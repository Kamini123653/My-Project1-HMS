using System.Security.Claims;
using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/pharmacy")]
[Authorize]
public class PharmacyController(HMSDbContext db) : ControllerBase
{
    [HttpGet("queue")]
    public async Task<ActionResult<List<PrescriptionQueueDto>>> Queue()
    {
        var list = await db.Prescriptions.Include(p => p.Patient).Include(p => p.Items)
            .Where(p => p.Status == "Pending")
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();

        return list.Select(p => new PrescriptionQueueDto(p.PrescriptionId, p.Patient.FullName, p.PatientId,
            p.PatientType, p.Status, p.Items.Count, p.CreatedAt)).ToList();
    }

    [HttpGet("{prescriptionId:int}")]
    public async Task<ActionResult<PrescriptionDetailDto>> Detail(int prescriptionId)
    {
        var rx = await db.Prescriptions.Include(p => p.Patient).Include(p => p.Consultation)
            .Include(p => p.Items).ThenInclude(i => i.Medicine).ThenInclude(m => m.Batches)
            .FirstOrDefaultAsync(p => p.PrescriptionId == prescriptionId);
        if (rx is null) return NotFound();

        var items = rx.Items.Select(i =>
        {
            // FEFO: first-expiry-first-out — pick the batch with the earliest expiry that still has stock.
            var batch = i.Medicine.Batches.Where(b => b.StockQty > 0).OrderBy(b => b.ExpiryDate).FirstOrDefault();
            var totalStock = i.Medicine.Batches.Sum(b => b.StockQty);
            return new PrescriptionItemDetailDto(i.PrescriptionItemId, i.Medicine.Name, i.Dosage ?? "", i.Duration ?? "",
                i.Quantity, batch?.BatchNumber, batch?.ExpiryDate, totalStock);
        }).ToList();

        return Ok(new PrescriptionDetailDto(rx.PrescriptionId, rx.Patient.FullName, rx.PatientId, rx.PatientType,
            rx.Status, rx.Consultation?.Diagnosis, items));
    }

    [HttpPost("{prescriptionId:int}/dispense")]
    [Authorize(Roles = "Pharmacist,Admin")]
    public async Task<IActionResult> Dispense(int prescriptionId, DispenseRequest req)
    {
        var rx = await db.Prescriptions.Include(p => p.Items).ThenInclude(i => i.Medicine).ThenInclude(m => m.Batches)
            .FirstOrDefaultAsync(p => p.PrescriptionId == prescriptionId);
        if (rx is null) return NotFound();
        if (rx.Status == "Dispensed") return BadRequest(new { message = "This prescription has already been dispensed." });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var dispenseRecord = new DispenseRecord { PrescriptionId = rx.PrescriptionId, DispensedByUserId = userId };
        db.DispenseRecords.Add(dispenseRecord);

        var itemsToDispense = rx.Items.Where(i => req.PrescriptionItemIds.Contains(i.PrescriptionItemId)).ToList();
        foreach (var item in itemsToDispense)
        {
            var remaining = item.Quantity;
            // FEFO deduction: consume from earliest-expiring batches first, spilling into the next batch as needed.
            foreach (var batch in item.Medicine.Batches.Where(b => b.StockQty > 0).OrderBy(b => b.ExpiryDate))
            {
                if (remaining <= 0) break;
                var take = Math.Min(remaining, batch.StockQty);
                if (take <= 0) continue;

                batch.StockQty -= take;
                remaining -= take;
                db.DispenseItems.Add(new DispenseItem
                {
                    Dispense = dispenseRecord,
                    PrescriptionItemId = item.PrescriptionItemId,
                    BatchId = batch.BatchId,
                    QtyDispensed = take
                });
            }
            if (remaining > 0)
                return BadRequest(new { message = $"Insufficient stock for {item.Medicine.Name}. Short by {remaining} {item.Medicine.Unit}." });
        }

        rx.Status = "Dispensed";
        await db.SaveChangesAsync();
        return Ok(new { message = "Medicines dispensed. Stock auto-deducted (FEFO)." });
    }

    [HttpGet("inventory")]
    public async Task<ActionResult<List<MedicineInventoryDto>>> Inventory()
    {
        var meds = await db.Medicines.Include(m => m.Batches).Where(m => m.IsActive).OrderBy(m => m.Name).ToListAsync();
        return meds.Select(m =>
        {
            var stock = m.Batches.Sum(b => b.StockQty);
            var nearest = m.Batches.Where(b => b.StockQty > 0).OrderBy(b => b.ExpiryDate).FirstOrDefault();
            var status = stock <= m.ReorderThreshold ? "Low Stock" : "OK";
            return new MedicineInventoryDto(m.MedicineId, m.Name, m.Unit, stock, m.ReorderThreshold,
                nearest?.ExpiryDate.ToString("MMM yyyy"), status);
        }).ToList();
    }

    [HttpGet("low-stock")]
    public async Task<ActionResult<List<LowStockDto>>> LowStock()
    {
        var meds = await db.Medicines.Include(m => m.Batches).Where(m => m.IsActive).ToListAsync();
        return meds.Where(m => m.Batches.Sum(b => b.StockQty) <= m.ReorderThreshold)
            .Select(m => new LowStockDto(m.MedicineId, m.Name, m.Batches.Sum(b => b.StockQty), m.ReorderThreshold))
            .ToList();
    }

    [HttpGet("vendors")]
    public async Task<ActionResult<List<VendorDto>>> Vendors() =>
        await db.Vendors.Select(v => new VendorDto(v.VendorId, v.Name, v.ContactInfo)).ToListAsync();

    [HttpPost("stock-entry")]
    [Authorize(Roles = "Pharmacist,Admin")]
    public async Task<IActionResult> StockEntry(StockEntryRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var batch = await db.MedicineBatches.FirstOrDefaultAsync(b =>
            b.MedicineId == req.MedicineId && b.BatchNumber == req.BatchNumber);

        if (batch is null)
        {
            batch = new MedicineBatch
            {
                MedicineId = req.MedicineId,
                BatchNumber = req.BatchNumber,
                ExpiryDate = req.ExpiryDate,
                StockQty = 0,
                VendorId = req.VendorId
            };
            db.MedicineBatches.Add(batch);
            await db.SaveChangesAsync();
        }
        batch.StockQty += req.Quantity;

        db.StockEntries.Add(new StockEntry
        {
            VendorId = req.VendorId,
            InvoiceNumber = req.InvoiceNumber,
            MedicineId = req.MedicineId,
            BatchId = batch.BatchId,
            QtyReceived = req.Quantity,
            CreatedByUserId = userId
        });
        await db.SaveChangesAsync();
        return Ok(new { message = "Stock entry saved. Inventory updated." });
    }
}
