"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Medal, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TOURNAMENT_SLUG = "2026-summer";

const navItems = [
  { href: "/", label: "Home", icon: Home, match: "/", exact: true },
  { href: `/tournament/${TOURNAMENT_SLUG}/mens-singles`, label: "Tournament", icon: Trophy, match: "/tournament" },
  { href: "/league/rankings", label: "League", icon: Medal, match: "/league" },
  { href: "/profile", label: "Profile", icon: User, match: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === "/"
            : pathname.startsWith(item.match);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 text-[10px] transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
