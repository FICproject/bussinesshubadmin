import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import authRoutes from './modules/admin/auth.controller';
import categoryRoutes from './modules/admin/categories.controller';
import kycRoutes from './modules/admin/kyc.controller';
import memberRoutes from './modules/admin/members.controller';
import serviceRoutes from './modules/admin/services.controller';
import requestRoutes from './modules/admin/requests.controller';
import dashboardRoutes from './modules/admin/dashboard.controller';
import meetingRoutes from './modules/admin/meetings.controller';
import paymentRoutes from './modules/admin/payments.controller';
import supportRoutes from './modules/admin/support.controller';
import notificationRoutes from './modules/admin/notifications.controller';
import referralRoutes from './modules/admin/referrals.controller';
import fundingRoutes from './modules/admin/funding.controller';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (config.corsOrigins.includes(origin) || config.env === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin API Routes
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/kyc', kycRoutes);
app.use('/api/admin/members', memberRoutes);
app.use('/api/admin/services', serviceRoutes);
app.use('/api/admin/requests', requestRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/meetings', meetingRoutes);
app.use('/api/admin/payments', paymentRoutes);
app.use('/api/admin/support', supportRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/admin/referrals', referralRoutes);
app.use('/api/admin/funding', fundingRoutes);

export default app;

