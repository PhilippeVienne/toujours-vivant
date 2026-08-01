import { UserProfile, EmergencyContact, PingLog, UserStatus } from '@/types';

const MOCK_USER: UserProfile = {
  id: 'usr_demo_123',
  email: 'jean.dupont@example.com',
  fullName: 'Jean Dupont',
  emergencyToken: 'tok_live_demo_987654321',
  pingFrequencyMinutes: 30,
  status: 'OK',
  lastPingAt: new Date().toISOString(),
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
};

const INITIAL_CONTACTS: EmergencyContact[] = [
  {
    id: 'cnt_1',
    userId: 'usr_demo_123',
    name: 'Marie Dupont (Épouse)',
    email: 'marie.dupont@example.com',
    phone: '+33 6 12 34 56 78',
    notifyByEmail: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cnt_2',
    userId: 'usr_demo_123',
    name: 'Thomas Dupont (Fils)',
    email: 'thomas.dupont@example.com',
    phone: '+33 6 98 76 54 32',
    notifyByEmail: true,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_PINGS: PingLog[] = [
  {
    id: 'png_1',
    userId: 'usr_demo_123',
    pingType: 'MANUAL',
    latitude: 48.8566,
    longitude: 2.3522,
    locationName: 'Paris, France',
    message: 'Tout va très bien ce matin !',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'png_0',
    userId: 'usr_demo_123',
    pingType: 'PASSIVE_MOTION',
    message: 'Détection d\'activité physique (Accéléromètre)',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  }
];

class MockStore {
  private user: UserProfile = { ...MOCK_USER };
  private contacts: EmergencyContact[] = [...INITIAL_CONTACTS];
  private pings: PingLog[] = [...INITIAL_PINGS];
  private lastPingTimestamp: number = Date.now();

  constructor() {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('tv_user');
      const storedContacts = localStorage.getItem('tv_contacts');
      const storedPings = localStorage.getItem('tv_pings');
      const storedTimestamp = localStorage.getItem('tv_last_ping_ts');

      if (storedUser) this.user = JSON.parse(storedUser);
      if (storedContacts) this.contacts = JSON.parse(storedContacts);
      if (storedPings) this.pings = JSON.parse(storedPings);
      if (storedTimestamp) this.lastPingTimestamp = parseInt(storedTimestamp, 10);
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tv_user', JSON.stringify(this.user));
      localStorage.setItem('tv_contacts', JSON.stringify(this.contacts));
      localStorage.setItem('tv_pings', JSON.stringify(this.pings));
      localStorage.setItem('tv_last_ping_ts', this.lastPingTimestamp.toString());
    }
  }

  public getUser(): UserProfile {
    return this.user;
  }

  public getContacts(): EmergencyContact[] {
    return this.contacts;
  }

  public getPings(): PingLog[] {
    return this.pings;
  }

  public addPing(pingData: Partial<PingLog>): PingLog {
    const newPing: PingLog = {
      id: 'png_' + Date.now(),
      userId: this.user.id,
      pingType: pingData.pingType || 'MANUAL',
      latitude: pingData.latitude,
      longitude: pingData.longitude,
      locationName: pingData.locationName,
      message: pingData.message,
      photoUrl: pingData.photoUrl,
      createdAt: new Date().toISOString(),
    };

    this.pings.unshift(newPing);
    this.lastPingTimestamp = Date.now();
    this.user.lastPingAt = newPing.createdAt;
    this.user.status = 'OK';
    this.save();
    return newPing;
  }

  public addContact(contact: Omit<EmergencyContact, 'id' | 'userId' | 'createdAt'>): EmergencyContact {
    const newContact: EmergencyContact = {
      ...contact,
      id: 'cnt_' + Date.now(),
      userId: this.user.id,
      createdAt: new Date().toISOString(),
    };
    this.contacts.push(newContact);
    this.save();
    return newContact;
  }

  public removeContact(id: string): void {
    this.contacts = this.contacts.filter(c => c.id !== id);
    this.save();
  }

  public calculateStatus(): { status: UserStatus; secondsRemaining: number } {
    const elapsedSeconds = Math.floor((Date.now() - this.lastPingTimestamp) / 1000);
    const ttlSeconds = (this.user.pingFrequencyMinutes || 30) * 60;
    const secondsRemaining = Math.max(0, ttlSeconds - elapsedSeconds);

    let status: UserStatus = 'OK';
    if (secondsRemaining === 0) {
      status = 'ALERT';
    } else if (secondsRemaining < 300) {
      // 5 min warning window
      status = 'WARNING';
    }

    this.user.status = status;
    return { status, secondsRemaining };
  }

  public setStatus(newStatus: UserStatus): void {
    this.user.status = newStatus;
    if (newStatus === 'OK') {
      this.lastPingTimestamp = Date.now();
      this.user.lastPingAt = new Date().toISOString();
    }
    this.save();
  }
}

export const mockStore = new MockStore();
