import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  let supabaseStatus: "ok" | "not_configured" | "error" =
    configured ? "error" : "not_configured";

  if (configured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("profiles")
        .select("user_id", { head: true, count: "exact" });

      supabaseStatus = error ? "error" : "ok";
    } catch {
      supabaseStatus = "error";
    }
  }

  return NextResponse.json({
    ok: true,
    service: "corretor-social",
    framework: "nextjs",
    app: "ok",
    supabase: supabaseStatus,
    timestamp: new Date().toISOString(),
  });
}
