using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/doctors")]
[Authorize]
public class DoctorsController(HMSDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<DoctorDto>>> GetAll([FromQuery] int? departmentId)
    {
        var query = db.Doctors.Include(d => d.User).Include(d => d.Department).Include(d => d.Availability)
            .Where(d => d.IsActive).AsQueryable();
        if (departmentId.HasValue) query = query.Where(d => d.DepartmentId == departmentId);

        var doctors = await query.ToListAsync();
        return doctors.Select(ToDto).ToList();
    }

    [HttpPut("{id:int}/schedule")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateSchedule(int id, UpdateDoctorScheduleRequest req)
    {
        var doctor = await db.Doctors.Include(d => d.Availability).FirstOrDefaultAsync(d => d.DoctorId == id);
        if (doctor is null) return NotFound();

        doctor.ConsultationFee = req.ConsultationFee;
        doctor.HoursFrom = TimeSpan.Parse(req.HoursFrom);
        doctor.HoursTo = TimeSpan.Parse(req.HoursTo);

        db.DoctorAvailabilities.RemoveRange(doctor.Availability);
        for (byte day = 0; day < req.WeeklyAvailability.Length && day < 7; day++)
        {
            db.DoctorAvailabilities.Add(new DoctorAvailability
            {
                DoctorId = doctor.DoctorId,
                DayOfWeek = day,
                IsAvailable = req.WeeklyAvailability[day]
            });
        }
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static DoctorDto ToDto(Doctor d)
    {
        var avail = new bool[7];
        foreach (var a in d.Availability) if (a.DayOfWeek < 7) avail[a.DayOfWeek] = a.IsAvailable;
        return new DoctorDto(d.DoctorId, d.User.FullName, d.Department.Name, d.ConsultationFee,
            d.HoursFrom.ToString(@"hh\:mm"), d.HoursTo.ToString(@"hh\:mm"), avail, d.IsActive);
    }
}
