"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  applyCampaignRenderState,
  buildCampaignVariantRows,
  renderedPathsFromVariant,
  type CampaignDraftInput,
} from "@/lib/campaign-persistence";
import {
  buildSocialPublishJobPayload,
  supportedPublishProviders,
} from "@/lib/publication-plan";

export type { CampaignDraftInput } from "@/lib/campaign-persistence";

function whatsappReadyForTracking(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";

  return (
    digits.length === 10 ||
    digits.length === 11 ||
    (digits.length >= 12 && digits.length <= 15)
  );
}

function campaignGenerationMetadata(input: CampaignDraftInput) {
  return {
    source: "deterministic_preview_v0_2",
    template_id: input.visualStyle,
    subheadline: input.subheadline.trim(),
    publish_providers: supportedPublishProviders(input.publishProviders ?? []),
  };
}

async function persistCampaign(input: CampaignDraftInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: property }, { data: profile }] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id,title,purpose,price,public_location,city,bedrooms,suites,bathrooms,parking,area_m2,highlights,description",
      )
      .eq("id", input.propertyId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("professional_name,logo_path,primary_color")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!property) {
    throw new Error("O imóvel não pertence a esta conta.");
  }

  const requestedMediaIds = Array.from(
    new Set(
      [
        input.mediaSelection.instagramFeed,
        input.mediaSelection.instagramStory,
        input.mediaSelection.facebook,
        input.mediaSelection.tiktok,
        input.mediaSelection.google,
        ...input.mediaSelection.carousel,
      ].filter((id): id is string => Boolean(id)),
    ),
  );

  const validMediaIds = new Set<string>();

  if (requestedMediaIds.length > 0) {
    const { data: mediaRows, error: mediaError } = await supabase
      .from("property_media")
      .select("id")
      .eq("property_id", property.id)
      .in("id", requestedMediaIds);

    if (mediaError) {
      throw new Error("Não foi possível validar as fotos da campanha.");
    }

    mediaRows?.forEach((row) => validMediaIds.add(row.id));
  }

  let campaignId = input.campaignId;

  if (campaignId) {
    const { data: existing } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      throw new Error("Campanha não encontrada.");
    }

    const { error } = await supabase
      .from("campaigns")
      .update({
        visual_style: input.visualStyle,
        marketing_angle: input.headline,
        generation_metadata: campaignGenerationMetadata(input),
      })
      .eq("id", campaignId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error("Não foi possível atualizar a campanha.");
    }
  } else {
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        property_id: input.propertyId,
        visual_style: input.visualStyle,
        marketing_angle: input.headline,
        status: "ready",
        generation_metadata: campaignGenerationMetadata(input),
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("Não foi possível salvar a campanha.");
    }

    campaignId = data.id;
  }

  const variantRows = buildCampaignVariantRows(
    input,
    campaignId!,
    validMediaIds,
  );

  const { data: existingVariants, error: existingVariantsError } =
    await supabase
      .from("campaign_variants")
      .select("provider,format,render_metadata,rendered_asset_path")
      .eq("campaign_id", campaignId!);

  if (existingVariantsError) {
    throw new Error("Não foi possível verificar as versões atuais da campanha.");
  }

  const renderContext = {
    property: {
      title: property.title,
      purpose: property.purpose,
      price: property.price,
      public_location: property.public_location,
      city: property.city,
      bedrooms: property.bedrooms,
      suites: property.suites,
      bathrooms: property.bathrooms,
      parking: property.parking,
      area_m2: property.area_m2,
      highlights: property.highlights,
      description: property.description,
    },
    brand: {
      professional_name: profile?.professional_name ?? null,
      logo_path: profile?.logo_path ?? null,
      primary_color: profile?.primary_color ?? null,
    },
  };

  const { rowsWithRenderState, stalePaths } = applyCampaignRenderState({
    variantRows,
    existingVariants: existingVariants ?? [],
    renderContext,
    userId: user.id,
  });

  const { error: variantsError } = await supabase
    .from("campaign_variants")
    .upsert(rowsWithRenderState, {
      onConflict: "campaign_id,provider,format",
    });

  if (variantsError) {
    throw new Error("A campanha foi criada, mas não conseguimos salvar suas versões.");
  }

  if (stalePaths.size > 0) {
    const { error: cleanupError } = await supabase.storage
      .from("campaign-assets")
      .remove(Array.from(stalePaths));

    if (cleanupError) {
      console.error("Could not remove stale rendered campaign assets", cleanupError);
    }
  }

  return campaignId;
}

