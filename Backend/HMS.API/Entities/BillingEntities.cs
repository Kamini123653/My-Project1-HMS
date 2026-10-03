namespace HMS.API.Entities;

public class Invoice
{
    public int InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = null!;
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public int? AppointmentId { get; set; }
    public int? AdmissionId { get; set; }
    public string InvoiceType { get; set; } = null!; // OPD|IPD
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending|Partial|Paid
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public class InvoiceItem
{
    public int InvoiceItemId { get; set; }
    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string SourceType { get; set; } = null!; // Registration|Consultation|Pharmacy|Lab|Room|Other
    public decimal Amount { get; set; }
}

public class Payment
{
    public int PaymentId { get; set; }
    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Mode { get; set; } = null!; // Cash|Card|UPI|Insurance
    public int ReceivedByUserId { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
}

public class InsuranceClaim
{
    public int ClaimId { get; set; }
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public string TPAName { get; set; } = null!;
    public decimal ClaimAmount { get; set; }
    public decimal? AdjudicatedAmount { get; set; }
    public string Status { get; set; } = "Submitted"; // Submitted|UnderReview|Approved|Rejected
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
