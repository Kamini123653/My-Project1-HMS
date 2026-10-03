namespace HMS.API.Entities;

public class Patient
{
    public int PatientId { get; set; }
    public string UHID { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public DateOnly? DateOfBirth { get; set; }
    public string Gender { get; set; } = null!;
    public string? BloodGroup { get; set; }
    public string Mobile { get; set; } = null!;
    public string? EmergencyContact { get; set; }
    public string? Address { get; set; }
    public string? KnownAllergies { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int Age => DateOfBirth is null ? 0 :
        DateTime.UtcNow.Year - DateOfBirth.Value.Year -
        (DateTime.UtcNow.DayOfYear < DateOfBirth.Value.DayOfYear ? 1 : 0);
}
