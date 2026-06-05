import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LeagueRulesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">League Rules</h1>
          <p className="text-sm text-muted-foreground">Rating system & how to play</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>The league runs in seasons. Within a season, players challenge each other at any time and results update ratings immediately.</p>
          <p>There is one open pool — everyone plays everyone. Divisions may be introduced as the community grows.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Rating System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">Points are transferred as a percentage of the loser's rating after each match.</p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-semibold">Scenario</th>
                  <th className="px-3 py-2 text-right font-semibold">Transfer</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-3 py-2 text-muted-foreground">Winner rated ≥ opponent</td>
                  <td className="px-3 py-2 text-right font-medium">3% of opponent's rating</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">Winner rated &lt; opponent</td>
                  <td className="px-3 py-2 text-right font-medium">5% of opponent's rating</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground text-xs">Example: A (800) beats B (1000) → A takes 5% of 1000 = 50 pts → A: 850, B: 950</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Starting Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-semibold">Skill Level</th>
                  <th className="px-3 py-2 text-right font-semibold">Starting Rating</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Advanced", rating: 1200 },
                  { label: "Intermediate", rating: 1000 },
                  { label: "Improver", rating: 800 },
                  { label: "Beginner", rating: 600 },
                ].map(({ label, rating }, i, arr) => (
                  <tr key={label} className={i < arr.length - 1 ? "border-b" : ""}>
                    <td className="px-3 py-2 text-muted-foreground">{label}</td>
                    <td className="px-3 py-2 text-right font-medium">{rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Rating floor: 400 — ratings never drop below this.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Seasons</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Admin opens and closes seasons. At season end, final standings are published.</p>
          <p>Ratings may carry over or reset at the start of a new season — admin decides per season.</p>
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">Rating floor: 400</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
