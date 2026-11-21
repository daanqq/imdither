/* oxlint-disable react/only-export-components */
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Toggle as TogglePrimitive } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent font-sans text-xs font-medium whitespace-nowrap text-muted-foreground transition-[background-color,border-color,color,box-shadow] duration-150 ease-out outline-none hover:bg-background/55 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:border-transparent aria-pressed:bg-[var(--surface-control-active)] aria-pressed:text-foreground aria-pressed:shadow-[var(--shadow-control)] data-[state=on]:border-transparent data-[state=on]:bg-[var(--surface-control-active)] data-[state=on]:text-foreground data-[state=on]:shadow-[var(--shadow-control)] dark:aria-invalid:ring-destructive/40 dark:aria-pressed:border-white/8 dark:data-[state=on]:border-white/8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border-border/80 bg-[var(--surface-control)]/60 hover:bg-[var(--surface-control-active)]/70",
      },
      size: {
        default:
          "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-7 min-w-7 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 min-w-9 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
