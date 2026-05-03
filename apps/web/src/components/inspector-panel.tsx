import * as React from "react"
import {
  PRESET_PALETTES,
  type AutoTuneRecommendation,
  type EditorSettings,
} from "@workspace/core"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { AutoTunePanel } from "@/components/auto-tune-panel"
import { StackTab } from "@/components/stack-tab"
import type { LookRecipe } from "@/lib/look-recipes"
import type { SettingsTransition } from "@/lib/editor-settings-transition"

type InspectorPanelProps = {
  advancedOpen: boolean
  appliedRecommendationId: string | null
  autoTuneError: string | null
  autoTuneLoading: boolean
  autoTuneRecommendations: AutoTuneRecommendation[]
  settings: EditorSettings
  lookRecipeId: string
  lookRecipes: readonly LookRecipe[]
  sourceAvailable: boolean
  sourceWidth?: number
  onAdvancedOpenChange: (open: boolean) => void
  onApplyAutoTuneRecommendation: (
    recommendation: AutoTuneRecommendation
  ) => void
  onCopyLook: () => void
  onCopyPaletteJson: () => void
  onCopySettings: () => void
  onExportPaletteGpl: () => void
  onExportPaletteJson: () => void
  onExtractPalette: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFile: (file: File) => void
  onImportPaletteFromClipboard: () => void
  onDeleteLookRecipe: (id: string) => void
  onRenameLookRecipe: (id: string, name: string) => void
  onSaveLookRecipe: (name: string) => void
  onSelectLookRecipe: (id: string) => void
  onPasteLook: () => void
  onPasteSettings: () => void
  onResolutionWidthChange: (width: number) => void
  onReset: () => void
  onSettingsTransition: (transition: SettingsTransition) => void
  resolutionAspectLabel: string
}

export const InspectorPanel = React.memo(function InspectorPanel({
  advancedOpen,
  appliedRecommendationId,
  autoTuneError,
  autoTuneLoading,
  autoTuneRecommendations,
  settings,
  lookRecipeId,
  lookRecipes,
  sourceAvailable,
  sourceWidth,
  onAdvancedOpenChange,
  onApplyAutoTuneRecommendation,
  onCopyLook,
  onCopyPaletteJson,
  onCopySettings,
  onExportPaletteGpl,
  onExportPaletteJson,
  onExtractPalette,
  onImportPaletteFile,
  onImportPaletteFromClipboard,
  onDeleteLookRecipe,
  onRenameLookRecipe,
  onSaveLookRecipe,
  onSelectLookRecipe,
  onPasteLook,
  onPasteSettings,
  onResolutionWidthChange,
  onReset,
  onSettingsTransition,
  resolutionAspectLabel,
}: InspectorPanelProps) {
  const activePreset = PRESET_PALETTES.find(
    (palette) => palette.id === settings.paletteId
  )
  const activePaletteColors =
    settings.customPalette ??
    activePreset?.colors.map((color) => color.hex) ??
    PRESET_PALETTES[0].colors.map((color) => color.hex)
  const paletteSelectValue = settings.customPalette?.length
    ? "custom"
    : settings.paletteId
  return (
    <aside className="h-full max-h-full min-h-0 min-w-0 overflow-hidden">
      <Card className="flex h-full min-h-0 min-w-0 gap-0 overflow-hidden border-border bg-[var(--surface-inspector)] py-0">
        <Tabs defaultValue="looks" className="h-full min-h-0 min-w-0 gap-0">
          <CardHeader className="shrink-0 px-2 pt-2 pb-0">
            <TabsList className="grid w-full grid-cols-2" variant="line">
              <TabsTrigger value="looks">Looks</TabsTrigger>
              <TabsTrigger value="stack">Stack</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="min-h-0 min-w-0 flex-1 basis-0 overflow-hidden px-0 py-0">
            <InspectorTab value="looks">
              <AutoTunePanel
                appliedRecommendationId={appliedRecommendationId}
                error={autoTuneError}
                isLoading={autoTuneLoading}
                recommendations={autoTuneRecommendations}
                sourceAvailable={sourceAvailable}
                onApplyRecommendation={onApplyAutoTuneRecommendation}
              />
            </InspectorTab>
            <InspectorTab value="stack">
              <StackTab
                activePaletteColors={activePaletteColors}
                advancedOpen={advancedOpen}
                lookRecipeId={lookRecipeId}
                lookRecipes={lookRecipes}
                paletteSelectValue={paletteSelectValue}
                resolutionAspectLabel={resolutionAspectLabel}
                settings={settings}
                sourceWidth={sourceWidth}
                onAdvancedOpenChange={onAdvancedOpenChange}
                onCopyLook={onCopyLook}
                onCopyPaletteJson={onCopyPaletteJson}
                onCopySettings={onCopySettings}
                onDeleteLookRecipe={onDeleteLookRecipe}
                onExportPaletteGpl={onExportPaletteGpl}
                onExportPaletteJson={onExportPaletteJson}
                onExtractPalette={onExtractPalette}
                onImportPaletteFile={onImportPaletteFile}
                onImportPaletteFromClipboard={onImportPaletteFromClipboard}
                onPasteLook={onPasteLook}
                onPasteSettings={onPasteSettings}
                onRenameLookRecipe={onRenameLookRecipe}
                onReset={onReset}
                onResolutionWidthChange={onResolutionWidthChange}
                onSaveLookRecipe={onSaveLookRecipe}
                onSelectLookRecipe={onSelectLookRecipe}
                onSettingsTransition={onSettingsTransition}
              />
            </InspectorTab>
          </CardContent>
        </Tabs>
      </Card>
    </aside>
  )
})

function InspectorTab({
  children,
  value,
}: {
  children: React.ReactNode
  value: string
}) {
  return (
    <TabsContent
      value={value}
      forceMount
      className="h-full min-h-0 overflow-hidden data-[state=inactive]:hidden"
    >
      <ScrollArea className="h-full min-h-0 min-w-0 overscroll-contain">
        <div className="min-w-0 p-2">{children}</div>
      </ScrollArea>
    </TabsContent>
  )
}
