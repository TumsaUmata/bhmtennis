import type { ReactNode } from "react";
import { LeagueSubNav } from "@/components/layout/league-sub-nav";

export default function LeagueLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <LeagueSubNav />
      {children}
    </div>
  );
}
