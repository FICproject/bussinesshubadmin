import fs from 'fs';
import path from 'path';
import os from 'os';
import mongoose from 'mongoose';
import { AdminUserModel } from './AdminUser';
import { CategoryModel } from './Category';
import { MemberModel } from './Member';
import { KycSubmissionModel } from './KycSubmission';
import { ServiceListingModel } from './ServiceListing';
import { FicRequestModel } from './FicRequest';
import { PaymentModel } from './Payment';
import { AuditLogModel } from './AuditLog';
import { MeetingModel } from './Meeting';
import { SupportTicketModel } from './SupportTicket';
import { ReferralConfigModel, ReferralRecordModel } from './Referral';
import { FundingApplicationModel } from './FundingApplication';
import { InvestmentPoolModel } from './InvestmentPool';
import { MemberWalletModel } from './MemberWallet';
import { config } from '../config/env';

// Persistent storage file location (configurable via PERSISTENCE_DIR env variable)
const PERSISTENT_DIR = config.persistentSnapshotDir || path.join(os.tmpdir(), 'fic_hub_data');
const PERSISTENT_FILE = path.join(PERSISTENT_DIR, 'fic_hub_snapshot.json');

// All collections to persist
const COLLECTIONS: { name: string; model: any }[] = [
  { name: 'AdminUser', model: AdminUserModel },
  { name: 'Category', model: CategoryModel },
  { name: 'Member', model: MemberModel },
  { name: 'KycSubmission', model: KycSubmissionModel },
  { name: 'ServiceListing', model: ServiceListingModel },
  { name: 'FicRequest', model: FicRequestModel },
  { name: 'Payment', model: PaymentModel },
  { name: 'AuditLog', model: AuditLogModel },
  { name: 'Meeting', model: MeetingModel },
  { name: 'SupportTicket', model: SupportTicketModel },
  { name: 'ReferralConfig', model: ReferralConfigModel },
  { name: 'ReferralRecord', model: ReferralRecordModel },
  { name: 'FundingApplication', model: FundingApplicationModel },
  { name: 'InvestmentPool', model: InvestmentPoolModel },
  { name: 'MemberWallet', model: MemberWalletModel },
];

let isSaving = false;
let saveQueued = false;
let autoSaveInterval: NodeJS.Timeout | null = null;

/**
 * Check if a persistent snapshot file exists and has records
 */
export function hasPersistentSnapshot(): boolean {
  try {
    if (!fs.existsSync(PERSISTENT_FILE)) return false;
    const stats = fs.statSync(PERSISTENT_FILE);
    return stats.size > 10;
  } catch {
    return false;
  }
}

/**
 * Restore all persisted database state from disk
 */
export async function restoreFromPersistentSnapshot(): Promise<boolean> {
  try {
    if (!hasPersistentSnapshot()) return false;
    console.log(`[Persistence] Restoring database from snapshot: ${PERSISTENT_FILE}...`);
    const rawData = fs.readFileSync(PERSISTENT_FILE, 'utf8');
    const snapshot = JSON.parse(rawData);

    let totalRestored = 0;
    for (const col of COLLECTIONS) {
      const records = snapshot[col.name];
      if (Array.isArray(records) && records.length > 0) {
        // Clear current memory collection and restore exact persisted state
        await col.model.deleteMany({});
        await col.model.insertMany(records, { ordered: false });
        totalRestored += records.length;
      }
    }

    console.log(`[Persistence] Successfully restored ${totalRestored} documents across ${COLLECTIONS.length} collections.`);
    return totalRestored > 0;
  } catch (err) {
    console.error('[Persistence] Error restoring database snapshot:', err);
    return false;
  }
}

/**
 * Save all collections to disk as a persistent snapshot
 */
export async function savePersistentSnapshot(): Promise<void> {
  if (isSaving) {
    saveQueued = true;
    return;
  }
  isSaving = true;

  try {
    if (!fs.existsSync(PERSISTENT_DIR)) {
      fs.mkdirSync(PERSISTENT_DIR, { recursive: true });
    }

    const snapshot: Record<string, any[]> = {};
    for (const col of COLLECTIONS) {
      const docs = await col.model.find({}).lean();
      snapshot[col.name] = docs;
    }

    const tempFile = `${PERSISTENT_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(snapshot, null, 2), 'utf8');
    fs.renameSync(tempFile, PERSISTENT_FILE);
  } catch (err) {
    console.error('[Persistence] Error saving database snapshot:', err);
  } finally {
    isSaving = false;
    if (saveQueued) {
      saveQueued = false;
      setTimeout(() => savePersistentSnapshot(), 500);
    }
  }
}

/**
 * Hook into Mongoose schema post-save, post-update, and post-remove to trigger persistent snapshot
 */
export function setupPersistenceHooks(): void {
  for (const col of COLLECTIONS) {
    const schema = col.model.schema as any;
    schema.post('save', () => {
      savePersistentSnapshot();
    });
    schema.post('insertMany', () => {
      savePersistentSnapshot();
    });
    schema.post('updateOne', () => {
      savePersistentSnapshot();
    });
    schema.post('updateMany', () => {
      savePersistentSnapshot();
    });
    schema.post('findOneAndUpdate', () => {
      savePersistentSnapshot();
    });
    schema.post('findOneAndDelete', () => {
      savePersistentSnapshot();
    });
    schema.post('deleteOne', () => {
      savePersistentSnapshot();
    });
    schema.post('deleteMany', () => {
      savePersistentSnapshot();
    });
  }

  // Periodic safety flush every 3 seconds if active
  if (!autoSaveInterval) {
    autoSaveInterval = setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        savePersistentSnapshot();
      }
    }, 3000);
  }

  // Also flush on exit signals
  process.on('SIGINT', async () => {
    try {
      await savePersistentSnapshot();
    } finally {
      process.exit(0);
    }
  });

  process.on('SIGTERM', async () => {
    try {
      await savePersistentSnapshot();
    } finally {
      process.exit(0);
    }
  });
}
