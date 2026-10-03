using System.Security.Claims;
using HMS.API.Data;
using HMS.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(HMSDbContext db) : ControllerBase
{
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Admin()
    {
        var today = DateTime.UtcNow.Date;
        var todayDate = DateOnly.FromDateTime(today);

        var patientsToday = await db.Appointments.CountAsync(a => a.AppointmentDate == todayDate);
        var revenueToday = await db.Payments.Where(p => p.PaidAt >= today).SumAsync(p => p.Amount);
        var totalBeds = await db.Beds.CountAsync();
        var occupiedBeds = await db.Beds.CountAsync(b => b.Status == "Occupied");
        var pendingClaims = await db.InsuranceClaims.Where(c => c.Status != "Approved" && c.Status != "Rejected")
            .SumAsync(c => c.ClaimAmount);
        var pendingClaimsCount = await db.InsuranceClaims.CountAsync(c => c.Status != "Approved" && c.Status != "Rejected");

        var footfall = await db.Appointments.Where(a => a.AppointmentDate == todayDate)
            .Include(a => a.Department)
            .GroupBy(a => a.Department.Name)
            .Select(g => new { department = g.Key, count = g.Count() })
            .ToListAsync();

        var lowStock = await db.Medicines.Include(m => m.Batches)
            .Where(m => m.IsActive).ToListAsync();
        var lowStockAlerts = lowStock.Where(m => m.Batches.Sum(b => b.StockQty) <= m.ReorderThreshold)
            .Select(m => new { name = m.Name, stock = m.Batches.Sum(b => b.StockQty) }).ToList();

        return Ok(new
        {
            patientsToday,
            revenueToday,
            bedOccupancy = $"{occupiedBeds}/{totalBeds}",
            pendingClaims,
            pendingClaimsCount,
            footfall,
            lowStockAlerts,
            icuOccupancyPct = totalBeds == 0 ? 0 : Math.Round(occupiedBeds * 100.0 / totalBeds, 0)
        });
    }

    [HttpGet("doctor")]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult> Doctor()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var doctor = await db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
        if (doctor is null) return Ok(new { });

        var todayDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var opdQueueCount = await db.Appointments.CountAsync(a => a.DoctorId == doctor.DoctorId && a.AppointmentDate == todayDate && a.Status != "Cancelled");
        var waiting = await db.Appointments.CountAsync(a => a.DoctorId == doctor.DoctorId && a.AppointmentDate == todayDate && a.Status == "Waiting");
        var ipdCount = await db.IPDAdmissions.CountAsync(a => a.DoctorId == doctor.DoctorId && a.Status != "Discharged");
        var pendingReports = await db.TestOrders.CountAsync(o => o.DoctorId == doctor.DoctorId && o.Status == "ResultReady");

        return Ok(new { opdQueueCount, waiting, ipdCount, pendingReports });
    }

    [HttpGet("nurse")]
    [Authorize(Roles = "Nurse")]
    public async Task<ActionResult> Nurse()
    {
        var today = DateTime.UtcNow.Date;
        var vitalsRecordedToday = await db.Vitals.CountAsync(v => v.RecordedAt >= today);
        var ipdCount = await db.IPDAdmissions.CountAsync(a => a.Status != "Discharged");
        var dischargeAdvised = await db.IPDAdmissions.CountAsync(a => a.DischargeAdvised && a.Status != "Discharged");
        return Ok(new { vitalsRecordedToday, ipdCount, dischargeAdvised });
    }

    [HttpGet("reception")]
    [Authorize(Roles = "Receptionist,Admin")]
    public async Task<ActionResult> Reception()
    {
        var todayDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var today = DateTime.UtcNow.Date;
        var registrationsToday = await db.Patients.CountAsync(p => p.CreatedAt >= today);
        var appointmentsToday = await db.Appointments.CountAsync(a => a.AppointmentDate == todayDate);
        var admissionsToday = await db.IPDAdmissions.CountAsync(a => a.AdmissionDate >= today);
        var totalBeds = await db.Beds.CountAsync();
        var availableBeds = await db.Beds.CountAsync(b => b.Status == "Available");
        return Ok(new { registrationsToday, appointmentsToday, admissionsToday, bedsAvailable = $"{availableBeds} / {totalBeds}" });
    }

    [HttpGet("pharmacy")]
    [Authorize(Roles = "Pharmacist,Admin")]
    public async Task<ActionResult> Pharmacy()
    {
        var today = DateTime.UtcNow.Date;
        var prescriptionsToday = await db.Prescriptions.CountAsync(p => p.CreatedAt >= today);
        var pending = await db.Prescriptions.CountAsync(p => p.Status == "Pending");
        var dispensedToday = await db.DispenseItems.Include(i => i.Dispense).Include(i => i.Batch).ThenInclude(b => b.Medicine)
            .Where(i => i.Dispense.DispensedAt >= today).ToListAsync();
        var salesToday = dispensedToday.Sum(i => i.QtyDispensed * i.Batch.Medicine.UnitPrice);
        var meds = await db.Medicines.Include(m => m.Batches).Where(m => m.IsActive).ToListAsync();
        var lowStockCount = meds.Count(m => m.Batches.Sum(b => b.StockQty) <= m.ReorderThreshold);
        var expiringSoon = meds.SelectMany(m => m.Batches)
            .Count(b => b.StockQty > 0 && b.ExpiryDate <= DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)));

        return Ok(new { prescriptionsToday, pending, salesToday, lowStockCount, expiringSoon });
    }

    [HttpGet("lab")]
    [Authorize(Roles = "Lab,Admin")]
    public async Task<ActionResult> Lab()
    {
        var today = DateTime.UtcNow.Date;
        var ordersToday = await db.TestOrders.CountAsync(o => o.OrderedAt >= today);
        var samplesPending = await db.TestOrders.CountAsync(o => o.Status == "Pending");
        var resultsPending = await db.TestOrders.CountAsync(o => o.Status == "Collected");
        var reportsSentToday = await db.TestResults.CountAsync(r => r.EnteredAt >= today);
        return Ok(new { ordersToday, samplesPending, resultsPending, reportsSentToday });
    }

    [HttpGet("billing")]
    [Authorize(Roles = "Accountant,Admin")]
    public async Task<ActionResult<BillingDashboardDto>> Billing([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var rangeFrom = (from ?? today).ToDateTime(TimeOnly.MinValue);
        var rangeTo = (to ?? today).ToDateTime(TimeOnly.MaxValue);

        var collected = await db.Payments.Where(p => p.PaidAt >= rangeFrom && p.PaidAt <= rangeTo).SumAsync(p => p.Amount);
        var outstanding = await db.Invoices.Where(i => i.Status != "Paid").SumAsync(i => i.TotalAmount - i.PaidAmount);
        var insurancePending = await db.InsuranceClaims.Where(c => c.Status != "Approved" && c.Status != "Rejected").SumAsync(c => c.ClaimAmount);
        var insurancePendingCount = await db.InsuranceClaims.CountAsync(c => c.Status != "Approved" && c.Status != "Rejected");
        var invoicesInRange = await db.Invoices.CountAsync(i => i.CreatedAt >= rangeFrom && i.CreatedAt <= rangeTo);

        // Outstanding is a current-balance snapshot, not meaningful to filter by the collected-payments
        // date range — so its aging breakdown is computed here (over the small open-invoice set) rather
        // than filtered by `from`/`to`, which apply only to the time-series figures above.
        var openInvoices = await db.Invoices.Where(i => i.Status != "Paid")
            .Select(i => new OpenInvoiceRow(i.CreatedAt, i.TotalAmount - i.PaidAmount))
            .ToListAsync();
        var now = DateTime.UtcNow;
        var aging = new List<AgingBucketDto>
        {
            BuildAgingBucket(openInvoices, now, "0–7 days", 0, 7),
            BuildAgingBucket(openInvoices, now, "8–30 days", 7, 30),
            BuildAgingBucket(openInvoices, now, "30+ days", 30, null),
        };

        return Ok(new BillingDashboardDto(collected, outstanding, insurancePending, insurancePendingCount, invoicesInRange, aging));
    }

    [HttpGet("billing/trend")]
    [Authorize(Roles = "Accountant,Admin")]
    public async Task<ActionResult<List<RevenueTrendPointDto>>> BillingTrend([FromQuery] int days = 7)
    {
        if (days != 7 && days != 30) days = 7;
        var startDate = DateTime.UtcNow.Date.AddDays(-(days - 1));

        var payments = await db.Payments.Where(p => p.PaidAt >= startDate)
            .Select(p => new { p.PaidAt, p.Amount })
            .ToListAsync();

        var trend = Enumerable.Range(0, days)
            .Select(offset => startDate.AddDays(offset))
            .Select(date => new RevenueTrendPointDto(
                DateOnly.FromDateTime(date),
                payments.Where(p => p.PaidAt.Date == date).Sum(p => p.Amount)))
            .ToList();

        return Ok(trend);
    }

    private record OpenInvoiceRow(DateTime CreatedAt, decimal Balance);

    private static AgingBucketDto BuildAgingBucket(List<OpenInvoiceRow> openInvoices, DateTime now, string label, int minDaysExclusive, int? maxDaysInclusive)
    {
        var items = openInvoices.Where(i =>
        {
            var days = (now - i.CreatedAt).TotalDays;
            return days > minDaysExclusive && (maxDaysInclusive == null || days <= maxDaysInclusive);
        }).ToList();
        return new AgingBucketDto(label, items.Sum(i => i.Balance), items.Count);
    }
}
