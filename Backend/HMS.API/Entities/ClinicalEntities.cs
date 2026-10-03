namespace HMS.API.Entities;

public class Appointment
{
    public int AppointmentId { get; set; }
    public string TokenNumber { get; set; } = null!;
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;
    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;
    public DateOnly AppointmentDate { get; set; }
    public string SlotTime { get; set; } = null!;
    public string Status { get; set; } = "Waiting"; // Waiting|InConsult|Completed|Cancelled
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class IPDAdmission
{
    public int AdmissionId { get; set; }
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;
    public int BedId { get; set; }
    public Bed Bed { get; set; } = null!;
    public string AdmissionType { get; set; } = null!; // Planned|Emergency
    public string? InitialDiagnosis { get; set; }
    public string? AttendantName { get; set; }
    public string? AttendantContact { get; set; }
    public decimal AdvanceDeposit { get; set; }
    public DateTime AdmissionDate { get; set; } = DateTime.UtcNow;
    public bool DischargeAdvised { get; set; }
    public DateTime? DischargeAdvisedAt { get; set; }
    public bool BillCleared { get; set; }
    public DateTime? DischargeDate { get; set; }
    public string Status { get; set; } = "Admitted"; // Admitted|DischargeAdvised|Discharged
    public int CreatedByUserId { get; set; }
}

public class Vital
{
    public int VitalId { get; set; }
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public int? AppointmentId { get; set; }
    public int? AdmissionId { get; set; }
    public int RecordedByUserId { get; set; }
    public string? BloodPressure { get; set; }
    public string? Pulse { get; set; }
    public string? Temperature { get; set; }
    public string? SpO2 { get; set; }
    public string? RespiratoryRate { get; set; }
    public string? Weight { get; set; }
    public string? Notes { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

public class Consultation
{
    public int ConsultationId { get; set; }
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;
    public int? AppointmentId { get; set; }
    public int? AdmissionId { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? Diagnosis { get; set; }
    public DateTime ConsultDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Open"; // Open|Closed
}
