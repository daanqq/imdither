import * as React from "react"
import {
  DITHER_ALGORITHM_OPTIONS,
  DEFAULT_SETTINGS,
  PRESET_PALETTES,
  PROCESSING_PRESET_OPTIONS,
  getDitherAlgorithmOption,
  matchProcessingPreset,
  type AlphaBackground,
  type BayerSize,
  type ColorDepth,
  type ColorMode,
  type DitherAlgorithm,
  type EditorSettings,
  type MatchingMode,
  type ProcessingPresetId,
  type ResizeMode,
} from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
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

import { CommittedSliderField } from "@/components/committed-slider-field"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import { getNextPaletteColor } from "@/lib/palette-add-color"
import { normalizeHexColorDraft } from "@/lib/palette-color-draft"
import { getRandomDifferentValue } from "@/lib/random-options"
import type { CompareMode } from "@/store/editor-store"

export type ControlPanelProps = {
  advancedOpen: boolean
  compareMode: CompareMode
  settings: EditorSettings
  onAdvancedOpenChange: (open: boolean) => void
  onCompareModeChange: (mode: CompareMode) => void
  onCopyPaletteJson: () => void
  onCopySettings: () => void
  onExportPaletteGpl: () => void
  onExportPaletteJson: () => void
  onExtractPalette: (size: 2 | 4 | 8 | 16 | 32) => void
  onImportPaletteFile: (file: File) => void
  onImportPaletteFromClipboard: () => void
  onPasteSettings: () => void
  onResolutionWidthChange: (width: number) => void
  onReset: () => void
  onSettingsTransition: (transition: SettingsTransition) => void
  resolutionAspectLabel: string
}

