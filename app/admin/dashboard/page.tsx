import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getContent } from "@/lib/content";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  console.log(`[dashboard] Cookie present: ${!!token}`);

  if (!token) {
    console.log("[dashboard] No token, redirecting to /admin");
    redirect("/admin");
  }

  const valid = await verifySessionToken(token);
  console.log(`[dashboard] Token valid: ${valid}`);

  if (!valid) {
    console.log("[dashboard] Invalid token, redirecting to /admin");
    redirect("/admin");
  }

  const content = getContent();
  return <AdminDashboardClient initialContent={content} />;
}
