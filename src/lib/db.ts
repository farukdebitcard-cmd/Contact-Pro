import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhone } from './phone';

export interface Reminder {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  smsSent?: boolean;
}

export interface CallLog {
  id: string;
  number: string;
  contactId?: string;
  timestamp: number;
  type: 'outgoing' | 'incoming' | 'missed';
}

export interface Contact {
  id: string;
  name: string;
  phone: string; // Normalized
  email: string;
  groups: string[]; // Array of group IDs
  notes: string;
  favorite: boolean;
  reminders?: Reminder[];
  createdAt: number;
  updatedAt: number;
}

export interface Group {
  id: string;
  name: string;
  color: string;
}

interface ContactDB extends DBSchema {
  contacts: {
    key: string;
    value: Contact;
    indexes: { 'by-name': string; 'by-phone': string; 'by-favorite': number };
  };
  groups: {
    key: string;
    value: Group;
  };
  settings: {
    key: string;
    value: any;
  };
  calls: {
    key: string;
    value: CallLog;
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<ContactDB>>;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<ContactDB>('contact-manager', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
          contactStore.createIndex('by-name', 'name');
          contactStore.createIndex('by-phone', 'phone');
          contactStore.createIndex('by-favorite', 'favorite');
        }
        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('calls')) {
          const callStore = db.createObjectStore('calls', { keyPath: 'id' });
          callStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

// Contacts API
export async function getContacts(): Promise<Contact[]> {
  const db = await initDB();
  return db.getAll('contacts');
}

export async function getContact(id: string): Promise<Contact | undefined> {
  const db = await initDB();
  return db.get('contacts', id);
}

export async function saveContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Contact> {
  const db = await initDB();
  const now = Date.now();
  
  const newContact: Contact = {
    ...contact,
    id: contact.id || uuidv4(),
    phone: normalizePhone(contact.phone),
    createdAt: contact.id ? (await getContact(contact.id))?.createdAt || now : now,
    updatedAt: now,
  };

  await db.put('contacts', newContact);
  return newContact;
}

export async function deleteContact(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('contacts', id);
}

export async function toggleFavorite(id: string): Promise<void> {
  const db = await initDB();
  const contact = await db.get('contacts', id);
  if (contact) {
    contact.favorite = !contact.favorite;
    contact.updatedAt = Date.now();
    await db.put('contacts', contact);
  }
}

// Groups API
export async function getGroups(): Promise<Group[]> {
  const db = await initDB();
  return db.getAll('groups');
}

export async function saveGroup(group: Omit<Group, 'id'> & { id?: string }): Promise<Group> {
  const db = await initDB();
  const newGroup: Group = {
    ...group,
    id: group.id || uuidv4(),
  };
  await db.put('groups', newGroup);
  return newGroup;
}

export async function deleteGroup(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('groups', id);
  
  // Remove group from all contacts
  const contacts = await getContacts();
  const tx = db.transaction('contacts', 'readwrite');
  for (const contact of contacts) {
    if (contact.groups.includes(id)) {
      contact.groups = contact.groups.filter(g => g !== id);
      contact.updatedAt = Date.now();
      tx.store.put(contact);
    }
  }
  await tx.done;
}

// Settings API
export async function getSetting(key: string): Promise<any> {
  const db = await initDB();
  return db.get('settings', key);
}

export async function saveSetting(key: string, value: any): Promise<void> {
  const db = await initDB();
  await db.put('settings', value, key);
}

// Call History API
export async function getCallHistory(): Promise<CallLog[]> {
  const db = await initDB();
  const calls = await db.getAllFromIndex('calls', 'by-timestamp');
  return calls.reverse(); // Newest first
}

export async function addCallLog(number: string, contactId?: string, type: 'outgoing' | 'incoming' | 'missed' = 'outgoing'): Promise<CallLog> {
  const db = await initDB();
  const call: CallLog = {
    id: uuidv4(),
    number: normalizePhone(number),
    contactId,
    timestamp: Date.now(),
    type,
  };
  await db.put('calls', call);
  return call;
}

export async function clearCallHistory(): Promise<void> {
  const db = await initDB();
  await db.clear('calls');
}
