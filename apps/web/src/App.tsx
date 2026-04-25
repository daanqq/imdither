import * as React from "react"
import {
  DEFAULT_SETTINGS,
  PRESET_PALETTES,
  clampOutputSize,
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
import { Slider } from "@workspace/ui/components/slider"
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

import { useTheme } from "@/components/theme-provider"
import {
  createDemoSource,
  decodeImageFile,
  downloadBlob,
  drawPixelBuffer,
  fitWithinOutputBudget,
  pickImageFromClipboard,
  pixelBufferToPngBlob,
  type LoadedSource,
} from "@/lib/image"
import { createProcessingJobs } from "@/lib/processing-jobs"
import {
  SLIDE_COMPARE_DEFAULT,
  SLIDE_COMPARE_MAX,
  SLIDE_COMPARE_MIN,
  clampSlideDivider,
  getSlideDividerFromClientX,
  getSlideDividerFromKey,
} from "@/lib/slide-compare"
import {
  useEditorStore,
  type CompareMode,
  type ViewScale,
} from "@/store/editor-store"

const SLIDE_COMPARE_FIT_INSET = 12
const DESKTOP_VIEW_SCALE_QUERY = "(min-width: 768px)"

export function App() {
  const {
    settings,
    compareMode,
    viewScale,
    advancedOpen,
    status,
    setSettings,
    patchSettings,
    patchResize,
    patchPreprocess,
    setCompareMode,
    setViewScale,
    setAdvancedOpen,
    setStatus,
    setError,
    setSourceNotice,
    setMetadata,
  } = useEditorStore()
  const [source, setSource] = React.useState<LoadedSource | null>(() =>
    createDemoSource()
  )
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
  const sourceAspectRatio =
    source && source.buffer.width > 0
      ? source.buffer.height / source.buffer.width
      : settings.resize.height / settings.resize.width
  const aspectLabel = source
    ? formatAspectRatio(source.buffer.width, source.buffer.height)
    : formatAspectRatio(settings.resize.width, settings.resize.height)
  const aspectLockedResize = React.useCallback(
    (width: number) => getAspectLockedResize(width, sourceAspectRatio),
    [sourceAspectRatio]
  )
  const patchResolutionWidth = React.useCallback(
    (width: number) => {
      patchResize(aspectLockedResize(width))
    },
    [aspectLockedResize, patchResize]
  )
  const setAspectLockedSettings = React.useCallback(
    (nextSettings: EditorSettings) => {
      setSettings({
        ...nextSettings,
        resize: {
          ...nextSettings.resize,
          ...aspectLockedResize(nextSettings.resize.width),
        },
      })
    },
    [aspectLockedResize, setSettings]
  )
  const resetAspectLockedSettings = React.useCallback(() => {
    setAspectLockedSettings(DEFAULT_SETTINGS)
  }, [setAspectLockedSettings])

  const loadSource = React.useCallback(
    (nextSource: LoadedSource) => {
      const outputSize = fitWithinOutputBudget(
        nextSource.buffer.width,
        nextSource.buffer.height
      )
      const notice = [
        nextSource.notice,
        outputSize.downscaled
          ? `[OUTPUT AUTO-SIZED: ${outputSize.width}x${outputSize.height} / 12MP]`
          : null,
      ]
        .filter(Boolean)
        .join(" ")

      setSource(nextSource)
      setPreview(null)
      setError(null)
      setSourceNotice(notice || null)
      patchResize({
        width: outputSize.width,
        height: outputSize.height,
      })
    },
    [patchResize, setError, setSourceNotice]
  )

  React.useEffect(() => {
    if (!source) {
      return
    }

    const nextResize = aspectLockedResize(settings.resize.width)

    if (
      nextResize.width !== settings.resize.width ||
      nextResize.height !== settings.resize.height
    ) {
      patchResize(nextResize)
    }
  }, [
    aspectLockedResize,
    patchResize,
    settings.resize.height,
    settings.resize.width,
    source,
  ])

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
        loadSource(await decodeImageFile(file))
      } catch (fileError) {
        setError(
          fileError instanceof Error ? fileError.message : "Image decode failed"
        )
        setStatus("error")
      }
    },
    [loadSource, setError, setStatus]
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

      setAspectLockedSettings(parsed)
      setError(null)
      setSourceNotice("[SETTINGS PASTED FROM CLIPBOARD]")
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
  const previewReduced = preview
    ? preview.width !== settings.resize.width ||
      preview.height !== settings.resize.height
    : false
  const palette = PRESET_PALETTES.find(
    (preset) => preset.id === settings.paletteId
  )
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
                    <div
                      className={cn(
                        "grid h-full min-h-0 w-full gap-3",
                        viewScale === "fit" &&
                          (compareMode === "slide"
                            ? "items-stretch"
                            : "items-center")
                      )}
                    >
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
                          expectedHeight={source.buffer.height}
                          expectedWidth={source.buffer.width}
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
            paletteDefaultMode={palette?.defaultColorMode ?? "grayscale-first"}
            settings={settings}
            onAdvancedOpenChange={setAdvancedOpen}
            onCompareModeChange={setCompareMode}
            onCopySettings={handleCopySettings}
            onPasteSettings={handlePasteSettings}
            onPatchPreprocess={patchPreprocess}
            onPatchResize={patchResize}
            onPatchSettings={patchSettings}
            onResolutionWidthChange={patchResolutionWidth}
            onReset={resetAspectLockedSettings}
            onSetSettings={setAspectLockedSettings}
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
  paletteDefaultMode,
  settings,
  onAdvancedOpenChange,
  onCompareModeChange,
  onCopySettings,
  onPasteSettings,
  onPatchPreprocess,
  onPatchResize,
  onPatchSettings,
  onResolutionWidthChange,
  onReset,
  onSetSettings,
  resolutionAspectLabel,
}: {
  advancedOpen: boolean
  compareMode: CompareMode
  paletteDefaultMode: ColorMode
  settings: EditorSettings
  onAdvancedOpenChange: (open: boolean) => void
  onCompareModeChange: (mode: CompareMode) => void
  onCopySettings: () => void
  onPasteSettings: () => void
  onPatchPreprocess: (patch: Partial<EditorSettings["preprocess"]>) => void
  onPatchResize: (patch: Partial<EditorSettings["resize"]>) => void
  onPatchSettings: (patch: Partial<EditorSettings>) => void
  onResolutionWidthChange: (width: number) => void
  onReset: () => void
  onSetSettings: (settings: EditorSettings) => void
  resolutionAspectLabel: string
}) {
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
                  onValueChange={(paletteId) => {
                    const preset = PRESET_PALETTES.find(
                      (item) => item.id === paletteId
                    )
                    onSetSettings({
                      ...settings,
                      paletteId,
                      preprocess: {
                        ...settings.preprocess,
                        colorMode:
                          preset?.defaultColorMode ?? paletteDefaultMode,
                      },
                    })
                  }}
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
                    onPatchSettings({ algorithm: algorithm as DitherAlgorithm })
                  }
                >
                  <SelectTrigger id="algorithm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="bayer">Bayer</SelectItem>
                      <SelectItem value="matt-parker">Matt Parker</SelectItem>
                      <SelectItem value="floyd-steinberg">
                        Floyd-Steinberg
                      </SelectItem>
                      <SelectItem value="atkinson">Atkinson</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {settings.algorithm === "bayer" && (
                <Field>
                  <FieldLabel>Bayer Matrix</FieldLabel>
                  <ToggleGroup
                    type="single"
                    value={String(settings.bayerSize)}
                    variant="outline"
                    className="w-full"
                    onValueChange={(value) => {
                      if (value) {
                        onPatchSettings({
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

              <SliderField
                label="Brightness"
                max={100}
                min={-100}
                step={1}
                value={settings.preprocess.brightness}
                onChange={(brightness) => onPatchPreprocess({ brightness })}
              />
              <SliderField
                label="Contrast"
                max={100}
                min={-100}
                step={1}
                value={settings.preprocess.contrast}
                onChange={(contrast) => onPatchPreprocess({ contrast })}
              />

              <Field>
                <FieldLabel htmlFor="fit">Fit</FieldLabel>
                <Select
                  value={settings.resize.fit}
                  onValueChange={(fit) =>
                    onPatchResize({ fit: fit as ResizeFit })
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
                          onPatchResize({ mode: value as ResizeMode })
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
                          onPatchSettings({
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
                          onPatchPreprocess({ colorMode: value as ColorMode })
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
                  <SliderField
                    label="Gamma"
                    max={3}
                    min={0.2}
                    step={0.05}
                    value={settings.preprocess.gamma}
                    onChange={(gamma) => onPatchPreprocess({ gamma })}
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
                        onPatchPreprocess({ invert })
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
                      onClick={() => onSetSettings(DEFAULT_SETTINGS)}
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

function SlideComparePreview({
  dividerPercent,
  original,
  processed,
  status,
  viewScale,
  onDividerChange,
}: {
  dividerPercent: number
  original: LoadedSource["buffer"]
  processed: LoadedSource["buffer"] | null
  status?: string
  viewScale: ViewScale
  onDividerChange: (percent: number) => void
}) {
  const originalCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const processedCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const dividerLineRef = React.useRef<HTMLDivElement>(null)
  const dividerHandleRef = React.useRef<HTMLButtonElement>(null)
  const dividerPercentRef = React.useRef(clampSlideDivider(dividerPercent))
  const pendingDividerPercentRef = React.useRef(dividerPercentRef.current)
  const dividerAnimationFrameRef = React.useRef<number | null>(null)
  const processedReady = Boolean(processed)
  const frameWidth = processed?.width ?? original.width
  const frameHeight = processed?.height ?? original.height
  const clampedDivider = clampSlideDivider(dividerPercent)
  const [viewportSize, setViewportSize] = React.useState<{
    height: number
    width: number
  } | null>(null)
  const displaySize =
    viewScale === "fit" && viewportSize
      ? getContainedSize(
          frameWidth,
          frameHeight,
          viewportSize.width - SLIDE_COMPARE_FIT_INSET,
          viewportSize.height - SLIDE_COMPARE_FIT_INSET
        )
      : { height: frameHeight, width: frameWidth }

  React.useEffect(() => {
    if (!originalCanvasRef.current) {
      return
    }

    drawPixelBuffer(originalCanvasRef.current, original)
  }, [original])

  React.useEffect(() => {
    if (!processed || !processedCanvasRef.current) {
      return
    }

    drawPixelBuffer(processedCanvasRef.current, processed)
    applyDividerVisual(dividerPercentRef.current)
  }, [processed])

  React.useEffect(() => {
    dividerPercentRef.current = clampedDivider
    pendingDividerPercentRef.current = clampedDivider
    applyDividerVisual(clampedDivider)
  }, [clampedDivider])

  React.useEffect(() => {
    return () => {
      if (dividerAnimationFrameRef.current !== null) {
        cancelAnimationFrame(dividerAnimationFrameRef.current)
      }
    }
  }, [])

  React.useLayoutEffect(() => {
    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    const updateViewportSize = () => {
      const rect = viewport.getBoundingClientRect()
      setViewportSize((current) => {
        const next = {
          height: Math.floor(rect.height),
          width: Math.floor(rect.width),
        }

        if (
          current &&
          current.height === next.height &&
          current.width === next.width
        ) {
          return current
        }

        return next
      })
    }

    updateViewportSize()
    const frameId = requestAnimationFrame(updateViewportSize)

    const observer = new ResizeObserver(updateViewportSize)
    observer.observe(viewport)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [])

  function applyDividerVisual(percent: number) {
    const nextPercent = clampSlideDivider(percent)

    if (processedCanvasRef.current) {
      processedCanvasRef.current.style.clipPath = `inset(0 0 0 ${nextPercent}%)`
    }

    if (dividerLineRef.current) {
      dividerLineRef.current.style.left = `${nextPercent}%`
    }

    if (dividerHandleRef.current) {
      dividerHandleRef.current.style.left = `${nextPercent}%`
      dividerHandleRef.current.setAttribute(
        "aria-valuenow",
        String(Math.round(nextPercent))
      )
    }
  }

  function scheduleDividerVisual(percent: number) {
    pendingDividerPercentRef.current = clampSlideDivider(percent)

    if (dividerAnimationFrameRef.current !== null) {
      return
    }

    dividerAnimationFrameRef.current = requestAnimationFrame(() => {
      dividerAnimationFrameRef.current = null
      applyDividerVisual(pendingDividerPercentRef.current)
    })
  }

  function commitDividerVisual(percent: number) {
    const nextPercent = clampSlideDivider(percent)
    dividerPercentRef.current = nextPercent
    pendingDividerPercentRef.current = nextPercent
    applyDividerVisual(nextPercent)
    onDividerChange(nextPercent)
  }

  function getDividerPercentFromPointer(clientX: number) {
    const frame = frameRef.current

    if (!frame || !processedReady) {
      return null
    }

    const rect = frame.getBoundingClientRect()
    return getSlideDividerFromClientX(clientX, rect.left, rect.width)
  }

  function updateDividerFromPointer(clientX: number) {
    const nextPercent = getDividerPercentFromPointer(clientX)

    if (nextPercent === null) {
      return
    }

    scheduleDividerVisual(nextPercent)
  }

  function commitDividerFromPointer(clientX: number) {
    const nextPercent = getDividerPercentFromPointer(clientX)

    if (nextPercent === null) {
      return
    }

    commitDividerVisual(nextPercent)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const nextPercent = getSlideDividerFromKey(
      clampedDivider,
      event.key,
      event.shiftKey
    )

    if (nextPercent === null) {
      return
    }

    event.preventDefault()
    commitDividerVisual(nextPercent)
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col p-1">
      <div
        ref={viewportRef}
        className={cn(
          "flex min-h-0 min-w-0 flex-1 items-center justify-center",
          viewScale === "fit" ? "overflow-hidden" : "overflow-auto",
          viewScale === "actual" && "items-start justify-start"
        )}
      >
        <div
          ref={frameRef}
          className={cn(
            "relative overflow-hidden bg-background ring-1 ring-foreground/10",
            processedReady && "cursor-ew-resize",
            viewScale === "fit" ? "shrink-0" : "h-fit w-fit max-w-none"
          )}
          style={{
            height: `${displaySize.height}px`,
            width: `${displaySize.width}px`,
          }}
          onPointerDown={(event) => {
            if (!processedReady) {
              return
            }

            event.currentTarget.setPointerCapture(event.pointerId)
            updateDividerFromPointer(event.clientX)
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              updateDividerFromPointer(event.clientX)
            }
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }

            commitDividerFromPointer(event.clientX)
          }}
          onPointerCancel={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
          }}
        >
          <canvas
            ref={originalCanvasRef}
            className="absolute inset-0 block size-full bg-background"
          />
          {processedReady ? (
            <canvas
              ref={processedCanvasRef}
              className="absolute inset-0 block size-full bg-background"
              style={{
                clipPath: `inset(0 0 0 ${clampedDivider}%)`,
              }}
            />
          ) : null}
          <div className="pointer-events-none absolute inset-x-2 top-2 flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.1em] text-foreground/80 uppercase">
            <span className="bg-background/80 px-1.5 py-0.5">Original</span>
            <span className="bg-background/80 px-1.5 py-0.5">Processed</span>
          </div>
          {processedReady ? (
            <>
              <div
                ref={dividerLineRef}
                className="pointer-events-none absolute inset-y-0 w-px bg-foreground ring-1 ring-background/75"
                style={{ left: `${clampedDivider}%` }}
              />
              <button
                ref={dividerHandleRef}
                type="button"
                aria-label="Slide comparison divider"
                aria-valuemax={SLIDE_COMPARE_MAX}
                aria-valuemin={SLIDE_COMPARE_MIN}
                aria-valuenow={Math.round(clampedDivider)}
                className="absolute top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground bg-background font-mono text-[10px] text-foreground ring-2 ring-background/75 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                role="slider"
                style={{ left: `${clampedDivider}%` }}
                onKeyDown={handleKeyDown}
                onPointerDown={(event) => {
                  event.stopPropagation()
                  event.currentTarget.setPointerCapture(event.pointerId)
                  updateDividerFromPointer(event.clientX)
                }}
                onPointerMove={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    updateDividerFromPointer(event.clientX)
                  }
                }}
                onPointerUp={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId)
                  }

                  commitDividerFromPointer(event.clientX)
                }}
                onPointerCancel={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId)
                  }
                }}
              >
                ||
              </button>
            </>
          ) : (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-background/80 p-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              [{status ?? "processing"}]
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getContainedSize(
  sourceWidth: number,
  sourceHeight: number,
  containerWidth: number,
  containerHeight: number
): { height: number; width: number } {
  const safeSourceWidth = Math.max(1, sourceWidth)
  const safeSourceHeight = Math.max(1, sourceHeight)
  const safeContainerWidth = Math.max(1, containerWidth)
  const safeContainerHeight = Math.max(1, containerHeight)
  const scale = Math.min(
    safeContainerWidth / safeSourceWidth,
    safeContainerHeight / safeSourceHeight
  )

  return {
    height: Math.max(1, Math.floor(safeSourceHeight * scale)),
    width: Math.max(1, Math.floor(safeSourceWidth * scale)),
  }
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

  React.useEffect(() => {
    if (!buffer || !canvasRef.current) {
      return
    }

    drawPixelBuffer(canvasRef.current, buffer)
  }, [buffer])

  return (
    <div className="m-1 flex min-h-0 min-w-0 flex-col gap-2">
      <div className="flex items-center font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
        <span>{label}</span>
      </div>
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-auto",
          viewScale === "actual" && "items-start justify-start"
        )}
      >
        {missing ? (
          <PreviewPlaceholder
            height={expectedHeight}
            status={status}
            viewScale={viewScale}
            width={expectedWidth}
          />
        ) : (
          <canvas
            ref={canvasRef}
            className={cn(
              "block bg-background",
              viewScale === "fit"
                ? "max-h-[68vh] max-w-full object-contain"
                : "max-w-none"
            )}
          />
        )}
      </div>
    </div>
  )
}

function PreviewPlaceholder({
  height,
  status,
  viewScale,
  width,
}: {
  height: number
  status?: string
  viewScale: ViewScale
  width: number
}) {
  return (
    <div
      className={cn(
        "dot-grid-subtle flex items-center justify-center border border-dashed border-border bg-background text-center",
        viewScale === "fit" ? "max-h-[68vh] max-w-full" : "max-w-none"
      )}
      style={{
        aspectRatio: `${width} / ${height}`,
        height: viewScale === "actual" ? `${height}px` : undefined,
        width: viewScale === "actual" ? `${width}px` : "min(100%, 100vh)",
      }}
    >
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

function SliderField({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}) {
  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        <span className="font-mono text-xs text-muted-foreground">
          {Number.isInteger(value) ? value : value.toFixed(2)}
        </span>
      </div>
      <Slider
        max={max}
        min={min}
        step={step}
        value={[value]}
        onValueChange={(nextValue) => onChange(nextValue[0] ?? value)}
      />
    </Field>
  )
}

function getAspectLockedResize(width: number, aspectRatio: number) {
  const safeAspectRatio =
    Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1
  const height = Math.max(1, Math.round(width * safeAspectRatio))
  const size = clampOutputSize(width, height)

  return {
    width: size.width,
    height: size.height,
  }
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
