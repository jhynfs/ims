import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface InventoryItem {
  id: string;
  itemId: string;
  equipmentName: string;
  category: string;
  serialNumber: string;
  quantity: number;
  unit: string;
  status: 'Available' | 'Issued' | 'Damaged';
  location: string;
  assignedUnit: string;
  dateAcquired: string;
  condition: 'Good' | 'Repair Needed';
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssuanceRecord {
  id: string;
  itemId: string;
  itemName: string;
  borrowerRank: string;
  borrowerName: string;
  dateIssued: string;
  expectedReturn: string;
  quantity: number;
  purpose: string;
  approvingOfficer: string;
  status: 'Issued' | 'Returned' | 'Overdue';
  actualReturnDate?: string;
  returnCondition?: string;
  returnRemarks?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  rank: string;
  fullName: string;
  role: 'Admin' | 'Supply Officer' | 'Viewer';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: string;
}

interface InventoryDB extends DBSchema {
  items: {
    key: string;
    value: InventoryItem;
    indexes: { 'by-category': string; 'by-status': string; 'by-itemId': string };
  };
  issuances: {
    key: string;
    value: IssuanceRecord;
    indexes: { 'by-status': string; 'by-itemId': string };
  };
  users: {
    key: string;
    value: User;
    indexes: { 'by-username': string };
  };
  auditLogs: {
    key: string;
    value: AuditLog;
    indexes: { 'by-timestamp': string };
  };
}

let dbInstance: IDBPDatabase<InventoryDB> | null = null;

export async function initDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<InventoryDB>('inventory-system', 1, {
    upgrade(db) {
      // Items store
      const itemStore = db.createObjectStore('items', { keyPath: 'id' });
      itemStore.createIndex('by-category', 'category');
      itemStore.createIndex('by-status', 'status');
      itemStore.createIndex('by-itemId', 'itemId');

      // Issuances store
      const issuanceStore = db.createObjectStore('issuances', { keyPath: 'id' });
      issuanceStore.createIndex('by-status', 'status');
      issuanceStore.createIndex('by-itemId', 'itemId');

      // Users store
      const userStore = db.createObjectStore('users', { keyPath: 'id' });
      userStore.createIndex('by-username', 'username');

      // Audit logs store
      const auditStore = db.createObjectStore('auditLogs', { keyPath: 'id' });
      auditStore.createIndex('by-timestamp', 'timestamp');
    },
  });

  // Initialize with default admin user if no users exist
  const users = await dbInstance.getAll('users');
  if (users.length === 0) {
    await dbInstance.add('users', {
      id: 'user-1',
      username: 'admin',
      password: 'admin123',
      rank: 'Major',
      fullName: 'System Administrator',
      role: 'Admin',
      createdAt: new Date().toISOString(),
    });

    // Add sample supply officer
    await dbInstance.add('users', {
      id: 'user-2',
      username: 'supply',
      password: 'supply123',
      rank: 'Lieutenant',
      fullName: 'Supply Officer',
      role: 'Supply Officer',
      createdAt: new Date().toISOString(),
    });

    // Add sample data
    await addSampleData(dbInstance);
  }

  return dbInstance;
}

async function addSampleData(db: IDBPDatabase<InventoryDB>) {
  const sampleItems: InventoryItem[] = [
    {
      id: 'item-1',
      itemId: 'SIG-0001',
      equipmentName: 'Motorola Radio',
      category: 'Communication Device',
      serialNumber: 'SN-283838',
      quantity: 20,
      unit: 'pcs',
      status: 'Available',
      location: 'Storage Room A',
      assignedUnit: 'Alpha Company',
      dateAcquired: '2025-01-10',
      condition: 'Good',
      remarks: 'Battery replaced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'item-2',
      itemId: 'BAT-0001',
      equipmentName: 'Radio Battery Pack',
      category: 'Batteries',
      serialNumber: 'SN-490123',
      quantity: 8,
      unit: 'pcs',
      status: 'Available',
      location: 'Storage Room A',
      assignedUnit: 'Alpha Company',
      dateAcquired: '2025-02-15',
      condition: 'Good',
      remarks: 'Low stock alert',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'item-3',
      itemId: 'LAP-0001',
      equipmentName: 'Dell Latitude 7420',
      category: 'Laptops',
      serialNumber: 'SN-772849',
      quantity: 5,
      unit: 'pcs',
      status: 'Issued',
      location: 'HQ Office',
      assignedUnit: 'Headquarters',
      dateAcquired: '2024-11-20',
      condition: 'Good',
      remarks: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'item-4',
      itemId: 'ANT-0001',
      equipmentName: 'Radio Antenna Long Range',
      category: 'Antennas',
      serialNumber: 'SN-338291',
      quantity: 3,
      unit: 'pcs',
      status: 'Damaged',
      location: 'Repair Shop',
      assignedUnit: 'Bravo Company',
      dateAcquired: '2024-08-05',
      condition: 'Repair Needed',
      remarks: 'Bent from field operations',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const item of sampleItems) {
    await db.add('items', item);
  }

  const sampleIssuances: IssuanceRecord[] = [
    {
      id: 'issue-1',
      itemId: 'item-3',
      itemName: 'Dell Latitude 7420',
      borrowerRank: 'Captain',
      borrowerName: 'John Santos',
      dateIssued: '2026-05-10',
      expectedReturn: '2026-05-20',
      quantity: 2,
      purpose: 'Field operations planning',
      approvingOfficer: 'Major Anderson',
      status: 'Issued',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'issue-2',
      itemId: 'item-1',
      itemName: 'Motorola Radio',
      borrowerRank: 'Sergeant',
      borrowerName: 'Maria Cruz',
      dateIssued: '2026-05-01',
      expectedReturn: '2026-05-10',
      quantity: 5,
      purpose: 'Training exercise',
      approvingOfficer: 'Captain Lee',
      status: 'Returned',
      actualReturnDate: '2026-05-09',
      returnCondition: 'Good',
      returnRemarks: 'All units accounted for',
      createdAt: new Date().toISOString(),
    },
  ];

  for (const issuance of sampleIssuances) {
    await db.add('issuances', issuance);
  }
}

export async function getDB() {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

export async function exportDatabase() {
  const db = await getDB();
  const data = {
    items: await db.getAll('items'),
    issuances: await db.getAll('issuances'),
    users: await db.getAll('users'),
    auditLogs: await db.getAll('auditLogs'),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importDatabase(jsonData: string) {
  const data = JSON.parse(jsonData);
  const db = await getDB();

  // Clear existing data
  await db.clear('items');
  await db.clear('issuances');
  await db.clear('users');
  await db.clear('auditLogs');

  // Import new data
  for (const item of data.items || []) {
    await db.add('items', item);
  }
  for (const issuance of data.issuances || []) {
    await db.add('issuances', issuance);
  }
  for (const user of data.users || []) {
    await db.add('users', user);
  }
  for (const log of data.auditLogs || []) {
    await db.add('auditLogs', log);
  }
}
