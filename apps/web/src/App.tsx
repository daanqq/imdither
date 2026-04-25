import * as React from "react"
import {
  DITHER_ALGORITHM_OPTIONS,
  PRESET_PALETTES,
  getDitherAlgorithmOption,
  safeNormalizeSettings,
  type AlphaBackground,
  type BayerSize,
  type ColorMode,
  type DitherAlgorithm,
  type EditorSettings,
  type ResizeFit,
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
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
import { cn } from "@workspace/ui/lib/utils"
import {
  ClipboardIcon,
  DownloadIcon,
  MoonIcon,
  RotateCcwIcon,
  SunIcon,
  UploadIcon,
} from "lucide-react"

import { CommittedSliderField } from "@/components/committed-slider-field"
import { SlideComparePreview } from "@/components/slide-compare-preview"
import { useTheme } from "@/components/theme-provider"
import {
  downloadBlob,
  drawPixelBuffer,
  pixelBufferToPngBlob,
} from "@/lib/image"
import { getPreviewFrameStyle } from "@/lib/preview-frame"
import { createProcessingJobs } from "@/lib/processing-jobs"
import { SLIDE_COMPARE_DEFAULT } from "@/lib/slide-compare"
import {
  createDemoSourceIntake,
  formatSourceNotices,
  intakeImageFile,
  pickImageFromClipboard,
  type LoadedSource,
  type SourceIntakeResult,
} from "@/lib/source-intake"
import type { SettingsTransition } from "@/lib/editor-settings-transition"
import {
  useEditorStore,
  type CompareMode,
  type ViewScale,
} from "@/store/editor-store"

const DESKTOP_VIEW_SCALE_QUERY = "(min-width: 768px)"
export function App() {
  const {
    settings,
    compareMode,
    viewScale,
    advancedOpen,
    status,
    transitionSettings,
    setCompareMode,
    setViewScale,
    setAdvancedOpen,
    setStatus,
    setError,
    setSourceNotice,
    setMetadata,
  } = useEditorStore()
  const [source, setSource] = React.useState<LoadedSource | null>(() => {
    const result = createDemoSourceIntake()
    return result.type === "accepted" ? result.source : null
  })
  const [preview, setPreview] = React.useState<LoadedSource["buffer"] | null>(
    null
  )
  const [isDesktopViewScale, setIsDesktopViewScale] = React.useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia(DESKTOP_VIEW_SCALE_QUERY).matches
  )
  const [slideDividerPercent, setSlideDividerPercent] = React.useState(
    SLIDE_COMPARE_DEFAULT
  )
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const processingJobs = React.useMemo(() => createProcessingJobs(), [])
  const aspectLabel = source
    ? formatAspectRatio(source.buffer.width, source.buffer.height)
    : formatAspectRatio(settings.resize.width, settings.resize.height)
  const transitionContext = React.useMemo(
    () => ({
      sourceDimensions: source
        ? { width: source.buffer.width, height: source.buffer.height }
        : null,
    }),
    [source]
  )

  const applySourceIntake = React.useCallback(
    (result: SourceIntakeResult) => {
      if (result.type === "rejected") {
        setError(result.message)
        setStatus("error")
        return false
      }

      setSource(result.source)
      setPreview(null)
      setError(null)
      setSourceNotice(formatSourceNotices(result.notices))
      transitionSettings({
        type: "set-output-size",
        width: result.outputSize.width,
        height: result.outputSize.height,
      })
      return true
    },
    [setError, setSourceNotice, setStatus, transitionSettings]
  )

  React.useEffect(() => {
    if (!source) {
      return undefined
    }

    const handle = processingJobs.startPreviewJob({
      sourceKey: source.id,
      image: source.buffer,
      settings,
      onEvent: (event) => {
        switch (event.type) {
          case "queued":
            setStatus("queued")
            return
          case "processing":
            setStatus("processing")
            return
          case "reduced-preview-ready":
          case "refined-preview-ready":
            setPreview(event.result.image)
            setMetadata(event.result.metadata)
            setError(null)
            setStatus("ready")
            return
          case "failed":
            setError(event.error.message)
            setStatus("error")
            return
        }
      },
    })

    return () => {
      handle.cancel()
    }
  }, [processingJobs, settings, source, setError, setMetadata, setStatus])

  const handleFile = React.useCallback(
    async (file: File) => {
      try {
        setStatus("processing")
        applySourceIntake(await intakeImageFile(file))
      } catch (fileError) {
        setError(
          fileError instanceof Error ? fileError.message : "Image decode failed"
        )
        setStatus("error")
      }
    },
    [applySourceIntake, setError, setStatus]
  )

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_VIEW_SCALE_QUERY)
    const enforceMobileFit = () => {
      setIsDesktopViewScale(mediaQuery.matches)

      if (!mediaQuery.matches) {
        setViewScale("fit")
      }
    }

    enforceMobileFit()
    mediaQuery.addEventListener("change", enforceMobileFit)

    return () => {
      mediaQuery.removeEventListener("change", enforceMobileFit)
    }
  }, [setViewScale])

  React.useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const file = pickImageFromClipboard(event.clipboardData)

      if (!file) {
        return
      }

      event.preventDefault()
      await handleFile(file)
    }

    window.addEventListener("paste", handlePaste)

    return () => {
      window.removeEventListener("paste", handlePaste)
    }
  }, [handleFile])

  async function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (file) {
      await handleFile(file)
    }
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files[0]

    if (file?.type.startsWith("image/")) {
      await handleFile(file)
      return
    }

    setError("Drop an image file")
  }

  async function handleExportPng() {
    if (!source) {
      return
    }

    setStatus("exporting")

    try {
      const result = await processingJobs.runExportJob({
        sourceKey: source.id,
        image: source.buffer,
        settings,
      })
      const blob = await pixelBufferToPngBlob(result.image)
      downloadBlob(blob, makeExportName(source.name, "png"))
      setMetadata(result.metadata)
      setError(null)
      setStatus("ready")
    } catch (exportError) {
      setError(
        exportError instanceof Error ? exportError.message : "Export failed"
      )
      setStatus("error")
    }
  }

  async function handleCopySettings() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(settings, null, 2))
      setError(null)
      setSourceNotice("[SETTINGS COPIED TO CLIPBOARD]")
    } catch (settingsError) {
      setError(
        settingsError instanceof Error
          ? settingsError.message
          : "Settings copy failed"
      )
    }
  }

  async function handlePasteSettings() {
    try {
      const clipboardText = await navigator.clipboard.readText()
      const parsed = safeNormalizeSettings(JSON.parse(clipboardText))

      if (!parsed) {
        throw new Error("Clipboard JSON does not match settings schema v1")
      }

      const result = transitionSettings(
        { type: "apply-settings", settings: parsed },
        transitionContext
      )
      setError(null)
      setSourceNotice(
        result.sourceNotice
          ? `[SETTINGS PASTED FROM CLIPBOARD] ${result.sourceNotice}`
          : "[SETTINGS PASTED FROM CLIPBOARD]"
      )
    } catch (settingsError) {
      setError(
        settingsError instanceof Error
          ? settingsError.message
          : "Settings paste failed"
      )
    }
  }

  const showOriginal = compareMode === "original"
  const showProcessed = compareMode === "processed"
  const comparisonFrameWidth = preview?.width ?? source?.buffer.width
  const comparisonFrameHeight = preview?.height ?? source?.buffer.height
  const previewReduced = preview
    ? preview.width !== settings.resize.width ||
      preview.height !== settings.resize.height
    : false
  const busy =
    status === "queued" || status === "processing" || status === "exporting"

  return (
    <main
      className="h-svh w-full overflow-hidden bg-background text-foreground"
      onDragEnter={(event) => {
        event.preventDefault()
        setDragActive(true)
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1800px] min-w-0 flex-col gap-3 overflow-hidden p-3">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="size-2 rounded-full bg-destructive" />
              <h1 className="font-display text-3xl leading-none tracking-[-0.04em] md:text-4xl">
                IMDITHER
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <section className="grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_420px] xl:grid-rows-1">
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <Card
              className={cn(
                "relative h-full min-h-0 min-w-0 flex-1 overflow-hidden border-border bg-card py-3",
                dragActive && "border-destructive"
              )}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <ProcessingOverlay
                algorithm={settings.algorithm}
                busy={busy}
                previewReduced={isDesktopViewScale && previewReduced}
                status={status}
              />
              <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden px-0">
                <div
                  className={cn(
                    "dot-grid-subtle m-3 flex min-h-0 flex-1 bg-background ring-1 ring-foreground/10",
                    viewScale === "fit"
                      ? "items-center justify-center overflow-hidden"
                      : "overflow-auto"
                  )}
                >
                  {!source ? (
                    <Empty className="border-0">
                      <EmptyHeader>
                        <EmptyTitle>[WAITING FOR IMAGE]</EmptyTitle>
                        <EmptyDescription>
                          Drop, paste, upload, or load the bundled demo.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <div className="grid h-full min-h-0 w-full items-stretch gap-3">
                      {compareMode === "slide" ? (
                        <SlideComparePreview
                          dividerPercent={slideDividerPercent}
                          original={source.buffer}
                          processed={preview}
                          status={status}
                          viewScale={viewScale}
                          onDividerChange={setSlideDividerPercent}
                        />
                      ) : null}
                      {showOriginal ? (
                        <CanvasPanel
                          buffer={source.buffer}
                          label="Original"
                          expectedHeight={
                            comparisonFrameHeight ?? source.buffer.height
                          }
                          expectedWidth={
                            comparisonFrameWidth ?? source.buffer.width
                          }
                          viewScale={viewScale}
                        />
                      ) : null}
                      {showProcessed ? (
                        <CanvasPanel
                          buffer={preview}
                          expectedHeight={settings.resize.height}
                          expectedWidth={settings.resize.width}
                          label="Processed"
                          missing={!preview}
                          status={status}
                          viewScale={viewScale}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="mx-3 mb-3 grid shrink-0 grid-cols-1 items-stretch gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                  <div className="order-1 flex min-w-0 items-center gap-2 md:order-2 md:justify-center">
                    <Input
                      ref={fileInputRef}
                      className="sr-only"
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                    />
                    <Button
                      className="min-w-0 flex-1 md:w-36 md:flex-none"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadIcon data-icon="inline-start" />
                      Upload
                    </Button>
                    <Button
                      className="min-w-0 flex-1 md:w-36 md:flex-none"
                      disabled={!source || status === "exporting"}
                      onClick={handleExportPng}
                    >
                      <DownloadIcon data-icon="inline-start" />
                      {status === "exporting" ? "[EXPORTING]" : "Export PNG"}
                    </Button>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={viewScale}
                    variant="outline"
                    className="order-2 hidden h-full w-full md:order-1 md:flex md:max-w-72"
                    onValueChange={(value) => {
                      if (value) {
                        setViewScale(value as ViewScale)
                      }
                    }}
                  >
                    <ToggleGroupItem value="fit" className="h-full flex-1">
                      Fit
                    </ToggleGroupItem>
                    <ToggleGroupItem value="actual" className="h-full flex-1">
                      1:1
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <div
                    aria-hidden="true"
                    className="order-3 hidden min-w-0 md:block"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <ControlPanel
            advancedOpen={advancedOpen}
            compareMode={compareMode}
            settings={settings}
            onAdvancedOpenChange={setAdvancedOpen}
            onCompareModeChange={setCompareMode}
            onCopySettings={handleCopySettings}
            onPasteSettings={handlePasteSettings}
            onResolutionWidthChange={(width) =>
              transitionSettings(
                { type: "set-output-width", width },
                transitionContext
              )
            }
            onReset={() =>
              transitionSettings({ type: "reset-defaults" }, transitionContext)
            }
            onSettingsTransition={(transition) =>
              transitionSettings(transition, transitionContext)
            }
            resolutionAspectLabel={aspectLabel}
          />
        </section>
      </div>
    </main>
  )
}

function ProcessingOverlay({
  algorithm,
  busy,
  previewReduced,
  status,
}: {
  algorithm: DitherAlgorithm
  busy: boolean
  previewReduced: boolean
  status: ReturnType<typeof useEditorStore.getState>["status"]
}) {
  if (!busy && !previewReduced) {
    return null
  }

  const title =
    status === "exporting"
      ? "EXPORTING PNG"
      : busy
        ? "PROCESSING PREVIEW"
        : "PREVIEW ONLY"
  const detail =
    status === "exporting"
      ? "Preparing full-size PNG export."
      : previewReduced
        ? `Showing reduced preview while full ${algorithm} output catches up.`
        : status === "queued"
          ? "Queued. Controls remain editable."
          : `${algorithm} worker is running. New changes replace queued preview.`

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-20 rounded-xl border border-primary bg-background/95 p-3 shadow-none">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-display text-2xl leading-none tracking-[-0.04em] uppercase">
            {title}
          </div>
          <div className="mt-1 truncate font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
            {detail}
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-5 gap-1" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span
              key={index}
              className="h-3 w-3 animate-pulse bg-primary"
              style={{ animationDelay: `${index * 70}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const nextTheme = theme === "light" ? "dark" : "light"
  const isLight = theme === "light"

  return (
    <Button
      type="button"
      aria-label={`Switch to ${nextTheme} theme`}
      aria-pressed={isLight}
      className="font-mono text-xs uppercase"
      variant="outline"
      onClick={() => setTheme(nextTheme)}
    >
      {isLight ? (
        <MoonIcon data-icon="inline-start" />
      ) : (
        <SunIcon data-icon="inline-start" />
      )}
      {isLight ? "Dark theme" : "Light theme"}
    </Button>
  )
}

function ControlPanel({
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
}: {
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
}) {
  const selectedAlgorithmOption = getDitherAlgorithmOption(settings.algorithm)

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

              <Field>
                <FieldLabel htmlFor="fit">Fit</FieldLabel>
                <Select
                  value={settings.resize.fit}
                  onValueChange={(fit) =>
                    onSettingsTransition({
                      type: "set-resize-fit",
                      fit: fit as ResizeFit,
                    })
                  }
                >
                  <SelectTrigger id="fit" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="contain">Contain</SelectItem>
                      <SelectItem value="cover">Cover</SelectItem>
                      <SelectItem value="stretch">Stretch</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

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
                  <Button variant="ghost" onClick={onReset}>
                    Reset persisted controls
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </FieldGroup>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

function CanvasPanel({
  buffer,
  expectedHeight,
  expectedWidth,
  label,
  missing = false,
  status,
  viewScale,
}: {
  buffer: LoadedSource["buffer"] | null
  expectedHeight: number
  expectedWidth: number
  label: string
  missing?: boolean
  status?: string
  viewScale: ViewScale
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const frameStyle = getPreviewFrameStyle({
    sourceHeight: expectedHeight,
    sourceWidth: expectedWidth,
    viewScale,
  })

  React.useEffect(() => {
    if (!buffer || !canvasRef.current) {
      return
    }

    drawPixelBuffer(canvasRef.current, buffer)
  }, [buffer])

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col p-1">
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 items-center justify-center",
          viewScale === "fit" ? "overflow-hidden" : "overflow-auto",
          viewScale === "actual" && "items-start justify-start"
        )}
        style={viewScale === "fit" ? { containerType: "size" } : undefined}
      >
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-background ring-1 ring-foreground/10",
            missing && "border border-dashed border-border ring-0",
            viewScale === "actual" && "h-fit w-fit max-w-none"
          )}
          style={frameStyle}
        >
          {missing ? (
            <PreviewPlaceholder
              height={expectedHeight}
              status={status}
              width={expectedWidth}
            />
          ) : (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 block size-full bg-background"
            />
          )}
          <div className="pointer-events-none absolute inset-x-2 top-2 flex items-center font-mono text-[10px] tracking-[0.1em] text-foreground/80 uppercase">
            <span className="bg-background/80 px-1.5 py-0.5">{label}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewPlaceholder({
  height,
  status,
  width,
}: {
  height: number
  status?: string
  width: number
}) {
  return (
    <div className="dot-grid-subtle flex size-full items-center justify-center bg-background text-center">
      <div className="flex flex-col gap-1 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
        <span>[{status ?? "processing"}]</span>
        <span>
          {width}x{height}
        </span>
      </div>
    </div>
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

function formatAspectRatio(width: number, height: number): string {
  const safeWidth = Math.max(1, Math.round(width))
  const safeHeight = Math.max(1, Math.round(height))
  const divisor = greatestCommonDivisor(safeWidth, safeHeight)

  return `${safeWidth / divisor}:${safeHeight / divisor}`
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)

  while (b > 0) {
    const next = a % b
    a = b
    b = next
  }

  return Math.max(1, a)
}

function makeExportName(sourceName: string, extension: "png" | "json") {
  const base = sourceName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()

  return `imdither-${base || "export"}.${extension}`
}
