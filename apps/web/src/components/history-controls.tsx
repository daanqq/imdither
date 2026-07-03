import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Redo2Icon, Undo2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()

  return (
    <div className={cn("grid h-full w-full grid-cols-2 gap-2", className)}>
      <Button
        aria-label={t("history.undoAria")}
        className="h-full w-full gap-1 text-xs"
        disabled={!canUndo}
        size="icon"
        variant="outline"
        onClick={onUndo ?? noop}
      >
        <Undo2Icon />
        {t("history.undo")}
      </Button>
      <Button
        aria-label={t("history.redoAria")}
        className="h-full w-full gap-1 text-xs"
        disabled={!canRedo}
        size="icon"
        variant="outline"
        onClick={onRedo ?? noop}
      >
        <Redo2Icon />
        {t("history.redo")}
      </Button>
    </div>
  )
}
