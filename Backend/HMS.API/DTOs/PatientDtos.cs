namespace HMS.API.DTOs;

public record PatientDto(int PatientId, string UHID, string FullName, int Age, string Gender, string? BloodGroup,
    string Mobile, string? EmergencyContact, string? Address, string? KnownAllergies);

public record RegisterPatientRequest(string FullName, DateOnly? DateOfBirth, string Gender, string? BloodGroup,
    string Mobile, string? EmergencyContact, string? Address, string? KnownAllergies);

public record PatientSearchResult(int PatientId, string UHID, string FullName, int Age, string Gender, string Mobile);
