import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushServerConfigured } from "@/lib/push/server";

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey || !isPushServerConfigured()) {
    return NextResponse.json(
      { error: "Web Push não configurado no servidor", configured: false },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey, configured: true });
}
