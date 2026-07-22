import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const setting = await prisma.globalSetting.findUnique({ where: { key: "platform" } });
  const value = setting?.value as { defaultLocale?: string } | undefined;
  const defaultLocale = value?.defaultLocale ?? "en";

  return NextResponse.json(
    { defaultLocale },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } }
  );
}
