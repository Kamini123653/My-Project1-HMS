namespace HMS.API.Entities;

public class Medicine
{
    public int MedicineId { get; set; }
    public string Name { get; set; } = null!;
    public string Unit { get; set; } = "tabs";
    public decimal UnitPrice { get; set; }
    public int ReorderThreshold { get; set; } = 20;
    public bool IsActive { get; set; } = true;
    public ICollection<MedicineBatch> Batches { get; set; } = new List<MedicineBatch>();
}

public class Prescription
{
    public int PrescriptionId { get; set; }
    public int ConsultationId { get; set; }
    public Consultation Consultation { get; set; } = null!;
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;
    public string PatientType { get; set; } = null!; // OPD|IPD
    public string Status { get; set; } = "Pending"; // Pending|Dispensed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();
}

public class PrescriptionItem
{
    public int PrescriptionItemId { get; set; }
    public int PrescriptionId { get; set; }
    public Prescription Prescription { get; set; } = null!;
    public int MedicineId { get; set; }
    public Medicine Medicine { get; set; } = null!;
    public string? Dosage { get; set; }
    public string? Duration { get; set; }
    public int Quantity { get; set; } = 1;
}

public class Vendor
{
    public int VendorId { get; set; }
    public string Name { get; set; } = null!;
    public string? ContactInfo { get; set; }
}

public class MedicineBatch
{
    public int BatchId { get; set; }
    public int MedicineId { get; set; }
    public Medicine Medicine { get; set; } = null!;
    public string BatchNumber { get; set; } = null!;
    public DateOnly ExpiryDate { get; set; }
    public int StockQty { get; set; }
    public int? VendorId { get; set; }
    public Vendor? Vendor { get; set; }
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
}

public class StockEntry
{
    public int StockEntryId { get; set; }
    public int VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;
    public string InvoiceNumber { get; set; } = null!;
    public int MedicineId { get; set; }
    public Medicine Medicine { get; set; } = null!;
    public int BatchId { get; set; }
    public MedicineBatch Batch { get; set; } = null!;
    public int QtyReceived { get; set; }
    public DateTime EntryDate { get; set; } = DateTime.UtcNow;
    public int CreatedByUserId { get; set; }
}

public class DispenseRecord
{
    public int DispenseId { get; set; }
    public int PrescriptionId { get; set; }
    public Prescription Prescription { get; set; } = null!;
    public int DispensedByUserId { get; set; }
    public DateTime DispensedAt { get; set; } = DateTime.UtcNow;
    public ICollection<DispenseItem> Items { get; set; } = new List<DispenseItem>();
}

public class DispenseItem
{
    public int DispenseItemId { get; set; }
    public int DispenseId { get; set; }
    public DispenseRecord Dispense { get; set; } = null!;
    public int PrescriptionItemId { get; set; }
    public PrescriptionItem PrescriptionItem { get; set; } = null!;
    public int BatchId { get; set; }
    public MedicineBatch Batch { get; set; } = null!;
    public int QtyDispensed { get; set; }
}
