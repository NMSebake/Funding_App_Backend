import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; // you can make this more strict { id: number, email: string }
    }
  }
}


export default function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: "Unauthorized: No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized: Invalid token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

