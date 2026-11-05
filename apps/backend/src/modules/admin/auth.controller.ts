import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminUserModel } from '../../database/AdminUser';
import { authenticateAdmin, requireRole, AuthenticatedAdminRequest, logAdminAction } from '../../common/middleware/auth';
import { config } from '../../config/env';

const router = Router();
const JWT_SECRET = config.jwtSecret;

// POST /api/admin/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = await AdminUserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid admin credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, error: 'Admin account has been disabled. Contact Super Admin.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid admin credentials' });
      return;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          lastLoginAt: user.lastLoginAt,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// GET /api/admin/auth/me
router.get('/me', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const user = await AdminUserModel.findById(req.admin.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/auth/profile - Update current logged in admin's profile
router.patch('/profile', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const { name, phone, countryCode, avatarUrl, currentPassword, newPassword } = req.body;
    const user = await AdminUserModel.findById(req.admin.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (countryCode !== undefined) user.countryCode = countryCode.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, error: 'Current password is required to set a new password' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, error: 'Current password does not match' });
        return;
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.requirePasswordReset = false;
    }

    await user.save();
    await logAdminAction(req, 'UPDATE_PROFILE', 'AdminUser', user._id.toString(), { name: user.name });

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        countryCode: user.countryCode,
        avatarUrl: user.avatarUrl,
        role: user.role,
        department: user.department,
        regionScope: user.regionScope,
        permissions: user.permissions,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/auth/staff/:id (Super Admin only - full detail profile)
router.get('/staff/:id', authenticateAdmin, requireRole('SUPER_ADMIN'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const staffMember = await AdminUserModel.findById(id).select('-passwordHash');
    if (!staffMember) {
      res.status(404).json({ success: false, error: 'Staff member not found' });
      return;
    }
    res.json({ success: true, data: staffMember });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/auth/staff (Super Admin only)
router.get('/staff', authenticateAdmin, requireRole('SUPER_ADMIN'), async (_req, res) => {
  try {
    const staff = await AdminUserModel.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, data: staff });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/auth/staff (Super Admin only)
router.post('/staff', authenticateAdmin, requireRole('SUPER_ADMIN'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      countryCode,
      department,
      regionScope,
      requirePasswordReset,
      isActive,
      permissions,
    } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, error: 'Name, email, password, and role are required' });
      return;
    }

    const existing = await AdminUserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, error: 'Staff user with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newStaff = await AdminUserModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone: phone || '',
      countryCode: countryCode || '+91',
      department: department || 'OPERATIONS',
      regionScope: regionScope || 'All Regions',
      requirePasswordReset: requirePasswordReset !== undefined ? !!requirePasswordReset : true,
      isActive: isActive !== undefined ? !!isActive : true,
      permissions: permissions || [],
    });

    await logAdminAction(req, 'CREATE_STAFF', 'AdminUser', newStaff._id.toString(), {
      name,
      email,
      role,
      department,
    });

    res.status(201).json({
      success: true,
      data: {
        id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        countryCode: newStaff.countryCode,
        role: newStaff.role,
        department: newStaff.department,
        regionScope: newStaff.regionScope,
        requirePasswordReset: newStaff.requirePasswordReset,
        isActive: newStaff.isActive,
        permissions: newStaff.permissions,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/auth/staff/:id/status (Super Admin only)
router.patch('/staff/:id/status', authenticateAdmin, requireRole('SUPER_ADMIN'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    const user = await AdminUserModel.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Staff member not found' });
      return;
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;
    await user.save();

    await logAdminAction(req, 'UPDATE_STAFF', 'AdminUser', user._id.toString(), { isActive, role });

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

