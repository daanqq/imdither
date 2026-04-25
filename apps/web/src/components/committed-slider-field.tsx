import * as React from "react"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Slider } from "@workspace/ui/components/slider"

type CommittedSliderFieldProps = {
  label: string
  min: number
  max: number
  step: number
  value: number
  onCommit: (value: number) => void
}

export function CommittedSliderField({
  label,
  max,
  min,
  onCommit,
  step,
  value,
}: CommittedSliderFieldProps) {
  const [draftValue, setDraftValue] = React.useState(value)
  const draggingRef = React.useRef(false)

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
        <span className="font-mono text-xs text-muted-foreground">
          {Number.isInteger(draftValue) ? draftValue : draftValue.toFixed(2)}
        </span>
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
