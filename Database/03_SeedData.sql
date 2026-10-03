/* =========================================================
   HMS - City Care Hospital Management System
   03_SeedData.sql — reference + demo data
   Run after 02_Schema.sql
   Default passwords (bcrypt-hashed below):
     admin        / Admin@123
     r.iyer       / Doctor@123      (Cardiology)
     s.patel      / Doctor@123      (Orthopedics)
     m.fernandes  / Nurse@123
     s.kulkarni   / Reception@123
     v.naik       / Pharma@123
     p.rao        / Lab@123
     n.joshi      / Accounts@123
   ========================================================= */
USE HMSDb;
GO

/* ---------- Roles ---------- */
INSERT INTO dbo.Roles (RoleName) VALUES
 ('Admin'),('Doctor'),('Nurse'),('Receptionist'),('Pharmacist'),('Lab'),('Accountant');
GO

/* ---------- Departments ---------- */
INSERT INTO dbo.Departments (Name, ConsultationFee) VALUES
 ('General Medicine', 500),
 ('Cardiology', 900),
 ('Orthopedics', 700),
 ('Pediatrics', 550),
 ('Gynecology', 600),
 ('ENT', 500);
GO

/* ---------- Users (passwords hashed with BCrypt, work factor 11) ---------- */
INSERT INTO dbo.Users (Username, PasswordHash, FullName, Email, Phone, RoleId, DepartmentId, IsActive) VALUES
 ('admin',       '$2a$11$EBc18huDlCjVS78O7suouuTc3wNnpvRW6PSak/MZY8TLI5K6AFGZG', 'A. Mehta',        'admin@citycare.in',       '9800000001', (SELECT RoleId FROM dbo.Roles WHERE RoleName='Admin'),        NULL, 1),
 ('r.iyer',      '$2a$11$m0jKnZRVqTKgeFEDCAVrFO9k8.EbUwOzcDUC44l3r8MtZOyd1wat2', 'Dr. R. Iyer',     'r.iyer@citycare.in',      '9800000002', (SELECT RoleId FROM dbo.Roles WHERE RoleName='Doctor'),       (SELECT DepartmentId FROM dbo.Departments WHERE Name='Cardiology'), 1),
 ('s.patel',     '$2a$11$nqqhT4Y5zE023Q8nWIAh.e033fBA/5sJQXuxv3gjkbKMh3FnEwh3m', 'Dr. S. Patel',    's.patel@citycare.in',     '9800000003', (SELECT RoleId FROM dbo.Roles WHERE RoleName='Doctor'),       (SELECT DepartmentId FROM dbo.Departments WHERE Name='Orthopedics'), 1),
 ('m.fernandes', '$2a$11$2L070nLwSHwOYTT/BTVUau8kmn1y6vWF/RYzPpLs.HWUalfcCwvfe', 'M. Fernandes',    'm.fernandes@citycare.in', '9800000004', (SELECT RoleId FROM dbo.Roles WHERE RoleName='Nurse'),        NULL, 1),
 ('s.kulkarni',  '$2a$11$MDYYZAxHKbyjnrGGBnfMVu00aFzGFEH8eXI.ER5f8GqkCRl139RTy', 'S. Kulkarni',     's.kulkarni@citycare.in',  '9800000005', (SELECT RoleId FROM dbo.Roles WHERE RoleName='Receptionist'), NULL, 1),
 ('v.naik',      '$2a$11$IUIBHP0LgoIECRERQGc52.KtSCKI5UBPJxVPkIq3jV2qXWAYtFgV6', 'V. Naik',         'v.naik@citycare.in',      '9800000006', (SELECT RoleId FROM dbo.Roles WHERE RoleName='Pharmacist'),   NULL, 1),
 ('p.rao',       '$2a$11$c6q5SK6lf6i6n/L6dPjoj.JsmtcfFyKjjOpcTb.uwlnBaS3bcs9uq', 'P. Rao',          'p.rao@citycare.in',       '9800000007', (SELECT RoleId FROM dbo.Roles WHERE RoleName='Lab'),          NULL, 1),
 ('n.joshi',     '$2a$11$dW7c/WRq9f4j8ulmG4uFuO/OYdznj36Ikw1d61f8CMBmUlcxRF8ma', 'N. Joshi',        'n.joshi@citycare.in',     '9800000008', (SELECT RoleId FROM dbo.Roles WHERE RoleName='Accountant'),   NULL, 1);
GO

