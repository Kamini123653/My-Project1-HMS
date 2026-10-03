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
[Route("api/appointments")]
[Authorize]
public class AppointmentsController(HMSDbContext db) : ControllerBase
{
    private static readonly string[] AllSlots =
        ["09:00 AM", "09:20 AM", "09:40 AM", "10:00 AM", "10:15 AM", "10:40 AM", "11:00 AM",
         "11:20 AM", "11:40 AM", "12:00 PM", "12:20 PM", "12:40 PM"];

    [HttpGet]
    public async Task<ActionResult<List<AppointmentDto>>> GetAll([FromQuery] DateOnly? date, [FromQuery] int? doctorId)
    {
        var d = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var query = db.Appointments
            .Include(a => a.Patient).Include(a => a.Doctor).ThenInclude(doc => doc.User)
            .Include(a => a.Department)
            .Where(a => a.AppointmentDate == d);

        // Doctors only see their own queue.
        if (User.IsInRole("Doctor"))
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            query = query.Where(a => a.Doctor.UserId == userId);
        }
        else if (doctorId.HasValue)
        {
            query = query.Where(a => a.DoctorId == doctorId);
        }

        var list = await query.OrderBy(a => a.SlotTime).ToListAsync();
        return list.Select(ToDto).ToList();
    }

    [HttpGet("slots")]
    public async Task<ActionResult<List<DoctorSlotDto>>> GetSlots([FromQuery] int doctorId, [FromQuery] DateOnly date)
    {
        var taken = await db.Appointments
            .Where(a => a.DoctorId == doctorId && a.AppointmentDate == date && a.Status != "Cancelled")
            .Select(a => a.SlotTime).ToListAsync();

        return AllSlots.Select(s => new DoctorSlotDto(s, taken.Contains(s))).ToList();
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<ActionResult<AppointmentDto>> Book(BookAppointmentRequest req)
    {
        var doctor = await db.Doctors.FindAsync(req.DoctorId);
        if (doctor is null) return NotFound(new { message = "Doctor not found." });

        var slotTaken = await db.Appointments.AnyAsync(a =>
            a.DoctorId == req.DoctorId && a.AppointmentDate == req.AppointmentDate &&
            a.SlotTime == req.SlotTime && a.Status != "Cancelled");
        if (slotTaken) return Conflict(new { message = "That slot has just been booked. Please pick another." });

        var todayCount = await db.Appointments.CountAsync(a => a.AppointmentDate == req.AppointmentDate);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var appt = new Appointment
        {
            TokenNumber = CodeGenerator.NewToken(todayCount + 1),
            PatientId = req.PatientId,
            DoctorId = req.DoctorId,
            DepartmentId = doctor.DepartmentId,
            AppointmentDate = req.AppointmentDate,
            SlotTime = req.SlotTime,
            Status = "Waiting",
            CreatedByUserId = userId
        };
        db.Appointments.Add(appt);
        await db.SaveChangesAsync();

        await db.Entry(appt).Reference(a => a.Patient).LoadAsync();
        await db.Entry(appt).Reference(a => a.Doctor).Query().Include(doc => doc.User).LoadAsync();
        await db.Entry(appt).Reference(a => a.Department).LoadAsync();
        return Ok(ToDto(appt));
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateAppointmentStatusRequest req)
    {
        var appt = await db.Appointments.FindAsync(id);
        if (appt is null) return NotFound();
        appt.Status = req.Status;
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static AppointmentDto ToDto(Appointment a) => new(a.AppointmentId, a.TokenNumber, a.PatientId,
        a.Patient.FullName, a.Patient.Age, a.Patient.Gender, a.Doctor.User.FullName, a.Department.Name,
        a.AppointmentDate, a.SlotTime, a.Status);
}
