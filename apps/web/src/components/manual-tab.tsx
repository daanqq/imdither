import type { EditorSettings } from "@workspace/core"
import * as React from "react"

import { DitherSection } from "@/components/manual/dither-section"
import { EffectStackSection } from "@/components/manual/effect-stack-section"
import {
  LookRecipeBar,
  type LookRecipeOption,
} from "@/components/manual/look-recipe-bar"
import { OutputSection } from "@/components/manual/output-section"
import { PaletteSection } from "@/components/manual/palette-section"
import { ToneSection } from "@/components/manual/tone-section"
import { UtilitySection } from "@/components/manual/utility-section"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import {
  buildEffectStackModel,
  executeEffectStackCommand,
  type EffectStackEditingCommand,
} from "@/lib/effect-stack-editing-application"

type ManualTabProps = {
  settings: EditorSettings
  activePaletteColors: string[]
  isAnimated?: boolean
  lookRecipeId: string
  lookRecipes: readonly LookRecipeOption[]
  paletteSelectValue: string
  advancedOpen: boolean
  resolutionAspectLabel: string
  sourceWidth?: number
  onAdvancedOpenChange: (open: boolean) => void
  onCopyLook: () => void
  onCopyPaletteJson: () => void
  onCopySettings: () => void
  onDeleteLookRecipe: (id: string) => void
  onExportPaletteGpl: () => void
  onExportPaletteJson: () => void
  onExtractPalette: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFile: (file: File) => void
  onImportPaletteFromClipboard: () => void
  onPasteLook: () => void
  onPasteSettings: () => void
  onRenameLookRecipe: (id: string, name: string) => void
  onReset: () => void
  onResolutionWidthChange: (width: number) => void
  onSaveLookRecipe: (name: string) => void
  onSelectLookRecipe: (id: string) => void
  onSettingsTransition: (transition: SettingsTransition) => void
}

function settingsTransitionToCommand(
  transition: SettingsTransition
): EffectStackEditingCommand | null {
  switch (transition.type) {
    case "add-effect-stage":
      return {
        type: "add-stage",
        kind: transition.kind,
        effect: transition.effect,
      }
    case "remove-effect-stage":
      return { type: "remove-stage", instanceId: transition.instanceId }
    case "set-effect-stage-enabled":
      return {
        type: "toggle-stage",
        instanceId: transition.instanceId,
        enabled: transition.enabled,
      }
    case "set-effect-stage-params":
      return {
        type: "edit-stage-params",
        instanceId: transition.instanceId,
        params: transition.params,
      }
    case "reorder-effect-stages":
      return {
        type: "reorder-stages",
        group: transition.group,
        fromIndex: transition.fromIndex,
        toIndex: transition.toIndex,
      }
    default:
      return null
  }
}

export function ManualTab({
  settings,
  activePaletteColors,
  isAnimated = false,
  lookRecipeId,
  lookRecipes,
  paletteSelectValue,
  advancedOpen,
  resolutionAspectLabel,
  sourceWidth,
  onAdvancedOpenChange,
  onCopyLook,
  onCopyPaletteJson,
  onCopySettings,
  onDeleteLookRecipe,
  onExportPaletteGpl,
  onExportPaletteJson,
  onExtractPalette,
  onImportPaletteFile,
  onImportPaletteFromClipboard,
  onPasteLook,
  onPasteSettings,
  onRenameLookRecipe,
  onReset,
  onResolutionWidthChange,
  onSaveLookRecipe,
  onSelectLookRecipe,
  onSettingsTransition,
}: ManualTabProps) {
  const stackModel = React.useMemo(
    () => buildEffectStackModel(settings),
    [settings]
  )
  const [preGroup, , postGroup] = stackModel

  const settingsRef = React.useRef(settings)
  React.useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const handleTransition = React.useCallback(
    (transition: SettingsTransition) => {
      const command = settingsTransitionToCommand(transition)
      if (command) {
        const result = executeEffectStackCommand(settingsRef.current, command)
        if (result.ok) {
          onSettingsTransition(result.transition)
        } else {
          console.warn(
            "Effect stack command failed, falling back",
            command,
            result
          )
          onSettingsTransition(transition)
        }
        return
      }
      onSettingsTransition(transition)
    },
    [onSettingsTransition]
  )

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <LookRecipeBar
        activeId={lookRecipeId}
        recipes={lookRecipes}
        onDelete={onDeleteLookRecipe}
        onRename={onRenameLookRecipe}
        onSave={onSaveLookRecipe}
        onSelect={onSelectLookRecipe}
      />

      <DitherSection
        isAnimated={isAnimated}
        settings={settings}
        onSettingsTransition={handleTransition}
      />

      <PaletteSection
        activePaletteColors={activePaletteColors}
        paletteSelectValue={paletteSelectValue}
        settings={settings}
        onCopyPaletteJson={onCopyPaletteJson}
        onExportPaletteGpl={onExportPaletteGpl}
        onExportPaletteJson={onExportPaletteJson}
        onExtractPalette={onExtractPalette}
        onImportPaletteFile={onImportPaletteFile}
        onImportPaletteFromClipboard={onImportPaletteFromClipboard}
        onSettingsTransition={handleTransition}
      />

      <ToneSection
        advancedOpen={advancedOpen}
        settings={settings}
        onAdvancedOpenChange={onAdvancedOpenChange}
        onSettingsTransition={onSettingsTransition}
      />

      <EffectStackSection
        postStages={postGroup.stages}
        preStages={preGroup.stages}
        onSettingsTransition={handleTransition}
      />

      <OutputSection
        resolutionAspectLabel={resolutionAspectLabel}
        settings={settings}
        sourceWidth={sourceWidth}
        onResolutionWidthChange={onResolutionWidthChange}
        onSettingsTransition={onSettingsTransition}
      />

      <UtilitySection
        onCopyLook={onCopyLook}
        onCopySettings={onCopySettings}
        onPasteLook={onPasteLook}
        onPasteSettings={onPasteSettings}
        onReset={onReset}
      />
    </div>
  )
}
