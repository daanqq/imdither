import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Slider } from "@workspace/ui/components/slider"
import { RotateCcwIcon } from "lucide-react"

type CommittedSliderFieldProps = {
  label: string
  defaultValue: number
  min: number
  max: number
  step: number
  value: number
  onCommit: (value: number) => void
}

export function CommittedSliderField({
  defaultValue,
  label,
  max,
  min,
  onCommit,
  step,
  value,
}: CommittedSliderFieldProps) {
  const [draftValue, setDraftValue] = React.useState(value)
  const draggingRef = React.useRef(false)
  const resetLabel = `Reset ${label} to ${formatSliderValue(defaultValue)}`
  const canReset = Math.abs(draftValue - defaultValue) >= step / 2

  React.useEffect(() => {
    if (!draggingRef.current) {
      setDraftValue(value)
    }
  }, [value])

  const commitValue = React.useCallback(
    (nextValue: number) => {
      draggingRef.current = false
      setDraftValue(nextValue)
      onCommit(nextValue)
    },
    [onCommit]
  )

  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">
            {formatSliderValue(draftValue)}
          </span>
          <Button
            aria-label={resetLabel}
            disabled={!canReset}
            size="icon-xs"
            title={resetLabel}
            type="button"
            variant="ghost"
            onClick={canReset ? () => commitValue(defaultValue) : undefined}
          >
            <RotateCcwIcon data-icon="inline-start" />
          </Button>
        </div>
      </div>
      <Slider
        max={max}
        min={min}
        step={step}
        value={[draftValue]}
        onValueChange={(nextValue) => {
          draggingRef.current = true
          setDraftValue(nextValue[0] ?? draftValue)
        }}
        onValueCommit={(nextValue) => commitValue(nextValue[0] ?? draftValue)}
      />
    </Field>
  )
}

function formatSliderValue(value: number): string | number {
  return Number.isInteger(value) ? value : value.toFixed(2)
}
