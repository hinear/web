import { buildMcpProtectedResourceMetadata } from "@/features/mcp/lib/oauth";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json(
    buildMcpProtectedResourceMetadata(await getRequestOrigin())
  );
}
