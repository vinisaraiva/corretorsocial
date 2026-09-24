"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function messageUrl(type: "error" | "success", message: string) {
  return `/login?${type}=${encodeURIComponent(message)}`;
}

export async function login(formData: FormData) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    redirect(messageUrl("error", "Supabase ainda não foi configurado na hospedagem."));
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(messageUrl("error", "Informe e-mail e senha."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(messageUrl("error", "Não foi possível entrar. Confira seus dados."));
  }

  redirect("/");
}

export async function signup(formData: FormData) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    redirect(messageUrl("error", "Supabase ainda não foi configurado na hospedagem."));
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) {
    redirect(
      messageUrl(
        "error",
        "Informe um e-mail válido e uma senha com pelo menos 8 caracteres.",
      ),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(messageUrl("error", "Não foi possível criar a conta."));
  }

  if (data.session) {
    redirect("/onboarding");
  }

  redirect(
    messageUrl(
      "success",
      "Conta criada. Verifique seu e-mail para confirmar o cadastro.",
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
