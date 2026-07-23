import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { getStorageProvider } from "@/lib/storage";

export const ADMIN_SESSION_COOKIE = "exam-platform-admin-session";

const DEFAULT_ADMIN_EMAIL = "admin";
const DEFAULT_ADMIN_PASSWORD = "Admin@260723";
const DEFAULT_JWT_SECRET = "exam-platform-dev-secret";

interface AdminSessionPayload {
  email: string;
  role: "admin";
}

function getAdminEmail() {
  return (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
}

function getJwtSecret() {
  return process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET;
}

export function getDefaultAdminCredentials() {
  return {
    email: getAdminEmail(),
    password: getAdminPassword(),
  };
}

export async function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const storageProvider = await getStorageProvider();
    const registeredAdmin = await storageProvider.getAdminByEmail(normalizedEmail);

    if (registeredAdmin) {
      return bcrypt.compare(password, registeredAdmin.passwordHash);
    }
  } catch {
    // Storage lookup fallback
  }

  if (normalizedEmail !== getAdminEmail()) {
    return false;
  }

  try {
    const storageProvider = await getStorageProvider();
    const settings = await storageProvider.getSettings();

    if (settings.adminPasswordHash) {
      return bcrypt.compare(password, settings.adminPasswordHash);
    }
  } catch {
    // Storage lookup fallback
  }

  const hashedPassword = process.env.ADMIN_PASSWORD_HASH;

  if (hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  return password === getAdminPassword();
}

function signAdminToken(payload: AdminSessionPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "12h",
  });
}

function verifyAdminToken(token: string): AdminSessionPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (
      typeof decoded === "object" &&
      decoded !== null &&
      decoded.role === "admin" &&
      typeof decoded.email === "string"
    ) {
      return {
        email: decoded.email,
        role: "admin",
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function createAdminSession(email: string) {
  const cookieStore = await cookies();
  const token = signAdminToken({
    email: email.trim().toLowerCase(),
    role: "admin",
  });

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminToken(token);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
