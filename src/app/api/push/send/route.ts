import { NextResponse } from "next/server";
import { sendSinglePushNotification } from "@/lib/push/server";

interface SendBody {
  deviceId?: string;
  notificationId?: string;
}

async function verifyQStashRequest(request: Request, rawBody: string): Promise<boolean> {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  if (!currentKey) return false;

  const signature = request.headers.get("upstash-signature");
  if (!signature) return false;

  const { Receiver } = await import("@upstash/qstash");
  const receiver = new Receiver({
    currentSigningKey: currentKey,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "",
  });

  return receiver.verify({
    signature,
    body: rawBody,
    url: request.url,
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hasQStashKeys = !!process.env.QSTASH_CURRENT_SIGNING_KEY;

  if (hasQStashKeys) {
    const valid = await verifyQStashRequest(request, rawBody);
    if (!valid) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "QStash não configurado" }, { status: 503 });
    }
  }

  let body: SendBody;
  try {
    body = JSON.parse(rawBody) as SendBody;
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (!body.deviceId || !body.notificationId) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const result = await sendSinglePushNotification(body.deviceId, body.notificationId);
  return NextResponse.json(result);
}
