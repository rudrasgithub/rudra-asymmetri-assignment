import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const now = new Date().toISOString();
  
  try {
    const t1 = Date.now();
    await db.execute(sql`SELECT 1`);
    const ping = Date.now() - t1;

    return NextResponse.json({
      status: "ok",
      db: "connected",
      ping: `${ping}ms`,
      time: now,
    });
  } catch (e) {
    console.error("db check failed:", e);
    
    return NextResponse.json(
      { status: "error", db: "failed", time: now },
      { status: 503 }
    );
  }
}