import type { NextFunction, Request, Response } from "express";

export interface AuthUser {
  id: string;
  role: string;
  managerId?: string | null;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export default function authenticateMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.header("x-user-id");
  const role = req.header("x-user-role") ?? "employee";
  const managerId = req.header("x-manager-id") ?? null;
  const name = req.header("x-user-name") ?? "Demo User";

  req.user = {
    id: userId ?? "11111111-1111-1111-1111-111111111111",
    role,
    managerId,
    name,
  };

  next();
}
