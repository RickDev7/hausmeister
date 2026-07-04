import { NextResponse } from "next/server";
import { removePushRegistration } from "@/lib/push/file-store";
import { isRedisConfigured, removeSubscriptionRedis } from "@/lib/push/redis-store";

export async function POST(request: Request) {
  const body = (await request.json()) as { deviceId?: string };
  if (!body.deviceId) {
    return NextResponse.json({ error: "deviceId obrigatório" }, { status: 400 });
  }

  if (isRedisConfigured()) {
    await removeSubscriptionRedis(body.deviceId);
  } else {
    await removePushRegistration(body.deviceId);
  }

  return NextResponse.json({ ok: true });
}
