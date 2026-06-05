import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RulesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tournament Rules</h1>
          <p className="text-sm text-muted-foreground">Blackhorse Mills Tennis Tournament 2026</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Players</th>
                  <th className="pb-2 pr-4 font-medium">Format</th>
                  <th className="pb-2 font-medium">Advancement</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Men&apos;s Singles</td>
                  <td className="py-2 pr-4">24 (4 groups of 6)</td>
                  <td className="py-2 pr-4">Round-robin within groups</td>
                  <td className="py-2">Top 2 per group &rarr; QF &rarr; SF &rarr; Final</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Women&apos;s Singles</td>
                  <td className="py-2 pr-4">7 (1 group)</td>
                  <td className="py-2 pr-4">Full round-robin</td>
                  <td className="py-2">Top 2 &rarr; Final</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Mixed Doubles</td>
                  <td className="py-2 pr-4">6 teams (1 group)</td>
                  <td className="py-2 pr-4">Full round-robin</td>
                  <td className="py-2">Top 2 &rarr; Final</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Match Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-1">
            <p className="font-medium">Default: 2 sets</p>
            <p className="text-muted-foreground">
              If players split sets 1-1, a deciding tiebreak (first to 10, win by 2) determines the winner.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">Optional: 3rd set</p>
            <p className="text-muted-foreground">
              Players can mutually agree to play a full third set instead of the tiebreak.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">Set scoring</p>
            <p className="text-muted-foreground">
              Standard tennis scoring. Valid set scores: 6-0, 6-1, 6-2, 6-3, 6-4, 7-5, 7-6 (tiebreak at 6-6).
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">Incomplete matches</p>
            <p className="text-muted-foreground">
              If court time runs out, players can save the match as incomplete and finish it another time.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Scoring & Rankings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Result</th>
                  <th className="pb-2 pr-4 font-medium">Points</th>
                  <th className="pb-2 font-medium">Sets Recorded</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4">Win in straight sets (2-0)</td>
                  <td className="py-2 pr-4 font-semibold text-primary">1</td>
                  <td className="py-2">Winner +2, Loser +0</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Win via tiebreak or 3rd set (2-1)</td>
                  <td className="py-2 pr-4 font-semibold text-primary">1</td>
                  <td className="py-2">Winner +2, Loser +1</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Loss (0-2 or 1-2)</td>
                  <td className="py-2 pr-4">0</td>
                  <td className="py-2">As above (reversed)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Walkover / No-show</td>
                  <td className="py-2 pr-4">0</td>
                  <td className="py-2">Opponent gets 1 pt + 2 sets</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-1 pt-2">
            <p className="font-medium">Tiebreaker order (when tied on points)</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-0.5">
              <li>Head-to-head result</li>
              <li>Set difference (sets won - sets lost)</li>
              <li>Game difference (games won - games lost)</li>
              <li>Organizer decision</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Knockout Seeding (Men&apos;s)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Top Half</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">QF1</Badge>
                  <span>1st Group A vs 2nd Group D</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">QF2</Badge>
                  <span>1st Group B vs 2nd Group C</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Bottom Half</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">QF3</Badge>
                  <span>1st Group C vs 2nd Group B</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">QF4</Badge>
                  <span>1st Group D vs 2nd Group A</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Deadlines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Group Stage</th>
                  <th className="pb-2 pr-4 font-medium">QF</th>
                  <th className="pb-2 pr-4 font-medium">SF</th>
                  <th className="pb-2 font-medium">Final</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Men&apos;s Singles</td>
                  <td className="py-2 pr-4">12 Jul</td>
                  <td className="py-2 pr-4">19 Jul</td>
                  <td className="py-2 pr-4">26 Jul</td>
                  <td className="py-2">3 Aug</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Women&apos;s Singles</td>
                  <td className="py-2 pr-4">27 Jul</td>
                  <td className="py-2 pr-4">—</td>
                  <td className="py-2 pr-4">—</td>
                  <td className="py-2">3 Aug</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Mixed Doubles</td>
                  <td className="py-2 pr-4">27 Jul</td>
                  <td className="py-2 pr-4">—</td>
                  <td className="py-2 pr-4">—</td>
                  <td className="py-2">3 Aug</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Deadlines are tentative and subject to change by the organizers. Players can rearrange match times as long as it doesn&apos;t affect the tournament timeline.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Walkovers & Missed Deadlines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>If a match is not played by the deadline, the opponent wins by walkover.</p>
          <p>Players can discuss and rearrange timing with each other as long as it doesn&apos;t affect the overall tournament timeline.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Match Results</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>Either player can submit the match result. The result is accepted immediately (trust-based).</p>
          <p>The opponent or an admin can dispute or correct the result if there&apos;s a mistake.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Mixed Doubles</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>Doubles pairs are fixed for the entire tournament.</p>
          <p>One person registers the pair. Both players can view and submit results.</p>
        </CardContent>
      </Card>
    </div>
  );
}
