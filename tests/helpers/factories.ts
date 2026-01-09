export function buildLoginPayload(overrides: Partial<{ username: string; password: string }> = {}) {
  return {
    username: "testadmin",
    password: "testpassword123",
    ...overrides,
  };
}

export function buildConsignmentPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    vin: "1HGBH41JXMN109186",
    year: "2024",
    make: "Ferrari",
    model: "488 Spider",
    mileage: "5000",
    color: "Rosso Corsa",
    condition: "Excellent",
    accidentHistory: "None",
    description: "Pristine condition, one owner",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "5551234567",
    photos: [],
    salvageTitle: false,
    mechanicalIssues: "",
    lienStatus: false,
    ownershipConfirmed: true,
    agreementAccepted: true,
    termsAccepted: true,
    ...overrides,
  };
}

export function buildVehicleInquiryPayload(vehicleId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    vehicleId,
    vin: "1HGBH41JXMN109186",
    year: 2024,
    make: "Ferrari",
    model: "488 Spider",
    buyerName: "Jane Smith",
    buyerPhone: "5559876543",
    buyerEmail: "jane@example.com",
    message: "I am interested in this vehicle",
    interestType: "purchase",
    buyTimeline: "1-2 weeks",
    hasTradeIn: false,
    financingPreference: "cash",
    contactPreference: "phone",
    bestTimeToContact: "morning",
    ...overrides,
  };
}

export function buildTradeInPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike@example.com",
    phone: "5551112222",
    year: "2020",
    make: "BMW",
    model: "M5",
    mileage: "25000",
    condition: "excellent" as const,
    vin: "WBAPH5C55BA123456",
    payoffAmount: "15000",
    additionalInfo: "Regular maintenance, no issues",
    ...overrides,
  };
}

export function buildCreditApplicationPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    firstName: "Sarah",
    lastName: "Williams",
    dateOfBirth: "1985-06-15",
    phone: "5553334444",
    email: "sarah@example.com",
    currentAddress: "123 Main St",
    currentCity: "Miami",
    currentState: "FL",
    currentZip: "33101",
    currentHowLong: "3 years",
    housingStatus: "own",
    monthlyPayment: 2500,
    employerName: "Tech Corp",
    employerPhone: "5555556666",
    jobTitle: "Software Engineer",
    employmentLength: "5 years",
    monthlyIncome: 12000,
    vehicleInterest: "Ferrari 488",
    tcpaConsent: true,
    ...overrides,
  };
}

export function buildAppointmentPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    firstName: "Robert",
    lastName: "Brown",
    email: "robert@example.com",
    phone: "5557778888",
    appointmentType: "test_drive" as const,
    preferredDate: "2026-02-15",
    preferredTime: "10:00 AM",
    alternateDate: "2026-02-16",
    alternateTime: "2:00 PM",
    notes: "Looking forward to it",
    ...overrides,
  };
}

export function buildInventoryPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    vin: "1HGBH41JXMN109186",
    year: 2024,
    make: "Lamborghini",
    model: "Huracan",
    trim: "EVO",
    mileage: 1500,
    color: "Verde Mantis",
    price: 285000,
    condition: "Like New",
    description: "Factory warranty remaining",
    photos: [],
    status: "available" as const,
    featured: true,
    ...overrides,
  };
}

export function buildSellerSendCodePayload(overrides: Partial<{ phone: string }> = {}) {
  return {
    phone: "5551234567",
    ...overrides,
  };
}

export function buildSellerVerifyPayload(overrides: Partial<{ phone: string; code: string }> = {}) {
  return {
    phone: "5551234567",
    code: "123456",
    ...overrides,
  };
}
