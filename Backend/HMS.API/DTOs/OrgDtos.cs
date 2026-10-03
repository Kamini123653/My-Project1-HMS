namespace HMS.API.DTOs;

public record DepartmentDto(int DepartmentId, string Name, decimal ConsultationFee, bool IsActive, int DoctorCount);
public record CreateDepartmentRequest(string Name, decimal ConsultationFee);
public record UpdateDepartmentRequest(string Name, decimal ConsultationFee, bool IsActive);

public record DoctorDto(int DoctorId, string Name, string Department, decimal ConsultationFee, string HoursFrom, string HoursTo, bool[] WeeklyAvailability, bool IsActive);
public record CreateDoctorRequest(string Username, string FullName, string Password, int DepartmentId, decimal ConsultationFee, string HoursFrom, string HoursTo, bool[] WeeklyAvailability);
public record UpdateDoctorScheduleRequest(decimal ConsultationFee, string HoursFrom, string HoursTo, bool[] WeeklyAvailability);

public record WardDto(int WardId, string Name, decimal RatePerDay, int TotalBeds, int OccupiedBeds);
public record CreateWardRequest(string Name, decimal RatePerDay, int BedCount, string BedPrefix);
public record BedDto(int BedId, string BedNumber, string WardName, int WardId, string Status);
