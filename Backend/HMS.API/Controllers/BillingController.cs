using System.Security.Claims;
using HMS.API.Common;
using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/billing")]
[Authorize]
public class BillingController(HMSDbContext db) : ControllerBase
{
    private const decimal RegistrationFee = 50m;

    [HttpGet("pending")]
    public async Task<ActionResult<List<PendingBillDto>>> Pending()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var billedAppointmentIds = await db.Invoices.Where(i => i.AppointmentId != null).Select(i => i.AppointmentId!.Value).ToListAsync();
        var billedAdmissionIds = await db.Invoices.Where(i => i.AdmissionId != null && i.Status == "Paid").Select(i => i.AdmissionId!.Value).ToListAsync();

        var opd = await db.Appointments.Include(a => a.Patient).Include(a => a.Doctor)
            .Where(a => a.AppointmentDate == today && !billedAppointmentIds.Contains(a.AppointmentId))
            .Select(a => new PendingBillDto(a.AppointmentId, null, a.PatientId, a.Patient.FullName, "OPD",
                a.Doctor.ConsultationFee + RegistrationFee))
            .ToListAsync();

        var ipd = await db.IPDAdmissions.Include(a => a.Patient).Include(a => a.Bed).ThenInclude(b => b.Ward)
            .Where(a => a.Status != "Discharged" && !billedAdmissionIds.Contains(a.AdmissionId))
            .Select(a => new PendingBillDto(null, a.AdmissionId, a.PatientId, a.Patient.FullName, "IPD",
                a.Bed.Ward.RatePerDay))
            .ToListAsync();

