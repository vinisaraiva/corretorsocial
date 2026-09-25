type MetaGraphError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

type MetaIdResponse = {
  id?: string;
  post_id?: string;
};

function graphVersion() {
  const configured = process.env.META_GRAPH_VERSION?.trim();
  return configured && /^v\d+\.\d+$/.test(configured)
    ? configured
    : "v26.0";
}

async function parseMetaResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as T & MetaGraphError;

  if (!response.ok || payload.error) {
    const error = payload.error;
    const code = error?.code ? ` (#${error.code})` : "";
    const message = error?.message?.trim() || "Meta API request failed";
    throw new Error(`${message}${code}`);
  }

  return payload as T;
}

async function graphPost<T>(
  path: string,
  accessToken: string,
  params: Record<string, string>,
) {
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion()}/${path}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    },
  );

  return parseMetaResponse<T>(response);
}

async function graphGet<T>(
  path: string,
  accessToken: string,
  params: Record<string, string>,
) {
  const url = new URL(
    `https://graph.facebook.com/${graphVersion()}/${path}`,
  );

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  return parseMetaResponse<T>(response);
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function waitForInstagramContainer(
  containerId: string,
  accessToken: string,
) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const status = await graphGet<{
      status_code?: string;
      status?: string;
    }>(containerId, accessToken, {
      fields: "status_code,status",
    });

    if (
      status.status_code === "FINISHED" ||
      status.status_code === "PUBLISHED"
    ) {
      return;
    }

    if (
      status.status_code === "ERROR" ||
      status.status_code === "EXPIRED"
    ) {
      throw new Error(
        status.status || `Instagram container ${status.status_code.toLowerCase()}`,
      );
    }

    await sleep(1500);
  }

  throw new Error("Instagram media processing timed out");
}

export async function publishFacebookPhoto(input: {
  pageId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}) {
  const result = await graphPost<MetaIdResponse>(
    `${input.pageId}/photos`,
    input.accessToken,
    {
      url: input.imageUrl,
      caption: input.caption,
      published: "true",
    },
  );

  const externalId = result.post_id || result.id;

  if (!externalId) {
    throw new Error("Facebook did not return the published photo id");
  }

  return { externalId };
}

async function publishInstagramContainer(input: {
  instagramAccountId: string;
  accessToken: string;
  params: Record<string, string>;
}) {
  const container = await graphPost<MetaIdResponse>(
    `${input.instagramAccountId}/media`,
    input.accessToken,
    input.params,
  );

  if (!container.id) {
    throw new Error("Instagram did not return a media container id");
  }

  await waitForInstagramContainer(container.id, input.accessToken);

  const published = await graphPost<MetaIdResponse>(
    `${input.instagramAccountId}/media_publish`,
    input.accessToken,
    {
      creation_id: container.id,
    },
  );

  if (!published.id) {
    throw new Error("Instagram did not return the published media id");
  }

  return { externalId: published.id };
}

export function publishInstagramImage(input: {
  instagramAccountId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}) {
  return publishInstagramContainer({
    instagramAccountId: input.instagramAccountId,
    accessToken: input.accessToken,
    params: {
      image_url: input.imageUrl,
      caption: input.caption,
    },
  });
}

export function publishInstagramStory(input: {
  instagramAccountId: string;
  accessToken: string;
  imageUrl: string;
}) {
  return publishInstagramContainer({
    instagramAccountId: input.instagramAccountId,
    accessToken: input.accessToken,
    params: {
      media_type: "STORIES",
      image_url: input.imageUrl,
    },
  });
}

export async function publishInstagramCarousel(input: {
  instagramAccountId: string;
  accessToken: string;
  imageUrls: string[];
  caption: string;
}) {
  if (input.imageUrls.length < 2 || input.imageUrls.length > 10) {
    throw new Error("Instagram carousel must contain between 2 and 10 items");
  }

  const childIds: string[] = [];

  for (const imageUrl of input.imageUrls) {
    const child = await graphPost<MetaIdResponse>(
      `${input.instagramAccountId}/media`,
      input.accessToken,
      {
        image_url: imageUrl,
        is_carousel_item: "true",
      },
    );

    if (!child.id) {
      throw new Error("Instagram did not return a carousel item id");
    }

    await waitForInstagramContainer(child.id, input.accessToken);
    childIds.push(child.id);
  }

  return publishInstagramContainer({
    instagramAccountId: input.instagramAccountId,
    accessToken: input.accessToken,
    params: {
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption: input.caption,
    },
  });
}