export async function ensureCampaignVariant(
  input: CampaignDraftInput,
  provider: "instagram" | "facebook" | "google_business",
  format: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (input.campaignId) {
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", input.campaignId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (campaign) {
      const { data: variant } = await supabase
        .from("campaign_variants")
        .select("id")
        .eq("campaign_id", campaign.id)
        .eq("provider", provider)
        .eq("format", format)
        .maybeSingle();

      if (variant) {
        return campaign.id;
      }
    }
  }

  return persistCampaign(input);
}

export async function getCampaignRenderRequirements(campaignId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!campaign) {
    throw new Error("Campanha não encontrada.");
  }

  const { data: rows, error } = await supabase
    .from("campaign_variants")
    .select("provider,format,rendered_asset_path")
    .eq("campaign_id", campaign.id);

  if (error) {
    throw new Error("Não foi possível verificar os arquivos da campanha.");
  }

  return (rows ?? [])
    .filter(
      (variant) =>
        (!variant.rendered_asset_path ||
          !variant.rendered_asset_path.toLowerCase().endsWith(".jpg")) &&
        !(
          variant.provider === "tiktok" &&
          variant.format === "vertical_video"
        ),
    )
    .map((variant) => ({
      provider: variant.provider,
      format: variant.format,
    }));
}

export async function validateCampaignScheduleTime(
  scheduledFor: string,
) {
  const date = new Date(scheduledFor);
  const now = Date.now();
  const minimumScheduleAt = now + 2 * 60 * 1000;

  if (Number.isNaN(date.getTime())) {
    return {
      ok: false as const,
      message: "Escolha uma data e horário válidos.",
    };
  }

  if (date.getTime() < minimumScheduleAt) {
    return {
      ok: false as const,
      message:
        "Escolha um horário com pelo menos 2 minutos de antecedência para prepararmos os arquivos finais.",
    };
  }

  return {
    ok: true as const,
    scheduledFor: date.toISOString(),
  };
}

export async function saveCampaignDraft(input: CampaignDraftInput) {
  return persistCampaign(input);
}

export async function getCampaignPublicationState(campaignId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("status,published_at")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !campaign) {
    throw new Error("Campanha não encontrada.");
  }

  return campaign;
}

export async function publishCampaignNow(input: CampaignDraftInput) {
  const publishProviders = supportedPublishProviders(
    input.publishProviders ?? [],
  );

  if (publishProviders.length === 0) {
    return {
      ok: false as const,
      message: "Selecione pelo menos uma rede conectada para publicar.",
    };
  }

  const campaignId = await persistCampaign(input);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id,status")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (campaignError || !campaign) {
    throw new Error("Campanha não encontrada.");
  }

  if (campaign.status === "publishing") {
    return {
      ok: false as const,
      message: "Esta campanha já está sendo publicada.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("whatsapp")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!whatsappReadyForTracking(profile?.whatsapp)) {
    return {
      ok: false as const,
      message:
        "Cadastre seu WhatsApp em Configurações antes de publicar. Ele será usado no link rastreável da campanha.",
    };
  }

  const { data: connections, error: connectionsError } = await supabase
    .from("social_connections")
    .select("provider,token_secret_ref")
    .eq("user_id", user.id)
    .eq("status", "connected")
    .in("provider", publishProviders);

  if (connectionsError) {
    throw new Error("Não foi possível validar as redes conectadas.");
  }

  const connectedProviders = new Set(
    (connections ?? [])
      .filter((connection) => Boolean(connection.token_secret_ref))
      .map((connection) => connection.provider),
  );

  if (
    publishProviders.some((provider) => !connectedProviders.has(provider))
  ) {
    return {
      ok: false as const,
      message:
        "Uma das redes selecionadas não está mais conectada. Revise as conexões antes de publicar.",
    };
  }

  const queuedAt = new Date().toISOString();

  const { error: statusError } = await supabase
    .from("campaigns")
    .update({
      status: "publishing",
      scheduled_for: null,
      generation_metadata: campaignGenerationMetadata({
        ...input,
        publishProviders,
      }),
    })
    .eq("id", campaignId)
    .eq("user_id", user.id);

  if (statusError) {
    throw new Error("Não foi possível iniciar a publicação.");
  }

  const { error: jobError } = await supabase.from("jobs").insert({
    user_id: user.id,
    type: "social_publish",
    priority: 20,
    run_after: queuedAt,
    max_attempts: 3,
    payload: buildSocialPublishJobPayload({
      campaignId,
      scheduledFor: queuedAt,
      providers: publishProviders,
      mode: "immediate",
    }),
  });

  if (jobError) {
    await supabase
      .from("campaigns")
      .update({ status: "ready" })
      .eq("id", campaignId)
      .eq("user_id", user.id);

    throw new Error(
      "Não foi possível colocar a publicação na fila. Tente novamente.",
    );
  }

  return {
    ok: true as const,
    campaignId,
    queuedProviders: publishProviders,
  };
}


