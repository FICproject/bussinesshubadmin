import mongoose from 'mongoose';
import app from './app';
import { seedDatabase } from './database/seed';
import {
  hasPersistentSnapshot,
  restoreFromPersistentSnapshot,
  savePersistentSnapshot,
  setupPersistenceHooks,
} from './database/persistence';
import { config } from './config/env';

const PORT = config.port;
let MONGODB_URI = config.mongodbUri;

async function bootstrap() {
  let connected = false;

  // 1. Try connecting to configured MongoDB (e.g., local MongoDB or MongoDB Atlas)
  try {
    console.log(`Connecting to primary MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: config.dbTimeoutMs });
    console.log('Connected to primary MongoDB successfully.');
    connected = true;
  } catch (primaryErr) {
    console.warn('Primary MongoDB not reachable. Initializing embedded database fallback...');
  }

  // 2. If no MongoDB is running on the machine, automatically start an embedded in-memory MongoDB instance
  if (!connected) {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      MONGODB_URI = mongod.getUri();
      console.log(`Embedded MongoDB started at: ${MONGODB_URI}`);

      await mongoose.connect(MONGODB_URI);
      console.log('Connected to embedded MongoDB successfully.');
      connected = true;
    } catch (memErr) {
      console.error('Failed to start embedded fallback MongoDB:', memErr);
    }
  }

  // 3. Database initialization: restore existing user state or run initial seeder
  if (connected) {
    try {
      // Setup live hooks so every user action / change on the website auto-persists to disk
      setupPersistenceHooks();

      if (hasPersistentSnapshot()) {
        console.log('Found persistent website database snapshot. Restoring actual saved state...');
        const restored = await restoreFromPersistentSnapshot();
        if (!restored) {
          console.log('Snapshot restore skipped or empty. Running initial seeder...');
          await seedDatabase();
          await savePersistentSnapshot();
        } else {
          console.log('Website data successfully restored from disk! All user activities and changes are active.');
        }
      } else {
        console.log('No previous snapshot found. Running initial baseline database seeder...');
        await seedDatabase();
        // Immediately save the baseline state to the persistent snapshot file
        await savePersistentSnapshot();
        console.log('Baseline database seeded and saved to persistent disk storage.');
      }
    } catch (seedErr) {
      console.error('Database initialization error:', seedErr);
    }
  }

  app.listen(PORT, () => {
    console.log(`FIC Business Hub Admin & Shared API listening on port ${PORT}`);
  });
}

bootstrap();

