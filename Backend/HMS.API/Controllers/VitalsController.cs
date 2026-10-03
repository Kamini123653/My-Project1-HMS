using System.Security.Claims;
using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/vitals")]
[Authorize]
public class VitalsController(HMSDbContext db) : ControllerBase
{
    [HttpGet("patient/{patientId:int}")]
    public async Task<ActionResult<List<VitalDto>>> GetForPatient(int patientId)
    {
        var vitals = await db.Vitals
            .Where(v => v.PatientId == patientId)
            .OrderByDescending(v => v.RecordedAt)
            .ToListAsync();

        var userIds = vitals.Select(v => v.RecordedByUserId).Distinct().ToList();
        var users = await db.Users.Where(u => userIds.Contains(u.UserId)).ToDictionaryAsync(u => u.UserId, u => u.FullName);

        return vitals.Select(v => new VitalDto(v.VitalId, v.BloodPressure, v.Pulse, v.Temperature, v.SpO2,
            v.RespiratoryRate, v.Weight, v.Notes, v.RecordedAt, users.GetValueOrDefault(v.RecordedByUserId, "Unknown"))).ToList();
    }

    [HttpPost]
    [Authorize(Roles = "Nurse,Doctor,Admin")]
    public async Task<ActionResult<VitalDto>> Record(RecordVitalsRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var vital = new Vital
        {
            PatientId = req.PatientId,
            AppointmentId = req.AppointmentId,
            AdmissionId = req.AdmissionId,
            RecordedByUserId = userId,
            BloodPressure = req.BloodPressure,
            Pulse = req.Pulse,
            Temperature = req.Temperature,
            SpO2 = req.SpO2,
            RespiratoryRate = req.RespiratoryRate,
            Weight = req.Weight,
            Notes = req.Notes
        };
        db.Vitals.Add(vital);
        await db.SaveChangesAsync();

        var fullName = User.FindFirstValue("fullName") ?? "You";
        return Ok(new VitalDto(vital.VitalId, vital.BloodPressure, vital.Pulse, vital.Temperature, vital.SpO2,
            vital.RespiratoryRate, vital.Weight, vital.Notes, vital.RecordedAt, fullName));
    }
}
