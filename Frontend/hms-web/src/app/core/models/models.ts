export interface UserDto {
  userId: number;
  username: string;
  fullName: string;
  role: string;
  email?: string;
  phone?: string;
  department?: string;
  isActive: boolean;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: UserDto;
}

export interface DepartmentDto {
  departmentId: number;
  name: string;
  consultationFee: number;
  isActive: boolean;
  doctorCount: number;
}

export interface DoctorDto {
  doctorId: number;
  name: string;
  department: string;
  consultationFee: number;
  hoursFrom: string;
  hoursTo: string;
  weeklyAvailability: boolean[];
  isActive: boolean;
}

export interface WardDto {
  wardId: number;
  name: string;
  ratePerDay: number;
  totalBeds: number;
  occupiedBeds: number;
}

export interface BedDto {
  bedId: number;
  bedNumber: string;
  wardName: string;
  wardId: number;
  status: string;
}

export interface PatientDto {
  patientId: number;
  uhid: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup?: string;
  mobile: string;
  emergencyContact?: string;
  address?: string;
  knownAllergies?: string;
}

export interface PatientSearchResult {
  patientId: number;
  uhid: string;
  fullName: string;
  age: number;
  gender: string;
  mobile: string;
}

export interface AppointmentDto {
  appointmentId: number;
  tokenNumber: string;
  patientId: number;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctor: string;
  department: string;
  appointmentDate: string;
  slotTime: string;
  status: string;
}

export interface DoctorSlotDto {
  slotTime: string;
  taken: boolean;
}

export interface IPDAdmissionDto {
  admissionId: number;
  patientId: number;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctor: string;
  ward: string;
  bed: string;
  admissionType: string;
  initialDiagnosis?: string;
  admissionDate: string;
  dischargeAdvised: boolean;
  billCleared: boolean;
  status: string;
  knownAllergies?: string;
}

export interface VitalDto {
  vitalId: number;
  bloodPressure?: string;
  pulse?: string;
  temperature?: string;
  spO2?: string;
  respiratoryRate?: string;
  weight?: string;
  notes?: string;
  recordedAt: string;
  recordedBy: string;
}

export interface ConsultationHistoryDto {
  consultationId: number;
  consultDate: string;
  chiefComplaint?: string;
  diagnosis?: string;
  doctor: string;
}

export interface MedicineOptionDto {
  medicineId: number;
  name: string;
  unit: string;
}

export interface PrescriptionQueueDto {
  prescriptionId: number;
  patientName: string;
  patientId: number;
  patientType: string;
  status: string;
  itemCount: number;
  createdAt: string;
}

export interface PrescriptionItemDetailDto {
  prescriptionItemId: number;
  medicineName: string;
  dosage: string;
  duration: string;
  quantity: number;
  bestBatch?: string;
  bestBatchExpiry?: string;
  stockAvailable: number;
}

export interface PrescriptionDetailDto {
  prescriptionId: number;
  patientName: string;
  patientId: number;
  patientType: string;
  status: string;
  doctorNote?: string;
  items: PrescriptionItemDetailDto[];
}

export interface MedicineInventoryDto {
  medicineId: number;
  name: string;
  unit: string;
  totalStock: number;
  reorderThreshold: number;
  nearestExpiry?: string;
  status: string;
}

export interface LowStockDto {
  medicineId: number;
  name: string;
  currentStock: number;
  threshold: number;
}

export interface VendorDto {
  vendorId: number;
  name: string;
  contactInfo?: string;
}

export interface TestCatalogDto {
  testId: number;
  name: string;
  type: string;
  price: number;
}

export interface TestOrderDto {
  orderId: number;
  patientName: string;
  patientId: number;
  testName: string;
  type: string;
  orderedBy: string;
  status: string;
  sampleId?: string;
  orderedAt: string;
}

export interface TestResultDto {
  orderId: number;
  testName: string;
  type: string;
  status: string;
  resultData?: string;
  enteredAt?: string;
  orderedBy: string;
}

export interface InvoiceLineDto {
  description: string;
  sourceType: string;
  amount: number;
}

export interface InvoiceDto {
  invoiceId: number;
  invoiceNumber: string;
  patientId: number;
  patientName: string;
  invoiceType: string;
  items: InvoiceLineDto[];
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
}

export interface PendingBillDto {
  appointmentId?: number;
  admissionId?: number;
  patientId: number;
  patientName: string;
  type: string;
  estimatedAmount: number;
}

export interface InsuranceClaimDto {
  claimId: number;
  patientName: string;
  tpaName: string;
  claimAmount: number;
  adjudicatedAmount?: number;
  status: string;
  submittedAt: string;
}

export interface RecentPaymentDto {
  invoiceNumber: string;
  patientName: string;
  mode: string;
  amount: number;
  status: string;
  paidAt: string;
}

export interface BillingSummaryDto {
  collectedToday: number;
  outstanding: number;
  insurancePending: number;
  invoicesToday: number;
}
