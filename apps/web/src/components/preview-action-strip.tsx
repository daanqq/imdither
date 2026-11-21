import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { DrawerTrigger } from "@workspace/ui/components/drawer"
import { DownloadIcon, UploadIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HistoryControls } from "@/components/history-controls"
import type { JobStatus } from "@/store/editor-store"

export function PreviewActionStrip({
  canRedoSettingsChange = false,
  canUndoSettingsChange = false,
  fileInputRef,
  original,
  status,
  onRedoSettingsChange,
  onUndoSettingsChange,
}: {
  canRedoSettingsChange?: boolean
  canUndoSettingsChange?: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  original: unknown
  status: JobStatus
  onRedoSettingsChange?: () => void
  onUndoSettingsChange?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div
      data-slot="preview-action-strip"
      className="flex w-full min-w-0 items-center justify-between gap-2 md:gap-3"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
        <Button
          type="button"
          className="h-8 min-w-0 flex-1 px-2.5 text-xs whitespace-nowrap sm:w-auto sm:flex-none sm:px-3"
          title={t("actions.uploadHint")}
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon data-icon="inline-start" className="size-3.5 shrink-0" />
          <span>{t("actions.upload")}</span>
        </Button>
        <DrawerTrigger asChild>
          <Button
            type="button"
            className="h-8 min-w-0 flex-1 px-2.5 text-xs font-semibold whitespace-nowrap sm:w-auto sm:flex-none sm:px-3"
            disabled={!original || status === "exporting"}
            title={t("actions.exportHint")}
          >
            <DownloadIcon
              data-icon="inline-start"
              className="size-3.5 shrink-0"
            />
            <span>
              {status === "exporting"
                ? t("actions.exporting")
                : t("actions.export")}
            </span>
          </Button>
        </DrawerTrigger>
      </div>
      <HistoryControls
        canRedo={canRedoSettingsChange}
        canUndo={canUndoSettingsChange}
        className="shrink-0"
        onRedo={onRedoSettingsChange}
        onUndo={onUndoSettingsChange}
      />
    </div>
  )
}
