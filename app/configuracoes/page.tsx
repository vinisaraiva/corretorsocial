import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SettingsForm } from "@/components/settings-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const metaNotices: Record<string, string> = {
  connected: "Facebook conectado com sucesso.",
  disconnected: "A conexão com o Facebook foi removida.",
  no_page:
    "Facebook autorizado, mas não encontramos nenhuma Página disponível para publicação automática. Você pode continuar usando o Corretor Social e conectar uma Página depois.",
  no_publishable_page:
    "Encontramos Página(s) na sua conta, mas nenhuma está liberada para publicação automática pelo Corretor Social.",
  missing_config:
    "A integração Facebook ainda precisa das variáveis do aplicativo e da chave de criptografia no servidor.",
  denied: "A autorização do Facebook foi cancelada ou negada.",
  invalid_state:
    "A autorização expirou ou não pôde ser validada. Inicie a conexão novamente.",
  expired:
    "A sessão temporária da Meta expirou. Inicie a conexão novamente.",
  failed:
    "Não foi possível concluir a conexão com o Facebook. Verifique o aplicativo e tente novamente.",
  disconnect_failed:
    "Não foi possível remover a conexão com o Facebook neste momento.",
};

const instagramNotices: Record<string, string> = {
  connected: "Instagram conectado com sucesso.",
  disconnected: "A conexão com o Instagram foi removida.",
  missing_config:
    "A integração Instagram ainda precisa das credenciais do Instagram Login no servidor.",
  denied: "A autorização do Instagram foi cancelada ou negada.",
  invalid_state:
    "A autorização do Instagram expirou ou não pôde ser validada. Tente conectar novamente.",
  failed:
    "Não foi possível concluir a conexão com o Instagram. Verifique a configuração do Instagram Login e tente novamente.",
  disconnect_failed:
    "Não foi possível remover a conexão com o Instagram neste momento.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    meta?: string | string[];
    instagram?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const metaCode = Array.isArray(params.meta) ? params.meta[0] : params.meta;
  const instagramCode = Array.isArray(params.instagram)
    ? params.instagram[0]
    : params.instagram;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: connections }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "professional_name,agency_name,creci,email,whatsapp,phone,website,city,service_regions,primary_color,secondary_color,communication_tone,default_cta,review_before_publish,logo_path",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("social_connections")
      .select("provider,status,display_name,external_account_id")
      .eq("user_id", user.id),
  ]);

  if (!profile) {
    redirect("/onboarding");
  }

  let logoUrl: string | null = null;

  if (profile.logo_path) {
    const { data } = await supabase.storage
      .from("profile-assets")
      .createSignedUrl(profile.logo_path, 60 * 60);

    logoUrl = data?.signedUrl ?? null;
  }

  return (
    <AppShell
      title="Configurações"
      description="Deixe seu perfil pronto uma vez e reutilize em todas as campanhas."
    >
      <SettingsForm
        profile={profile}
        connections={connections ?? []}
        logoUrl={logoUrl}
        metaNotice={metaCode ? metaNotices[metaCode] : undefined}
        instagramNotice={
          instagramCode ? instagramNotices[instagramCode] : undefined
        }
      />
    </AppShell>
  );
}