/* ---------- Doctors + Availability ---------- */
INSERT INTO dbo.Doctors (UserId, DepartmentId, ConsultationFee, HoursFrom, HoursTo) VALUES
 ((SELECT UserId FROM dbo.Users WHERE Username='r.iyer'),  (SELECT DepartmentId FROM dbo.Departments WHERE Name='Cardiology'),  900, '09:00', '13:00'),
 ((SELECT UserId FROM dbo.Users WHERE Username='s.patel'), (SELECT DepartmentId FROM dbo.Departments WHERE Name='Orthopedics'), 700, '11:00', '15:00');
GO

-- Dr. Iyer: Mon-Fri (0-4) available; Dr. Patel: Mon-Sat (0-5) available
INSERT INTO dbo.DoctorAvailability (DoctorId, DayOfWeek, IsAvailable)
SELECT d.DoctorId, v.DayOfWeek, 1
FROM dbo.Doctors d
CROSS APPLY (VALUES (0),(1),(2),(3),(4)) AS v(DayOfWeek)
WHERE d.DoctorId = (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer'));

INSERT INTO dbo.DoctorAvailability (DoctorId, DayOfWeek, IsAvailable)
SELECT d.DoctorId, v.DayOfWeek, 1
FROM dbo.Doctors d
CROSS APPLY (VALUES (0),(1),(2),(3),(4),(5)) AS v(DayOfWeek)
WHERE d.DoctorId = (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='s.patel'));
GO

/* ---------- Wards & Beds ---------- */
INSERT INTO dbo.Wards (Name, RatePerDay) VALUES
 ('General Ward', 1800),
 ('Semi-Private', 3500),
 ('ICU', 9000);
GO

INSERT INTO dbo.Beds (WardId, BedNumber, Status)
SELECT (SELECT WardId FROM dbo.Wards WHERE Name='General Ward'), 'GW-'+RIGHT('0'+CAST(n AS VARCHAR(2)),2), CASE WHEN n<=8 THEN 'Occupied' ELSE 'Available' END
FROM (SELECT TOP 12 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n FROM sys.objects) x;

INSERT INTO dbo.Beds (WardId, BedNumber, Status)
SELECT (SELECT WardId FROM dbo.Wards WHERE Name='Semi-Private'), 'SP-'+RIGHT('0'+CAST(n AS VARCHAR(2)),2), CASE WHEN n<=4 THEN 'Occupied' ELSE 'Available' END
FROM (SELECT TOP 6 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n FROM sys.objects) x;

INSERT INTO dbo.Beds (WardId, BedNumber, Status)
SELECT (SELECT WardId FROM dbo.Wards WHERE Name='ICU'), 'ICU-'+RIGHT('0'+CAST(n AS VARCHAR(2)),2), CASE WHEN n<=4 THEN 'Occupied' ELSE 'Available' END
FROM (SELECT TOP 6 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n FROM sys.objects) x;
GO

/* ---------- Patients ---------- */
INSERT INTO dbo.Patients (UHID, FullName, DateOfBirth, Gender, BloodGroup, Mobile, EmergencyContact, Address, KnownAllergies) VALUES
 ('UHID-20260819', 'Anita Sharma',      '1992-03-14', 'Female', 'O+', '9811111111', 'R. Sharma - 9811111112', 'Pune', 'Penicillin'),
 ('UHID-20259112', 'Rohan Deshpande',   '1968-07-02', 'Male',   'B+', '9811111113', 'S. Deshpande - 9811111114', 'Pune', NULL),
 ('UHID-20260710', 'Farida Khan',       '1999-01-20', 'Female', 'A+', '9811111115', 'M. Khan - 9811111116', 'Pune', NULL),
 ('UHID-20258890', 'Mohit Verma',       '1981-11-09', 'Male',   'AB+','9811111117', 'K. Verma - 9811111118', 'Pune', 'Sulfa drugs'),
 ('UHID-20260721', 'Kavya Reddy',       '2020-05-30', 'Female', 'O-', '9811111119', 'P. Reddy - 9811111120', 'Pune', NULL);
GO

/* ---------- Medicines, Vendors, Batches ---------- */
INSERT INTO dbo.Vendors (Name, ContactInfo) VALUES
 ('MedSupply Distributors', 'sales@medsupply.in'),
 ('PharmaCorp India', 'orders@pharmacorp.in');
GO

INSERT INTO dbo.Medicines (Name, Unit, UnitPrice, ReorderThreshold) VALUES
 ('Amoxicillin 500mg', 'tabs', 8, 30),
 ('Paracetamol 650mg', 'tabs', 3, 30),
 ('Insulin Glargine', 'vials', 450, 15),
 ('Metformin 500mg', 'tabs', 4, 30),
 ('Atropine Injection', 'vials', 60, 10),
 ('Surgical Gloves (M)', 'pairs', 12, 100);
