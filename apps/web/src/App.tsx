import * as React from "react"
import {
  DEFAULT_SETTINGS,
  MAX_OUTPUT_PIXELS,
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
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
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
  ImageIcon,
  RotateCcwIcon,
  UploadIcon,
} from "lucide-react"

import {
  createDemoSource,
  decodeImageFile,
  downloadBlob,
  drawPixelBuffer,
  fitWithinOutputBudget,
  INTERACTIVE_PREVIEW_PIXEL_BUDGET,
  makePreviewSettings,
  pickImageFromClipboard,
  pixelBufferToPngBlob,
  type LoadedSource,
} from "@/lib/image"
import { runDitherJob } from "@/lib/worker-client"
import {
  paletteName,
  useEditorStore,
  type CompareMode,
  type ViewScale,
} from "@/store/editor-store"

export function App() {
  const {
    settings,
    compareMode,
    viewScale,
    advancedOpen,
    status,
    error,
    sourceNotice,
    metadata,
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
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const jobIdRef = React.useRef(0)
  const previewRunRef = React.useRef(0)
  const nextJobId = React.useCallback(() => {
    jobIdRef.current += 1
    return jobIdRef.current
  }, [])
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

    const controller = new AbortController()
    const previewRunId = previewRunRef.current + 1
    previewRunRef.current = previewRunId
    const quickSettings = makePreviewSettings(
      settings,
      INTERACTIVE_PREVIEW_PIXEL_BUDGET
    )
    const finalSettings = makePreviewSettings(settings)
    const shouldRefine =
      quickSettings.resize.width !== finalSettings.resize.width ||
      quickSettings.resize.height !== finalSettings.resize.height
    const isCurrentRun = () =>
      !controller.signal.aborted && previewRunRef.current === previewRunId
    const applyPreviewResult = (
      result: Awaited<ReturnType<typeof runDitherJob>>
    ) => {
      if (!isCurrentRun()) {
        return false
      }

      setPreview(result.image)
      setMetadata({
        ...result.metadata,
        outputWidth: settings.resize.width,
        outputHeight: settings.resize.height,
      })
      setError(null)
      return true
    }
    const handlePreviewError = (jobError: unknown) => {
      if (
        controller.signal.aborted ||
        (jobError instanceof DOMException && jobError.name === "AbortError") ||
        !isCurrentRun()
      ) {
        return
      }

      setError(jobError instanceof Error ? jobError.message : "Job failed")
      setStatus("error")
    }

    setStatus("queued")
    const quickTimeout = window.setTimeout(() => {
      if (!isCurrentRun()) {
        return
      }

      setStatus("processing")
      runDitherJob({
        jobId: nextJobId(),
        sourceKey: source.id,
        image: source.buffer,
        settings: quickSettings,
        signal: controller.signal,
      })
        .then((result) => {
          if (!applyPreviewResult(result)) {
            return
          }

          setStatus("ready")
        })
        .catch(handlePreviewError)
    }, 120)
    const refineTimeout = shouldRefine
      ? window.setTimeout(() => {
          if (!isCurrentRun()) {
            return
          }

          runDitherJob({
            jobId: nextJobId(),
            sourceKey: source.id,
            image: source.buffer,
            settings: finalSettings,
            signal: controller.signal,
          })
            .then((result) => {
              if (!applyPreviewResult(result)) {
                return
              }

              setStatus("ready")
            })
            .catch(handlePreviewError)
        }, 650)
      : undefined

    return () => {
      window.clearTimeout(quickTimeout)

      if (refineTimeout) {
        window.clearTimeout(refineTimeout)
      }

      controller.abort()
    }
  }, [nextJobId, settings, source, setError, setMetadata, setStatus])

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

    previewRunRef.current += 1
    setStatus("exporting")

    try {
      const result = await runDitherJob({
        jobId: nextJobId(),
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

  const showOriginal = compareMode === "original" || compareMode === "split"
  const showProcessed = compareMode === "processed" || compareMode === "split"
  const pixelLoad = settings.resize.width * settings.resize.height
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
        <header className="grid shrink-0 gap-3 border-b border-border pb-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="size-2 rounded-full bg-destructive" />
              <h1 className="font-display text-3xl leading-none tracking-[-0.04em] md:text-4xl">
                IMDITHER
              </h1>
            </div>
            <HeaderStats
              error={error}
              metadata={metadata}
              notice={sourceNotice ?? source?.notice ?? null}
              pixelLoad={pixelLoad}
              previewReduced={previewReduced}
              settings={settings}
              source={source}
              status={status}
            />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
            <Input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={handleFileInput}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon data-icon="inline-start" />
              Upload
            </Button>
            <Button
              variant="outline"
              onClick={() => loadSource(createDemoSource())}
            >
              <ImageIcon data-icon="inline-start" />
              Demo
            </Button>
            <Button
              disabled={!source || status === "exporting"}
              onClick={handleExportPng}
            >
              <DownloadIcon data-icon="inline-start" />
              {status === "exporting" ? "[EXPORTING]" : "Export PNG"}
            </Button>
          </div>
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
                status={status}
              />
              <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden px-3">
                <div
                  className={cn(
                    "dot-grid-subtle flex min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-background p-2",
                    viewScale === "fit" && "items-center justify-center"
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
                        compareMode === "split" && "lg:grid-cols-2",
                        viewScale === "fit" && "items-center"
                      )}
                    >
                      {showOriginal && (
                        <CanvasPanel
                          buffer={source.buffer}
                          label="Original"
                          expectedHeight={source.buffer.height}
                          expectedWidth={source.buffer.width}
                          viewScale={viewScale}
                        />
                      )}
                      {showProcessed && (
                        <CanvasPanel
                          buffer={preview}
                          expectedHeight={settings.resize.height}
                          expectedWidth={settings.resize.width}
                          label="Processed"
                          missing={!preview}
                          status={status}
                          viewScale={viewScale}
                        />
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <ControlPanel
            advancedOpen={advancedOpen}
            compareMode={compareMode}
            paletteDefaultMode={palette?.defaultColorMode ?? "grayscale-first"}
            settings={settings}
            viewScale={viewScale}
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
            onViewScaleChange={setViewScale}
          />
        </section>
      </div>
    </main>
  )
}

function HeaderStats({
  error,
  metadata,
  notice,
  pixelLoad,
  previewReduced,
  settings,
  source,
  status,
}: {
  error: string | null
  metadata: ReturnType<typeof useEditorStore.getState>["metadata"]
  notice: string | null
  pixelLoad: number
  previewReduced: boolean
  settings: EditorSettings
  source: LoadedSource | null
  status: ReturnType<typeof useEditorStore.getState>["status"]
}) {
  const statusText = error
    ? `error: ${error}`
    : previewReduced
      ? "preview reduced"
      : notice || status

  return (
    <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
      <Badge
        variant={error ? "destructive" : "outline"}
        className="max-w-52 truncate"
      >
        {statusText}
      </Badge>
      <Badge variant="outline">
        {source
          ? `${source.buffer.width}x${source.buffer.height}`
          : "no source"}
      </Badge>
      <Badge variant="outline">
        out {settings.resize.width}x{settings.resize.height}
      </Badge>
      <Badge variant="outline">
        {metadata?.algorithmName ?? settings.algorithm}
      </Badge>
      <Badge variant="outline">
        {metadata ? `${metadata.processingTimeMs}ms` : "--ms"}
      </Badge>
      <div className="flex w-32 flex-col gap-1">
        <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
          <span>{status}</span>
          <span>{Math.round((pixelLoad / MAX_OUTPUT_PIXELS) * 100)}%</span>
        </div>
        <SegmentBar value={pixelLoad / MAX_OUTPUT_PIXELS} />
      </div>
    </div>
  )
}

function ProcessingOverlay({
  algorithm,
  busy,
  status,
}: {
  algorithm: DitherAlgorithm
  busy: boolean
  status: ReturnType<typeof useEditorStore.getState>["status"]
}) {
  if (!busy) {
    return null
  }

  const title = status === "exporting" ? "EXPORTING PNG" : "PROCESSING PREVIEW"
  const detail =
    status === "queued"
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

function ControlPanel({
  advancedOpen,
  compareMode,
  paletteDefaultMode,
  settings,
  viewScale,
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
  onViewScaleChange,
}: {
  advancedOpen: boolean
  compareMode: CompareMode
  paletteDefaultMode: ColorMode
  settings: EditorSettings
  viewScale: ViewScale
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
  onViewScaleChange: (scale: ViewScale) => void
}) {
  return (
    <aside className="h-full max-h-full min-h-0 min-w-0 overflow-hidden">
      <Card className="flex h-full min-h-0 min-w-0 overflow-hidden border-border bg-card py-3">
        <CardHeader className="shrink-0">
          <CardTitle>Control Panel</CardTitle>
          <CardDescription>
            Basic controls stay visible. Advanced tone path is collapsed.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 min-w-0 flex-1 basis-0 overflow-x-hidden overflow-y-auto overscroll-contain pr-3">
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
                      colorMode: preset?.defaultColorMode ?? paletteDefaultMode,
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
              <FieldDescription>
                Current: {paletteName(settings.paletteId)}
              </FieldDescription>
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
                      onPatchSettings({ bayerSize: Number(value) as BayerSize })
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
              <ToggleGroup
                type="single"
                value={compareMode}
                variant="outline"
                className="w-full"
                onValueChange={(value) => {
                  if (value) {
                    onCompareModeChange(value as CompareMode)
                  }
                }}
              >
                <ToggleGroupItem value="processed" className="flex-1">
                  Processed
                </ToggleGroupItem>
                <ToggleGroupItem value="split" className="flex-1">
                  Split
                </ToggleGroupItem>
                <ToggleGroupItem value="original" className="flex-1">
                  Original
                </ToggleGroupItem>
              </ToggleGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label">View</FieldLegend>
              <ToggleGroup
                type="single"
                value={viewScale}
                variant="outline"
                className="w-full"
                onValueChange={(value) => {
                  if (value) {
                    onViewScaleChange(value as ViewScale)
                  }
                }}
              >
                <ToggleGroupItem value="fit" className="flex-1">
                  Fit
                </ToggleGroupItem>
                <ToggleGroupItem value="actual" className="flex-1">
                  1:1
                </ToggleGroupItem>
              </ToggleGroup>
            </FieldSet>

            <NumberField
              label="Width"
              value={settings.resize.width}
              description={`Height inferred: ${settings.resize.height}px / aspect ${resolutionAspectLabel}`}
              onChange={onResolutionWidthChange}
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
                <ToggleGroupItem value="black" className="flex-1">
                  Black
                </ToggleGroupItem>
                <ToggleGroupItem value="white" className="flex-1">
                  White
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
                <ToggleGroupItem value="grayscale-first" className="flex-1">
                  Gray
                </ToggleGroupItem>
                <ToggleGroupItem value="color-preserve" className="flex-1">
                  Color
                </ToggleGroupItem>
              </ToggleGroup>
            </FieldSet>

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
                    onCheckedChange={(invert) => onPatchPreprocess({ invert })}
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

  React.useEffect(() => {
    if (!buffer || !canvasRef.current) {
      return
    }

    drawPixelBuffer(canvasRef.current, buffer)
  }, [buffer])

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
        <span>{label}</span>
        <span>{missing ? `[${status ?? "waiting"}]` : "[ready]"}</span>
      </div>
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-auto rounded-lg border border-border bg-card p-2",
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

function SegmentBar({ value }: { value: number }) {
  const activeSegments = Math.min(12, Math.ceil(value * 12))
  const overLimit = value > 1

  return (
    <div className="grid grid-cols-12 gap-0.5" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-2 bg-muted",
            index < activeSegments &&
              (overLimit ? "bg-destructive" : "bg-primary")
          )}
        />
      ))}
    </div>
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
