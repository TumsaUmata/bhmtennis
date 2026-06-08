"use client";

import { Trophy, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { useCurrentUser, isGuest } from "@/lib/current-user";
import { signOut } from "@/lib/supabase/auth";

const TOURNAMENT_SLUG = "2026-summer";

const desktopNavItems = [
  { href: "/", label: "Home", match: null, exact: true },
  { href: `/tournament/${TOURNAMENT_SLUG}/mens-singles`, label: "Tournament", match: "/tournament" },
  { href: "/league/rankings", label: "League", match: "/league" },
  { href: "/profile", label: "Profile", match: "/profile" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              BHM Tennis
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {desktopNavItems.map((item) => {
              const isActive = item.exact
                ? pathname === "/"
                : pathname.startsWith(item.match ?? item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {!isGuest(currentUser) && currentUser.isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isGuest(currentUser) ? (
            <Link href="/login">
              <Button size="sm" variant="outline">Sign in</Button>
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{currentUser.name}</span>
              <Button size="sm" variant="ghost" onClick={handleSignOut}>Sign out</Button>
            </div>
          )}
          <button
            className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-card">
          <nav className="mx-auto max-w-5xl flex flex-col px-4 py-2">
            {desktopNavItems.map((item) => {
              const isActive = item.exact
                ? pathname === "/"
                : pathname.startsWith(item.match ?? item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "px-3 py-2.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {!isGuest(currentUser) && currentUser.isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "px-3 py-2.5 rounded-md text-sm transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Admin
              </Link>
            )}
            {!isGuest(currentUser) && (
              <div className="mt-2 border-t pt-2">
                <div className="px-3 py-1.5 text-xs text-muted-foreground">{currentUser.name}</div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
