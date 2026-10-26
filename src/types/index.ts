export type AppMode = 
  | 'safeband'          // Primary survivor safety vault & SOS
  | 'duress'            // Coercion dummy UI (when forced to unlock with duress PIN)
  | 'responder_console' // Campus security & CPF live dispatch terminal
  | 'security_audit';   // SSDLC & STRIDE Threat model showcase

export interface EvidenceItem {
  id: string;
  type: 'photo' | 'audio' | 'note';
  title: string;
  timestamp: string; // ISO 8601
  sha256Hash: string;
  ivHex: string;
  encryptedPayload: string;
  fileSizeBytes: number;
  previewUrl?: string; // Volatile RAM blob only
  audioDurationSeconds?: number;
  legalMetadata: {
    deviceFingerprint: string;
    geotag: {
      lat: number;
      lng: number;
      accuracyMeters: number;
      zoneLabel: string;
    };
    chainOfCustodyId: string;
    hashAlgorithm: string;
    encryptionAlgorithm: string;
  };
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  notifySms: boolean;
  notifyWhatsapp: boolean;
  isCampusSecurity?: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  studentNumber?: string;
  university: string;
  residenceOrZone: string;
  pin: string;
  duressPin?: string;
  contacts: EmergencyContact[];
  location?: {
    lat: number;
    lng: number;
    zoneLabel: string;
    isLiveGps: boolean;
  };
  createdAt: string;
}

export interface SupportDirectoryItem {
  id: string;
  name: string;
  category: 'emergency_hotline' | 'thuthuzela_pep' | 'shelter' | 'legal_aid' | 'campus_security';
  province: string;
  city: string;
  phone: string;
  tollFree?: boolean;
  ussdCode?: string;
  address: string;
  hours: string;
  servicesOffered: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  cachedOffline: boolean;
  verifiedDate: string;
}

export interface BreadcrumbPoint {
  lat: number;
  lng: number;
  accuracy: number;
  speedKmh?: number;
  heading?: number;
  battery?: number;
  timestamp: string;
}

export interface DispatchEvent {
  id: string;
  timestamp: string;
  unitName: string;
  etaMinutes: number;
  notes?: string;
  status: string;
}

export interface SOSDistressSignal {
  id: string;
  timestamp: string;
  status: 'triggering' | 'broadcasting' | 'acknowledged' | 'dispatched' | 'on_scene' | 'resolved';
  latitude: number;
  longitude: number;
  accuracy: number;
  campusZone: string;
  batteryLevel: number;
  survivorPseudonym: string;
  emergencyContactsNotified: number;
  audioRecordingCaptured: boolean;
  assignedResponder?: string;
  responderEtaMinutes?: number;
  securityNotes?: string;
  integrityHash: string;
  trackingToken?: string;
  trackingExpiresAt?: string;
  trackingRevoked?: boolean;
  smsDeliveryStatus?: Array<{
    to: string;
    name?: string;
    status: 'sent' | 'simulated' | 'failed';
    provider: string;
    messageSid?: string;
    error?: string;
    timestamp: string;
  }>;
  severity?: 'critical' | 'high' | 'medium';
  breadcrumbs?: BreadcrumbPoint[];
  dispatchEvents?: DispatchEvent[];
}

export type ClientRole = 'survivor' | 'responder' | 'tracker';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

export interface WSClientMessage {
  type: 
    | 'auth:responder'
    | 'auth:survivor'
    | 'auth:tracker'
    | 'sos:create'
    | 'sos:location'
    | 'sos:status'
    | 'responder:dispatch'
    | 'responder:resolve'
    | 'survivor:checkin'
    | 'evidence:chunk'
    | 'ping';
  payload?: any;
}

export interface WSServerMessage {
  type:
    | 'auth:success'
    | 'auth:error'
    | 'incident:new'
    | 'incident:update'
    | 'incident:resolved'
    | 'location:update'
    | 'dispatch:assigned'
    | 'init:state'
    | 'queue:flushed'
    | 'pong';
  payload?: any;
}


export interface StrideThreat {
  category: 'Spoofing' | 'Tampering' | 'Repudiation' | 'Information Disclosure' | 'Denial of Service' | 'Elevation of Privilege';
  component: string;
  riskDescription: string;
  mitigationControl: string;
  status: 'Enforced' | 'Verified';
}

export interface FinancialYearProjection {
  year: string;
  phase: string;
  campusContractsCount: number;
  campusRevenue: number;
  municipalContractsCount: number;
  municipalRevenue: number;
  csiSponsorshipsCount: number;
  csiRevenue: number;
  totalGrossRevenue: number;
  operatingCosts: number;
  netProfit: number;
  profitMarginPercent: number;
}
