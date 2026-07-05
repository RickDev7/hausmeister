import { NextResponse } from "next/server";
import type { ScheduledPushNotification } from "@/lib/notification-schedule";
import { isPushServerConfigured, registerPushSchedule } from "@/lib/push/server";
import { removePushRegistration } from "@/lib/push/file-store";
import { isRedisConfigured, removeSubscriptionRedis } from "@/lib/push/redis-store";

interface RegisterBody {
  deviceId?: string;
  subscription?: PushSubscriptionJSON;
  schedules?: ScheduledPushNotification[];
}

export async function POST(request: Request) {
  if (!isPushServerConfigured()) {
    return NextResponse.json(
      { error: "Configure VAPID keys no servidor", configured: false },
      { status: 503 }
    );
  }

  const body = (await request.json()) as RegisterBody;

  if (!body.deviceId || !body.subscription || !Array.isArray(body.schedules)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const result = await registerPushSchedule(body.deviceId, body.subscription, body.schedules);

  return NextResponse.json({
    ok: true,
    scheduled: body.schedules.length,
    storage: result.storage,
    qstashScheduled: result.qstashScheduled,
  });
}

export async function DELETE(request: Request) {
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
