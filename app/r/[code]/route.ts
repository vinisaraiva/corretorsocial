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
  const { data: link, error } = await supabase
    .from("tracking_links")
    .select("id,destination_url,clicks")
    .eq("short_code", shortCode)
    .maybeSingle();

  if (error || !link || !allowedDestination(link.destination_url)) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const { error: updateError } = await supabase
    .from("tracking_links")
    .update({
      clicks: Number(link.clicks ?? 0) + 1,
    })
    .eq("id", link.id);

  if (updateError) {
    console.error("Could not increment tracking link", updateError);
  }

  return NextResponse.redirect(link.destination_url, 302);
}