        return opd.Concat(ipd).ToList();
    }

    [HttpPost("opd/generate")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<ActionResult<InvoiceDto>> GenerateOpdBill(GenerateOpdBillRequest req)
    {
        var appt = await db.Appointments.Include(a => a.Patient).Include(a => a.Doctor).ThenInclude(d => d.User)
            .FirstOrDefaultAsync(a => a.AppointmentId == req.AppointmentId);
        if (appt is null) return NotFound();

        var existing = await db.Invoices.FirstOrDefaultAsync(i => i.AppointmentId == appt.AppointmentId);
        if (existing is not null) return Ok(await ToDtoAsync(existing.InvoiceId));

        var items = new List<InvoiceItem>
        {
            new() { Description = $"Consultation — {appt.Doctor.User?.FullName}", SourceType = "Consultation", Amount = appt.Doctor.ConsultationFee },
            new() { Description = "Registration Fee", SourceType = "Registration", Amount = RegistrationFee }
        };

        var invoice = new Invoice
        {
            InvoiceNumber = CodeGenerator.NewInvoiceNumber("OPD"),
            PatientId = appt.PatientId,
            AppointmentId = appt.AppointmentId,
            InvoiceType = "OPD",
            TotalAmount = items.Sum(i => i.Amount),
            Status = "Pending"
        };
        foreach (var item in items) invoice.Items.Add(item);
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        return Ok(await ToDtoAsync(invoice.InvoiceId));
    }

    [HttpPost("ipd/generate")]
    [Authorize(Roles = "Admin,Receptionist,Accountant")]
    public async Task<ActionResult<InvoiceDto>> GenerateIpdBill(GenerateIpdBillRequest req)
    {
        var admission = await db.IPDAdmissions.Include(a => a.Patient).Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Bed).ThenInclude(b => b.Ward)
            .FirstOrDefaultAsync(a => a.AdmissionId == req.AdmissionId);
        if (admission is null) return NotFound();

        var consultationIds = await db.Consultations.Where(c => c.AdmissionId == admission.AdmissionId)
            .Select(c => c.ConsultationId).ToListAsync();

        var pharmacyAmount = await db.PrescriptionItems.Include(pi => pi.Medicine)
            .Where(pi => consultationIds.Contains(pi.Prescription.ConsultationId))
            .SumAsync(pi => pi.Quantity * pi.Medicine.UnitPrice);

        var labAmount = await db.TestOrders.Include(o => o.Test)
            .Where(o => o.ConsultationId != null && consultationIds.Contains(o.ConsultationId!.Value))
            .SumAsync(o => o.Test.Price);

        var days = Math.Max(1, (int)Math.Ceiling(((admission.DischargeDate ?? DateTime.UtcNow) - admission.AdmissionDate).TotalDays));
        var roomAmount = days * admission.Bed.Ward.RatePerDay;

        var items = new List<InvoiceItem>
        {
            new() { Description = $"Room Charges — {admission.Bed.Ward.Name} × {days} day{(days > 1 ? "s" : "")}", SourceType = "Room", Amount = roomAmount },
            new() { Description = $"Consultation — {admission.Doctor.User?.FullName}", SourceType = "Consultation", Amount = admission.Doctor.ConsultationFee },
        };
        if (pharmacyAmount > 0) items.Add(new InvoiceItem { Description = "Pharmacy Charges", SourceType = "Pharmacy", Amount = pharmacyAmount });
        if (labAmount > 0) items.Add(new InvoiceItem { Description = "Lab / Radiology Charges", SourceType = "Lab", Amount = labAmount });

        var existing = await db.Invoices.Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.AdmissionId == admission.AdmissionId && i.Status != "Paid");

        if (existing is not null)
        {
            db.InvoiceItems.RemoveRange(existing.Items);
            existing.Items = items;
            existing.TotalAmount = items.Sum(i => i.Amount);
            await db.SaveChangesAsync();
            return Ok(await ToDtoAsync(existing.InvoiceId));
        }

        var invoice = new Invoice
        {
            InvoiceNumber = CodeGenerator.NewInvoiceNumber("INV"),
            PatientId = admission.PatientId,
            AdmissionId = admission.AdmissionId,
            InvoiceType = "IPD",
            TotalAmount = items.Sum(i => i.Amount),
            Status = "Pending"
        };
        foreach (var item in items) invoice.Items.Add(item);
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        return Ok(await ToDtoAsync(invoice.InvoiceId));
    }

    [HttpGet("invoice/{id:int}")]
    public async Task<ActionResult<InvoiceDto>> GetInvoice(int id) => Ok(await ToDtoAsync(id));

    [HttpPost("payment")]
    [Authorize(Roles = "Admin,Receptionist,Accountant")]
    public async Task<ActionResult> CollectPayment(CollectPaymentRequest req)
    {
        var invoice = await db.Invoices.FindAsync(req.InvoiceId);
        if (invoice is null) return NotFound();

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        db.Payments.Add(new Payment { InvoiceId = invoice.InvoiceId, Amount = req.Amount, Mode = req.Mode, ReceivedByUserId = userId });

        invoice.PaidAmount += req.Amount;
        invoice.Status = invoice.PaidAmount >= invoice.TotalAmount ? "Paid" : invoice.PaidAmount > 0 ? "Partial" : "Pending";
        await db.SaveChangesAsync();

        if (invoice.Status == "Paid" && invoice.AdmissionId.HasValue)
        {
            var admission = await db.IPDAdmissions.FindAsync(invoice.AdmissionId.Value);
            if (admission is not null) admission.BillCleared = true;
        }
        if (invoice.Status == "Paid" && invoice.AppointmentId.HasValue)
        {
            var appt = await db.Appointments.FindAsync(invoice.AppointmentId.Value);
            if (appt is not null && appt.Status == "Waiting") appt.Status = "InConsult";
        }
        await db.SaveChangesAsync();

        return Ok(new { message = $"Payment recorded. Invoice #{invoice.InvoiceNumber} updated.", status = invoice.Status });
    }

    [HttpGet("payments/recent")]
    public async Task<ActionResult<List<RecentPaymentDto>>> RecentPayments()
    {
        var payments = await db.Payments.Include(p => p.Invoice).ThenInclude(i => i.Patient)
            .OrderByDescending(p => p.PaidAt).Take(50).ToListAsync();
        return payments.Select(p => new RecentPaymentDto(p.Invoice.InvoiceNumber, p.Invoice.Patient.FullName,
            p.Mode, p.Amount, p.Invoice.Status, p.PaidAt)).ToList();
    }

    [HttpGet("summary")]
    public async Task<ActionResult<BillingSummaryDto>> Summary()
    {
        var today = DateTime.UtcNow.Date;
        var collectedToday = await db.Payments.Where(p => p.PaidAt >= today).SumAsync(p => p.Amount);
        var outstanding = await db.Invoices.Where(i => i.Status != "Paid").SumAsync(i => i.TotalAmount - i.PaidAmount);
        var insurancePending = await db.InsuranceClaims.Where(c => c.Status != "Approved" && c.Status != "Rejected")
            .SumAsync(c => c.ClaimAmount);
        var invoicesToday = await db.Invoices.CountAsync(i => i.CreatedAt >= today);
        return new BillingSummaryDto(collectedToday, outstanding, insurancePending, invoicesToday);
    }

    // ---------- Insurance / TPA ----------
    [HttpGet("insurance-claims")]
    public async Task<ActionResult<List<InsuranceClaimDto>>> Claims()
    {
        var claims = await db.InsuranceClaims.Include(c => c.Patient).OrderByDescending(c => c.SubmittedAt).ToListAsync();
        return claims.Select(c => new InsuranceClaimDto(c.ClaimId, c.Patient.FullName, c.TPAName, c.ClaimAmount,
            c.AdjudicatedAmount, c.Status, c.SubmittedAt)).ToList();
    }

    [HttpPost("insurance-claims")]
    [Authorize(Roles = "Admin,Accountant,Receptionist")]
    public async Task<ActionResult> SubmitClaim(SubmitClaimRequest req)
    {
        var invoice = await db.Invoices.FindAsync(req.InvoiceId);
        if (invoice is null) return NotFound();

        db.InsuranceClaims.Add(new InsuranceClaim
        {
            PatientId = invoice.PatientId,
            InvoiceId = invoice.InvoiceId,
            TPAName = req.TPAName,
            ClaimAmount = req.ClaimAmount,
            Status = "Submitted"
        });
        await db.SaveChangesAsync();
        return Ok(new { message = "Claim submitted to TPA." });
    }

    [HttpPut("insurance-claims/{id:int}/status")]
    [Authorize(Roles = "Admin,Accountant")]
    public async Task<IActionResult> UpdateClaimStatus(int id, UpdateClaimStatusRequest req)
    {
        var claim = await db.InsuranceClaims.FindAsync(id);
        if (claim is null) return NotFound();
        claim.Status = req.Status;
        claim.AdjudicatedAmount = req.AdjudicatedAmount;
        claim.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<InvoiceDto> ToDtoAsync(int invoiceId)
    {
        var inv = await db.Invoices.Include(i => i.Patient).Include(i => i.Items).FirstAsync(i => i.InvoiceId == invoiceId);
        var lines = inv.Items.Select(i => new InvoiceLineDto(i.Description, i.SourceType, i.Amount)).ToList();
        return new InvoiceDto(inv.InvoiceId, inv.InvoiceNumber, inv.PatientId, inv.Patient.FullName, inv.InvoiceType,
            lines, inv.TotalAmount, inv.PaidAmount, inv.Status, inv.CreatedAt);
    }
}