export const ControlPanel = React.memo(function ControlPanel({
  advancedOpen,
  compareMode,
  settings,
  onAdvancedOpenChange,
  onCompareModeChange,
  onCopyPaletteJson,
  onCopySettings,
  onExportPaletteGpl,
  onExportPaletteJson,
  onExtractPalette,
  onImportPaletteFile,
  onImportPaletteFromClipboard,
  onPasteSettings,
  onResolutionWidthChange,
  onReset,
  onSettingsTransition,
  resolutionAspectLabel,
}: ControlPanelProps) {
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
      <Card className="flex h-full min-h-0 min-w-0 gap-0 overflow-hidden border-border bg-[var(--surface-inspector)] py-2">
        <CardHeader className="shrink-0 border-b border-border pb-2">
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 min-w-0 flex-1 basis-0 overflow-hidden px-0">
          <ScrollArea className="h-full min-h-0 min-w-0 overscroll-contain">
            <FieldGroup className="min-w-0 gap-3 pb-1">
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
                    <SelectTrigger
                      id="processing-preset"
                      className="min-w-0 flex-1"
                    >
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
                          DITHER_ALGORITHM_OPTIONS.map(
                            (algorithm) => algorithm.id
                          ),
                          settings.algorithm
                        ),
                      })
                    }
                  />
                </div>
              </Field>

              {selectedAlgorithmOption.capabilities.bayerSize && (
                <Field>
                  <FieldLabel>Bayer Matrix</FieldLabel>
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
                        aria-label={`${size} by ${size}`}
                        className="flex-1"
                      >
                        {size}x{size}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
              )}

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

              {paletteSelectValue === "custom" ? (
                <PaletteEditor
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
                      colors: activePaletteColors.map(
                        (currentColor, colorIndex) =>
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
              ) : null}

              <Field>
                <FieldLabel htmlFor="color-depth">Color Depth</FieldLabel>
                <Select
                  value={getColorDepthSelectValue(settings.colorDepth)}
                  onValueChange={(value) =>
                    onSettingsTransition({
                      type: "set-color-depth",
                      colorDepth:
                        value === "full"
                          ? { mode: "full" }
                          : {
                              mode: "limit",
                              count: Number(value) as 2 | 4 | 8 | 16,
                            },
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
                {settings.colorDepth.mode === "limit" &&
                activePaletteColors.length > settings.colorDepth.count ? (
                  <FieldDescription>
                    First {settings.colorDepth.count} of{" "}
                    {activePaletteColors.length} palette colors are used.
                  </FieldDescription>
                ) : (
                  <FieldDescription>
                    Processing uses the selected palette order.
                  </FieldDescription>
                )}
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

              <FieldSet>
                <FieldLegend variant="label">Compare</FieldLegend>
                <div className="flex w-full items-center gap-2">
                  <ToggleGroup
                    type="single"
                    value={compareMode === "slide" ? compareMode : ""}
                    variant="outline"
                    className="flex-1"
                    onValueChange={(value) => {
                      if (value) {
                        onCompareModeChange(value as CompareMode)
                      }
                    }}
                  >
                    <ToggleGroupItem value="slide" className="flex-1">
                      Slide
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <ToggleGroup
                    type="single"
                    value={compareMode === "slide" ? "" : compareMode}
                    variant="outline"
                    className="flex-[2]"
                    onValueChange={(value) => {
                      if (value) {
                        onCompareModeChange(value as CompareMode)
                      }
                    }}
                  >
                    <ToggleGroupItem value="processed" className="flex-1">
                      Processed
                    </ToggleGroupItem>
                    <ToggleGroupItem value="original" className="flex-1">
                      Original
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </FieldSet>

              <NumberField
                label="Width"
                value={settings.resize.width}
                description={`Height inferred: ${settings.resize.height}px / aspect ${resolutionAspectLabel}`}
                onChange={onResolutionWidthChange}
              />

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
                  onSettingsTransition({
                    type: "set-preprocess",
                    patch: { contrast },
                  })
                }
              />

              <Collapsible
                className="min-w-0 overflow-hidden"
                open={advancedOpen}
                onOpenChange={onAdvancedOpenChange}
              >
                <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
                  <div className="flex flex-col gap-1">
                    <FieldLabel>Advanced</FieldLabel>
                    <FieldDescription>
                      Gamma, invert, JSON presets.
                    </FieldDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button size="sm" variant="ghost">
                      {advancedOpen ? "Close" : "Open"}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="flex min-w-0 flex-col gap-3 overflow-hidden pt-3">
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
                      <ToggleGroupItem
                        value="color-preserve"
                        className="flex-1"
                      >
                        Color
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="grayscale-first"
                        className="flex-1"
                      >
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
                      onSettingsTransition({
                        type: "set-preprocess",
                        patch: { gamma },
                      })
                    }
                  />
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor="invert">
                        Invert Before Palette
                      </FieldLabel>
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
                  <Separator />
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Button
                      variant="outline"
                      className="min-w-0 justify-start"
                      onClick={onCopySettings}
                    >
                      <ClipboardIcon data-icon="inline-start" />
                      Copy settings
                    </Button>
                    <Button
                      variant="outline"
                      className="min-w-0 justify-start"
                      onClick={onPasteSettings}
                    >
                      <UploadIcon data-icon="inline-start" />
                      Paste settings
                    </Button>
                    <Button
                      variant="destructive"
                      className="min-w-0 justify-start"
                      onClick={onReset}
                    >
                      <RotateCcwIcon data-icon="inline-start" />
                      Defaults
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </FieldGroup>
          </ScrollArea>
        </CardContent>
      </Card>
    </aside>
  )
})

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
  const [colorInputLayout, setColorInputLayout] = React.useState<
    "cards" | "rows"
  >("cards")
  const canAddColor = colors.length < 32
  const canDeleteColor = colors.length > 2
  const extractionSizeValue = getExtractionSizeValue(colors.length)

  return (
    <FieldSet className="gap-2">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <FieldLegend variant="label">Custom Palette</FieldLegend>
      </div>
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
            <span className="min-w-0 flex-1 truncate text-left">
              Extract palette
            </span>
            <span className="flex h-full shrink-0 items-center gap-2 border-l border-border px-3 font-sans text-sm font-medium text-foreground dark:border-input">
              <PipetteIcon />
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
        <div className="grid min-w-0 grid-cols-2 gap-1.5">
          <Button
            aria-label="Add palette color"
            className="min-w-0 justify-start px-2"
            disabled={!canAddColor}
            type="button"
            variant="outline"
            onClick={onAddColor}
          >
            <PlusIcon data-icon="inline-start" />
            Add color
          </Button>
          <Button
            aria-label="Import palette file"
            className="min-w-0 justify-start px-2"
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileInputIcon data-icon="inline-start" />
            Import file
          </Button>
          <Button
            aria-label="Copy palette JSON"
            className="min-w-0 justify-start px-2"
            type="button"
            variant="outline"
            onClick={onCopyPaletteJson}
          >
            <ClipboardIcon data-icon="inline-start" />
            Copy to clipboard
          </Button>
          <Button
            aria-label="Import palette from clipboard"
            className="min-w-0 justify-start px-2"
            type="button"
            variant="outline"
            onClick={onImportPaletteFromClipboard}
          >
            <UploadIcon data-icon="inline-start" />
            Paste from clipboard
          </Button>
          <Button
            aria-label="Export palette JSON"
            className="min-w-0 justify-start px-2"
            type="button"
            variant="outline"
            onClick={onExportPaletteJson}
          >
            <DownloadIcon data-icon="inline-start" />
            Export JSON
          </Button>
          <Button
            aria-label="Export palette GPL"
            className="min-w-0 justify-start px-2"
            type="button"
            variant="outline"
            onClick={onExportPaletteGpl}
          >
            <DownloadIcon data-icon="inline-start" />
            Export GPL
          </Button>
        </div>
        <ToggleGroup
          aria-label="Custom color input layout"
          type="single"
          value={colorInputLayout}
          variant="outline"
          className="w-full"
          onValueChange={(value) => {
            if (value) {
              setColorInputLayout(value as "cards" | "rows")
            }
          }}
        >
          <ToggleGroupItem value="cards" className="flex-1">
            Color pickers
          </ToggleGroupItem>
          <ToggleGroupItem value="rows" className="flex-1">
            Color inputs
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {colorInputLayout === "cards" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1">
          {colors.map((color, index) => (
            <div
              key={`${color}-${index}`}
              className="flex min-w-0 flex-col overflow-hidden rounded-sm border border-border bg-background"
            >
              <div
                className="relative h-7 min-w-0 overflow-hidden transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                style={{ backgroundColor: color }}
              >
                <PaletteColorInput
                  aria-label={`Pick palette swatch color ${index + 1}`}
                  className="palette-color-input absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  color={color}
                  onCommit={(nextColor) => onColorChange(index, nextColor)}
                />
              </div>
              <Button
                aria-label={`Delete palette swatch color ${index + 1}`}
                className="h-7 w-full min-w-0 rounded-none border-0 border-t border-border p-0 shadow-none"
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
      ) : (
        <div className="grid min-w-0 grid-cols-2 gap-1.5">
          {colors.map((color, index) => (
            <div
              key={`${color}-${index}`}
              className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] overflow-hidden rounded-lg border border-input"
            >
              <div className="grid min-w-0 grid-cols-2">
                <PaletteColorInput
                  aria-label={`Pick color ${index + 1}`}
                  className="palette-color-input h-8 cursor-pointer rounded-none border-0 p-0 focus-visible:ring-0"
                  color={color}
                  onCommit={(nextColor) => onColorChange(index, nextColor)}
                />
                <Button
                  aria-label={`Delete color ${index + 1}`}
                  className="h-8 min-w-0 rounded-none border-0 border-l border-input p-0 shadow-none focus-visible:ring-0"
                  disabled={!canDeleteColor}
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => onDeleteColor(index)}
                >
                  <Trash2Icon />
                </Button>
              </div>
              <PaletteHexInput
                color={color}
                index={index}
                className="h-8 rounded-none border-0 border-l border-input focus-visible:ring-0"
                onColorChange={onColorChange}
              />
            </div>
          ))}
        </div>
      )}
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

function getColorDepthSelectValue(colorDepth: ColorDepth): string {
  return colorDepth.mode === "full" ? "full" : String(colorDepth.count)
}

function getExtractionSizeValue(colorCount: number): string {
  return [2, 4, 8, 16, 32].includes(colorCount) ? String(colorCount) : "8"
}

function PaletteColorInput({
  color,
  onCommit,
  ...props
}: Omit<
  React.ComponentProps<typeof Input>,
  "defaultValue" | "onBlur" | "type"
> & {
  color: string
  onCommit: (color: string) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const commitColor = React.useCallback(
    (nextColor: string) => {
      if (nextColor !== color) {
        onCommit(nextColor)
      }
    },
    [color, onCommit]
  )

  React.useEffect(() => {
    const input = inputRef.current

    if (!input) {
      return undefined
    }

    const handleChange = () => commitColor(input.value)

    input.addEventListener("change", handleChange)

    return () => input.removeEventListener("change", handleChange)
  }, [commitColor])

  return (
    <Input
      ref={inputRef}
      type="color"
      defaultValue={color}
      onBlur={(event) => commitColor(event.currentTarget.value)}
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

    if (!draft) {
      input.value = color
      return
    }

    if (normalizedDraft) {
      input.value = normalizedDraft

      if (normalizedDraft !== color) {
        onColorChange(index, normalizedDraft)
      }

      return
    }

    input.value = color
  }

  return (
    <Input
      key={color}
      aria-label={`Hex color ${index + 1}`}
      className={className ?? "h-8 font-mono"}
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
  description,
  label,
  onChange,
  value,
}: {
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
      <Input
        key={value}
        id={id}
        defaultValue={value}
        inputMode="numeric"
        min={1}
        max={4096}
        type="number"
        onBlur={(event) => commitDraft(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            event.currentTarget.blur()
          }
        }}
      />
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
