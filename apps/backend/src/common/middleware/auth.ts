import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminRole } from '@fic/shared-types';
import { AuditLogModel } from '../../database/AuditLog';
import { config } from '../../config/env';

const JWT_SECRET = config.jwtSecret;

export interface AuthenticatedAdminRequest extends Request {
  admin?: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    permissions: string[];
  };
}

export const authenticateAdmin = (
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.admin = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired session token' });
  }
};

export const requireRole = (...roles: AdminRole[]) => {
  return (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.admin.role)) {
      res.status(403).json({ success: false, error: `Access denied. Requires role: ${roles.join(' or ')}` });
      return;
    }
    next();
  };
};

export const logAdminAction = async (
  adminReq: AuthenticatedAdminRequest,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any>
) => {
  try {
    if (adminReq.admin) {
      await AuditLogModel.create({
        adminId: adminReq.admin.id,
        adminName: adminReq.admin.name,
        adminRole: adminReq.admin.role,
        action,
        entityType,
        entityId,
        ipAddress: adminReq.ip || (adminReq.headers['x-forwarded-for'] as string),
        details,
      });
    }
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

