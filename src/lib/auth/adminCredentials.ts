import { verifyPassword } from "./password";

/** Shared by the admin login route and the main participant login route (which also
 * recognizes admin credentials so researchers don't need to know the separate /admin URL). */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash) return false;
  if (email.toLowerCase() !== adminEmail) return false;
  return verifyPassword(password, adminHash);
}
