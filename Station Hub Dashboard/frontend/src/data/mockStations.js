// frontend/src/data/mockStations.js

// Full station data — used by both list and review views
export const mockStations = [
  {
    id: '1',
    name: 'AutoSpa Islamabad',
    slug: 'autospa-islamabad',
    stationType: 'CAR_CARE',
    status: 'SUBMITTED',
    description: 'Premium car wash and detailing studio serving Islamabad since 2020. We specialize in ceramic coating, interior deep cleaning, and paint correction.',

    // Business / Partner
    partner: {
      id: 'p1',
      name: 'Hamza Khan',
      email: 'hamza@autospa.pk',
      phone: '+92 300 1234567',
      accountStatus: 'ACTIVE',
      joinedAt: '2026-08-15T10:00:00Z',
    },
    contact: {
      phone: '+92 51 1234567',
      email: 'info@autospa.pk',
      website: 'https://autospa.pk',
    },

    // Category
    supportsCarCare: true,
    supportsEVCharging: false,
    is24Hours: false,

    // Location
    address: {
      line1: 'Plot 45, F-7 Markaz',
      line2: 'Near Jinnah Super Market',
      city: 'Islamabad',
      province: 'Islamabad Capital Territory',
      postalCode: '44000',
      countryCode: 'PK',
    },
    coordinates: { latitude: 33.7167, longitude: 73.0583 },

    // Photos
    photos: [
      { id: 'ph1', url: 'https://picsum.photos/seed/autospa1/800/600', thumbnailUrl: 'https://picsum.photos/seed/autospa1/300/200', sortOrder: 1, isPrimary: true },
      { id: 'ph2', url: 'https://picsum.photos/seed/autospa2/800/600', thumbnailUrl: 'https://picsum.photos/seed/autospa2/300/200', sortOrder: 2, isPrimary: false },
      { id: 'ph3', url: 'https://picsum.photos/seed/autospa3/800/600', thumbnailUrl: 'https://picsum.photos/seed/autospa3/300/200', sortOrder: 3, isPrimary: false },
      { id: 'ph4', url: 'https://picsum.photos/seed/autospa4/800/600', thumbnailUrl: 'https://picsum.photos/seed/autospa4/300/200', sortOrder: 4, isPrimary: false },
    ],

    // Hours
    hours: [
      { dayOfWeek: 0, openTime: '10:00', closeTime: '18:00', isClosed: false, is24Hours: false },
      { dayOfWeek: 1, openTime: '09:00', closeTime: '20:00', isClosed: false, is24Hours: false },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '20:00', isClosed: false, is24Hours: false },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '20:00', isClosed: false, is24Hours: false },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00', isClosed: false, is24Hours: false },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '20:00', isClosed: false, is24Hours: false },
      { dayOfWeek: 6, openTime: '10:00', closeTime: '18:00', isClosed: false, is24Hours: false },
    ],

    // Services
    services: [
      {
        id: 's1',
        category: { id: 'c1', name: 'Car Wash' },
        name: 'Premium Exterior + Interior Wash',
        description: 'Complete exterior foam wash, interior vacuum, dashboard polish, and tire shine.',
        basePrice: 1500,
        currency: 'PKR',
        durationMinutes: 45,
        isBookable: true,
        isActive: true,
        vehiclePrices: [
          { vehicleType: 'Sedan', price: 1500 },
          { vehicleType: 'SUV', price: 2000 },
          { vehicleType: 'Pickup', price: 2500 },
        ],
      },
      {
        id: 's2',
        category: { id: 'c1', name: 'Car Wash' },
        name: 'Basic Exterior Wash',
        description: 'Exterior foam wash and tire cleaning.',
        basePrice: 800,
        currency: 'PKR',
        durationMinutes: 20,
        isBookable: true,
        isActive: true,
      },
      {
        id: 's3',
        category: { id: 'c2', name: 'Detailing' },
        name: 'Ceramic Coating (Full Body)',
        description: '9H ceramic coating with 2-year warranty. Includes paint correction.',
        basePrice: 45000,
        currency: 'PKR',
        durationMinutes: 480,
        isBookable: true,
        isActive: true,
      },
      {
        id: 's4',
        category: { id: 'c3', name: 'Interior Cleaning' },
        name: 'Interior Deep Clean',
        description: 'Steam cleaning of seats, carpets, roof lining, and dashboard.',
        basePrice: 8000,
        currency: 'PKR',
        durationMinutes: 180,
        isBookable: true,
        isActive: true,
      },
    ],

    // EV (not applicable for this station)
    evProfile: null,
    chargingUnits: [],

    // Facilities
    facilities: [
      { id: 'f1', name: 'Free WiFi', icon: '📶' },
      { id: 'f2', name: 'Waiting Area', icon: '🪑' },
      { id: 'f3', name: 'Cafe', icon: '☕' },
      { id: 'f4', name: 'Washroom', icon: '🚻' },
      { id: 'f5', name: 'Parking', icon: '🅿️' },
    ],

    // Verification documents
    documents: [
      { id: 'd1', type: 'BUSINESS_LICENSE', url: '#', uploadedAt: '2026-08-20T10:00:00Z', verified: true },
      { id: 'd2', type: 'CNIC', url: '#', uploadedAt: '2026-08-20T10:00:00Z', verified: true },
      { id: 'd3', type: 'UTILITY_BILL', url: '#', uploadedAt: '2026-08-20T10:00:00Z', verified: false },
    ],

    // Moderation history
    approvalHistory: [
      { id: 'h1', action: 'SUBMITTED', actor: { id: 'u1', name: 'Hamza Khan', role: 'STATION_OWNER' }, previousStatus: 'DRAFT', newStatus: 'SUBMITTED', createdAt: '2026-09-28T10:30:00Z' },
    ],

    currentSubmission: { submittedAt: '2026-09-28T10:30:00Z', submittedBy: 'Hamza Khan', version: 1 },
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-09-28T10:30:00Z',
  },

  {
    id: '2',
    name: 'EV Charge Hub Lahore',
    slug: 'ev-charge-hub-lahore',
    stationType: 'EV_CHARGING',
    status: 'APPROVED',
    description: 'Fast DC charging station in DHA Lahore. 6 charging bays with CCS2 and Type 2 connectors. 24/7 access.',

    partner: {
      id: 'p2', name: 'Ali Raza', email: 'ali@evcharge.pk', phone: '+92 321 7654321',
      accountStatus: 'ACTIVE', joinedAt: '2026-07-10T10:00:00Z',
    },
    contact: { phone: '+92 42 9876543', email: 'info@evcharge.pk', website: 'https://evcharge.pk' },

    supportsCarCare: false,
    supportsEVCharging: true,
    is24Hours: true,

    address: {
      line1: 'Phase 5, DHA',
      line2: 'Near LGS School',
      city: 'Lahore',
      province: 'Punjab',
      postalCode: '54000',
      countryCode: 'PK',
    },
    coordinates: { latitude: 31.4697, longitude: 74.4126 },

    photos: [
      { id: 'ph5', url: 'https://picsum.photos/seed/evhub1/800/600', thumbnailUrl: 'https://picsum.photos/seed/evhub1/300/200', sortOrder: 1, isPrimary: true },
      { id: 'ph6', url: 'https://picsum.photos/seed/evhub2/800/600', thumbnailUrl: 'https://picsum.photos/seed/evhub2/300/200', sortOrder: 2, isPrimary: false },
    ],

    hours: Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i, openTime: '00:00', closeTime: '23:59', isClosed: false, is24Hours: true,
    })),

    services: [],
    evProfile: {
      operatorName: 'EV Charge Hub Pvt Ltd',
      networkName: 'EVChargeHub',
      accessType: 'PUBLIC',
      is24Hours: true,
      paymentRequired: true,
      supportsReservation: false,
      pricingNotes: 'PKR 65 per kWh for DC fast charging. PKR 45 per kWh for AC.',
      lastVerifiedAt: '2026-09-15T10:00:00Z',
    },
    chargingUnits: [
      {
        id: 'u1', label: 'Bay 1-2', chargingType: 'DC', maxPowerKw: 60, quantity: 2, operationalState: 'OPERATIONAL',
        connectors: [{ id: 'c1', name: 'CCS2' }, { id: 'c2', name: 'CHAdeMO' }],
        pricing: { pricingType: 'PER_KWH', amount: 65, currency: 'PKR', unit: 'kWh', sessionFee: 0, notes: 'Fast DC charging' },
      },
      {
        id: 'u2', label: 'Bay 3-6', chargingType: 'AC', maxPowerKw: 22, quantity: 4, operationalState: 'OPERATIONAL',
        connectors: [{ id: 'c3', name: 'Type 2' }],
        pricing: { pricingType: 'PER_KWH', amount: 45, currency: 'PKR', unit: 'kWh', sessionFee: 0, notes: 'AC charging' },
      },
    ],

    facilities: [
      { id: 'f6', name: 'Cafe', icon: '☕' },
      { id: 'f7', name: 'Washroom', icon: '🚻' },
      { id: 'f8', name: 'Free WiFi', icon: '📶' },
      { id: 'f9', name: 'Parking', icon: '🅿️' },
    ],

    documents: [
      { id: 'd4', type: 'BUSINESS_LICENSE', url: '#', uploadedAt: '2026-07-15T10:00:00Z', verified: true },
      { id: 'd5', type: 'OWNERSHIP_PROOF', url: '#', uploadedAt: '2026-07-15T10:00:00Z', verified: true },
    ],

    approvalHistory: [
      { id: 'h2', action: 'SUBMITTED', actor: { id: 'u2', name: 'Ali Raza', role: 'STATION_OWNER' }, previousStatus: 'DRAFT', newStatus: 'SUBMITTED', createdAt: '2026-09-20T14:15:00Z' },
      { id: 'h3', action: 'APPROVED', actor: { id: 'a1', name: 'Admin', role: 'SUPER_ADMIN' }, previousStatus: 'SUBMITTED', newStatus: 'APPROVED', createdAt: '2026-09-22T09:00:00Z' },
    ],

    currentSubmission: { submittedAt: '2026-09-20T14:15:00Z', submittedBy: 'Ali Raza', version: 1 },
    createdAt: '2026-07-10T10:00:00Z',
    updatedAt: '2026-09-22T09:00:00Z',
  },

  {
    id: '3',
    name: 'Speedy Wash & Charge',
    slug: 'speedy-wash-charge',
    stationType: 'BOTH',
    status: 'CHANGES_PENDING',
    description: 'Combined car wash and EV charging station in Karachi.',

    partner: { id: 'p3', name: 'Sara Ahmed', email: 'sara@speedy.pk', phone: '+92 333 1112223', accountStatus: 'ACTIVE', joinedAt: '2026-06-01T10:00:00Z' },
    contact: { phone: '+92 21 3456789', email: 'info@speedy.pk' },

    supportsCarCare: true,
    supportsEVCharging: true,
    is24Hours: false,

    address: { line1: 'Block 6, PECHS', line2: '', city: 'Karachi', province: 'Sindh', postalCode: '75400', countryCode: 'PK' },
    coordinates: { latitude: 24.8607, longitude: 67.0011 },

    photos: [
      { id: 'ph7', url: 'https://picsum.photos/seed/speedy1/800/600', thumbnailUrl: 'https://picsum.photos/seed/speedy1/300/200', sortOrder: 1, isPrimary: true },
    ],

    hours: Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i, openTime: '08:00', closeTime: '22:00', isClosed: false, is24Hours: false,
    })),

    services: [
      {
        id: 's5', category: { id: 'c1', name: 'Car Wash' },
        name: 'Express Wash', description: 'Quick exterior wash in 15 minutes.',
        basePrice: 600, currency: 'PKR', durationMinutes: 15, isBookable: true, isActive: true,
      },
    ],

    evProfile: {
      operatorName: 'Speedy Pvt Ltd', networkName: 'SpeedyCharge',
      accessType: 'PUBLIC', is24Hours: false, paymentRequired: true, supportsReservation: true,
      pricingNotes: 'PKR 55 per kWh.', lastVerifiedAt: '2026-09-10T10:00:00Z',
    },
    chargingUnits: [
      {
        id: 'u3', label: 'Unit A', chargingType: 'DC', maxPowerKw: 50, quantity: 1, operationalState: 'OPERATIONAL',
        connectors: [{ id: 'c1', name: 'CCS2' }],
        pricing: { pricingType: 'PER_KWH', amount: 55, currency: 'PKR', unit: 'kWh', sessionFee: 0, notes: '' },
      },
    ],

    facilities: [
      { id: 'f10', name: 'Washroom', icon: '🚻' },
      { id: 'f11', name: 'Parking', icon: '🅿️' },
    ],

    documents: [
      { id: 'd6', type: 'BUSINESS_LICENSE', url: '#', uploadedAt: '2026-06-05T10:00:00Z', verified: true },
    ],

    approvalHistory: [
      { id: 'h4', action: 'SUBMITTED', actor: { id: 'u3', name: 'Sara Ahmed', role: 'STATION_OWNER' }, previousStatus: 'DRAFT', newStatus: 'SUBMITTED', createdAt: '2026-09-10T09:00:00Z' },
      { id: 'h5', action: 'CHANGES_REQUESTED', actor: { id: 'a1', name: 'Admin', role: 'SUPER_ADMIN' }, reason: 'Please upload a clearer photo of the EV charging bays.', previousStatus: 'SUBMITTED', newStatus: 'CHANGES_REQUESTED', createdAt: '2026-09-12T11:00:00Z' },
      { id: 'h6', action: 'SUBMITTED', actor: { id: 'u3', name: 'Sara Ahmed', role: 'STATION_OWNER' }, previousStatus: 'CHANGES_REQUESTED', newStatus: 'CHANGES_PENDING', createdAt: '2026-09-25T09:00:00Z' },
    ],

    currentSubmission: { submittedAt: '2026-09-25T09:00:00Z', submittedBy: 'Sara Ahmed', version: 2 },
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-09-25T09:00:00Z',
  },

  {
    id: '4',
    name: 'Premium Detailing Studio',
    slug: 'premium-detailing-studio',
    stationType: 'CAR_CARE',
    status: 'SUSPENDED',
    description: 'High-end detailing studio.',

    partner: { id: 'p4', name: 'Bilal Tariq', email: 'bilal@premium.pk', phone: '+92 345 9998887', accountStatus: 'ACTIVE', joinedAt: '2026-05-01T10:00:00Z' },
    contact: { phone: '+92 51 9876543', email: 'info@premium.pk' },

    supportsCarCare: true,
    supportsEVCharging: false,
    is24Hours: false,

    address: { line1: 'Bahria Town Phase 4', line2: '', city: 'Rawalpindi', province: 'Punjab', postalCode: '46000', countryCode: 'PK' },
    coordinates: { latitude: 33.5228, longitude: 73.0939 },

    photos: [
      { id: 'ph8', url: 'https://picsum.photos/seed/premium1/800/600', thumbnailUrl: 'https://picsum.photos/seed/premium1/300/200', sortOrder: 1, isPrimary: true },
    ],

    hours: Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i, openTime: '10:00', closeTime: '20:00', isClosed: i === 0, is24Hours: false,
    })),

    services: [
      { id: 's6', category: { id: 'c2', name: 'Detailing' }, name: 'Full Body Polish', description: 'Machine polish.', basePrice: 12000, currency: 'PKR', durationMinutes: 240, isBookable: true, isActive: true },
    ],

    evProfile: null,
    chargingUnits: [],

    facilities: [{ id: 'f12', name: 'Waiting Area', icon: '🪑' }],

    documents: [{ id: 'd7', type: 'BUSINESS_LICENSE', url: '#', uploadedAt: '2026-05-05T10:00:00Z', verified: true }],

    approvalHistory: [
      { id: 'h7', action: 'SUBMITTED', actor: { id: 'u4', name: 'Bilal Tariq', role: 'STATION_OWNER' }, previousStatus: 'DRAFT', newStatus: 'SUBMITTED', createdAt: '2026-09-15T11:20:00Z' },
      { id: 'h8', action: 'APPROVED', actor: { id: 'a1', name: 'Admin', role: 'SUPER_ADMIN' }, previousStatus: 'SUBMITTED', newStatus: 'APPROVED', createdAt: '2026-09-16T10:00:00Z' },
      { id: 'h9', action: 'SUSPENDED', actor: { id: 'a1', name: 'Admin', role: 'SUPER_ADMIN' }, reason: 'Multiple customer complaints about pricing discrepancies.', previousStatus: 'APPROVED', newStatus: 'SUSPENDED', createdAt: '2026-09-25T15:00:00Z' },
    ],

    currentSubmission: null,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-09-25T15:00:00Z',
  },
];