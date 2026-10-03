using System.Security.Claims;
using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/ipd")]
[Authorize]
public class IpdController(HMSDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<IPDAdmissionDto>>> GetAll([FromQuery] string? status)
    {
        var query = db.IPDAdmissions
            .Include(a => a.Patient).Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Bed).ThenInclude(b => b.Ward)
            .AsQueryable();

        if (User.IsInRole("Doctor"))
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            query = query.Where(a => a.Doctor.UserId == userId);
        }

        if (!string.IsNullOrEmpty(status)) query = query.Where(a => a.Status == status);
        else query = query.Where(a => a.Status != "Discharged");

        var list = await query.OrderByDescending(a => a.AdmissionDate).ToListAsync();
        return list.Select(ToDto).ToList();
    }

    [HttpPost("admit")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<ActionResult<IPDAdmissionDto>> Admit(AdmitPatientRequest req)
    {
        var bed = await db.Beds.FirstOrDefaultAsync(b => b.WardId == req.WardId && b.Status == "Available");
        if (bed is null) return BadRequest(new { message = "No available beds in the selected ward." });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var admission = new IPDAdmission
        {
            PatientId = req.PatientId,
            DoctorId = req.DoctorId,
            BedId = bed.BedId,
            AdmissionType = req.AdmissionType,
            InitialDiagnosis = req.InitialDiagnosis,
            AttendantName = req.AttendantName,
            AttendantContact = req.AttendantContact,
            AdvanceDeposit = req.AdvanceDeposit,
            Status = "Admitted",
            CreatedByUserId = userId
        };
        bed.Status = "Occupied";
        db.IPDAdmissions.Add(admission);
        await db.SaveChangesAsync();

        await db.Entry(admission).Reference(a => a.Patient).LoadAsync();
        await db.Entry(admission).Reference(a => a.Doctor).Query().Include(d => d.User).LoadAsync();
        await db.Entry(admission).Reference(a => a.Bed).Query().Include(b => b.Ward).LoadAsync();
        return Ok(ToDto(admission));
    }

    [HttpPut("{id:int}/advise-discharge")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> AdviseDischarge(int id)
    {
        var admission = await db.IPDAdmissions.FindAsync(id);
        if (admission is null) return NotFound();
        admission.DischargeAdvised = true;
        admission.DischargeAdvisedAt = DateTime.UtcNow;
        admission.Status = "DischargeAdvised";
        await db.SaveChangesAsync();
        return Ok(new { message = "Marked ready for discharge. Sent to Discharge Desk — pending billing clearance." });
    }

    [HttpPut("{id:int}/finalize-discharge")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> FinalizeDischarge(int id)
    {
        var admission = await db.IPDAdmissions.Include(a => a.Bed).FirstOrDefaultAsync(a => a.AdmissionId == id);
        if (admission is null) return NotFound();
        if (!admission.BillCleared)
            return BadRequest(new { message = "Cannot discharge — outstanding bill not yet cleared." });

        admission.Status = "Discharged";
        admission.DischargeDate = DateTime.UtcNow;
        admission.Bed.Status = "Available";
        await db.SaveChangesAsync();
        return Ok(new { message = "Patient discharged. Bed released back to the available pool." });
    }

    private static IPDAdmissionDto ToDto(IPDAdmission a) => new(a.AdmissionId, a.PatientId, a.Patient.FullName,
        a.Patient.Age, a.Patient.Gender, a.Doctor.User.FullName, a.Bed.Ward.Name, a.Bed.BedNumber, a.AdmissionType,
        a.InitialDiagnosis, a.AdmissionDate, a.DischargeAdvised, a.BillCleared, a.Status, a.Patient.KnownAllergies);
}
