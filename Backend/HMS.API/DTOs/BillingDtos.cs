namespace HMS.API.DTOs;

public record InvoiceLineDto(string Description, string SourceType, decimal Amount);
public record InvoiceDto(int InvoiceId, string InvoiceNumber, int PatientId, string PatientName, string InvoiceType,
    List<InvoiceLineDto> Items, decimal TotalAmount, decimal PaidAmount, string Status, DateTime CreatedAt);

public record GenerateOpdBillRequest(int AppointmentId);
public record GenerateIpdBillRequest(int AdmissionId);

public record CollectPaymentRequest(int InvoiceId, decimal Amount, string Mode);

public record PendingBillDto(int? AppointmentId, int? AdmissionId, int PatientId, string PatientName, string Type, decimal EstimatedAmount);

public record SubmitClaimRequest(int InvoiceId, string TPAName, decimal ClaimAmount);
public record InsuranceClaimDto(int ClaimId, string PatientName, string TPAName, decimal ClaimAmount,
    decimal? AdjudicatedAmount, string Status, DateTime SubmittedAt);
public record UpdateClaimStatusRequest(string Status, decimal? AdjudicatedAmount);

public record BillingSummaryDto(decimal CollectedToday, decimal Outstanding, decimal InsurancePending, int InvoicesToday);

public record RecentPaymentDto(string InvoiceNumber, string PatientName, string Mode, decimal Amount, string Status, DateTime PaidAt);

public record AgingBucketDto(string Bucket, decimal Amount, int Count);
public record BillingDashboardDto(decimal Collected, decimal Outstanding, decimal InsurancePending, int InsurancePendingCount,
    int InvoicesInRange, List<AgingBucketDto> OutstandingAging);

public record RevenueTrendPointDto(DateOnly Date, decimal Amount);
