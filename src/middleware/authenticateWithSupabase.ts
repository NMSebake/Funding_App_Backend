// server/src/middleware/authenticateWithSupabase.ts
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email?: string };
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("SUPABASE_URL or SUPABASE_ANON_KEY not set - authenticateWithSupabase will fail");
}

export default async function authenticateWithSupabase(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized: Invalid token" });

  try {
    // Call Supabase auth endpoint to validate token and return user
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY!,
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Supabase /user call failed:", resp.status, text);
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const user = await resp.json();
    // user.id is supabase uuid
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err: any) {
    console.error("authenticateWithSupabase error:", err);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}
