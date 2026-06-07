import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        full_name?: string;  
      };
      fullUser?: any;
    }
  }
}

// Basic auth middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; full_name?: string };
    
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      full_name: decoded.full_name || ''
    };
    
    // Get full user data including role
    const fullUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { user_type: true, seeker_profile: true, employer_profile: true }
    });
    req.fullUser = fullUser;
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Role checking middleware
export const isEmployer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.fullUser || await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    });
    
    if (!user || user.user_type?.type_name !== 'Employer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This resource is only available for employers.',
        required_role: 'Employer',
        your_role: user?.user_type?.type_name || 'Unknown'
      });
    }
    
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.fullUser || await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    });
    
    const role = user?.user_type?.type_name;
    if (!user || (role !== 'Admin' && role !== 'Super Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This resource is only available for administrators.',
        required_role: 'Admin or Super Admin',
        your_role: role || 'Unknown'
      });
    }
    
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
};

export const isSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.fullUser || await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    });
    
    if (!user || user.user_type?.type_name !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This resource is only available for super administrators.',
        required_role: 'Super Admin',
        your_role: user?.user_type?.type_name || 'Unknown'
      });
    }
    
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
};

export const isJobSeeker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.fullUser || await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    });
    
    if (!user || user.user_type?.type_name !== 'Job Seeker') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This resource is only available for job seekers.',
        required_role: 'Job Seeker',
        your_role: user?.user_type?.type_name || 'Unknown'
      });
    }
    
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
};

// Authorize any of the provided roles
export const authorizeAny = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.fullUser || await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { user_type: true }
      });
      
      const userRole = user?.user_type?.type_name;
      
      if (!user || !roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This resource requires one of the following roles: ${roles.join(', ')}`,
          required_roles: roles,
          your_role: userRole || 'Unknown'
        });
      }
      
      next();
    } catch (error) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  };
};