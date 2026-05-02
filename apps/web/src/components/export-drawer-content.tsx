import { Button } from "@workspace/ui/components/button"
import {
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Slider } from "@workspace/ui/components/slider"
import { DownloadIcon } from "lucide-react"

import {
  EXPORT_FORMAT_OPTIONS,
  EXPORT_QUALITY_STEP,
  MAX_EXPORT_QUALITY,
  MIN_EXPORT_QUALITY,
  getExportFormatOption,
  type ExportFormat,
} from "@/lib/export-image"
import type { JobStatus } from "@/store/editor-store"

export function ExportDrawerContent({
  exportFormat,
  exportQuality,
  status,
  onExport,
  onExportFormatChange,
  onExportQualityChange,
}: {
  exportFormat: ExportFormat
  exportQuality: number
  status: JobStatus
  onExport: () => void
  onExportFormatChange: (format: ExportFormat) => void
  onExportQualityChange: (quality: number) => void
}) {
  const selectedExportFormat = getExportFormatOption(exportFormat)
  const exportQualityPercent = Math.round(exportQuality * 100)
  const displayedExportQuality = selectedExportFormat.supportsQuality
    ? exportQuality
    : 1

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Export</DrawerTitle>
        <DrawerDescription>
          Format and quality for final image download.
        </DrawerDescription>
      </DrawerHeader>
      <div className="grid min-w-0 gap-3 p-3">
        <div className="grid min-w-0 grid-cols-[minmax(8rem,0.75fr)_minmax(0,1.25fr)] gap-3">
          <label
            className="grid min-w-0 content-start gap-1.5 pr-3 text-sm font-medium"
            htmlFor="export-format"
          >
            Export Format
            <Select
              value={exportFormat}
              onValueChange={(value) =>
                onExportFormatChange(value as ExportFormat)
              }
            >
              <SelectTrigger
                aria-label="Export format"
                className="min-w-0"
                id="export-format"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="grid min-w-0 grid-cols-[minmax(0,1fr)_4ch] gap-x-2 gap-y-1 border-l border-border pl-3 font-mono text-[10px] text-muted-foreground">
            <span className="font-sans text-sm font-medium text-foreground">
              Export Quality
            </span>
            <Slider
              aria-label="Export quality"
              className="col-span-2 row-start-2 min-w-0"
              disabled={!selectedExportFormat.supportsQuality}
              max={MAX_EXPORT_QUALITY}
              min={MIN_EXPORT_QUALITY}
              step={EXPORT_QUALITY_STEP}
              value={[displayedExportQuality]}
              onValueChange={(value) =>
                onExportQualityChange(value[0] ?? exportQuality)
              }
            />
            <span className="col-start-2 row-start-1 text-right tabular-nums">
              {selectedExportFormat.supportsQuality
                ? exportQualityPercent
                : 100}
              %
            </span>
          </label>
        </div>
        {exportFormat === "png" ? (
          <p className="text-xs text-muted-foreground">
            PNG exports remain lossless at 100%.
          </p>
        ) : null}
      </div>
      <DrawerFooter>
        <Button disabled={status === "exporting"} onClick={onExport}>
          <DownloadIcon data-icon="inline-start" />
          Download {selectedExportFormat.label}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  )
}
