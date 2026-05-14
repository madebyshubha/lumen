import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";
import { verifySessionToken } from "../lib/auth";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.header("authorization") ?? req.header("Authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    res
      .status(401)
      .json({ code: "unauthorized", message: "Missing bearer token" });
    return;
  }
  const token = header.slice(7).trim();
  if (!token) {
    res
      .status(401)
      .json({ code: "unauthorized", message: "Empty bearer token" });
    return;
  }

  let payload;
  try {
    payload = await verifySessionToken(token);
  } catch (err) {
    req.log.warn({ err }, "session token rejected");
    res
      .status(401)
      .json({ code: "unauthorized", message: "Invalid session token" });
    return;
  }

  const userId = Number(payload.sub);
  if (!Number.isFinite(userId)) {
    res
      .status(401)
      .json({ code: "unauthorized", message: "Invalid session subject" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res
      .status(401)
      .json({ code: "unauthorized", message: "Session user not found" });
    return;
  }

  if (user.sessionVersion !== payload.sv) {
    res
      .status(401)
      .json({ code: "unauthorized", message: "Session has been revoked" });
    return;
  }

  req.user = user;
  next();
}
