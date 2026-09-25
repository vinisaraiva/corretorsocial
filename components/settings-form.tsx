import Link from "next/link";
import { Save } from "lucide-react";
import { saveSettings } from "@/app/configuracoes/actions";
import { disconnectMeta } from "@/app/configuracoes/meta/actions";
import { LogoUploader } from "@/components/logo-uploader";

type ProfileSettings = {
  professional_name: string | null;
  agency_name: string | null;
  creci: string | null;
  email: string | null;
  whatsapp: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  service_regions: string[];
  primary_color: string;
  secondary_color: string;
  communication_tone: string;
  default_cta: string;
  review_before_publish: boolean;
};

type Connection = {
  provider: "instagram" | "facebook" | "tiktok" | "google_business";
  status: string;
  display_name: string | null;
  external_account_id: string | null;
};

const networkLabels = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google_business: "Google Business",
} as const;

export function SettingsForm({
  profile,
  connections,
  logoUrl,
  metaNotice,
}: {
  profile: ProfileSettings;
  connections: Connection[];
  logoUrl?: string | null;
  metaNotice?: string;
}) {
  const connectedByProvider = new Map(
    connections
      .filter((connection) => connection.status === "connected")
      .map((connection) => [connection.provider, connection]),
  );
  const metaConnected =
    connectedByProvider.has("facebook") || connectedByProvider.has("instagram");

  return (
    <form action={saveSettings} className="space-y-5">
      <Section
        title="Perfil profissional"
        description="Como você aparece nos criativos e publicações."
      >
        <Grid>
          <Field
            name="professional_name"
            label="Nome profissional"
            defaultValue={profile.professional_name ?? ""}
            placeholder="João Silva"
          />
          <Field
            name="creci"
            label="CRECI"
            defaultValue={profile.creci ?? ""}
            placeholder="CRECI 12345-BA"
          />
          <Field
            name="agency_name"
            label="Imobiliária (opcional)"
            defaultValue={profile.agency_name ?? ""}
            placeholder="Nome da imobiliária"
          />
          <label className="text-sm font-bold">
            E-mail
            <input
              value={profile.email ?? ""}
              readOnly
              className="app-input mt-2 bg-[#F9FAFB] text-[#667085]"
            />
          </label>
        </Grid>
      </Section>

      <Section
        title="Contato"
        description="O WhatsApp será o principal destino dos interessados."
      >
        <Grid>
          <Field
            name="whatsapp"
            label="WhatsApp"
            defaultValue={profile.whatsapp ?? ""}
            placeholder="(73) 99999-9999"
          />
          <Field
            name="phone"
            label="Telefone"
            defaultValue={profile.phone ?? ""}
            placeholder="(73) 99999-9999"
          />
          <Field
            name="website"
            label="Site"
            defaultValue={profile.website ?? ""}
            placeholder="seusite.com.br"
          />
          <Field
            name="city"
            label="Cidade principal"
            defaultValue={profile.city ?? ""}
            placeholder="Porto Seguro - BA"
          />
        </Grid>

        <label className="mt-4 block text-sm font-bold">
          Bairros ou regiões atendidas
          <input
            name="service_regions"
            className="app-input mt-2"
            defaultValue={profile.service_regions.join(", ")}
            placeholder="Taperapuã, Centro, Arraial d'Ajuda"
          />
        </label>
      </Section>

      <Section
        title="Marca"
        description="Aplicada automaticamente aos seus criativos."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Cor principal
            <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#E4E7EC] px-3">
              <input
                name="primary_color"
                type="color"
                defaultValue={profile.primary_color}
                className="h-8 w-10 border-0 bg-transparent"
              />
              <span className="text-sm text-[#667085]">
                {profile.primary_color.toUpperCase()}
              </span>
            </div>
          </label>

          <label className="text-sm font-bold">
            Cor secundária
            <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#E4E7EC] px-3">
              <input
                name="secondary_color"
                type="color"
                defaultValue={profile.secondary_color}
                className="h-8 w-10 border-0 bg-transparent"
              />
              <span className="text-sm text-[#667085]">
                {profile.secondary_color.toUpperCase()}
              </span>
            </div>
          </label>
        </div>

        <div className="mt-4">
          <LogoUploader initialUrl={logoUrl} />
        </div>
      </Section>

      <Section
        title="Redes sociais"
        description="Só mostramos uma rede como conectada depois da autorização real."
      >
        {metaNotice ? (
          <div className="mb-4 rounded-xl border border-[#B2DDFF] bg-[#EFF8FF] p-4 text-sm font-semibold text-[#175CD3]">
            {metaNotice}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(networkLabels) as Array<keyof typeof networkLabels>).map(
            (provider) => {
              const connection = connectedByProvider.get(provider);
              const connected = Boolean(connection);

              return (
                <div
                  key={provider}
                  className="flex min-h-16 items-center justify-between gap-4 rounded-xl border border-[#E4E7EC] px-4"
                >
                  <div>
                    <strong>{networkLabels[provider]}</strong>
                    {connection?.display_name ? (
                      <div className="mt-1 text-xs text-[#667085]">
                        {connection.display_name}
                      </div>
                    ) : null}
                  </div>
                  <span
                    className={
                      connected
                        ? "text-sm font-bold text-[#067647]"
                        : "text-sm font-bold text-[#667085]"
                    }
                  >
                    {connected ? "Conectado" : "A conectar"}
                  </span>
                </div>
              );
            },
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/api/oauth/meta/start"
            className="app-button-primary inline-flex min-h-11 items-center justify-center"
          >
            {metaConnected ? "Reconectar Meta" : "Conectar Facebook e Instagram"}
          </Link>
          {metaConnected ? (
            <button
              type="submit"
              formAction={disconnectMeta}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D0D5DD] px-4 text-sm font-bold text-[#344054]"
            >
              Desconectar Meta
            </button>
          ) : null}
        </div>

        <p className="mt-3 text-xs leading-5 text-[#667085]">
          A conexão Meta permite escolher explicitamente a Página do Facebook.
          Se houver uma conta profissional do Instagram vinculada a essa Página,
          ela também será conectada.
        </p>
      </Section>

      <Section
        title="Preferências"
        description="Você pode manter tudo no automático e alterar apenas quando quiser."
      >
        <label className="flex min-h-16 items-center justify-between gap-5 rounded-xl border border-[#E4E7EC] p-4">
          <div>
            <div className="font-bold">Revisar antes de publicar</div>
            <div className="mt-1 text-sm text-[#667085]">
              Recomendado enquanto você conhece a plataforma.
            </div>
          </div>
          <input
            type="checkbox"
            name="review_before_publish"
            defaultChecked={profile.review_before_publish}
            className="h-5 w-5 accent-[#176B5B]"
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            name="default_cta"
            label="CTA padrão"
            defaultValue={profile.default_cta}
          />

          <label className="text-sm font-bold">
            Tom de comunicação
            <select
              name="communication_tone"
              className="app-input mt-2"
              defaultValue={profile.communication_tone}
            >
              <option value="professional">Profissional</option>
              <option value="friendly">Amigável</option>
              <option value="sophisticated">Sofisticado</option>
              <option value="direct">Direto</option>
            </select>
          </label>
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          className="app-button-primary inline-flex items-center gap-2"
        >
          <Save size={18} />
          Salvar configurações
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="app-card p-5 sm:p-6">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="mt-1 text-sm text-[#667085]">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        name={name}
        className="app-input mt-2"
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </label>
  );
}
