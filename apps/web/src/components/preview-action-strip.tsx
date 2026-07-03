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
    <div className="grid h-8 w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-2 md:h-full md:grid-cols-[auto_1fr_auto]">
      <div className="grid min-w-0 grid-cols-2 gap-2 md:w-[20rem]">
        <Button
          className="h-full w-full min-w-0 !pl-2.5 text-xs"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon data-icon="inline-start" />
          {t("actions.upload")}
        </Button>
        <DrawerTrigger asChild>
          <Button
            className="h-full w-full min-w-0 border border-primary text-xs"
            disabled={!original || status === "exporting"}
          >
            <DownloadIcon data-icon="inline-start" />
            {status === "exporting"
              ? t("actions.exporting")
              : t("actions.export")}
          </Button>
        </DrawerTrigger>
      </div>
      <div aria-hidden="true" className="hidden md:block" />
      <HistoryControls
        canRedo={canRedoSettingsChange}
        canUndo={canUndoSettingsChange}
        className="md:w-44"
        onRedo={onRedoSettingsChange}
        onUndo={onUndoSettingsChange}
      />
    </div>
  )
}
