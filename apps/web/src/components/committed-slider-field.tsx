import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { RotateCcwIcon } from "lucide-react"

export type CommittedSliderFieldProps = {
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
  const inputRef = React.useRef<HTMLInputElement>(null)
  const valueTextRef = React.useRef<HTMLSpanElement>(null)
  const resetButtonRef = React.useRef<HTMLButtonElement>(null)
  const committedValueRef = React.useRef(value)
  const draftValueRef = React.useRef(value)
  const resetLabel = `Reset ${label} to ${formatSliderValue(defaultValue)}`
  const canReset = canResetValue(value, defaultValue, step)

  React.useEffect(() => {
    committedValueRef.current = value
    draftValueRef.current = value
    applyDraftValue({
      defaultValue,
      input: inputRef.current,
      resetButton: resetButtonRef.current,
      step,
      value,
      valueText: valueTextRef.current,
      min,
      max,
    })
  }, [defaultValue, max, min, step, value])

  const commitValue = React.useCallback(
    (nextValue: number) => {
      const normalizedValue = normalizeSliderValue(nextValue, min, max)

      applyDraftValue({
        defaultValue,
        input: inputRef.current,
        resetButton: resetButtonRef.current,
        step,
        value: normalizedValue,
        valueText: valueTextRef.current,
        min,
        max,
      })

      if (committedValueRef.current === normalizedValue) {
        return
      }

      committedValueRef.current = normalizedValue
      draftValueRef.current = normalizedValue
      onCommit(normalizedValue)
    },
    [defaultValue, max, min, onCommit, step]
  )

  const commitCurrentValue = React.useCallback(() => {
    commitValue(draftValueRef.current)
  }, [commitValue])

  function handleInput(event: React.FormEvent<HTMLInputElement>) {
    const nextValue = normalizeSliderValue(
      Number(event.currentTarget.value),
      min,
      max
    )

    draftValueRef.current = nextValue
    applyDraftValue({
      defaultValue,
      input: event.currentTarget,
      resetButton: resetButtonRef.current,
      step,
      value: nextValue,
      valueText: valueTextRef.current,
      min,
      max,
    })
  }

  function handleKeyUp(event: React.KeyboardEvent<HTMLInputElement>) {
    if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight" ||
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "Home" ||
      event.key === "End" ||
      event.key === "PageUp" ||
      event.key === "PageDown" ||
      event.key === "Enter"
    ) {
      commitCurrentValue()
    }
  }

  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        <div className="flex items-center gap-1.5">
          <span
            ref={valueTextRef}
            className="font-mono text-xs text-muted-foreground"
          >
            {formatSliderValue(value)}
          </span>
          <Button
            ref={resetButtonRef}
            aria-label={resetLabel}
            disabled={!canReset}
            size="icon-xs"
            title={resetLabel}
            type="button"
            variant="ghost"
            onClick={() => commitValue(defaultValue)}
          >
            <RotateCcwIcon data-icon="inline-start" />
          </Button>
        </div>
      </div>
      <input
        ref={inputRef}
        aria-label={label}
        className="w-full"
        data-slot="committed-range-slider"
        defaultValue={value}
        max={max}
        min={min}
        step={step}
        style={
          {
            "--committed-slider-percent": `${getSliderPercent(value, min, max)}%`,
          } as React.CSSProperties
        }
        type="range"
        onBlur={commitCurrentValue}
        onInput={handleInput}
        onKeyUp={handleKeyUp}
        onPointerCancel={commitCurrentValue}
        onPointerUp={commitCurrentValue}
      />
    </Field>
  )
}

function applyDraftValue({
  defaultValue,
  input,
  max,
  min,
  resetButton,
  step,
  value,
  valueText,
}: {
  defaultValue: number
  input: HTMLInputElement | null
  max: number
  min: number
  resetButton: HTMLButtonElement | null
  step: number
  value: number
  valueText: HTMLSpanElement | null
}) {
  if (input) {
    input.value = String(value)
    input.style.setProperty(
      "--committed-slider-percent",
      `${getSliderPercent(value, min, max)}%`
    )
  }

  if (valueText) {
    valueText.textContent = String(formatSliderValue(value))
  }

  if (resetButton) {
    resetButton.disabled = !canResetValue(value, defaultValue, step)
  }
}

function normalizeSliderValue(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(max, Math.max(min, value))
}

function getSliderPercent(value: number, min: number, max: number) {
  if (max <= min) {
    return 0
  }

  return ((normalizeSliderValue(value, min, max) - min) / (max - min)) * 100
}

function canResetValue(value: number, defaultValue: number, step: number) {
  return Math.abs(value - defaultValue) >= step / 2
}

function formatSliderValue(value: number): string | number {
  return Number.isInteger(value) ? value : value.toFixed(2)
}
