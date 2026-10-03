namespace HMS.API.DTOs;

public record PrescriptionQueueDto(int PrescriptionId, string PatientName, int PatientId, string PatientType,
    string Status, int ItemCount, DateTime CreatedAt);

public record PrescriptionItemDetailDto(int PrescriptionItemId, string MedicineName, string Dosage, string Duration,
    int Quantity, string? BestBatch, DateOnly? BestBatchExpiry, int StockAvailable);

public record PrescriptionDetailDto(int PrescriptionId, string PatientName, int PatientId, string PatientType,
    string Status, string? DoctorNote, List<PrescriptionItemDetailDto> Items);

public record DispenseRequest(List<int> PrescriptionItemIds);

public record MedicineInventoryDto(int MedicineId, string Name, string Unit, int TotalStock, int ReorderThreshold,
    string? NearestExpiry, string Status);

public record StockEntryRequest(int VendorId, string InvoiceNumber, int MedicineId, string BatchNumber, int Quantity, DateOnly ExpiryDate);

public record LowStockDto(int MedicineId, string Name, int CurrentStock, int Threshold);

public record VendorDto(int VendorId, string Name, string? ContactInfo);
