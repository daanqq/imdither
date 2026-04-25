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
  type ColorMode,
  type DitherAlgorithm,
  type EditorSettings,
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
import { Switch } from "@workspace/ui/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { ClipboardIcon, RotateCcwIcon, UploadIcon } from "lucide-react"

import { CommittedSliderField } from "@/components/committed-slider-field"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import type { CompareMode } from "@/store/editor-store"

export type ControlPanelProps = {
  advancedOpen: boolean
  compareMode: CompareMode
  settings: EditorSettings
  onAdvancedOpenChange: (open: boolean) => void
  onCompareModeChange: (mode: CompareMode) => void
  onCopySettings: () => void
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
  onCopySettings,
  onPasteSettings,
  onResolutionWidthChange,
  onReset,
  onSettingsTransition,
  resolutionAspectLabel,
}: ControlPanelProps) {
  const selectedAlgorithmOption = getDitherAlgorithmOption(settings.algorithm)
  const matchedProcessingPreset = matchProcessingPreset(settings)

  return (
    <aside className="h-full max-h-full min-h-0 min-w-0 overflow-hidden">
      <Card className="flex h-full min-h-0 min-w-0 overflow-hidden border-border bg-card py-3">
        <CardHeader className="shrink-0">
          <CardTitle>Control Panel</CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 min-w-0 flex-1 basis-0 overflow-hidden px-0">
          <div className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain px-4 [scrollbar-gutter:stable]">
            <FieldGroup className="min-w-0 gap-4 pb-1">
              <Field>
                <FieldLabel htmlFor="processing-preset">Recipe</FieldLabel>
                <Select
                  value={matchedProcessingPreset?.id ?? "custom"}
                  onValueChange={(presetId) => {
                    if (presetId !== "custom") {
                      onSettingsTransition({
                        type: "apply-processing-preset",
                        presetId: presetId as ProcessingPresetId,
                      })
                    }
                  }}
                >
                  <SelectTrigger id="processing-preset" className="w-full">
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
              </Field>

              <Field>
                <FieldLabel htmlFor="palette">Palette</FieldLabel>
                <Select
                  value={settings.paletteId}
                  onValueChange={(paletteId) =>
                    onSettingsTransition({ type: "set-palette", paletteId })
                  }
                >
                  <SelectTrigger id="palette" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PRESET_PALETTES.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="algorithm">Algorithm</FieldLabel>
                <Select
                  value={settings.algorithm}
                  onValueChange={(algorithm) =>
                    onSettingsTransition({
                      type: "set-algorithm",
                      algorithm: algorithm as DitherAlgorithm,
                    })
                  }
                >
                  <SelectTrigger id="algorithm" className="w-full">
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

              <Separator />

              <Collapsible
                className="min-w-0 overflow-hidden"
                open={advancedOpen}
                onOpenChange={onAdvancedOpenChange}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <FieldLabel>Advanced</FieldLabel>
                    <FieldDescription>
                      Gamma, invert, JSON presets.
                    </FieldDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost">
                      {advancedOpen ? "[CLOSE]" : "[OPEN]"}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="flex min-w-0 flex-col gap-5 overflow-hidden pt-4">
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
                  <div className="flex min-w-0 flex-col gap-2">
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
          </div>
        </CardContent>
      </Card>
    </aside>
  )
})

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
