import { UserProfile, EmergencyContact } from '../types';

export interface UniversityOption {
  id: string;
  name: string;
  defaultSecurityName: string;
  defaultSecurityNumber: string;
  defaultZone: string;
  lat: number;
  lng: number;
}

export const SOUTH_AFRICAN_UNIVERSITIES: UniversityOption[] = [
  {
    id: 'uj-kingsway',
    name: 'University of Johannesburg (UJ) - Kingsway Campus',
    defaultSecurityName: 'UJ Protection Control Room',
    defaultSecurityNumber: '011 559 2555',
    defaultZone: 'UJ Kingsway Campus (D-Ring Study Area)',
    lat: -26.1834,
    lng: 28.0007,
  },
  {
    id: 'uj-doornfontein',
    name: 'University of Johannesburg (UJ) - Doornfontein Campus',
    defaultSecurityName: 'UJ DFC Protection Desk',
    defaultSecurityNumber: '011 559 6450',
    defaultZone: 'UJ Doornfontein Campus (Beit St Gate)',
    lat: -26.1952,
    lng: 28.0583,
  },
  {
    id: 'wits-braamfontein',
    name: 'University of the Witwatersrand (Wits) - Braamfontein',
    defaultSecurityName: 'Wits Campus Protection & GEO',
    defaultSecurityNumber: '011 717 4444',
    defaultZone: 'Wits Solomon Mahlangu Concourse',
    lat: -26.1929,
    lng: 28.0305,
  },
  {
    id: 'up-hatfield',
    name: 'University of Pretoria (UP) - Hatfield Campus',
    defaultSecurityName: 'UP Security Services Operations',
    defaultSecurityNumber: '012 420 2310',
    defaultZone: 'UP Hatfield Campus (Roper St)',
    lat: -25.7545,
    lng: 28.2314,
  },
  {
    id: 'uct-upper',
    name: 'University of Cape Town (UCT) - Upper Campus',
    defaultSecurityName: 'UCT Campus Protection Services',
    defaultSecurityNumber: '021 650 2222',
    defaultZone: 'UCT Upper Campus (Jammie Plaza)',
    lat: -33.9577,
    lng: 18.4612,
  },
  {
    id: 'stellenbosch-main',
    name: 'Stellenbosch University - Main Campus',
    defaultSecurityName: 'Stellenbosch Campus Security',
    defaultSecurityNumber: '021 808 2333',
    defaultZone: 'Stellenbosch Neelsie Student Centre',
    lat: -33.9322,
    lng: 18.8644,
  },
  {
    id: 'ukzn-howard',
    name: 'University of KwaZulu-Natal (UKZN) - Howard College',
    defaultSecurityName: 'UKZN Risk Management Services',
    defaultSecurityNumber: '031 260 2540',
    defaultZone: 'UKZN Howard College Tower',
    lat: -29.8674,
    lng: 30.9814,
  },
  {
    id: 'tut-pretoria',
    name: 'Tshwane University of Technology (TUT) - Pretoria',
    defaultSecurityName: 'TUT Protection Services',
    defaultSecurityNumber: '012 382 5000',
    defaultZone: 'TUT Pretoria Main Gate',
    lat: -25.7317,
    lng: 28.1630,
  },
  {
    id: 'custom',
    name: 'Other South African University / College',
    defaultSecurityName: 'Campus Protection Control Room',
    defaultSecurityNumber: '10111',
    defaultZone: 'Student Residence & Corridor',
    lat: -26.2041,
    lng: 28.0473,
  }
];

const STORAGE_KEY_CURRENT_USER = 'safeband_current_user_v1';
const STORAGE_KEY_USERS_DB = 'safeband_users_database_v1';

