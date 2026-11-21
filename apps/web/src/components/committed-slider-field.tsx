import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { cn } from "@workspace/ui/lib/utils"
import { RotateCcwIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

export type CommittedSliderFieldProps = {
  label: string
  defaultValue: number
  min: number
  max: number
  step: number
  value: number
  unit?: string
  onCommit: (value: number) => void
}

export function CommittedSliderField({
  defaultValue,
  label,
  max,
  min,
  onCommit,
  step,
  unit,
  value,
}: CommittedSliderFieldProps) {
  const { t } = useTranslation()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const valueTextRef = React.useRef<HTMLSpanElement>(null)
  const resetButtonRef = React.useRef<HTMLButtonElement>(null)
  const committedValueRef = React.useRef(value)
  const draftValueRef = React.useRef(value)
  const resetLabel = t("slider.reset", {
    label,
    value: formatSliderValueWithUnit(defaultValue, unit),
  })
  const canReset = canResetValue(value, defaultValue, step)
  const isBipolar = isBipolarRange(min, max)
  const zeroPercent = isBipolar ? getSliderPercent(0, min, max) : 0
  const fill = getSliderFillRange(value, min, max)
  const needsUnitSpace = unit ? /^[a-zA-Z]/.test(unit) : false

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

  function updateDraftValue(event: React.ChangeEvent<HTMLInputElement>) {
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
    <Field className="gap-1">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>{label}</FieldLabel>
        <div className="flex items-center gap-1">
          <span className="inline-flex items-baseline font-mono text-xs text-muted-foreground tabular-nums">
            <span ref={valueTextRef}>{formatSliderValue(value)}</span>
            {unit ? (
              <span
                data-slot="committed-slider-unit"
                className={cn(
                  "text-[11px] text-muted-foreground/80",
                  needsUnitSpace && "ml-0.5"
                )}
              >
                {unit}
              </span>
            ) : null}
          </span>
          <Button
            ref={resetButtonRef}
            aria-hidden={!canReset || undefined}
            aria-label={resetLabel}
            className={cn(
              "transition-opacity duration-150 disabled:pointer-events-none disabled:opacity-0",
              !canReset && "pointer-events-none opacity-0"
            )}
            data-dirty={canReset ? "true" : "false"}
            disabled={!canReset}
            size="icon-xs"
            tabIndex={canReset ? 0 : -1}
            title={resetLabel}
            type="button"
            variant="ghost"
            onClick={() => commitValue(defaultValue)}
          >
            <RotateCcwIcon data-icon="inline-start" />
          </Button>
        </div>
      </div>
      <div className="relative flex w-full items-center">
        {isBipolar ? (
          <span
            aria-hidden="true"
            data-slot="committed-slider-center-tick"
            className="pointer-events-none absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/25"
            style={{ left: `${zeroPercent}%` }}
          />
        ) : null}
        <input
          ref={inputRef}
          aria-label={label}
          className="relative z-10 w-full"
          data-bipolar={isBipolar ? "true" : undefined}
          data-slot="committed-range-slider"
          defaultValue={value}
          max={max}
          min={min}
          step={step}
          style={
            {
              "--committed-slider-percent": `${fill.percent}%`,
              "--committed-slider-fill-start": `${fill.start}%`,
              "--committed-slider-fill-end": `${fill.end}%`,
            } as React.CSSProperties
          }
          type="range"
          onBlur={commitCurrentValue}
          onInput={updateDraftValue}
          onKeyUp={handleKeyUp}
          onPointerCancel={commitCurrentValue}
          onPointerUp={commitCurrentValue}
        />
      </div>
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
    const fill = getSliderFillRange(value, min, max)
    input.value = String(value)
    input.style.setProperty("--committed-slider-percent", `${fill.percent}%`)
    input.style.setProperty("--committed-slider-fill-start", `${fill.start}%`)
    input.style.setProperty("--committed-slider-fill-end", `${fill.end}%`)
  }

  if (valueText) {
    valueText.textContent = String(formatSliderValue(value))
  }

  if (resetButton) {
    const nextCanReset = canResetValue(value, defaultValue, step)
    resetButton.disabled = !nextCanReset
    resetButton.dataset.dirty = nextCanReset ? "true" : "false"
    resetButton.tabIndex = nextCanReset ? 0 : -1
    if (nextCanReset) {
      resetButton.removeAttribute("aria-hidden")
      resetButton.classList.remove("opacity-0", "pointer-events-none")
    } else {
      resetButton.setAttribute("aria-hidden", "true")
      resetButton.classList.add("opacity-0", "pointer-events-none")
    }
  }
}

function isBipolarRange(min: number, max: number) {
  return min < 0 && max > 0
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

function getSliderFillRange(value: number, min: number, max: number) {
  const percent = getSliderPercent(value, min, max)
  if (!isBipolarRange(min, max)) {
    return { percent, start: 0, end: percent }
  }

  const zeroPercent = getSliderPercent(0, min, max)
  return {
    percent,
    start: Math.min(zeroPercent, percent),
    end: Math.max(zeroPercent, percent),
  }
}

function canResetValue(value: number, defaultValue: number, step: number) {
  return Math.abs(value - defaultValue) >= step / 2
}

function formatSliderValue(value: number): string | number {
  return Number.isInteger(value) ? value : value.toFixed(2)
}

function formatSliderValueWithUnit(value: number, unit?: string): string {
  const formatted = String(formatSliderValue(value))
  if (!unit) {
    return formatted
  }

  const separator = /^[a-zA-Z]/.test(unit) ? " " : ""
  return `${formatted}${separator}${unit}`
}
