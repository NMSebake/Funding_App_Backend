// server/src/middleware/authenticateWithSupabase.ts
import { NextFunction, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.");
  // don't throw here so server can still start in dev if you want
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function authenticateWithSupabase(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized: No token provided" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ message: "Unauthorized: Invalid token" });

  const token = parts[1];

  try {
    // Note: getUser works with an access token
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      console.error("Supabase getUser error:", error);
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    // Attach user to request
    (req as any).user = {
      id: data.user.id,
      email: data.user.email,
    };

    next();
  } catch (err) {
    console.error("Supabase auth error:", err);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}
