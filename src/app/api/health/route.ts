import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAIConfig } from "@/server/ai/config";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const ai = getAIConfig();
    return NextResponse.json({ status: "ok", database: "ok", ai: { provider: ai.provider, isMock: ai.isMock } });
  } catch {
    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}
