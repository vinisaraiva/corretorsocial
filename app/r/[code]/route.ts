import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function allowedDestination(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      (url.hostname === "wa.me" || url.hostname === "api.whatsapp.com")
    );
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const shortCode = code.trim();

  if (!/^[A-Za-z0-9_-]{6,64}$/.test(shortCode)) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const supabase = createAdminClient();
  const { data: destination, error } = await supabase.rpc(
    "increment_tracking_link_click",
    {
      p_short_code: shortCode,
    },
  );

  if (
    error ||
    typeof destination !== "string" ||
    !allowedDestination(destination)
  ) {
    if (error) {
      console.error("Could not increment tracking link", error);
    }

    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  return NextResponse.redirect(destination, 302);
}