// Pre-seeded demo user for instant 1-tap testing
export const DEMO_USER_PROFILE: UserProfile = {
  id: 'usr_demo_lerato_2026',
  fullName: 'Lerato Khumalo',
  phone: '082 459 1204',
  studentNumber: '202419823',
  university: 'University of Johannesburg (UJ) - Kingsway Campus',
  residenceOrZone: 'Auckland Park Kingsway D-Ring Study Area',
  pin: '1234',
  duressPin: '9999',
  contacts: [
    {
      id: 'c_mother',
      name: 'Mama (Thandi Khumalo)',
      phone: '082 459 1204',
      relationship: 'Mother / Guardian',
      notifySms: true,
      notifyWhatsapp: true,
    },
    {
      id: 'c_roommate',
      name: 'Lindiwe (Campus Roommate)',
      phone: '076 892 3411',
      relationship: 'Roommate / Close Friend',
      notifySms: true,
      notifyWhatsapp: true,
    },
    {
      id: 'c_security',
      name: 'UJ Campus Protection Control Room',
      phone: '011 559 2555',
      relationship: 'Campus Security',
      notifySms: true,
      notifyWhatsapp: false,
      isCampusSecurity: true,
    }
  ],
  location: {
    lat: -26.1834,
    lng: 28.0007,
    zoneLabel: 'UJ Kingsway Campus (D-Ring Study Area)',
    isLiveGps: true,
  },
  createdAt: '2026-10-15T08:00:00.000Z'
};

function normalizePhoneKey(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '');
}

function getUsersDatabase(): Record<string, UserProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read users database from localStorage:', err);
  }
  // Initialize with demo user
  const initialDb: Record<string, UserProfile> = {
    [normalizePhoneKey(DEMO_USER_PROFILE.phone)]: DEMO_USER_PROFILE
  };
  saveUsersDatabase(initialDb);
  return initialDb;
}

function saveUsersDatabase(db: Record<string, UserProfile>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(db));
  } catch (err) {
    console.error('Failed to save users database:', err);
  }
}

export const userService = {
  getCurrentUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to parse current user session:', err);
    }
    return null;
  },

  setCurrentUser(user: UserProfile | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
        // Also update in DB
        const db = getUsersDatabase();
        db[normalizePhoneKey(user.phone)] = user;
        saveUsersDatabase(db);
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (err) {
      console.error('Failed to persist user session:', err);
    }
  },

  loginWithPhone(phone: string, pin: string): { success: boolean; user?: UserProfile; error?: string } {
    const cleanPhone = normalizePhoneKey(phone);
    if (!cleanPhone) {
      return { success: false, error: 'Please enter your registered mobile number.' };
    }

    const db = getUsersDatabase();
    // Search by clean phone or exact match
    let found: UserProfile | undefined = db[cleanPhone];
    if (!found) {
      // Try searching through values
      found = Object.values(db).find(u => normalizePhoneKey(u.phone) === cleanPhone);
    }

    if (!found) {
      return { 
        success: false, 
        error: `No SafeBand account found for ${phone}. Please click "Register New Account" to set up your profile and lifelines.` 
      };
    }

    if (found.pin && found.pin !== pin) {
      return { success: false, error: 'Incorrect 4-digit PIN. Please try again.' };
    }

    this.setCurrentUser(found);
    return { success: true, user: found };
  },

  registerUser(details: Omit<UserProfile, 'id' | 'createdAt'>): UserProfile {
    const newUser: UserProfile = {
      ...details,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };

    const db = getUsersDatabase();
    db[normalizePhoneKey(newUser.phone)] = newUser;
    saveUsersDatabase(db);
    this.setCurrentUser(newUser);
    return newUser;
  },

  updateUserProfile(updates: Partial<UserProfile>): UserProfile | null {
    const current = this.getCurrentUser();
    if (!current) return null;

    const updated: UserProfile = {
      ...current,
      ...updates,
      contacts: updates.contacts || current.contacts
    };

    this.setCurrentUser(updated);
    return updated;
  },

  updateUserLocation(location: UserProfile['location']): UserProfile | null {
    const current = this.getCurrentUser();
    if (!current || !location) return null;

    const updated: UserProfile = {
      ...current,
      location
    };

    this.setCurrentUser(updated);
    return updated;
  },

  loginDemoUser(): UserProfile {
    this.setCurrentUser(DEMO_USER_PROFILE);
    return DEMO_USER_PROFILE;
  },

  logout(): void {
    this.setCurrentUser(null);
  }
};
