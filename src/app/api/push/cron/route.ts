import { NextResponse } from "next/server";
import { isPushServerConfigured, processDuePushNotifications, getPushServerStatus } from "@/lib/push/server";

function isAuthorizedCron(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");

  if (vercelCron === "1") return true;
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!isPushServerConfigured()) {
    return NextResponse.json({ error: "Web Push não configurado", sent: 0 }, { status: 503 });
  }

  const result = await processDuePushNotifications();
  return NextResponse.json({
    ok: true,
    ...result,
    server: getPushServerStatus(),
    at: new Date().toISOString(),
  });
}