GO

INSERT INTO dbo.MedicineBatches (MedicineId, BatchNumber, ExpiryDate, StockQty, VendorId) VALUES
 ((SELECT MedicineId FROM dbo.Medicines WHERE Name='Amoxicillin 500mg'), 'B-4471', '2027-12-31', 120, (SELECT VendorId FROM dbo.Vendors WHERE Name='MedSupply Distributors')),
 ((SELECT MedicineId FROM dbo.Medicines WHERE Name='Paracetamol 650mg'), 'B-3390', '2028-03-31', 340, (SELECT VendorId FROM dbo.Vendors WHERE Name='MedSupply Distributors')),
 ((SELECT MedicineId FROM dbo.Medicines WHERE Name='Insulin Glargine'),  'B-5512', '2027-01-31', 8,   (SELECT VendorId FROM dbo.Vendors WHERE Name='PharmaCorp India')),
 ((SELECT MedicineId FROM dbo.Medicines WHERE Name='Metformin 500mg'),  'B-2207', '2027-09-30', 210, (SELECT VendorId FROM dbo.Vendors WHERE Name='PharmaCorp India')),
 ((SELECT MedicineId FROM dbo.Medicines WHERE Name='Atropine Injection'), 'B-6621', '2027-06-30', 5, (SELECT VendorId FROM dbo.Vendors WHERE Name='PharmaCorp India')),
 ((SELECT MedicineId FROM dbo.Medicines WHERE Name='Surgical Gloves (M)'), 'B-7010', '2029-01-31', 40, (SELECT VendorId FROM dbo.Vendors WHERE Name='MedSupply Distributors'));
GO

/* ---------- Test Catalog ---------- */
INSERT INTO dbo.TestCatalog (Name, Type, Price) VALUES
 ('Complete Blood Count (CBC)', 'Lab', 350),
 ('Lipid Profile', 'Lab', 600),
 ('HbA1c', 'Lab', 500),
 ('X-Ray Chest', 'Radiology', 450),
 ('CT Scan', 'Radiology', 3500),
 ('Ultrasound Abdomen', 'Radiology', 1200);
GO

/* ---------- Demo OPD Appointments (today) ---------- */
INSERT INTO dbo.Appointments (TokenNumber, PatientId, DoctorId, DepartmentId, AppointmentDate, SlotTime, Status, CreatedByUserId) VALUES
 ('A-12', (SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20260819'), (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer')), (SELECT DepartmentId FROM dbo.Departments WHERE Name='General Medicine'), CAST(SYSUTCDATETIME() AS DATE), '10:15 AM', 'Waiting', (SELECT UserId FROM dbo.Users WHERE Username='s.kulkarni')),
 ('A-13', (SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20260710'), (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='s.patel')), (SELECT DepartmentId FROM dbo.Departments WHERE Name='Orthopedics'), CAST(SYSUTCDATETIME() AS DATE), '10:40 AM', 'InConsult', (SELECT UserId FROM dbo.Users WHERE Username='s.kulkarni')),
 ('A-14', (SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20260721'), (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer')), (SELECT DepartmentId FROM dbo.Departments WHERE Name='Pediatrics'), CAST(SYSUTCDATETIME() AS DATE), '11:00 AM', 'Waiting', (SELECT UserId FROM dbo.Users WHERE Username='s.kulkarni'));
GO

/* ---------- Demo IPD Admissions ---------- */
INSERT INTO dbo.IPDAdmissions (PatientId, DoctorId, BedId, AdmissionType, InitialDiagnosis, AttendantName, AttendantContact, AdvanceDeposit, DischargeAdvised, BillCleared, Status, CreatedByUserId) VALUES
 ((SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20259112'), (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer')), (SELECT BedId FROM dbo.Beds WHERE BedNumber='ICU-04'), 'Emergency', 'Acute coronary syndrome — for monitoring', 'S. Deshpande', '9811111114', 20000, 0, 0, 'Admitted', (SELECT UserId FROM dbo.Users WHERE Username='s.kulkarni')),
 ((SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20258890'), (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer')), (SELECT BedId FROM dbo.Beds WHERE BedNumber='SP-04'), 'Planned', 'Uncontrolled diabetes — for stabilization', 'K. Verma', '9811111118', 10000, 1, 0, 'DischargeAdvised', (SELECT UserId FROM dbo.Users WHERE Username='s.kulkarni'));
