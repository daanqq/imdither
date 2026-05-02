import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { DrawerTrigger } from "@workspace/ui/components/drawer"
import { DownloadIcon, UploadIcon } from "lucide-react"

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
  return (
    <div className="grid h-8 w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-2 md:h-full md:grid-cols-[auto_1fr_auto]">
      <div className="grid min-w-0 grid-cols-2 gap-2 md:w-[20rem]">
        <Button
          className="h-full w-full min-w-0 !pl-2.5"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon data-icon="inline-start" />
          Upload
        </Button>
        <DrawerTrigger asChild>
          <Button
            className="h-full w-full min-w-0 border border-primary"
            disabled={!original || status === "exporting"}
          >
            <DownloadIcon data-icon="inline-start" />
            {status === "exporting" ? "Exporting" : "Export"}
          </Button>
        </DrawerTrigger>
      </div>
      <div aria-hidden="true" className="hidden md:block" />
      <HistoryControls
        canRedo={canRedoSettingsChange}
        canUndo={canUndoSettingsChange}
        className="md:w-40"
        onRedo={onRedoSettingsChange}
        onUndo={onUndoSettingsChange}
      />
    </div>
  )
}
