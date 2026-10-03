using HMS.API.Common;
using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientsController(HMSDbContext db) : ControllerBase
{
    [HttpGet("search")]
    public async Task<ActionResult<List<PatientSearchResult>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return new List<PatientSearchResult>();
        q = q.Trim();

        var patients = await db.Patients
            .Where(p => p.FullName.Contains(q) || p.Mobile.Contains(q) || p.UHID.Contains(q))
            .OrderBy(p => p.FullName)
            .Take(20)
            .ToListAsync();

        return patients.Select(p => new PatientSearchResult(p.PatientId, p.UHID, p.FullName, p.Age, p.Gender, p.Mobile)).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PatientDto>> GetById(int id)
    {
        var p = await db.Patients.FindAsync(id);
        if (p is null) return NotFound();
        return ToDto(p);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<ActionResult<PatientDto>> Register(RegisterPatientRequest req)
    {
        var patient = new Patient
        {
            UHID = CodeGenerator.NewUHID(),
            FullName = req.FullName,
            DateOfBirth = req.DateOfBirth,
            Gender = req.Gender,
            BloodGroup = req.BloodGroup,
            Mobile = req.Mobile,
            EmergencyContact = req.EmergencyContact,
            Address = req.Address,
            KnownAllergies = req.KnownAllergies
        };
        db.Patients.Add(patient);
        await db.SaveChangesAsync();
        return Ok(ToDto(patient));
    }

    private static PatientDto ToDto(Patient p) => new(p.PatientId, p.UHID, p.FullName, p.Age, p.Gender, p.BloodGroup,
        p.Mobile, p.EmergencyContact, p.Address, p.KnownAllergies);
}
