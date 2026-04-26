import * as React from "react"
import {
  DITHER_ALGORITHM_OPTIONS,
  PRESET_PALETTES,
  type AutoTuneRecommendation,
} from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { SparklesIcon } from "lucide-react"

export type AutoTunePanelProps = {
  appliedRecommendationId: string | null
  error: string | null
  isLoading: boolean
  recommendations: AutoTuneRecommendation[]
  sourceAvailable: boolean
  onApplyRecommendation: (recommendation: AutoTuneRecommendation) => void
  onRunAutoTune: () => void
}

export const AutoTunePanel = React.memo(function AutoTunePanel({
  appliedRecommendationId,
  error,
  isLoading,
  recommendations,
  sourceAvailable,
  onApplyRecommendation,
  onRunAutoTune,
}: AutoTunePanelProps) {
  return (
    <Card className="min-h-0 gap-0 overflow-hidden border-primary/25 bg-[var(--surface-inspector)] py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <CardHeader className="gap-1 border-b border-border pb-2!">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <CardTitle>Auto-Tune</CardTitle>
            <p className="min-w-0 truncate font-mono text-[10px] leading-none text-muted-foreground uppercase">
              image-aware starting looks
            </p>
          </div>
          <Button
            type="button"
            size="default"
            className="h-8 shrink-0 px-3"
            disabled={!sourceAvailable || isLoading}
            onClick={onRunAutoTune}
          >
            <SparklesIcon data-icon="inline-start" />
            {isLoading ? "Scanning" : "Auto"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-2 pt-2">
        {!sourceAvailable && (
          <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            Load a Source Image to generate looks.
          </p>
        )}

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {sourceAvailable && recommendations.length === 0 && !error && (
          <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            Run Auto to rank clean, mono, ink, color, and texture looks.
          </p>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-1.5">
            {recommendations.map((recommendation) => (
              <RecommendationButton
                key={recommendation.id}
                applied={appliedRecommendationId === recommendation.id}
                recommendation={recommendation}
                onApplyRecommendation={onApplyRecommendation}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

function RecommendationButton({
  applied,
  recommendation,
  onApplyRecommendation,
}: {
  applied: boolean
  recommendation: AutoTuneRecommendation
  onApplyRecommendation: (recommendation: AutoTuneRecommendation) => void
}) {
  const settings = recommendation.snapshot.settings
  const algorithmLabel =
    DITHER_ALGORITHM_OPTIONS.find(
      (algorithm) => algorithm.id === settings.algorithm
    )?.label ?? settings.algorithm
  const paletteLabel = settings.customPalette?.length
    ? `Custom ${settings.customPalette.length}`
    : (PRESET_PALETTES.find((palette) => palette.id === settings.paletteId)
        ?.name ?? settings.paletteId)
  const tonalLabel =
    settings.preprocess.contrast > 16
      ? "High contrast"
      : settings.preprocess.contrast < 0
        ? "Soft contrast"
        : settings.preprocess.colorMode === "color-preserve"
          ? "Color"
          : "Mono"

  return (
    <button
      type="button"
      className="group w-full rounded-md border border-border bg-background/35 p-2 text-left transition-[background-color,border-color,transform] duration-200 ease-out hover:border-primary/35 hover:bg-background/65 active:translate-y-px data-[applied=true]:border-primary/55 data-[applied=true]:bg-primary/10"
      data-applied={applied}
      onClick={() => onApplyRecommendation(recommendation)}
    >
      <span className="flex min-w-0 items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-sm leading-tight font-medium">
            {recommendation.label}
          </span>
          <span className="mt-1 block text-xs leading-snug text-muted-foreground">
            {recommendation.intent}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {recommendation.recommended && (
            <span className="rounded-sm border border-primary/40 px-1.5 py-0.5 font-mono text-[9px] leading-none text-primary uppercase">
              Recommended
            </span>
          )}
          {applied && (
            <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[9px] leading-none text-muted-foreground uppercase">
              Applied
            </span>
          )}
        </span>
      </span>
      <span className="mt-2 flex flex-wrap gap-1">
        {[
          algorithmLabel,
          paletteLabel,
          settings.preprocess.colorMode,
          tonalLabel,
        ].map((chip) => (
          <span
            key={chip}
            className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground"
          >
            {chip}
          </span>
        ))}
      </span>
    </button>
  )
}
