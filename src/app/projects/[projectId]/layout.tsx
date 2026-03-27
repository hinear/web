import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { buildAuthPath } from "@/features/auth/lib/next-path";
import { ProjectModalProvider } from "@/features/projects/components/project-modal-provider";
import { QueryClientProvider } from "@/lib/react-query/query-provider";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  // Check auth once at layout level
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  // Only check auth for protected routes (not auth page itself)
  if (!pathname.startsWith("/auth")) {
    const actorId = await getAuthenticatedActorIdOrNull();
    if (!actorId) {
      redirect(buildAuthPath(pathname));
    }
  }

  const { projectId } = await params;

  return (
    <QueryClientProvider>
      {children}
      <ProjectModalProvider projectId={projectId} />
    </QueryClientProvider>
  );
}
