import type { ReactNode } from "react";
import { TournamentSubNav } from "@/components/layout/tournament-sub-nav";

export default async function TournamentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="space-y-4">
      <TournamentSubNav slug={slug} />
      {children}
    </div>
  );
}
