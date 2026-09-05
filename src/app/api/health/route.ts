import { prisma } from "@/lib/prisma";
import { appConfig } from "@/config/app";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await prisma.$queryRaw`SELECT 1`; return Response.json({status:"ok",service:appConfig.slug,database:"ready",timestamp:new Date().toISOString()}); }
  catch { return Response.json({status:"unavailable",service:appConfig.slug,database:"unavailable"},{status:503}); }
}
