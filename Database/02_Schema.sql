/* =========================================================
   HMS - City Care Hospital Management System
   02_Schema.sql — tables, keys, constraints
   Run after 01_CreateDatabase.sql
   ========================================================= */
USE HMSDb;
GO

/* ---------- Reference / Identity ---------- */

CREATE TABLE dbo.Roles (
    RoleId          INT IDENTITY(1,1) PRIMARY KEY,
    RoleName        NVARCHAR(30) NOT NULL UNIQUE
        CHECK (RoleName IN ('Admin','Doctor','Nurse','Receptionist','Pharmacist','Lab','Accountant'))
);
GO

CREATE TABLE dbo.Departments (
    DepartmentId        INT IDENTITY(1,1) PRIMARY KEY,
    Name                 NVARCHAR(100) NOT NULL UNIQUE,
    ConsultationFee      DECIMAL(10,2) NOT NULL DEFAULT 0,
    IsActive             BIT NOT NULL DEFAULT 1,
    CreatedAt            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.Users (
    UserId               INT IDENTITY(1,1) PRIMARY KEY,
    Username             NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash         NVARCHAR(200) NOT NULL,
    FullName             NVARCHAR(120) NOT NULL,
    Email                NVARCHAR(150) NULL,
    Phone                NVARCHAR(20) NULL,
    RoleId               INT NOT NULL REFERENCES dbo.Roles(RoleId),
    DepartmentId         INT NULL REFERENCES dbo.Departments(DepartmentId),
    IsActive             BIT NOT NULL DEFAULT 1,
    MustChangePassword   BIT NOT NULL DEFAULT 0,
    CreatedAt            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    LastLoginAt          DATETIME2 NULL
);
GO

CREATE TABLE dbo.PasswordResetTokens (
    TokenId       INT IDENTITY(1,1) PRIMARY KEY,
    UserId        INT NOT NULL REFERENCES dbo.Users(UserId),
    Token         NVARCHAR(200) NOT NULL UNIQUE,
    ExpiresAt     DATETIME2 NOT NULL,
    UsedAt        DATETIME2 NULL,
    CreatedAt     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------- Doctors ---------- */

CREATE TABLE dbo.Doctors (
    DoctorId             INT IDENTITY(1,1) PRIMARY KEY,
    UserId               INT NOT NULL UNIQUE REFERENCES dbo.Users(UserId),
    DepartmentId         INT NOT NULL REFERENCES dbo.Departments(DepartmentId),
    ConsultationFee      DECIMAL(10,2) NOT NULL DEFAULT 0,
    HoursFrom            TIME NOT NULL DEFAULT '09:00',
    HoursTo              TIME NOT NULL DEFAULT '13:00',
    IsActive             BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.DoctorAvailability (
    DoctorAvailabilityId INT IDENTITY(1,1) PRIMARY KEY,
    DoctorId             INT NOT NULL REFERENCES dbo.Doctors(DoctorId),
    DayOfWeek            TINYINT NOT NULL CHECK (DayOfWeek BETWEEN 0 AND 6), -- 0=Mon..6=Sun
    IsAvailable          BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_DoctorAvailability UNIQUE (DoctorId, DayOfWeek)
);
GO

/* ---------- Patients ---------- */

CREATE TABLE dbo.Patients (
    PatientId            INT IDENTITY(1,1) PRIMARY KEY,
    UHID                 NVARCHAR(20) NOT NULL UNIQUE,
    FullName             NVARCHAR(120) NOT NULL,
    DateOfBirth          DATE NULL,
    Gender               NVARCHAR(10) NOT NULL CHECK (Gender IN ('Male','Female','Other')),
    BloodGroup           NVARCHAR(5) NULL,
    Mobile               NVARCHAR(15) NOT NULL,
    EmergencyContact     NVARCHAR(100) NULL,
    Address              NVARCHAR(300) NULL,
    KnownAllergies       NVARCHAR(300) NULL,
    CreatedAt            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Patients_Mobile ON dbo.Patients(Mobile);
CREATE INDEX IX_Patients_FullName ON dbo.Patients(FullName);
GO

/* ---------- Wards & Beds ---------- */

CREATE TABLE dbo.Wards (
    WardId               INT IDENTITY(1,1) PRIMARY KEY,
    Name                 NVARCHAR(50) NOT NULL UNIQUE,
    RatePerDay           DECIMAL(10,2) NOT NULL,
    IsActive             BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.Beds (
    BedId                INT IDENTITY(1,1) PRIMARY KEY,
    WardId               INT NOT NULL REFERENCES dbo.Wards(WardId),
    BedNumber            NVARCHAR(20) NOT NULL,
    Status               NVARCHAR(15) NOT NULL DEFAULT 'Available'
        CHECK (Status IN ('Available','Occupied')),
    CONSTRAINT UQ_Beds_Number UNIQUE (WardId, BedNumber)
);
GO

/* ---------- OPD Appointments ---------- */

CREATE TABLE dbo.Appointments (
    AppointmentId        INT IDENTITY(1,1) PRIMARY KEY,
    TokenNumber           NVARCHAR(10) NOT NULL,
    PatientId            INT NOT NULL REFERENCES dbo.Patients(PatientId),
    DoctorId             INT NOT NULL REFERENCES dbo.Doctors(DoctorId),
    DepartmentId         INT NOT NULL REFERENCES dbo.Departments(DepartmentId),
    AppointmentDate      DATE NOT NULL,
    SlotTime             VARCHAR(10) NOT NULL,
    Status               NVARCHAR(20) NOT NULL DEFAULT 'Waiting'
        CHECK (Status IN ('Waiting','InConsult','Completed','Cancelled')),
    CreatedByUserId      INT NOT NULL REFERENCES dbo.Users(UserId),
    CreatedAt            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Appointments_Date ON dbo.Appointments(AppointmentDate);
GO

/* ---------- IPD Admissions ---------- */

CREATE TABLE dbo.IPDAdmissions (
    AdmissionId          INT IDENTITY(1,1) PRIMARY KEY,
    PatientId            INT NOT NULL REFERENCES dbo.Patients(PatientId),
    DoctorId             INT NOT NULL REFERENCES dbo.Doctors(DoctorId),
    BedId                INT NOT NULL REFERENCES dbo.Beds(BedId),
    AdmissionType        NVARCHAR(15) NOT NULL CHECK (AdmissionType IN ('Planned','Emergency')),
    InitialDiagnosis     NVARCHAR(300) NULL,
    AttendantName        NVARCHAR(120) NULL,
    AttendantContact     NVARCHAR(20) NULL,
    AdvanceDeposit       DECIMAL(10,2) NOT NULL DEFAULT 0,
    AdmissionDate        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    DischargeAdvised     BIT NOT NULL DEFAULT 0,
    DischargeAdvisedAt   DATETIME2 NULL,
    BillCleared          BIT NOT NULL DEFAULT 0,
    DischargeDate        DATETIME2 NULL,
    Status               NVARCHAR(20) NOT NULL DEFAULT 'Admitted'
        CHECK (Status IN ('Admitted','DischargeAdvised','Discharged')),
    CreatedByUserId      INT NOT NULL REFERENCES dbo.Users(UserId)
);
GO

/* ---------- Vitals ---------- */

CREATE TABLE dbo.Vitals (
    VitalId              INT IDENTITY(1,1) PRIMARY KEY,
    PatientId            INT NOT NULL REFERENCES dbo.Patients(PatientId),
    AppointmentId        INT NULL REFERENCES dbo.Appointments(AppointmentId),
    AdmissionId          INT NULL REFERENCES dbo.IPDAdmissions(AdmissionId),
    RecordedByUserId     INT NOT NULL REFERENCES dbo.Users(UserId),
    BloodPressure        NVARCHAR(20) NULL,
    Pulse                NVARCHAR(20) NULL,
    Temperature           NVARCHAR(20) NULL,
    SpO2                 NVARCHAR(10) NULL,
    RespiratoryRate       NVARCHAR(10) NULL,
    Weight                NVARCHAR(10) NULL,
    Notes                 NVARCHAR(300) NULL,
    RecordedAt            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------- Consultations / Prescriptions ---------- */

CREATE TABLE dbo.Consultations (
    ConsultationId       INT IDENTITY(1,1) PRIMARY KEY,
    PatientId            INT NOT NULL REFERENCES dbo.Patients(PatientId),
    DoctorId             INT NOT NULL REFERENCES dbo.Doctors(DoctorId),
    AppointmentId        INT NULL REFERENCES dbo.Appointments(AppointmentId),
    AdmissionId          INT NULL REFERENCES dbo.IPDAdmissions(AdmissionId),
    ChiefComplaint       NVARCHAR(500) NULL,
    Diagnosis            NVARCHAR(500) NULL,
    ConsultDate           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Status                NVARCHAR(15) NOT NULL DEFAULT 'Open' CHECK (Status IN ('Open','Closed'))
);
GO

CREATE TABLE dbo.Medicines (
    MedicineId           INT IDENTITY(1,1) PRIMARY KEY,
    Name                 NVARCHAR(150) NOT NULL,
    Unit                 NVARCHAR(30) NOT NULL DEFAULT 'tabs',
    UnitPrice            DECIMAL(10,2) NOT NULL DEFAULT 0,
    ReorderThreshold     INT NOT NULL DEFAULT 20,
    IsActive             BIT NOT NULL DEFAULT 1
);
CREATE INDEX IX_Medicines_Name ON dbo.Medicines(Name);
GO

CREATE TABLE dbo.Prescriptions (
    PrescriptionId       INT IDENTITY(1,1) PRIMARY KEY,
    ConsultationId       INT NOT NULL REFERENCES dbo.Consultations(ConsultationId),
    PatientId            INT NOT NULL REFERENCES dbo.Patients(PatientId),
    DoctorId             INT NOT NULL REFERENCES dbo.Doctors(DoctorId),
    PatientType          NVARCHAR(5) NOT NULL CHECK (PatientType IN ('OPD','IPD')),
    Status                NVARCHAR(15) NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending','Dispensed')),
    CreatedAt             DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.PrescriptionItems (
    PrescriptionItemId   INT IDENTITY(1,1) PRIMARY KEY,
    PrescriptionId       INT NOT NULL REFERENCES dbo.Prescriptions(PrescriptionId),
    MedicineId           INT NOT NULL REFERENCES dbo.Medicines(MedicineId),
    Dosage                NVARCHAR(50) NULL,
    Duration              NVARCHAR(30) NULL,
    Quantity              INT NOT NULL DEFAULT 1
);
GO

/* ---------- Pharmacy: vendors, batches, purchase, dispense ---------- */

CREATE TABLE dbo.Vendors (
    VendorId             INT IDENTITY(1,1) PRIMARY KEY,
    Name                 NVARCHAR(150) NOT NULL,
    ContactInfo          NVARCHAR(200) NULL
);
GO

CREATE TABLE dbo.MedicineBatches (
    BatchId              INT IDENTITY(1,1) PRIMARY KEY,
    MedicineId           INT NOT NULL REFERENCES dbo.Medicines(MedicineId),
    BatchNumber          NVARCHAR(30) NOT NULL,
    ExpiryDate           DATE NOT NULL,
    StockQty             INT NOT NULL DEFAULT 0,
    VendorId             INT NULL REFERENCES dbo.Vendors(VendorId),
    ReceivedAt            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_MedicineBatch UNIQUE (MedicineId, BatchNumber)
);
CREATE INDEX IX_MedicineBatches_Expiry ON dbo.MedicineBatches(ExpiryDate);
GO

CREATE TABLE dbo.StockEntries (
    StockEntryId         INT IDENTITY(1,1) PRIMARY KEY,
    VendorId             INT NOT NULL REFERENCES dbo.Vendors(VendorId),
    InvoiceNumber        NVARCHAR(50) NOT NULL,
    MedicineId           INT NOT NULL REFERENCES dbo.Medicines(MedicineId),
    BatchId              INT NOT NULL REFERENCES dbo.MedicineBatches(BatchId),
    QtyReceived          INT NOT NULL,
    EntryDate             DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedByUserId       INT NOT NULL REFERENCES dbo.Users(UserId)
);
GO

CREATE TABLE dbo.DispenseRecords (
    DispenseId           INT IDENTITY(1,1) PRIMARY KEY,
    PrescriptionId       INT NOT NULL REFERENCES dbo.Prescriptions(PrescriptionId),
    DispensedByUserId    INT NOT NULL REFERENCES dbo.Users(UserId),
    DispensedAt           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.DispenseItems (
    DispenseItemId       INT IDENTITY(1,1) PRIMARY KEY,
    DispenseId           INT NOT NULL REFERENCES dbo.DispenseRecords(DispenseId),
    PrescriptionItemId   INT NOT NULL REFERENCES dbo.PrescriptionItems(PrescriptionItemId),
    BatchId              INT NOT NULL REFERENCES dbo.MedicineBatches(BatchId),
    QtyDispensed          INT NOT NULL
);
GO

/* ---------- Lab / Radiology (Diagnostics) ---------- */

CREATE TABLE dbo.TestCatalog (
    TestId               INT IDENTITY(1,1) PRIMARY KEY,
    Name                 NVARCHAR(150) NOT NULL,
    Type                 NVARCHAR(15) NOT NULL CHECK (Type IN ('Lab','Radiology')),
    Price                DECIMAL(10,2) NOT NULL DEFAULT 0,
    IsActive             BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.TestOrders (
    OrderId              INT IDENTITY(1,1) PRIMARY KEY,
    PatientId            INT NOT NULL REFERENCES dbo.Patients(PatientId),
    DoctorId             INT NOT NULL REFERENCES dbo.Doctors(DoctorId),
    TestId               INT NOT NULL REFERENCES dbo.TestCatalog(TestId),
    ConsultationId       INT NULL REFERENCES dbo.Consultations(ConsultationId),
    SampleId              NVARCHAR(20) NULL,
    Status                NVARCHAR(15) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending','Collected','ResultReady')),
    OrderedAt              DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CollectedAt            DATETIME2 NULL
);
GO

CREATE TABLE dbo.TestResults (
    ResultId             INT IDENTITY(1,1) PRIMARY KEY,
    OrderId              INT NOT NULL UNIQUE REFERENCES dbo.TestOrders(OrderId),
    ResultData            NVARCHAR(MAX) NULL, -- JSON key/value of parameters
    EnteredByUserId       INT NOT NULL REFERENCES dbo.Users(UserId),
    EnteredAt             DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------- Billing ---------- */

CREATE TABLE dbo.Invoices (
    InvoiceId            INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceNumber         NVARCHAR(20) NOT NULL UNIQUE,
    PatientId            INT NOT NULL REFERENCES dbo.Patients(PatientId),
    AppointmentId         INT NULL REFERENCES dbo.Appointments(AppointmentId),
    AdmissionId           INT NULL REFERENCES dbo.IPDAdmissions(AdmissionId),
    InvoiceType           NVARCHAR(5) NOT NULL CHECK (InvoiceType IN ('OPD','IPD')),
    TotalAmount           DECIMAL(12,2) NOT NULL DEFAULT 0,
    PaidAmount            DECIMAL(12,2) NOT NULL DEFAULT 0,
    Status                NVARCHAR(15) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending','Partial','Paid')),
    CreatedAt              DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.InvoiceItems (
    InvoiceItemId        INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceId            INT NOT NULL REFERENCES dbo.Invoices(InvoiceId),
    Description           NVARCHAR(200) NOT NULL,
    SourceType             NVARCHAR(20) NOT NULL
        CHECK (SourceType IN ('Registration','Consultation','Pharmacy','Lab','Room','Other')),
    Amount                DECIMAL(10,2) NOT NULL
);
GO

CREATE TABLE dbo.Payments (
    PaymentId            INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceId            INT NOT NULL REFERENCES dbo.Invoices(InvoiceId),
    Amount                DECIMAL(12,2) NOT NULL,
    Mode                  NVARCHAR(15) NOT NULL CHECK (Mode IN ('Cash','Card','UPI','Insurance')),
    ReceivedByUserId      INT NOT NULL REFERENCES dbo.Users(UserId),
    PaidAt                 DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.InsuranceClaims (
    ClaimId              INT IDENTITY(1,1) PRIMARY KEY,
    PatientId            INT NOT NULL REFERENCES dbo.Patients(PatientId),
    InvoiceId            INT NOT NULL REFERENCES dbo.Invoices(InvoiceId),
    TPAName               NVARCHAR(100) NOT NULL,
    ClaimAmount           DECIMAL(12,2) NOT NULL,
    AdjudicatedAmount     DECIMAL(12,2) NULL,
    Status                NVARCHAR(20) NOT NULL DEFAULT 'Submitted'
        CHECK (Status IN ('Submitted','UnderReview','Approved','Rejected')),
    SubmittedAt            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt              DATETIME2 NULL
);
GO
