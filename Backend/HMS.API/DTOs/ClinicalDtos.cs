namespace HMS.API.DTOs;

// ---------- Appointments ----------
public record AppointmentDto(int AppointmentId, string TokenNumber, int PatientId, string PatientName, int PatientAge,
    string PatientGender, string Doctor, string Department, DateOnly AppointmentDate, string SlotTime, string Status);

public record BookAppointmentRequest(int PatientId, int DoctorId, DateOnly AppointmentDate, string SlotTime);
public record UpdateAppointmentStatusRequest(string Status);

public record DoctorSlotDto(string SlotTime, bool Taken);

// ---------- IPD ----------
public record IPDAdmissionDto(int AdmissionId, int PatientId, string PatientName, int PatientAge, string PatientGender,
    string Doctor, string Ward, string Bed, string AdmissionType, string? InitialDiagnosis, DateTime AdmissionDate,
    bool DischargeAdvised, bool BillCleared, string Status, string? KnownAllergies);

public record AdmitPatientRequest(int PatientId, int DoctorId, string AdmissionType, string? InitialDiagnosis,
    int WardId, string? AttendantName, string? AttendantContact, decimal AdvanceDeposit);

public record AssignBedRequest(int BedId);

// ---------- Vitals ----------
public record VitalDto(int VitalId, string? BloodPressure, string? Pulse, string? Temperature, string? SpO2,
    string? RespiratoryRate, string? Weight, string? Notes, DateTime RecordedAt, string RecordedBy);

public record RecordVitalsRequest(int PatientId, int? AppointmentId, int? AdmissionId, string? BloodPressure,
    string? Pulse, string? Temperature, string? SpO2, string? RespiratoryRate, string? Weight, string? Notes);

// ---------- Consultation / Prescription ----------
public record ConsultationHistoryDto(int ConsultationId, DateTime ConsultDate, string? ChiefComplaint, string? Diagnosis, string Doctor);

public record SavePrescriptionItem(int MedicineId, string? Dosage, string? Duration, int Quantity);
public record SaveConsultationRequest(int PatientId, int? AppointmentId, int? AdmissionId, string? ChiefComplaint,
    string? Diagnosis, List<SavePrescriptionItem> Medicines);

public record OrderTestRequest(int PatientId, int TestId, int? ConsultationId);