export async function scheduleCampaignDraft(
  input: CampaignDraftInput,
  scheduledFor: string,
) {
  const date = new Date(scheduledFor);

  if (Number.isNaN(date.getTime())) {
    return {
      ok: false as const,
      message: "Escolha uma data e horário válidos.",
    };
  }

  if (date.getTime() <= Date.now()) {
    return {
      ok: false as const,
      message:
        "O horário escolhido passou enquanto preparávamos os arquivos. Escolha um novo horário.",
    };
  }

  const campaignId = await persistCampaign(input);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (date.getTime() <= Date.now()) {
    return {
      ok: false as const,
      message:
        "O horário escolhido passou enquanto preparávamos os arquivos. Escolha um novo horário.",
    };
  }

  const publishProviders = supportedPublishProviders(
    input.publishProviders ?? [],
  );

  if (publishProviders.length > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("whatsapp")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!whatsappReadyForTracking(profile?.whatsapp)) {
      return {
        ok: false as const,
        message:
          "Cadastre seu WhatsApp em Configurações antes de agendar publicação automática.",
      };
    }

    const { data: connections, error: connectionsError } = await supabase
      .from("social_connections")
      .select("provider,token_secret_ref")
      .eq("user_id", user.id)
      .eq("status", "connected")
      .in("provider", publishProviders);

    if (connectionsError) {
      throw new Error("Não foi possível validar as redes conectadas.");
    }

    const connectedProviders = new Set(
      (connections ?? [])
        .filter((connection) => Boolean(connection.token_secret_ref))
        .map((connection) => connection.provider),
    );

    const missingProviders = publishProviders.filter(
      (provider) => !connectedProviders.has(provider),
    );

    if (missingProviders.length > 0) {
      return {
        ok: false as const,
        message:
          "Uma das redes selecionadas não está mais conectada. Revise as conexões antes de agendar.",
      };
    }
  }

  const scheduledIso = date.toISOString();
  const { error } = await supabase
    .from("campaigns")
    .update({
      status: "scheduled",
      scheduled_for: scheduledIso,
      generation_metadata: campaignGenerationMetadata({
        ...input,
        publishProviders,
      }),
    })
    .eq("id", campaignId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Não foi possível agendar a campanha.");
  }

  if (publishProviders.length > 0) {
    const { error: jobError } = await supabase.from("jobs").insert({
      user_id: user.id,
      type: "social_publish",
      priority: 40,
      run_after: scheduledIso,
      max_attempts: 3,
      payload: buildSocialPublishJobPayload({
        campaignId,
        scheduledFor: scheduledIso,
        providers: publishProviders,
      }),
    });

    if (jobError) {
      await supabase
        .from("campaigns")
        .update({
          status: "ready",
          scheduled_for: null,
        })
        .eq("id", campaignId)
        .eq("user_id", user.id);

      throw new Error(
        "Não foi possível colocar a publicação na fila. O agendamento foi cancelado.",
      );
    }
  }

  return {
    ok: true as const,
    campaignId,
    queuedProviders: publishProviders,
  };
}


