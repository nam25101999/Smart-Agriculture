import 'express';

export interface AuthUserPayload {
  id: string;
  email: string;
  fullName: string;
  globalRoles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

