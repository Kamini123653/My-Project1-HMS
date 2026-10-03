namespace HMS.API.Entities;

public class TestCatalog
{
    public int TestId { get; set; }
    public string Name { get; set; } = null!;
    public string Type { get; set; } = null!; // Lab|Radiology
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
}

public class TestOrder
{
    public int OrderId { get; set; }
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;
    public int TestId { get; set; }
    public TestCatalog Test { get; set; } = null!;
    public int? ConsultationId { get; set; }
    public string? SampleId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending|Collected|ResultReady
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CollectedAt { get; set; }
    public TestResult? Result { get; set; }
}

public class TestResult
{
    public int ResultId { get; set; }
    public int OrderId { get; set; }
    public TestOrder Order { get; set; } = null!;
    public string? ResultData { get; set; } // JSON
    public int EnteredByUserId { get; set; }
    public DateTime EnteredAt { get; set; } = DateTime.UtcNow;
}
