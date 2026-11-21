import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
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
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { ResponsiveDrawer } from "@/components/responsive-drawer"
import {
  PaletteColorInput,
  PaletteHexInput,
} from "@/components/manual/param-controls"

const EXTRACTION_SIZES = [2, 4, 8, 16, 32] as const
const MAX_PALETTE_COLORS = 32
const MIN_PALETTE_COLORS = 2

type ExtractionSize = (typeof EXTRACTION_SIZES)[number]

function getDefaultExtractionSize(colorCount: number): ExtractionSize {
  if (EXTRACTION_SIZES.includes(colorCount as ExtractionSize)) {
    return colorCount as ExtractionSize
  }
  return 8
}

export function PaletteEditorDrawer({
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
  onCopyPaletteJson?: () => void
  onExportPaletteGpl?: () => void
  onExportPaletteJson?: () => void
  onExtractPalette?: (size: ExtractionSize) => void
  onImportPaletteFile?: (file: File) => void
  onImportPaletteFromClipboard?: () => void
}) {
  const { t } = useTranslation()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [extractSize, setExtractSize] = React.useState<ExtractionSize>(() =>
    getDefaultExtractionSize(colors.length)
  )
  const canAddColor = colors.length < MAX_PALETTE_COLORS
  const canDeleteColor = colors.length > MIN_PALETTE_COLORS

  return (
    <ResponsiveDrawer>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
        >
          <PipetteIcon data-icon="inline-start" />
          {t("manual.editColors")}
        </Button>
      </DrawerTrigger>
      <DrawerContent overlayVariant="subtle">
        <DrawerHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <DrawerTitle className="truncate">
                  {t("manual.paletteEditor")}
                </DrawerTitle>
                <span
                  aria-label={t("manual.paletteLimitAria", {
                    count: colors.length,
                    max: MAX_PALETTE_COLORS,
                  })}
                  data-slot="palette-color-count"
                  className="inline-flex shrink-0 items-center rounded-sm border border-border bg-[var(--surface-control)] px-1.5 py-0.5 font-mono text-[11px] leading-none font-medium text-muted-foreground tabular-nums"
                >
                  {colors.length} / {MAX_PALETTE_COLORS}
                </span>
              </div>
              <DrawerDescription className="mt-0.5">
                {t("manual.paletteEditorDesc")}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button
                aria-label={t("common.close")}
                className="-mt-0.5 -mr-1 shrink-0 text-muted-foreground hover:text-foreground"
                size="icon-sm"
                title={t("common.close")}
                type="button"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3.5">
          <div
            data-slot="palette-primary-actions"
            className="grid min-w-0 gap-2"
          >
            <div className="grid min-w-0 gap-1.5 rounded-lg border border-border/80 bg-[var(--surface-control)]/45 p-2.5">
              <span className="font-sans text-xs font-medium text-foreground">
                {t("manual.extractFromImage")}
              </span>
              <div className="flex min-w-0 items-center gap-1.5">
                <ToggleGroup
                  aria-label={t("manual.extractColorCount")}
                  className="min-w-0 flex-1"
                  type="single"
                  value={String(extractSize)}
                  variant="outline"
                  onValueChange={(value) => {
                    const next = Number(value)
                    if (EXTRACTION_SIZES.includes(next as ExtractionSize)) {
                      setExtractSize(next as ExtractionSize)
                    }
                  }}
                >
                  {EXTRACTION_SIZES.map((size) => (
                    <ToggleGroupItem
                      key={size}
                      className="h-7 flex-1 px-1.5 font-mono text-xs tabular-nums"
                      value={String(size)}
                    >
                      {size}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Button
                  className="h-8 shrink-0 px-2.5"
                  size="sm"
                  type="button"
                  variant="secondary"
                  onClick={() => onExtractPalette?.(extractSize)}
                >
                  <PipetteIcon data-icon="inline-start" className="size-3.5" />
                  {t("manual.extractAction")}
                </Button>
              </div>
            </div>

            <Button
              className="h-8 w-full justify-center font-medium"
              disabled={!canAddColor}
              type="button"
              variant="outline"
              onClick={onAddColor}
            >
              <PlusIcon data-icon="inline-start" className="size-3.5" />
              {t("manual.addColor")}
            </Button>
          </div>

          <div
            aria-label={t("manual.paletteTools")}
            data-slot="palette-utility-toolbar"
            role="toolbar"
            className="flex flex-wrap items-center gap-1 rounded-md border border-border/80 bg-[var(--surface-control)]/55 p-1"
          >
            <Button
              aria-label={t("manual.importFile")}
              className="flex-1 gap-1 px-1.5 text-[11px]"
              size="xs"
              title={t("manual.importFile")}
              type="button"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileInputIcon className="size-3.5" />
              <span>{t("manual.importFileShort")}</span>
            </Button>
            <Button
              aria-label={t("manual.pasteFromClipboard")}
              className="flex-1 gap-1 px-1.5 text-[11px]"
              size="xs"
              title={t("manual.pasteFromClipboard")}
              type="button"
              variant="ghost"
              onClick={() => onImportPaletteFromClipboard?.()}
            >
              <UploadIcon className="size-3.5" />
              <span>{t("manual.pastePalette")}</span>
            </Button>
            <Button
              aria-label={t("manual.copyJson")}
              className="flex-1 gap-1 px-1.5 text-[11px]"
              size="xs"
              title={t("manual.copyJson")}
              type="button"
              variant="ghost"
              onClick={() => onCopyPaletteJson?.()}
            >
              <ClipboardIcon className="size-3.5" />
              <span className="font-mono">JSON</span>
            </Button>
            <span
              aria-hidden="true"
              className="h-4 w-px shrink-0 bg-border/80"
            />
            <Button
              aria-label={t("manual.exportJson")}
              className="gap-1 px-1.5 font-mono text-[11px]"
              size="xs"
              title={t("manual.exportJson")}
              type="button"
              variant="ghost"
              onClick={() => onExportPaletteJson?.()}
            >
              <DownloadIcon className="size-3" />
              <span>JSON</span>
            </Button>
            <Button
              aria-label={t("manual.exportGpl")}
              className="gap-1 px-1.5 font-mono text-[11px]"
              size="xs"
              title={t("manual.exportGpl")}
              type="button"
              variant="ghost"
              onClick={() => onExportPaletteGpl?.()}
            >
              <DownloadIcon className="size-3" />
              <span>GPL</span>
            </Button>
          </div>

          <div
            data-slot="palette-color-list"
            className="grid grid-cols-1 gap-1.5 min-[360px]:grid-cols-2"
          >
            {colors.map((color, index) => (
              <div
                key={index}
                data-slot="palette-editor-row"
                className="flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-[var(--surface-control-active)]/80 p-1 pl-1.5 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25"
              >
                <span
                  data-slot="palette-editor-swatch"
                  className="relative size-6 shrink-0 overflow-hidden rounded-[4px]"
                  style={{ backgroundColor: color }}
                >
                  <PaletteColorInput
                    aria-label={t("manual.pickSwatchColor", { n: index + 1 })}
                    className="palette-color-input absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    color={color}
                    onCommit={(nextColor) => onColorChange(index, nextColor)}
                  />
                </span>
                <PaletteHexInput
                  color={color}
                  index={index}
                  className="h-6 min-w-0 flex-1 rounded-none border-0 bg-transparent px-1 font-mono text-xs uppercase shadow-none focus-visible:ring-0"
                  onColorChange={onColorChange}
                />
                <Button
                  aria-label={t("manual.deleteColor", { n: index + 1 })}
                  className="size-6 shrink-0 rounded-sm text-muted-foreground hover:text-destructive"
                  disabled={!canDeleteColor}
                  size="icon-xs"
                  title={t("manual.deleteColor", { n: index + 1 })}
                  type="button"
                  variant="ghost"
                  onClick={() => onDeleteColor(index)}
                >
                  <Trash2Icon className="size-3.5" />
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
                onImportPaletteFile?.(file)
              }

              event.currentTarget.value = ""
            }}
          />
        </div>
      </DrawerContent>
    </ResponsiveDrawer>
  )
}
