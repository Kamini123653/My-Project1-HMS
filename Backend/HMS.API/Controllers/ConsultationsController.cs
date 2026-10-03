using System.Security.Claims;
using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/consultations")]
[Authorize]
public class ConsultationsController(HMSDbContext db) : ControllerBase
{
    [HttpGet("patient/{patientId:int}/history")]
    public async Task<ActionResult<List<ConsultationHistoryDto>>> History(int patientId)
    {
        var list = await db.Consultations.Include(c => c.Doctor).ThenInclude(d => d.User)
            .Where(c => c.PatientId == patientId)
            .OrderByDescending(c => c.ConsultDate)
            .ToListAsync();

        return list.Select(c => new ConsultationHistoryDto(c.ConsultationId, c.ConsultDate, c.ChiefComplaint,
            c.Diagnosis, c.Doctor.User.FullName)).ToList();
    }

    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult> Save(SaveConsultationRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var doctor = await db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
        if (doctor is null) return Forbid();

        var consultation = new Consultation
        {
            PatientId = req.PatientId,
            DoctorId = doctor.DoctorId,
            AppointmentId = req.AppointmentId,
            AdmissionId = req.AdmissionId,
            ChiefComplaint = req.ChiefComplaint,
            Diagnosis = req.Diagnosis,
            Status = "Closed"
        };
        db.Consultations.Add(consultation);
        await db.SaveChangesAsync();

        int? prescriptionId = null;
        if (req.Medicines.Count > 0)
        {
            var prescription = new Prescription
            {
                ConsultationId = consultation.ConsultationId,
                PatientId = req.PatientId,
                DoctorId = doctor.DoctorId,
                PatientType = req.AdmissionId.HasValue ? "IPD" : "OPD",
                Status = "Pending"
            };
            db.Prescriptions.Add(prescription);
            await db.SaveChangesAsync();

            foreach (var m in req.Medicines)
            {
                db.PrescriptionItems.Add(new PrescriptionItem
                {
                    PrescriptionId = prescription.PrescriptionId,
                    MedicineId = m.MedicineId,
                    Dosage = m.Dosage,
                    Duration = m.Duration,
                    Quantity = m.Quantity
                });
            }
            await db.SaveChangesAsync();
            prescriptionId = prescription.PrescriptionId;
        }

        if (req.AppointmentId.HasValue)
        {
            var appt = await db.Appointments.FindAsync(req.AppointmentId.Value);
            if (appt is not null) appt.Status = "Completed";
            await db.SaveChangesAsync();
        }

        return Ok(new { consultationId = consultation.ConsultationId, prescriptionId });
    }

    [HttpPost("order-test")]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult> OrderTest(OrderTestRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var doctor = await db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
        if (doctor is null) return Forbid();

        var order = new TestOrder
        {
            PatientId = req.PatientId,
            DoctorId = doctor.DoctorId,
            TestId = req.TestId,
            ConsultationId = req.ConsultationId,
            Status = "Pending"
        };
        db.TestOrders.Add(order);
        await db.SaveChangesAsync();
        return Ok(new { orderId = order.OrderId, message = "Test order sent to Diagnostics queue." });
    }
}
