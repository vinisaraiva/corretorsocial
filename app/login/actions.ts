"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function loginMessageUrl(type: "error" | "success", message: string) {
  return `/login?${type}=${encodeURIComponent(message)}`;
}

function signupMessageUrl(type: "error" | "success", message: string) {
  return `/cadastro?${type}=${encodeURIComponent(message)}`;
}

export async function login(formData: FormData) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    redirect(
      loginMessageUrl(
        "error",
        "Supabase ainda não foi configurado na hospedagem.",
      ),
    );
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/").trim() || "/";

  if (!email || !password) {
    redirect(loginMessageUrl("error", "Informe e-mail e senha."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Seu cadastro já existe, mas o e-mail ainda não foi confirmado. Abra a mensagem enviada pelo Corretor Social e confirme antes de entrar."
        : "Não foi possível entrar. Confira seu e-mail e sua senha.";

    redirect(loginMessageUrl("error", message));
  }

  redirect(next.startsWith("/") ? next : "/");
}

export async function signup(formData: FormData) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    redirect(
      signupMessageUrl(
        "error",
        "Supabase ainda não foi configurado na hospedagem.",
      ),
    );
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(
    formData.get("password_confirmation") ?? "",
  );

  if (!email) {
    redirect(signupMessageUrl("error", "Informe um e-mail válido."));
  }

  if (password.length < 8) {
    redirect(
      signupMessageUrl(
        "error",
        "A senha precisa ter pelo menos 8 caracteres.",
      ),
    );
  }

  if (password !== passwordConfirmation) {
    redirect(signupMessageUrl("error", "As duas senhas precisam ser iguais."));
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://greenyellow-duck-334187.hostingersite.com";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) {
    const message =
      error.code === "over_email_send_rate_limit"
        ? "A confirmação já foi solicitada há poucos segundos. Aguarde cerca de 1 minuto antes de tentar novamente."
        : "Não foi possível criar a conta. Tente novamente.";

    redirect(signupMessageUrl("error", message));
  }

  if (data.session) {
    redirect("/onboarding");
  }

  redirect(
    signupMessageUrl(
      "success",
      "Conta criada. Enviamos um e-mail de confirmação. Abra a mensagem e confirme seu cadastro antes de entrar.",
    ),
  );
}

export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(
      signupMessageUrl(
        "error",
        "Informe o e-mail da conta para reenviar a confirmação.",
      ),
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://greenyellow-duck-334187.hostingersite.com";

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) {
    const message =
      error.code === "over_email_send_rate_limit"
        ? "Aguarde cerca de 1 minuto antes de pedir outro e-mail."
        : "Não foi possível reenviar a confirmação.";

    redirect(signupMessageUrl("error", message));
  }

  redirect(
    signupMessageUrl(
      "success",
      "Novo e-mail de confirmação enviado. Verifique também a caixa de spam.",
    ),
  );
}

export async function signout() {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