GO

/* ---------- Demo Consultation + Prescription + Rx items for Anita Sharma ---------- */
DECLARE @ConsultId INT, @RxId INT;

INSERT INTO dbo.Consultations (PatientId, DoctorId, AppointmentId, ChiefComplaint, Diagnosis, Status)
VALUES ((SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20260819'),
        (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer')),
        (SELECT AppointmentId FROM dbo.Appointments WHERE TokenNumber='A-12'),
        'Fever and body ache since 3 days, mild cough.',
        'Viral fever with upper respiratory tract infection. No signs of pneumonia.',
        'Open');
SET @ConsultId = SCOPE_IDENTITY();

INSERT INTO dbo.Prescriptions (ConsultationId, PatientId, DoctorId, PatientType, Status)
VALUES (@ConsultId, (SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20260819'),
        (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer')),
        'OPD', 'Pending');
SET @RxId = SCOPE_IDENTITY();

INSERT INTO dbo.PrescriptionItems (PrescriptionId, MedicineId, Dosage, Duration, Quantity) VALUES
 (@RxId, (SELECT MedicineId FROM dbo.Medicines WHERE Name='Amoxicillin 500mg'), '1-0-1 after food', '5 days', 10),
 (@RxId, (SELECT MedicineId FROM dbo.Medicines WHERE Name='Paracetamol 650mg'), '1-1-1 SOS', '3 days', 6);
GO

/* ---------- Demo Consultation + Prescription for Mohit Verma (IPD) ---------- */
DECLARE @ConsultId2 INT, @RxId2 INT;

INSERT INTO dbo.Consultations (PatientId, DoctorId, AdmissionId, ChiefComplaint, Diagnosis, Status)
VALUES ((SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20258890'),
        (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer')),
        (SELECT AdmissionId FROM dbo.IPDAdmissions a JOIN dbo.Patients p ON p.PatientId=a.PatientId WHERE p.UHID='UHID-20258890'),
        'Uncontrolled blood sugar levels.',
        'Type 2 Diabetes Mellitus — for insulin stabilization.',
        'Open');
SET @ConsultId2 = SCOPE_IDENTITY();

INSERT INTO dbo.Prescriptions (ConsultationId, PatientId, DoctorId, PatientType, Status)
VALUES (@ConsultId2, (SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20258890'),
        (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer')),
        'IPD', 'Pending');
SET @RxId2 = SCOPE_IDENTITY();

INSERT INTO dbo.PrescriptionItems (PrescriptionId, MedicineId, Dosage, Duration, Quantity) VALUES
 (@RxId2, (SELECT MedicineId FROM dbo.Medicines WHERE Name='Insulin Glargine'), '1 vial subcutaneous nightly', '7 days', 1),
 (@RxId2, (SELECT MedicineId FROM dbo.Medicines WHERE Name='Metformin 500mg'), '1-0-1 after food', '7 days', 20);
GO

/* ---------- Demo Test Orders ---------- */
INSERT INTO dbo.TestOrders (PatientId, DoctorId, TestId, Status, SampleId, CollectedAt) VALUES
 ((SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20260819'), (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer')), (SELECT TestId FROM dbo.TestCatalog WHERE Name='Complete Blood Count (CBC)'), 'Pending', NULL, NULL),
 ((SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20259112'), (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer')), (SELECT TestId FROM dbo.TestCatalog WHERE Name='Lipid Profile'), 'Collected', 'SMP-4821', SYSUTCDATETIME()),
 ((SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20260710'), (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='s.patel')), (SELECT TestId FROM dbo.TestCatalog WHERE Name='X-Ray Chest'), 'Pending', NULL, NULL);

INSERT INTO dbo.TestOrders (PatientId, DoctorId, TestId, Status, SampleId, CollectedAt)
VALUES ((SELECT PatientId FROM dbo.Patients WHERE UHID='UHID-20258890'), (SELECT DoctorId FROM dbo.Doctors WHERE UserId=(SELECT UserId FROM dbo.Users WHERE Username='r.iyer')), (SELECT TestId FROM dbo.TestCatalog WHERE Name='HbA1c'), 'ResultReady', 'SMP-4790', DATEADD(DAY,-1,SYSUTCDATETIME()));

INSERT INTO dbo.TestResults (OrderId, ResultData, EnteredByUserId)
SELECT OrderId, '{"HbA1c":"7.8%"}', (SELECT UserId FROM dbo.Users WHERE Username='p.rao')
FROM dbo.TestOrders WHERE SampleId='SMP-4790';
GO
