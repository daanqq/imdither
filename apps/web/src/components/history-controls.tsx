import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Redo2Icon, Undo2Icon } from "lucide-react"

const noop = () => {}

export function HistoryControls({
  canRedo,
  canUndo,
  className,
  onRedo,
  onUndo,
}: {
  canRedo: boolean
  canUndo: boolean
  className?: string
  onRedo?: () => void
  onUndo?: () => void
}) {
  return (
    <div className={cn("grid h-full w-full grid-cols-2 gap-2", className)}>
      <Button
        aria-label="Undo settings change"
        className="h-full w-full gap-1"
        disabled={!canUndo}
        size="icon"
        variant="outline"
        onClick={onUndo ?? noop}
      >
        <Undo2Icon />
        Undo
      </Button>
      <Button
        aria-label="Redo settings change"
        className="h-full w-full gap-1"
        disabled={!canRedo}
        size="icon"
        variant="outline"
        onClick={onRedo ?? noop}
      >
        <Redo2Icon />
        Redo
      </Button>
    </div>
  )
}
