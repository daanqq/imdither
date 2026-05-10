import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Slider } from "@workspace/ui/components/slider"
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

export function FrameStrip({
  frameCount,
  currentFrame,
  isPlaying,
  onPlayPause,
  onFrameChange,
  onPrevFrame,
  onNextFrame,
}: {
  frameCount: number
  currentFrame: number
  isPlaying: boolean
  onPlayPause: () => void
  onFrameChange: (frame: number) => void
  onPrevFrame: () => void
  onNextFrame: () => void
}) {
  if (frameCount <= 0) {
    return null
  }

  const isAtStart = currentFrame <= 0
  const isAtEnd = currentFrame >= frameCount - 1

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-[var(--surface-inspector)] px-2 py-1.5">
      <Button
        aria-label={isPlaying ? "Pause" : "Play"}
        title={isPlaying ? "Pause" : "Play"}
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={onPlayPause}
      >
        {isPlaying ? (
          <PauseIcon className="size-3.5" />
        ) : (
          <PlayIcon className="size-3.5" />
        )}
      </Button>

      <Button
        aria-label="Previous frame"
        title="Previous frame"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        disabled={isAtStart}
        onClick={onPrevFrame}
      >
        <ChevronLeftIcon className="size-3.5" />
      </Button>

      <div className="min-w-0 flex-1">
        <Slider
          value={[currentFrame]}
          min={0}
          max={Math.max(0, frameCount - 1)}
          step={1}
          onValueChange={([value]) => {
            if (value !== undefined) {
              onFrameChange(value)
            }
          }}
        />
      </div>

      <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
        {currentFrame + 1} / {frameCount}
      </span>

      <Button
        aria-label="Next frame"
        title="Next frame"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        disabled={isAtEnd}
        onClick={onNextFrame}
      >
        <ChevronRightIcon className="size-3.5" />
      </Button>
    </div>
  )
}
