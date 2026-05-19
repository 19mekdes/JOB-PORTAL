import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        user_type?: {
          id: number;
          type_name: string;
        };
      };
    }
  }
}