using HMS.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Data;

public class HMSDbContext(DbContextOptions<HMSDbContext> options) : DbContext(options)
{
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<DoctorAvailability> DoctorAvailabilities => Set<DoctorAvailability>();
    public DbSet<Ward> Wards => Set<Ward>();
    public DbSet<Bed> Beds => Set<Bed>();

    public DbSet<Patient> Patients => Set<Patient>();

    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<IPDAdmission> IPDAdmissions => Set<IPDAdmission>();
    public DbSet<Vital> Vitals => Set<Vital>();
    public DbSet<Consultation> Consultations => Set<Consultation>();

    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<MedicineBatch> MedicineBatches => Set<MedicineBatch>();
    public DbSet<StockEntry> StockEntries => Set<StockEntry>();
    public DbSet<DispenseRecord> DispenseRecords => Set<DispenseRecord>();
    public DbSet<DispenseItem> DispenseItems => Set<DispenseItem>();

    public DbSet<TestCatalog> TestCatalogs => Set<TestCatalog>();
    public DbSet<TestOrder> TestOrders => Set<TestOrder>();
    public DbSet<TestResult> TestResults => Set<TestResult>();

    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<InsuranceClaim> InsuranceClaims => Set<InsuranceClaim>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // ---------- Identity ----------
        b.Entity<Role>(e =>
        {
            e.ToTable("Roles");
            e.HasKey(x => x.RoleId);
            e.Property(x => x.RoleName).HasMaxLength(30).IsRequired();
            e.HasIndex(x => x.RoleName).IsUnique();
        });

