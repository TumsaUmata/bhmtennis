"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, UserRound, Handshake, ChevronRight, Calendar } from "lucide-react";
import { CategorySummary } from "@/lib/types";

interface CategoryCardProps {
  summary: CategorySummary;
  tournamentSlug: string;
}

const categoryIcons: Record<string, typeof Users> = {
  "mens-singles": Users,
  "womens-singles": UserRound,
  "mixed-doubles": Handshake,
};

const categoryDescriptions: Record<string, string> = {
  "mens-singles": "4 groups of 6 → Quarterfinals → Final",
  "womens-singles": "7 players round-robin → Final",
  "mixed-doubles": "6 teams round-robin → Final",
};

export function CategoryCard({ summary, tournamentSlug }: CategoryCardProps) {
  const { category, totalMatches, completedMatches, leaders } = summary;
  const Icon = categoryIcons[category.id] ?? Users;
  const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;
  const description = categoryDescriptions[category.id] ?? "";

  const deadlineDate = new Date(category.groupDeadline);
  const deadlineFormatted = deadlineDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <Link href={`/tournament/${tournamentSlug}/${category.slug}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{category.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {completedMatches} / {totalMatches} matches
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Group stage ends {deadlineFormatted}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Group Stage
            </Badge>
          </div>

          {leaders.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Current Leaders
              </p>
              <div className="space-y-1">
                {leaders.map((leader, i) => (
                  <div
                    key={leader.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">
                        {i + 1}.
                      </span>
                      {leader.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {leader.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
