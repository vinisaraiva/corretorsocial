import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function publicUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://greenyellow-duck-334187.hostingersite.com";

  return new URL(path, base);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/onboarding";

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(publicUrl(next));
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(publicUrl(next));
    }

    if (error.code === "bad_code_verifier") {
      const loginUrl = publicUrl("/login");
      loginUrl.searchParams.set(
        "success",
        "Seu e-mail foi confirmado. Entre com sua senha para continuar.",
      );
      return NextResponse.redirect(loginUrl);
    }
  }

  const loginUrl = publicUrl("/login");
  loginUrl.searchParams.set(
    "error",
    "Não foi possível concluir o acesso por esse link. Se o e-mail já foi confirmado, entre normalmente com sua senha.",
  );

  return NextResponse.redirect(loginUrl);
}