        b.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.UserId);
            e.Property(x => x.Username).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.Username).IsUnique();
            e.Property(x => x.PasswordHash).HasMaxLength(200).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(120).IsRequired();
            e.Property(x => x.Email).HasMaxLength(150);
            e.Property(x => x.Phone).HasMaxLength(20);
            e.HasOne(x => x.Role).WithMany(x => x.Users).HasForeignKey(x => x.RoleId);
            e.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId);
        });

        b.Entity<PasswordResetToken>(e =>
        {
            e.ToTable("PasswordResetTokens");
            e.HasKey(x => x.TokenId);
            e.Property(x => x.Token).HasMaxLength(200).IsRequired();
            e.HasIndex(x => x.Token).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        });

        // ---------- Org ----------
        b.Entity<Department>(e =>
        {
            e.ToTable("Departments");
            e.HasKey(x => x.DepartmentId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.ConsultationFee).HasColumnType("decimal(10,2)");
        });

        b.Entity<Doctor>(e =>
        {
            e.ToTable("Doctors");
            e.HasKey(x => x.DoctorId);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).IsRequired();
            e.HasIndex(x => x.UserId).IsUnique();
            e.HasOne(x => x.Department).WithMany(x => x.Doctors).HasForeignKey(x => x.DepartmentId);
            e.Property(x => x.ConsultationFee).HasColumnType("decimal(10,2)");
        });

        b.Entity<DoctorAvailability>(e =>
        {
            e.ToTable("DoctorAvailability");
            e.HasKey(x => x.DoctorAvailabilityId);
            e.HasOne(x => x.Doctor).WithMany(x => x.Availability).HasForeignKey(x => x.DoctorId);
            e.HasIndex(x => new { x.DoctorId, x.DayOfWeek }).IsUnique();
        });

        b.Entity<Ward>(e =>
        {
            e.ToTable("Wards");
            e.HasKey(x => x.WardId);
            e.Property(x => x.Name).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.RatePerDay).HasColumnType("decimal(10,2)");
        });

        b.Entity<Bed>(e =>
        {
            e.ToTable("Beds");
            e.HasKey(x => x.BedId);
            e.HasOne(x => x.Ward).WithMany(x => x.Beds).HasForeignKey(x => x.WardId);
            e.Property(x => x.BedNumber).HasMaxLength(20).IsRequired();
            e.HasIndex(x => new { x.WardId, x.BedNumber }).IsUnique();
        });

        // ---------- Patients ----------
        b.Entity<Patient>(e =>
        {
            e.ToTable("Patients");
            e.HasKey(x => x.PatientId);
            e.Property(x => x.UHID).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.UHID).IsUnique();
            e.Property(x => x.FullName).HasMaxLength(120).IsRequired();
            e.Property(x => x.Gender).HasMaxLength(10).IsRequired();
            e.Property(x => x.BloodGroup).HasMaxLength(5);
            e.Property(x => x.Mobile).HasMaxLength(15).IsRequired();
            e.Property(x => x.EmergencyContact).HasMaxLength(100);
            e.Property(x => x.Address).HasMaxLength(300);
            e.Property(x => x.KnownAllergies).HasMaxLength(300);
            e.Ignore(x => x.Age);
        });

        // ---------- Clinical ----------
        b.Entity<Appointment>(e =>
        {
            e.ToTable("Appointments");
            e.HasKey(x => x.AppointmentId);
            e.Property(x => x.TokenNumber).HasMaxLength(10).IsRequired();
            e.Property(x => x.SlotTime).HasMaxLength(10).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId);
            e.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId);
        });

        b.Entity<IPDAdmission>(e =>
        {
            e.ToTable("IPDAdmissions");
            e.HasKey(x => x.AdmissionId);
            e.Property(x => x.AdmissionType).HasMaxLength(15).IsRequired();
            e.Property(x => x.InitialDiagnosis).HasMaxLength(300);
            e.Property(x => x.AttendantName).HasMaxLength(120);
            e.Property(x => x.AttendantContact).HasMaxLength(20);
            e.Property(x => x.AdvanceDeposit).HasColumnType("decimal(10,2)");
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId);
            e.HasOne(x => x.Bed).WithMany().HasForeignKey(x => x.BedId);
        });

        b.Entity<Vital>(e =>
        {
            e.ToTable("Vitals");
            e.HasKey(x => x.VitalId);
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
        });

        b.Entity<Consultation>(e =>
        {
            e.ToTable("Consultations");
            e.HasKey(x => x.ConsultationId);
            e.Property(x => x.ChiefComplaint).HasMaxLength(500);
            e.Property(x => x.Diagnosis).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(15).IsRequired();
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId);
        });

        // ---------- Pharmacy ----------
        b.Entity<Medicine>(e =>
        {
            e.ToTable("Medicines");
            e.HasKey(x => x.MedicineId);
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Unit).HasMaxLength(30).IsRequired();
            e.Property(x => x.UnitPrice).HasColumnType("decimal(10,2)");
        });

        b.Entity<Prescription>(e =>
        {
            e.ToTable("Prescriptions");
            e.HasKey(x => x.PrescriptionId);
            e.Property(x => x.PatientType).HasMaxLength(5).IsRequired();
            e.Property(x => x.Status).HasMaxLength(15).IsRequired();
            e.HasOne(x => x.Consultation).WithMany().HasForeignKey(x => x.ConsultationId);
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId);
        });

        b.Entity<PrescriptionItem>(e =>
        {
            e.ToTable("PrescriptionItems");
            e.HasKey(x => x.PrescriptionItemId);
            e.Property(x => x.Dosage).HasMaxLength(50);
            e.Property(x => x.Duration).HasMaxLength(30);
            e.HasOne(x => x.Prescription).WithMany(x => x.Items).HasForeignKey(x => x.PrescriptionId);
            e.HasOne(x => x.Medicine).WithMany().HasForeignKey(x => x.MedicineId);
        });

        b.Entity<Vendor>(e =>
        {
            e.ToTable("Vendors");
            e.HasKey(x => x.VendorId);
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.ContactInfo).HasMaxLength(200);
        });

        b.Entity<MedicineBatch>(e =>
        {
            e.ToTable("MedicineBatches");
            e.HasKey(x => x.BatchId);
            e.Property(x => x.BatchNumber).HasMaxLength(30).IsRequired();
            e.HasOne(x => x.Medicine).WithMany(x => x.Batches).HasForeignKey(x => x.MedicineId);
            e.HasOne(x => x.Vendor).WithMany().HasForeignKey(x => x.VendorId);
            e.HasIndex(x => new { x.MedicineId, x.BatchNumber }).IsUnique();
        });

        b.Entity<StockEntry>(e =>
        {
            e.ToTable("StockEntries");
            e.HasKey(x => x.StockEntryId);
            e.Property(x => x.InvoiceNumber).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.Vendor).WithMany().HasForeignKey(x => x.VendorId);
            e.HasOne(x => x.Medicine).WithMany().HasForeignKey(x => x.MedicineId);
            e.HasOne(x => x.Batch).WithMany().HasForeignKey(x => x.BatchId);
        });

        b.Entity<DispenseRecord>(e =>
        {
            e.ToTable("DispenseRecords");
            e.HasKey(x => x.DispenseId);
            e.HasOne(x => x.Prescription).WithMany().HasForeignKey(x => x.PrescriptionId);
        });

        b.Entity<DispenseItem>(e =>
        {
            e.ToTable("DispenseItems");
            e.HasKey(x => x.DispenseItemId);
            e.HasOne(x => x.Dispense).WithMany(x => x.Items).HasForeignKey(x => x.DispenseId);
            e.HasOne(x => x.PrescriptionItem).WithMany().HasForeignKey(x => x.PrescriptionItemId);
            e.HasOne(x => x.Batch).WithMany().HasForeignKey(x => x.BatchId);
        });

        // ---------- Lab ----------
        b.Entity<TestCatalog>(e =>
        {
            e.ToTable("TestCatalog");
            e.HasKey(x => x.TestId);
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Type).HasMaxLength(15).IsRequired();
            e.Property(x => x.Price).HasColumnType("decimal(10,2)");
        });

        b.Entity<TestOrder>(e =>
        {
            e.ToTable("TestOrders");
            e.HasKey(x => x.OrderId);
            e.Property(x => x.SampleId).HasMaxLength(20);
            e.Property(x => x.Status).HasMaxLength(15).IsRequired();
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId);
            e.HasOne(x => x.Test).WithMany().HasForeignKey(x => x.TestId);
        });

        b.Entity<TestResult>(e =>
        {
            e.ToTable("TestResults");
            e.HasKey(x => x.ResultId);
            e.HasOne(x => x.Order).WithOne(x => x.Result!).HasForeignKey<TestResult>(x => x.OrderId);
            e.HasIndex(x => x.OrderId).IsUnique();
        });

        // ---------- Billing ----------
        b.Entity<Invoice>(e =>
        {
            e.ToTable("Invoices");
            e.HasKey(x => x.InvoiceId);
            e.Property(x => x.InvoiceNumber).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.InvoiceNumber).IsUnique();
            e.Property(x => x.InvoiceType).HasMaxLength(5).IsRequired();
            e.Property(x => x.Status).HasMaxLength(15).IsRequired();
            e.Property(x => x.TotalAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.PaidAmount).HasColumnType("decimal(12,2)");
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
        });

        b.Entity<InvoiceItem>(e =>
        {
            e.ToTable("InvoiceItems");
            e.HasKey(x => x.InvoiceItemId);
            e.Property(x => x.Description).HasMaxLength(200).IsRequired();
            e.Property(x => x.SourceType).HasMaxLength(20).IsRequired();
            e.Property(x => x.Amount).HasColumnType("decimal(10,2)");
            e.HasOne(x => x.Invoice).WithMany(x => x.Items).HasForeignKey(x => x.InvoiceId);
        });

        b.Entity<Payment>(e =>
        {
            e.ToTable("Payments");
            e.HasKey(x => x.PaymentId);
            e.Property(x => x.Amount).HasColumnType("decimal(12,2)");
            e.Property(x => x.Mode).HasMaxLength(15).IsRequired();
            e.HasOne(x => x.Invoice).WithMany(x => x.Payments).HasForeignKey(x => x.InvoiceId);
        });

        b.Entity<InsuranceClaim>(e =>
        {
            e.ToTable("InsuranceClaims");
            e.HasKey(x => x.ClaimId);
            e.Property(x => x.TPAName).HasMaxLength(100).IsRequired();
            e.Property(x => x.ClaimAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.AdjudicatedAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId);
            e.HasOne(x => x.Invoice).WithMany().HasForeignKey(x => x.InvoiceId);
        });
    }
}
