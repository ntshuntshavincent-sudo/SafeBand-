export interface LocationBreadcrumb {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speedKmh: number | null;
  heading: number | null;
  zoneLabel: string;
}

export interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type: 'safe_residence' | 'safe_campus' | 'safe_hospital' | 'high_risk_corridor';
  description: string;
}

export const SOUTH_AFRICA_SAFE_ZONES: SafeZone[] = [
  {
    id: 'sz-uj-kingsway',
    name: 'UJ Kingsway Campus (APK Central Perimeter)',
    latitude: -26.1834,
    longitude: 28.0007,
    radiusMeters: 450,
    type: 'safe_campus',
    description: '24/7 Monitored zone with campus security patrols and blue emergency phones'
  },
  {
    id: 'sz-uj-res-sophiatown',
    name: 'Sophiatown Student Residence Hall',
    latitude: -26.1812,
    longitude: 27.9950,
    radiusMeters: 180,
    type: 'safe_residence',
    description: 'Biometric access student residential sanctuary'
  },
  {
    id: 'sz-wits-east',
    name: 'Wits East Campus (Solomon Mahlangu)',
    latitude: -26.1929,
    longitude: 28.0305,
    radiusMeters: 400,
    type: 'safe_campus',
    description: 'Central campus concourse and gender equity office'
  },
  {
    id: 'sz-uct-upper',
    name: 'UCT Upper Campus & Lower Residence Corridor',
    latitude: -33.9577,
    longitude: 18.4612,
    radiusMeters: 500,
    type: 'safe_campus',
    description: 'Campus protection mobile perimeter'
  },
  {
    id: 'sz-dut-stevebiko',
    name: 'DUT Steve Biko Campus (Durban Central)',
    latitude: -29.8523,
    longitude: 31.0068,
    radiusMeters: 350,
    type: 'safe_campus',
    description: 'Student center and perimeter protection desk'
  },
  {
    id: 'sz-brixton-corridor',
    name: 'Brixton High-Risk Off-Campus Corridor',
    latitude: -26.1895,
    longitude: 27.9980,
    radiusMeters: 300,
    type: 'high_risk_corridor',
    description: 'Caution zone: High incidence of evening robberies and intimidation'
  }
];

// Haversine formula to compute distance between two GPS coordinates in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Check which geofence zone the owner is currently located in
export function detectCurrentZone(
  lat: number,
  lng: number,
  zones: SafeZone[] = SOUTH_AFRICA_SAFE_ZONES
): { zone: SafeZone | null; isInsideSafe: boolean; isInsideHighRisk: boolean } {
  for (const zone of zones) {
    const dist = calculateDistanceMeters(lat, lng, zone.latitude, zone.longitude);
    if (dist <= zone.radiusMeters) {
      return {
        zone,
        isInsideSafe: zone.type.startsWith('safe'),
        isInsideHighRisk: zone.type === 'high_risk_corridor'
      };
    }
  }

  return {
    zone: null,
    isInsideSafe: false,
    isInsideHighRisk: false
  };
}

// Simulated walk waypoints for interactive demo (walking from APK Library to Sophiatown Res)
export const SIMULATED_WALK_WAYPOINTS = [
  { lat: -26.1834, lng: 28.0007, label: 'APK Campus Library Exit', speed: 4.2 },
  { lat: -26.1830, lng: 27.9995, label: 'D-Ring Student Walkway', speed: 4.5 },
  { lat: -26.1825, lng: 27.9982, label: 'Turnstile West Gate Perimeter', speed: 4.1 },
  { lat: -26.1820, lng: 27.9970, label: 'Auckland Park Transit Stop', speed: 3.9 },
  { lat: -26.1815, lng: 27.9958, label: 'Perimeter Boundary Fence', speed: 4.3 },
  { lat: -26.1812, lng: 27.9950, label: 'Sophiatown Residence Gate (Safe Zone)', speed: 0.0 }
];
