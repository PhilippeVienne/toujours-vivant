export type UserStatus = 'OK' | 'WARNING' | 'ALERT' | 'PAUSED';

export type PingType = 'MANUAL' | 'PASSIVE_MOTION' | 'PUSH_CHECKIN';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  emergencyToken: string;
  pingFrequencyMinutes: number;
  status: UserStatus;
  offlineUntil?: string | null;
  lastPingAt: string;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  contactToken?: string;
  notifyByEmail: boolean;
  createdAt: string;
}

export interface PingLog {
  id: string;
  userId: string;
  pingType: PingType;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  message?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface AlertLog {
  id: string;
  userId: string;
  triggerReason: string;
  sentToEmails: string[];
  status: string;
  createdAt: string;
}

export interface CheckInStatusResponse {
  status: UserStatus;
  lastPingAt: string;
  secondsRemaining: number;
  user: UserProfile;
  contacts: EmergencyContact[];
  latestPings: PingLog[];
}
