import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  // Only strip trailing slash from non-root paths
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    const cleaned = url.pathname.slice(0, -1) + url.search;
    return new Response(null, {
      status: 301,
      headers: { Location: cleaned },
    });
  }

  // context.deploy.context is "production" | "deploy-preview" | "branch-deploy"
  // (the runtime-correct way to detect context inside an edge function —
  // Netlify.env.get('CONTEXT') is a build-time var only).
  //
  // Fail-safe pattern: only intercept on KNOWN staging contexts. If the
  // context is anything unexpected (including undefined), assume production
  // and let the CDN serve directly — never risk indexing production.
  const deployContext = context.deploy?.context;
  if (deployContext !== "branch-deploy" && deployContext !== "deploy-preview") return;

  // Staging: inject X-Robots-Tag so Google doesn't index staging URLs.
  const response = await context.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
};

export const config = { path: "/*" };
