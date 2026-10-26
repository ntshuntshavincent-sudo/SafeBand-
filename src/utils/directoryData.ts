import { SupportDirectoryItem, StrideThreat, FinancialYearProjection } from '../types';

export const VERIFIED_DIRECTORY_ITEMS: SupportDirectoryItem[] = [
  {
    id: 'gbv-command-centre',
    name: 'National GBV Command Centre (DSD)',
    category: 'emergency_hotline',
    province: 'National',
    city: 'All South Africa (Toll-Free)',
    phone: '0800 428 428',
    tollFree: true,
    ussdCode: '*120*7867#',
    address: 'National Emergency Dispatch, Department of Social Development',
    hours: '24 Hours / 7 Days a week',
    servicesOffered: [
      'Immediate crisis intervention',
      'Social worker emergency dispatch',
      'Please Call Me (*120*7867#)',
      'SMS "HELP" to 31531',
      'Sign language support via Skype'
    ],
    coordinates: { lat: -25.7479, lng: 28.2293 },
    cachedOffline: true,
    verifiedDate: '2026-10-01'
  },
  {
    id: 'tears-foundation',
    name: 'TEARS Foundation Crisis Line',
    category: 'emergency_hotline',
    province: 'National',
    city: 'Johannesburg / Nationwide',
    phone: '010 590 5920',
    tollFree: false,
    ussdCode: '*134*7355#',
    address: 'Nationwide Network with Free USSD Locator',
    hours: '24/7 Rapid Response',
    servicesOffered: [
      'Free USSD locator *134*7355#',
      'Emergency transport to Thuthuzela Centres',
      'Immediate trauma debriefing',
      'Confidential support'
    ],
    coordinates: { lat: -26.1076, lng: 28.0567 },
    cachedOffline: true,
    verifiedDate: '2026-10-05'
  },
  {
    id: 'tcc-baragwanath',
    name: 'Chris Hani Baragwanath Thuthuzela Care Centre',
    category: 'thuthuzela_pep',
    province: 'Gauteng',
    city: 'Soweto, Johannesburg',
    phone: '011 933 9111',
    tollFree: false,
    address: 'Chris Hani Baragwanath Hospital, Old Potchefstroom Rd, Diepkloof',
    hours: '24/7 Trauma Unit',
    servicesOffered: [
      'Free Post-Exposure Prophylaxis (PEP within 72 hrs)',
      'Forensic medical examination (tamper-proof kits)',
      'Dedicated SAPS investigator on-site',
      'Immediate psychologist counseling',
      'Safe shower & clean change of clothes'
    ],
    coordinates: { lat: -26.2625, lng: 27.9427 },
    cachedOffline: true,
    verifiedDate: '2026-09-28'
  },
  {
    id: 'tcc-karl-bremer',
    name: 'Karl Bremer Thuthuzela Care Centre',
    category: 'thuthuzela_pep',
    province: 'Western Cape',
    city: 'Bellville, Cape Town',
    phone: '021 918 1321',
    tollFree: false,
    address: 'Karl Bremer Hospital, Frans Conradie Dr, Bellville',
    hours: '24/7 Medical Care',
    servicesOffered: [
      'PEP 72-hour emergency antiretroviral starter',
      'Forensic evidence preservation with NPA prosecutors',
      'Trauma counseling & social work support',
      'Emergency legal statement filing'
    ],
    coordinates: { lat: -33.8967, lng: 18.6256 },
    cachedOffline: true,
    verifiedDate: '2026-10-02'
  },
  {
    id: 'tcc-rob-ferreira',
    name: 'Rob Ferreira Hospital Thuthuzela Care Centre',
    category: 'thuthuzela_pep',
    province: 'Mpumalanga',
    city: 'Mbombela (Nelspruit)',
    phone: '013 741 6100',
    tollFree: false,
    address: 'Rob Ferreira Hospital, Cnr Piet Retief & Madiba Dr, Mbombela',
    hours: '24/7 Forensic & PEP Services',
    servicesOffered: [
      'Immediate PEP administration (0-72 hrs)',
      'University student priority care desk',
      'Trauma counseling',
      'Safe transport connection'
    ],
    coordinates: { lat: -25.4753, lng: 30.9694 },
    cachedOffline: true,
    verifiedDate: '2026-09-15'
  },
  {
    id: 'tcc-addington',
    name: 'Addington Hospital Thuthuzela Care Centre',
    category: 'thuthuzela_pep',
    province: 'KwaZulu-Natal',
    city: 'Durban Beachfront',
    phone: '031 327 2000',
    tollFree: false,
    address: 'Addington Hospital, 16 Erskine Terrace, South Beach, Durban',
    hours: '24/7 Open',
    servicesOffered: [
      'Emergency PEP medicine',
      'Forensic rape kit documentation',
      'Crisis intervention & court preparation',
      'STI screening & emergency contraception'
    ],
    coordinates: { lat: -29.8661, lng: 31.0422 },
    cachedOffline: true,
    verifiedDate: '2026-09-20'
  },
  {
    id: 'shelter-saartjie',
    name: 'Saartjie Baartman Centre for Women & Children',
    category: 'shelter',
    province: 'Western Cape',
    city: 'Manenberg, Cape Town',
    phone: '021 633 5287',
    tollFree: false,
    address: 'Klipfontein Rd, Surrey Estate, Cape Town (Secure Facility)',
    hours: '24/7 Emergency Intake',
    servicesOffered: [
      'Confidential residential sanctuary',
      'Legal advice & protection order assistance',
      'Child support & trauma counseling',
      'Skills development programs'
    ],
    coordinates: { lat: -33.9745, lng: 18.5375 },
    cachedOffline: true,
    verifiedDate: '2026-10-08'
  },
  {
    id: 'shelter-powa',
    name: 'POWA (People Opposing Women Abuse)',
    category: 'shelter',
    province: 'Gauteng',
    city: 'Berea, Johannesburg',
    phone: '011 642 4345',
    tollFree: false,
    address: '64 Mitchell St, Berea, Johannesburg',
    hours: 'Mon-Fri 08:30-16:30, 24h Helpline 076 694 5911',
    servicesOffered: [
      'Emergency shelter accommodation',
      'Free legal consultations & court accompaniment',
      'Individual and group psychotherapy',
      'Protection order application guidance'
    ],
    coordinates: { lat: -26.1852, lng: 28.0543 },
    cachedOffline: true,
    verifiedDate: '2026-10-09'
  },
  {
    id: 'shelter-frida',
    name: 'Frida Hartley Shelter for Women',
    category: 'shelter',
    province: 'Gauteng',
    city: 'Yeoville, Johannesburg',
    phone: '011 648 6005',
    tollFree: false,
    address: 'Yeoville, Johannesburg (Undisclosed Exact Location)',
    hours: '24/7 Emergency Intake',
    servicesOffered: [
      'Safe haven for survivors and children',
      'Mental healthcare & psychological restoration',
      'Independent living reintegration',
      'Zero perpetrator access policy'
    ],
    coordinates: { lat: -26.1789, lng: 28.0612 },
    cachedOffline: true,
    verifiedDate: '2026-09-10'
  },
  {
    id: 'campus-uj-protection',
    name: 'University of Johannesburg (UJ) Campus Protection',
    category: 'campus_security',
    province: 'Gauteng',
    city: 'Auckland Park / Doornfontein / Soweto',
    phone: '011 559 2555',
    tollFree: true,
    address: 'UJ Operations Control Centre, Kingsway Campus',
    hours: '24/7 Immediate Campus Patrol',
    servicesOffered: [
      'Rapid armed campus patrol response (<3 mins)',
      'Residence escort service for night study',
      'Direct link to Brixton SAPS GBV desk',
      'PsyCaAD student trauma support routing'
    ],
    coordinates: { lat: -26.1834, lng: 28.0007 },
    cachedOffline: true,
    verifiedDate: '2026-10-10'
  },
  {
    id: 'campus-wits-protection',
    name: 'Wits Campus Protection & Gender Equity Office (GEO)',
    category: 'campus_security',
    province: 'Gauteng',
    city: 'Braamfontein, Johannesburg',
    phone: '011 717 4444',
    tollFree: false,
    address: 'Senate House / Solomon Mahlangu House, Braamfontein',
    hours: '24/7 Emergency Dispatch',
    servicesOffered: [
      'GEO crisis hotline: 072 048 3768',
      'Safe escort on campus routes & student housing corridors',
      'Discreet student residence dispatch',
      'Immediate trauma counselor on-call'
    ],
    coordinates: { lat: -26.1929, lng: 28.0305 },
    cachedOffline: true,
    verifiedDate: '2026-10-10'
  },
  {
    id: 'legal-aid-sa',
    name: 'Legal Aid South Africa Toll-Free Helpline',
    category: 'legal_aid',
    province: 'National',
    city: 'All 9 Provinces',
    phone: '0800 110 110',
    tollFree: true,
    ussdCode: '*130*7446#',
    address: 'National Office: 29 De Beer St, Braamfontein, Johannesburg',
    hours: 'Mon-Fri 07:00 - 19:00 (Emergency USSD 24/7)',
    servicesOffered: [
      'Free legal representation in domestic violence court',
      'Protection orders assistance',
      'Interim relief applications',
      'Representation during criminal trial against perpetrator'
    ],
    coordinates: { lat: -26.1956, lng: 28.0361 },
    cachedOffline: true,
    verifiedDate: '2026-09-30'
  }
];

