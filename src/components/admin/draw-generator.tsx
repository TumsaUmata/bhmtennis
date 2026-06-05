"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getService } from "@/lib/services";

interface Props {
  categoryId: string;
  categoryName: string;
  registeredCount: number;
  hasExistingDraw: boolean;
}

interface GroupConfig {
  groupCount: number;
  groupSize: number;
}

function computeValidConfigs(count: number): GroupConfig[] {
  if (count < 3) return [];
  const configs: GroupConfig[] = [];
  for (let groupCount = 1; groupCount <= count; groupCount++) {
    if (count % groupCount !== 0) continue;
    const groupSize = count / groupCount;
    if (groupSize >= 3 && groupSize <= 10) {
      configs.push({ groupCount, groupSize });
    }
  }
  return configs;
}

type Step = "configure" | "done";

export function DrawGenerator({ categoryId, categoryName, registeredCount, hasExistingDraw }: Props) {
  const [step, setStep] = useState<Step>("configure");
  const [selectedConfig, setSelectedConfig] = useState<GroupConfig | null>(null);
  const [seeds, setSeeds] = useState<string[]>([]);
  const [players, setPlayers] = useState<{ playerId: string; playerName: string }[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const validConfigs = computeValidConfigs(registeredCount);

  const loadPlayers = useCallback(async () => {
    setLoadingPlayers(true);
    try {
      const regs = await getService().getRegistrations(categoryId);
      setPlayers(regs.filter((r) => r.status !== "withdrawn"));
    } finally {
      setLoadingPlayers(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const maxSeeds = selectedConfig?.groupCount ?? 0;

  function handleAddSeed() {
    if (seeds.length >= maxSeeds) return;
    setSeeds((prev) => [...prev, ""]);
  }

  function handleSeedChange(index: number, value: string) {
    setSeeds((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function handleRemoveSeed(index: number) {
    setSeeds((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    if (!selectedConfig) return;
    setError("");
    setGenerating(true);
    try {
      const seedPlayerIds = seeds.filter((s) => s !== "");
      await getService().generateDraw(categoryId, selectedConfig.groupCount, seedPlayerIds);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate draw.");
    } finally {
      setGenerating(false);
    }
  }

  function handleRegenerate() {
    setStep("configure");
    setSelectedConfig(null);
    setSeeds([]);
    setError("");
  }

  if (step === "done") {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Draw generated</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Groups are now visible on the tournament page.
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs mt-2 h-7 px-2"
                onClick={handleRegenerate}
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Draw Generator — {categoryName}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {registeredCount} players
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {validConfigs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cannot generate draw — invalid player count ({registeredCount}).
          </p>
        ) : (
          <>
            {hasExistingDraw && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This will replace the existing group draw.
                </p>
              </div>
            )}

            {/* Group config pills */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Select group configuration</p>
              <div className="flex flex-wrap gap-2">
                {validConfigs.map((cfg) => {
                  const isSelected =
                    selectedConfig?.groupCount === cfg.groupCount &&
                    selectedConfig?.groupSize === cfg.groupSize;
                  return (
                    <button
                      key={`${cfg.groupCount}-${cfg.groupSize}`}
                      onClick={() => {
                        setSelectedConfig(cfg);
                        setSeeds([]);
                      }}
                      className={[
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary border-primary/30 font-medium"
                          : "bg-background text-muted-foreground border-border hover:border-primary/30 hover:text-foreground",
                      ].join(" ")}
                    >
                      {cfg.groupCount} group{cfg.groupCount !== 1 ? "s" : ""} of {cfg.groupSize}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seeds section */}
            {selectedConfig && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Seeds <span className="text-muted-foreground/70 font-normal">(optional, max {maxSeeds})</span>
                  </p>
                  {seeds.length < maxSeeds && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs gap-1"
                      onClick={handleAddSeed}
                    >
                      <Plus className="h-3 w-3" />
                      Add seed
                    </Button>
                  )}
                </div>

                {seeds.length > 0 && (
                  <div className="space-y-1.5">
                    {seeds.map((seedId, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">
                          {idx + 1}.
                        </span>
                        {loadingPlayers ? (
                          <div className="h-7 flex-1 animate-pulse rounded bg-muted" />
                        ) : (
                          <select
                            value={seedId}
                            onChange={(e) => handleSeedChange(idx, e.target.value)}
                            className="h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="">— select player —</option>
                            {players
                              .filter(
                                (p) =>
                                  p.playerId === seedId ||
                                  !seeds.includes(p.playerId)
                              )
                              .map((p) => (
                                <option key={p.playerId} value={p.playerId}>
                                  {p.playerName}
                                </option>
                              ))}
                          </select>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveSeed(idx)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button
              size="sm"
              className="gap-1.5 text-xs"
              disabled={!selectedConfig || generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                "Generate Draw"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
