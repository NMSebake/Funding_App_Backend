import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../types/user";


export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Make sure the decoded token contains the fields we expect
    const user: User = {
      id: decoded.sub as string,
      email: decoded.email as string,
    };

    req.user = user; // MAPPED CORRECTLY
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

