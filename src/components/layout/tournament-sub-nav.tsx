"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = (slug: string) => [
  { href: `/tournament/${slug}/mens-singles`, label: "Men's Singles" },
  { href: `/tournament/${slug}/womens-singles`, label: "Women's" },
  { href: `/tournament/${slug}/mixed-doubles`, label: "Doubles" },
  { href: `/tournament/${slug}/rules`, label: "Rules" },
];

export function TournamentSubNav({ slug, shortName }: { slug: string; shortName?: string }) {
  const pathname = usePathname();

  return (
    <div className="space-y-2">
      {shortName && (
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{shortName}</p>
      )}
      <nav className="flex gap-1 overflow-x-auto pb-0.5">
        {items(slug).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors",
              pathname.startsWith(item.href)
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