export const INITIAL_EMERGENCY_CONTACTS = [
  {
    id: 'c1',
    name: 'Mama (Thandi Khumalo)',
    phone: '+27 82 459 1204',
    relationship: 'Mother',
    notifySms: true,
    notifyWhatsapp: true,
  },
  {
    id: 'c2',
    name: 'Lindiwe (Campus Roommate)',
    phone: '+27 76 892 3411',
    relationship: 'Close Friend',
    notifySms: true,
    notifyWhatsapp: true,
  },
  {
    id: 'c3',
    name: 'Campus Protection Control Room',
    phone: '+27 11 559 2555',
    relationship: 'Campus Security',
    notifySms: true,
    notifyWhatsapp: false,
    isCampusSecurity: true,
  }
];

export const STRIDE_THREAT_MODELS: StrideThreat[] = [
  {
    category: 'Spoofing',
    component: 'Identity & Session Gateway',
    riskDescription: 'Perpetrator attempts to hijack distress session or impersonate survivor to cancel alert.',
    mitigationControl: 'JWT tokens with short 15-minute expirations, HTTP-only secure cookies, and cryptographic device fingerprint pairing.',
    status: 'Enforced'
  },
  {
    category: 'Tampering',
    component: 'Evidence Vault & Media Payloads',
    riskDescription: 'Perpetrator forces device deletion or alters audio records in transit to invalidate court admissibility.',
    mitigationControl: 'Client-side SHA-256 digital signature computed before network transit. Zero local disk storage; payload streams directly to tamper-proof S3 vault.',
    status: 'Enforced'
  },
  {
    category: 'Repudiation',
    component: 'Immutable Audit Trail',
    riskDescription: 'Perpetrator claims evidence was fabricated or recorded at a different date/time.',
    mitigationControl: 'Server logs and vault manifests are sealed with cryptographic NTP timestamps and unique Chain of Custody tokens (ZA-GBV-VAULT-*).',
    status: 'Verified'
  },
  {
    category: 'Information Disclosure',
    component: 'GPS Geofencing & Audio Stream',
    riskDescription: 'Eavesdropping on live distress coordinates over public or university Wi-Fi networks.',
    mitigationControl: 'End-to-end TLS 1.3 encryption + client-side AES-256-GCM encryption before sending over WSS (Secure WebSockets).',
    status: 'Enforced'
  },
  {
    category: 'Denial of Service',
    component: 'SOS Dispatch API Endpoints',
    riskDescription: 'Malicious actors flooding the dispatch endpoint to block genuine distress signals during high traffic.',
    mitigationControl: 'Express rate-limiting middleware (express-rate-limit), geofenced connection limits, and priority queuing for emergency SOS packets.',
    status: 'Enforced'
  },
  {
    category: 'Elevation of Privilege',
    component: 'Responder vs Survivor Access',
    riskDescription: 'Survivor or outsider accessing responder tactical dispatches or other survivors\' confidential cases.',
    mitigationControl: 'Strict Role-Based Access Control (RBAC) cryptographically separating Survivor identity tokens from Campus Responder roles.',
    status: 'Verified'
  }
];

