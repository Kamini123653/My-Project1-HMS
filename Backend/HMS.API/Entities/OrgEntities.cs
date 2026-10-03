namespace HMS.API.Entities;

public class Department
{
    public int DepartmentId { get; set; }
    public string Name { get; set; } = null!;
    public decimal ConsultationFee { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
}

public class Doctor
{
    public int DoctorId { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;
    public decimal ConsultationFee { get; set; }
    public TimeSpan HoursFrom { get; set; }
    public TimeSpan HoursTo { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<DoctorAvailability> Availability { get; set; } = new List<DoctorAvailability>();
}

public class DoctorAvailability
{
    public int DoctorAvailabilityId { get; set; }
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;
    public byte DayOfWeek { get; set; } // 0=Mon .. 6=Sun
    public bool IsAvailable { get; set; } = true;
}

public class Ward
{
    public int WardId { get; set; }
    public string Name { get; set; } = null!;
    public decimal RatePerDay { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Bed> Beds { get; set; } = new List<Bed>();
}

public class Bed
{
    public int BedId { get; set; }
    public int WardId { get; set; }
    public Ward Ward { get; set; } = null!;
    public string BedNumber { get; set; } = null!;
    public string Status { get; set; } = "Available"; // Available | Occupied
}
