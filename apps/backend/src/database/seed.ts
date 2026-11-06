import bcrypt from 'bcryptjs';
import { AdminUserModel } from './AdminUser';
import { ReferralConfigModel } from './Referral';
import { config } from '../config/env';

export async function seedDatabase() {
  try {
    // Seed ONLY the single Super Admin credential if no admin accounts exist
    const adminCount = await AdminUserModel.countDocuments();
    if (adminCount === 0) {
      console.log('Seeding initial Super Administrator account...');
      const superAdminPassword = await bcrypt.hash(config.seed.superAdminPassword, config.bcryptSaltRounds);
      await AdminUserModel.create({
        name: 'FIC Super Administrator',
        email: config.seed.superAdminEmail.toLowerCase(),
        passwordHash: superAdminPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        permissions: ['*'],
      });
      console.log(`Super Administrator created: ${config.seed.superAdminEmail}`);
    }

    // Ensure baseline referral program configuration exists
    const refConfig = await ReferralConfigModel.findOne({ key: 'DEFAULT_CONFIG' });
    if (!refConfig) {
      await ReferralConfigModel.create({
        key: 'DEFAULT_CONFIG',
        bonusPerReferral: 500,
        currency: 'INR',
        minimumPayoutAmount: 1000,
        isActive: true,
        updatedBy: 'System',
      });
    }

    console.log('Database initialization completed. Zero mock categories, users, or records.');
  } catch (err) {
    console.error('Error during database initialization:', err);
  }
}