export const FINANCIAL_PROJECTIONS: FinancialYearProjection[] = [
  {
    year: 'Year 1',
    phase: 'Pilot & University Launch (3 Campuses)',
    campusContractsCount: 3,
    campusRevenue: 105000,
    municipalContractsCount: 1,
    municipalRevenue: 120000,
    csiSponsorshipsCount: 1,
    csiRevenue: 50000,
    totalGrossRevenue: 275000,
    operatingCosts: 151000,
    netProfit: 124000,
    profitMarginPercent: 45
  },
  {
    year: 'Year 2',
    phase: 'National Growth (10 Campuses & 3 Districts)',
    campusContractsCount: 10,
    campusRevenue: 350000,
    municipalContractsCount: 3,
    municipalRevenue: 360000,
    csiSponsorshipsCount: 3,
    csiRevenue: 150000,
    totalGrossRevenue: 860000,
    operatingCosts: 220000,
    netProfit: 640000,
    profitMarginPercent: 74
  },
  {
    year: 'Year 3',
    phase: 'Pan-South African Expansion (25 Campuses)',
    campusContractsCount: 25,
    campusRevenue: 875000,
    municipalContractsCount: 8,
    municipalRevenue: 960000,
    csiSponsorshipsCount: 5,
    csiRevenue: 250000,
    totalGrossRevenue: 2085000,
    operatingCosts: 450000,
    netProfit: 1635000,
    profitMarginPercent: 78
  }
];
