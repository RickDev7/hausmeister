import { NextResponse } from "next/server";
import { isPushServerConfigured, processDuePushNotifications } from "@/lib/push/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!isPushServerConfigured()) {
    return NextResponse.json({ error: "Web Push não configurado", sent: 0 }, { status: 503 });
  }

  const result = await processDuePushNotifications();
  return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
}