export async function deleteCampaign(campaignId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: campaign, error: readError } = await supabase
    .from("campaigns")
    .select("id,status")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError || !campaign) {
    throw new Error("Campanha não encontrada.");
  }

  if (campaign.status === "publishing") {
    throw new Error(
      "A campanha está sendo publicada. Aguarde a conclusão antes de excluí-la.",
    );
  }

  const { data: renderedVariants } = await supabase
    .from("campaign_variants")
    .select("rendered_asset_path,render_metadata")
    .eq("campaign_id", campaign.id);

  const renderedPaths = Array.from(
    new Set(
      (renderedVariants ?? []).flatMap((variant) =>
        renderedPathsFromVariant(variant),
      ),
    ),
  ).filter((path) => path.startsWith(`${user.id}/`));

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaign.id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Não foi possível excluir a campanha.");
  }

  if (renderedPaths.length > 0) {
    const { error: assetError } = await supabase.storage
      .from("campaign-assets")
      .remove(renderedPaths);

    if (assetError) {
      console.error(
        "Campaign deleted but rendered assets could not be removed",
        assetError,
      );
    }
  }

  revalidatePath("/campanhas");
  revalidatePath("/imoveis");

  return { deleted: true };
}


export async function registerRenderedAssets(input: {
  campaignId: string;
  provider: "instagram" | "facebook" | "google_business";
  format: string;
  paths: string[];
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const uniquePaths = Array.from(new Set(input.paths)).filter((path) =>
    path.startsWith(`${user.id}/`),
  );

  if (uniquePaths.length === 0) {
    throw new Error("Nenhum arquivo renderizado válido foi informado.");
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", input.campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!campaign) {
    throw new Error("Campanha não encontrada.");
  }

  const { data: variant, error: variantError } = await supabase
    .from("campaign_variants")
    .select("id,render_metadata,rendered_asset_path")
    .eq("campaign_id", campaign.id)
    .eq("provider", input.provider)
    .eq("format", input.format)
    .maybeSingle();

  if (variantError || !variant) {
    throw new Error("Versão da campanha não encontrada para esta mídia.");
  }

  const metadata =
    variant.render_metadata &&
    typeof variant.render_metadata === "object" &&
    !Array.isArray(variant.render_metadata)
      ? { ...variant.render_metadata }
      : {};

  const expectedSlideCount =
    input.format === "carousel_4x5" &&
    typeof (metadata as Record<string, unknown>).slide_count === "number"
      ? Number((metadata as Record<string, unknown>).slide_count)
      : 1;

  if (uniquePaths.length !== expectedSlideCount) {
    throw new Error(
      input.format === "carousel_4x5"
        ? `O carrossel esperava ${expectedSlideCount} páginas, mas foram geradas ${uniquePaths.length}.`
        : "A arte final não foi gerada corretamente.",
    );
  }

  const previousPaths = Array.isArray(
    (metadata as Record<string, unknown>).rendered_asset_paths,
  )
    ? ((metadata as Record<string, unknown>).rendered_asset_paths as unknown[])
        .filter((path): path is string => typeof path === "string")
    : variant.rendered_asset_path
      ? [variant.rendered_asset_path]
      : [];

  const { error: updateError } = await supabase
    .from("campaign_variants")
    .update({
      rendered_asset_path: uniquePaths[0],
      render_metadata: {
        ...metadata,
        rendered_asset_paths: uniquePaths,
        rendered_at: new Date().toISOString(),
        render_source: "client_dom_v0_1",
      },
    })
    .eq("id", variant.id);

  if (updateError) {
    throw new Error("Não foi possível registrar os arquivos renderizados.");
  }

  const obsoletePaths = previousPaths.filter(
    (path) =>
      path.startsWith(`${user.id}/`) && !uniquePaths.includes(path),
  );

  if (obsoletePaths.length > 0) {
    const { error: cleanupError } = await supabase.storage
      .from("campaign-assets")
      .remove(obsoletePaths);

    if (cleanupError) {
      console.error(
        "Rendered assets were updated but old files could not be removed",
        cleanupError,
      );
    }
  }

  revalidatePath(`/campanhas/${campaign.id}`);
  revalidatePath("/campanhas");

  return {
    renderedAssetPath: uniquePaths[0],
    renderedAssetPaths: uniquePaths,
  };
}
