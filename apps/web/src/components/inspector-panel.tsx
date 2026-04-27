import * as React from "react"
import {
  DITHER_ALGORITHM_OPTIONS,
  DEFAULT_SETTINGS,
  PRESET_PALETTES,
  PROCESSING_PRESET_OPTIONS,
  getDitherAlgorithmOption,
  matchProcessingPreset,
  type AlphaBackground,
  type AutoTuneRecommendation,
  type BayerSize,
  type ColorMode,
  type DitherAlgorithm,
  type EditorSettings,
  type MatchingMode,
  type ProcessingPresetId,
  type ResizeMode,
} from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import {
  ClipboardIcon,
  DownloadIcon,
  FileInputIcon,
  PipetteIcon,
  PlusIcon,
  RotateCcwIcon,
  ShuffleIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import { AutoTunePanel } from "@/components/auto-tune-panel"
import { CommittedSliderField } from "@/components/committed-slider-field"
import { ResponsiveDrawer } from "@/components/responsive-drawer"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import { type ExportFormat } from "@/lib/export-image"
import { getNextPaletteColor } from "@/lib/palette-add-color"
import { normalizeHexColorDraft } from "@/lib/palette-color-draft"
import { getRandomDifferentValue } from "@/lib/random-options"

export type InspectorPanelProps = {
  advancedOpen: boolean
  appliedRecommendationId: string | null
  autoTuneError: string | null
  autoTuneLoading: boolean
  autoTuneRecommendations: AutoTuneRecommendation[]
  exportFormat: ExportFormat
  exportQuality: number
  settings: EditorSettings
  sourceAvailable: boolean
  sourceWidth?: number
  onAdvancedOpenChange: (open: boolean) => void
  onApplyAutoTuneRecommendation: (
    recommendation: AutoTuneRecommendation
  ) => void
  onCopyLook: () => void
  onCopyPaletteJson: () => void
  onCopySettings: () => void
  onExportFormatChange: (format: ExportFormat) => void
  onExportPaletteGpl: () => void
  onExportPaletteJson: () => void
  onExportQualityChange: (quality: number) => void
  onExtractPalette: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFile: (file: File) => void
  onImportPaletteFromClipboard: () => void
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
  onPasteLook,
  onPasteSettings,
  onResolutionWidthChange,
  onReset,
  onSettingsTransition,
  resolutionAspectLabel,
}: InspectorPanelProps) {
  const selectedAlgorithmOption = getDitherAlgorithmOption(settings.algorithm)
  const matchedProcessingPreset = matchProcessingPreset(settings)
  const processingPresetId = matchedProcessingPreset?.id ?? "custom"
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
            <TabsList className="grid w-full grid-cols-3" variant="line">
              <TabsTrigger value="looks">Looks</TabsTrigger>
              <TabsTrigger value="adjust">Adjust</TabsTrigger>
              <TabsTrigger value="palette">Palette</TabsTrigger>
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
            <InspectorTab value="adjust">
              <AdjustControls
                activePaletteColors={activePaletteColors}
                advancedOpen={advancedOpen}
                processingPresetId={processingPresetId}
                selectedAlgorithmOption={selectedAlgorithmOption}
                settings={settings}
                sourceWidth={sourceWidth}
                resolutionAspectLabel={resolutionAspectLabel}
                onAdvancedOpenChange={onAdvancedOpenChange}
                onCopyLook={onCopyLook}
                onCopySettings={onCopySettings}
                onPasteLook={onPasteLook}
                onPasteSettings={onPasteSettings}
                onResolutionWidthChange={onResolutionWidthChange}
                onReset={onReset}
                onSettingsTransition={onSettingsTransition}
              />
            </InspectorTab>
            <InspectorTab value="palette">
              <PaletteControls
                activePaletteColors={activePaletteColors}
                paletteSelectValue={paletteSelectValue}
                settings={settings}
                onCopyPaletteJson={onCopyPaletteJson}
                onExportPaletteGpl={onExportPaletteGpl}
                onExportPaletteJson={onExportPaletteJson}
                onExtractPalette={onExtractPalette}
                onImportPaletteFile={onImportPaletteFile}
                onImportPaletteFromClipboard={onImportPaletteFromClipboard}
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

function AdjustControls({
  activePaletteColors,
  advancedOpen,
  processingPresetId,
  resolutionAspectLabel,
  selectedAlgorithmOption,
  settings,
  sourceWidth,
  onAdvancedOpenChange,
  onCopyLook,
  onCopySettings,
  onPasteLook,
  onPasteSettings,
  onResolutionWidthChange,
  onReset,
  onSettingsTransition,
}: {
  activePaletteColors: string[]
  advancedOpen: boolean
  processingPresetId: string
  resolutionAspectLabel: string
  selectedAlgorithmOption: ReturnType<typeof getDitherAlgorithmOption>
  settings: EditorSettings
  sourceWidth?: number
  onAdvancedOpenChange: (open: boolean) => void
  onCopyLook: () => void
  onCopySettings: () => void
  onPasteLook: () => void
  onPasteSettings: () => void
  onResolutionWidthChange: (width: number) => void
  onReset: () => void
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  return (
    <FieldGroup className="min-w-0 gap-3">
      <Field>
        <FieldLabel htmlFor="processing-preset">Recipe</FieldLabel>
        <div className="flex min-w-0 items-center gap-2">
          <Select
            value={processingPresetId}
            onValueChange={(presetId) => {
              if (presetId !== "custom") {
                onSettingsTransition({
                  type: "apply-processing-preset",
                  presetId: presetId as ProcessingPresetId,
                })
              }
            }}
          >
            <SelectTrigger id="processing-preset" className="min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="custom">Custom</SelectItem>
                {PROCESSING_PRESET_OPTIONS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <RandomizeButton
            label="Random recipe"
            onClick={() =>
              onSettingsTransition({
                type: "apply-processing-preset",
                presetId: getRandomDifferentValue(
                  PROCESSING_PRESET_OPTIONS.map((preset) => preset.id),
                  processingPresetId
                ),
              })
            }
          />
        </div>
      </Field>
      <Field>
        <FieldLabel htmlFor="algorithm">Algorithm</FieldLabel>
        <div className="flex min-w-0 items-center gap-2">
          <Select
            value={settings.algorithm}
            onValueChange={(algorithm) =>
              onSettingsTransition({
                type: "set-algorithm",
                algorithm: algorithm as DitherAlgorithm,
              })
            }
          >
            <SelectTrigger id="algorithm" className="min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {DITHER_ALGORITHM_OPTIONS.map((algorithm) => (
                  <SelectItem key={algorithm.id} value={algorithm.id}>
                    {algorithm.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <RandomizeButton
            label="Random algorithm"
            onClick={() =>
              onSettingsTransition({
                type: "set-algorithm",
                algorithm: getRandomDifferentValue(
                  DITHER_ALGORITHM_OPTIONS.map((algorithm) => algorithm.id),
                  settings.algorithm
                ),
              })
            }
          />
        </div>
      </Field>
      {selectedAlgorithmOption.capabilities.bayerSize ? (
        <FieldSet>
          <FieldLegend variant="label">Bayer Matrix</FieldLegend>
          <ToggleGroup
            type="single"
            value={String(settings.bayerSize)}
            variant="outline"
            className="w-full"
            onValueChange={(value) => {
              if (value) {
                onSettingsTransition({
                  type: "set-bayer-size",
                  bayerSize: Number(value) as BayerSize,
                })
              }
            }}
          >
            {[2, 4, 8].map((size) => (
              <ToggleGroupItem
                key={size}
                value={String(size)}
                className="flex-1"
              >
                {size}x{size}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>
      ) : null}
      <Field>
        <FieldLabel htmlFor="color-depth">Color Depth</FieldLabel>
        <Select
          value={
            settings.colorDepth.mode === "full"
              ? "full"
              : String(settings.colorDepth.count)
          }
          onValueChange={(value) =>
            onSettingsTransition({
              type: "set-color-depth",
              colorDepth:
                value === "full"
                  ? { mode: "full" }
                  : { mode: "limit", count: Number(value) as 2 | 4 | 8 | 16 },
            })
          }
        >
          <SelectTrigger id="color-depth" className="min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="full">Full palette</SelectItem>
              {[2, 4, 8, 16].map((count) => (
                <SelectItem key={count} value={String(count)}>
                  First {count}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription>
          {settings.colorDepth.mode === "limit" &&
          activePaletteColors.length > settings.colorDepth.count
            ? `First ${settings.colorDepth.count} of ${activePaletteColors.length} palette colors are used.`
            : "Processing uses the selected palette order."}
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="matching-mode">Color Matching</FieldLabel>
        <Select
          value={settings.matchingMode}
          onValueChange={(matchingMode) =>
            onSettingsTransition({
              type: "set-matching-mode",
              matchingMode: matchingMode as MatchingMode,
            })
          }
        >
          <SelectTrigger id="matching-mode" className="min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="rgb">RGB</SelectItem>
              <SelectItem value="perceptual">Perceptual</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <CommittedSliderField
        defaultValue={DEFAULT_SETTINGS.preprocess.brightness}
        label="Brightness"
        max={100}
        min={-100}
        step={1}
        value={settings.preprocess.brightness}
        onCommit={(brightness) =>
          onSettingsTransition({
            type: "set-preprocess",
            patch: { brightness },
          })
        }
      />
      <CommittedSliderField
        defaultValue={DEFAULT_SETTINGS.preprocess.contrast}
        label="Contrast"
        max={100}
        min={-100}
        step={1}
        value={settings.preprocess.contrast}
        onCommit={(contrast) =>
          onSettingsTransition({ type: "set-preprocess", patch: { contrast } })
        }
      />
      <NumberField
        label="Width"
        value={settings.resize.width}
        description={`Height inferred: ${settings.resize.height}px / aspect ${resolutionAspectLabel}`}
        action={
          sourceWidth ? (
            <Button
              aria-label="Reset width to source size"
              title="Reset width to source size"
              type="button"
              variant="outline"
              className="h-8 px-2 font-mono text-xs"
              disabled={settings.resize.width === sourceWidth}
              onClick={() => onResolutionWidthChange(sourceWidth)}
            >
              <RotateCcwIcon data-icon="inline-start" />
              1x
            </Button>
          ) : null
        }
        onChange={onResolutionWidthChange}
      />
      <FieldSet>
        <FieldLegend variant="label">Resize Kernel</FieldLegend>
        <ToggleGroup
          type="single"
          value={settings.resize.mode}
          variant="outline"
          className="w-full"
          onValueChange={(value) => {
            if (value) {
              onSettingsTransition({
                type: "set-resize-mode",
                mode: value as ResizeMode,
              })
            }
          }}
        >
          <ToggleGroupItem value="bilinear" className="flex-1">
            Bilinear
          </ToggleGroupItem>
          <ToggleGroupItem value="nearest" className="flex-1">
            Nearest
          </ToggleGroupItem>
        </ToggleGroup>
      </FieldSet>
      <FieldSet>
        <FieldLegend variant="label">Alpha Flatten</FieldLegend>
        <ToggleGroup
          type="single"
          value={settings.alphaBackground}
          variant="outline"
          className="w-full"
          onValueChange={(value) => {
            if (value) {
              onSettingsTransition({
                type: "set-alpha-background",
                alphaBackground: value as AlphaBackground,
              })
            }
          }}
        >
          <ToggleGroupItem value="white" className="flex-1">
            White
          </ToggleGroupItem>
          <ToggleGroupItem value="black" className="flex-1">
            Black
          </ToggleGroupItem>
        </ToggleGroup>
      </FieldSet>
      <Collapsible
        className="min-w-0 overflow-hidden"
        open={advancedOpen}
        onOpenChange={onAdvancedOpenChange}
      >
        <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
          <div className="flex flex-col gap-1">
            <FieldLabel>Advanced</FieldLabel>
            <FieldDescription>Color mode, gamma, invert.</FieldDescription>
          </div>
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="ghost">
              {advancedOpen ? "Close" : "Open"}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="flex min-w-0 flex-col gap-3 overflow-hidden pt-3">
          <FieldSet>
            <FieldLegend variant="label">Color Mode</FieldLegend>
            <ToggleGroup
              type="single"
              value={settings.preprocess.colorMode}
              variant="outline"
              className="w-full"
              onValueChange={(value) => {
                if (value) {
                  onSettingsTransition({
                    type: "set-color-mode",
                    colorMode: value as ColorMode,
                  })
                }
              }}
            >
              <ToggleGroupItem value="color-preserve" className="flex-1">
                Color
              </ToggleGroupItem>
              <ToggleGroupItem value="grayscale-first" className="flex-1">
                Gray
              </ToggleGroupItem>
            </ToggleGroup>
          </FieldSet>
          <CommittedSliderField
            defaultValue={DEFAULT_SETTINGS.preprocess.gamma}
            label="Gamma"
            max={3}
            min={0.2}
            step={0.05}
            value={settings.preprocess.gamma}
            onCommit={(gamma) =>
              onSettingsTransition({ type: "set-preprocess", patch: { gamma } })
            }
          />
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="invert">Invert Before Palette</FieldLabel>
              <FieldDescription>
                Applies after tone preprocessing.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="invert"
              checked={settings.preprocess.invert}
              onCheckedChange={(invert) =>
                onSettingsTransition({
                  type: "set-preprocess",
                  patch: { invert },
                })
              }
            />
          </Field>
        </CollapsibleContent>
      </Collapsible>
      <Separator />
      <UtilityActions
        onCopyLook={onCopyLook}
        onCopySettings={onCopySettings}
        onPasteLook={onPasteLook}
        onPasteSettings={onPasteSettings}
        onReset={onReset}
      />
    </FieldGroup>
  )
}

function PaletteControls({
  activePaletteColors,
  paletteSelectValue,
  settings,
  onCopyPaletteJson,
  onExportPaletteGpl,
  onExportPaletteJson,
  onExtractPalette,
  onImportPaletteFile,
  onImportPaletteFromClipboard,
  onSettingsTransition,
}: {
  activePaletteColors: string[]
  paletteSelectValue: string
  settings: EditorSettings
  onCopyPaletteJson: () => void
  onExportPaletteGpl: () => void
  onExportPaletteJson: () => void
  onExtractPalette: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFile: (file: File) => void
  onImportPaletteFromClipboard: () => void
  onSettingsTransition: (transition: SettingsTransition) => void
}) {
  return (
    <FieldGroup className="min-w-0 gap-3">
      <Field>
        <FieldLabel htmlFor="palette">Palette</FieldLabel>
        <div className="flex min-w-0 items-center gap-2">
          <Select
            value={paletteSelectValue}
            onValueChange={(paletteId) => {
              if (paletteId === "custom") {
                onSettingsTransition({
                  type: "set-custom-palette",
                  colors: activePaletteColors,
                })
              } else {
                onSettingsTransition({ type: "set-palette", paletteId })
              }
            }}
          >
            <SelectTrigger id="palette" className="min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="custom">Custom</SelectItem>
                {PRESET_PALETTES.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <RandomizeButton
            label="Random palette"
            onClick={() =>
              onSettingsTransition({
                type: "set-palette",
                paletteId: getRandomDifferentValue(
                  PRESET_PALETTES.map((preset) => preset.id),
                  settings.paletteId
                ),
              })
            }
          />
        </div>
      </Field>
      <FieldSet>
        <FieldLegend variant="label">Palette Swatches</FieldLegend>
        <div className="grid grid-cols-8 gap-1">
          {activePaletteColors.slice(0, 32).map((color, index) => (
            <span
              key={`${color}-${index}`}
              className="relative aspect-square min-w-0 overflow-hidden border border-border"
              style={{ backgroundColor: color }}
            >
              <PaletteColorInput
                aria-label={`Pick palette swatch color ${index + 1}`}
                className="palette-color-input absolute inset-0 h-full w-full cursor-pointer opacity-0"
                color={color}
                onCommit={(nextColor) =>
                  onSettingsTransition({
                    type: "set-custom-palette",
                    colors: activePaletteColors.map(
                      (currentColor, colorIndex) =>
                        colorIndex === index ? nextColor : currentColor
                    ),
                  })
                }
              />
            </span>
          ))}
        </div>
        <FieldDescription>
          {activePaletteColors.length} colors active.
        </FieldDescription>
      </FieldSet>
      <PaletteEditorDrawer
        colors={activePaletteColors}
        onAddColor={() =>
          onSettingsTransition({
            type: "set-custom-palette",
            colors: [
              getNextPaletteColor(activePaletteColors),
              ...activePaletteColors,
            ],
          })
        }
        onColorChange={(index, color) =>
          onSettingsTransition({
            type: "set-custom-palette",
            colors: activePaletteColors.map((currentColor, colorIndex) =>
              colorIndex === index ? color : currentColor
            ),
          })
        }
        onDeleteColor={(index) =>
          onSettingsTransition({
            type: "set-custom-palette",
            colors: activePaletteColors.filter(
              (_color, colorIndex) => colorIndex !== index
            ),
          })
        }
        onCopyPaletteJson={onCopyPaletteJson}
        onExportPaletteGpl={onExportPaletteGpl}
        onExportPaletteJson={onExportPaletteJson}
        onExtractPalette={onExtractPalette}
        onImportPaletteFile={onImportPaletteFile}
        onImportPaletteFromClipboard={onImportPaletteFromClipboard}
      />
    </FieldGroup>
  )
}

function UtilityActions({
  onCopyLook,
  onCopySettings,
  onPasteLook,
  onPasteSettings,
  onReset,
}: {
  onCopyLook: () => void
  onCopySettings: () => void
  onPasteLook: () => void
  onPasteSettings: () => void
  onReset: () => void
}) {
  return (
    <div className="grid min-w-0 gap-3">
      <div className="grid min-w-0 gap-1.5">
        <FieldLabel>Look</FieldLabel>
        <Button
          variant="outline"
          className="justify-start"
          onClick={onCopyLook}
        >
          <ClipboardIcon data-icon="inline-start" />
          Copy look
        </Button>
        <Button
          variant="outline"
          className="justify-start"
          onClick={onPasteLook}
        >
          <UploadIcon data-icon="inline-start" />
          Paste look
        </Button>
      </div>
      <div className="grid min-w-0 gap-1.5">
        <FieldLabel>Settings JSON</FieldLabel>
        <Button
          variant="outline"
          className="justify-start"
          onClick={onCopySettings}
        >
          <ClipboardIcon data-icon="inline-start" />
          Copy settings
        </Button>
        <Button
          variant="outline"
          className="justify-start"
          onClick={onPasteSettings}
        >
          <UploadIcon data-icon="inline-start" />
          Paste settings
        </Button>
        <Button
          variant="destructive"
          className="justify-start"
          onClick={onReset}
        >
          <RotateCcwIcon data-icon="inline-start" />
          Defaults
        </Button>
      </div>
    </div>
  )
}

function PaletteEditorDrawer(
  props: React.ComponentProps<typeof PaletteEditor>
) {
  return (
    <ResponsiveDrawer>
      <DrawerTrigger asChild>
        <Button type="button" variant="outline" className="justify-start">
          <PipetteIcon data-icon="inline-start" />
          Edit colors
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Custom Palette Editor</DrawerTitle>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto p-3">
          <PaletteEditor {...props} />
        </div>
      </DrawerContent>
    </ResponsiveDrawer>
  )
}

function PaletteEditor({
  colors,
  onAddColor,
  onColorChange,
  onDeleteColor,
  onCopyPaletteJson,
  onExportPaletteGpl,
  onExportPaletteJson,
  onExtractPalette,
  onImportPaletteFile,
  onImportPaletteFromClipboard,
}: {
  colors: string[]
  onAddColor: () => void
  onColorChange: (index: number, color: string) => void
  onDeleteColor: (index: number) => void
  onCopyPaletteJson: () => void
  onExportPaletteGpl: () => void
  onExportPaletteJson: () => void
  onExtractPalette: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFile: (file: File) => void
  onImportPaletteFromClipboard: () => void
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const canAddColor = colors.length < 32
  const canDeleteColor = colors.length > 2
  const extractionSizeValue = [2, 4, 8, 16, 32].includes(colors.length)
    ? String(colors.length)
    : "8"

  return (
    <FieldSet className="gap-2">
      <FieldLegend variant="label">Custom Palette</FieldLegend>
      <div className="-mt-1 flex min-w-0 flex-col gap-1.5">
        <Select
          value={extractionSizeValue}
          onValueChange={(size) =>
            onExtractPalette(Number(size) as 2 | 4 | 8 | 16 | 32)
          }
        >
          <SelectTrigger
            aria-label="Extract palette size"
            className="h-8 w-full min-w-0 justify-between overflow-hidden rounded-lg border-border bg-background py-0 pr-2 pl-2.5 font-sans text-sm font-medium hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
          >
            <PipetteIcon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">
              Extract palette
            </span>
            <span className="flex h-full shrink-0 items-center gap-2 border-l border-border px-3 font-sans text-sm font-medium text-foreground dark:border-input">
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {[2, 4, 8, 16, 32].map((size) => (
                <SelectItem
                  key={size}
                  value={String(size)}
                  onPointerUp={() => {
                    if (String(size) === extractionSizeValue) {
                      onExtractPalette(size as 2 | 4 | 8 | 16 | 32)
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      (event.key === "Enter" || event.key === " ") &&
                      String(size) === extractionSizeValue
                    ) {
                      onExtractPalette(size as 2 | 4 | 8 | 16 | 32)
                    }
                  }}
                >
                  {size}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button disabled={!canAddColor} variant="outline" onClick={onAddColor}>
          <PlusIcon data-icon="inline-start" />
          Add color
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <FileInputIcon data-icon="inline-start" />
          Import file
        </Button>
        <Button variant="outline" onClick={onCopyPaletteJson}>
          <ClipboardIcon data-icon="inline-start" />
          Copy palette JSON
        </Button>
        <Button variant="outline" onClick={onImportPaletteFromClipboard}>
          <UploadIcon data-icon="inline-start" />
          Paste palette
        </Button>
        <Button variant="outline" onClick={onExportPaletteJson}>
          <DownloadIcon data-icon="inline-start" />
          Export JSON
        </Button>
        <Button variant="outline" onClick={onExportPaletteGpl}>
          <DownloadIcon data-icon="inline-start" />
          Export GPL
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {colors.map((color, index) => (
          <div
            key={`${color}-${index}`}
            className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_2rem] overflow-hidden border border-input"
          >
            <PaletteColorInput
              aria-label={`Pick palette swatch color ${index + 1}`}
              className="palette-color-input h-8 rounded-none border-0 p-0"
              color={color}
              onCommit={(nextColor) => onColorChange(index, nextColor)}
            />
            <PaletteHexInput
              color={color}
              index={index}
              className="h-8 rounded-none border-y-0 border-l border-input font-mono"
              onColorChange={onColorChange}
            />
            <Button
              aria-label={`Delete palette swatch color ${index + 1}`}
              className="h-8 rounded-none border-0 border-l border-input p-0"
              disabled={!canDeleteColor}
              size="icon"
              type="button"
              variant="outline"
              onClick={() => onDeleteColor(index)}
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
      </div>
      <input
        ref={fileInputRef}
        accept=".hex,.gpl,.json,text/plain,application/json"
        className="sr-only"
        type="file"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]

          if (file) {
            onImportPaletteFile(file)
          }

          event.currentTarget.value = ""
        }}
      />
    </FieldSet>
  )
}

function PaletteColorInput({
  color,
  onCommit,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "defaultValue" | "type"> & {
  color: string
  onCommit: (color: string) => void
}) {
  return (
    <Input
      type="color"
      defaultValue={color}
      onBlur={(event) => {
        if (event.currentTarget.value !== color) {
          onCommit(event.currentTarget.value)
        }
      }}
      {...props}
    />
  )
}

function PaletteHexInput({
  className,
  color,
  index,
  onColorChange,
}: {
  className?: string
  color: string
  index: number
  onColorChange: (index: number, color: string) => void
}) {
  function commitDraft(input: HTMLInputElement) {
    const draft = input.value.trim()
    const normalizedDraft = normalizeHexColorDraft(draft)

    if (!draft || !normalizedDraft) {
      input.value = color
      return
    }

    input.value = normalizedDraft

    if (normalizedDraft !== color) {
      onColorChange(index, normalizedDraft)
    }
  }

  return (
    <Input
      key={color}
      aria-label={`Hex color ${index + 1}`}
      className={className}
      defaultValue={color}
      spellCheck={false}
      onBlur={(event) => commitDraft(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          event.currentTarget.blur()
        }
      }}
    />
  )
}

function NumberField({
  action,
  description,
  label,
  onChange,
  value,
}: {
  action?: React.ReactNode
  description?: React.ReactNode
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const id = React.useId()

  function commitDraft(input: HTMLInputElement) {
    const nextValue = Number(input.value)

    if (!Number.isFinite(nextValue) || nextValue < 1) {
      input.value = String(value)
      return
    }

    const roundedValue = Math.round(nextValue)
    input.value = String(roundedValue)

    if (roundedValue !== value) {
      onChange(roundedValue)
    }
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div
        className={action ? "grid grid-cols-[minmax(0,1fr)_auto] gap-2" : ""}
      >
        <Input
          key={value}
          id={id}
          defaultValue={value}
          inputMode="numeric"
          max={4096}
          min={1}
          type="number"
          onBlur={(event) => commitDraft(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
        />
        {action}
      </div>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  )
}

function RandomizeButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button
      aria-label={label}
      title={label}
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
    >
      <ShuffleIcon />
    </Button>
  )
}
