import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@workspace/ui/lib/utils"

function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-foreground/16 supports-backdrop-filter:bg-foreground/12 supports-backdrop-filter:backdrop-blur-[1px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col border-border bg-[var(--surface-inspector)] text-sm text-foreground shadow-none outline-none data-[vaul-drawer-direction=bottom]:inset-x-2 data-[vaul-drawer-direction=bottom]:bottom-2 data-[vaul-drawer-direction=bottom]:mt-16 data-[vaul-drawer-direction=bottom]:max-h-[min(82dvh,42rem)] data-[vaul-drawer-direction=bottom]:rounded-[var(--radius)] data-[vaul-drawer-direction=bottom]:border data-[vaul-drawer-direction=left]:inset-y-2 data-[vaul-drawer-direction=left]:left-2 data-[vaul-drawer-direction=left]:w-[min(24rem,calc(100vw-1rem))] data-[vaul-drawer-direction=left]:rounded-[var(--radius)] data-[vaul-drawer-direction=left]:border data-[vaul-drawer-direction=right]:inset-y-2 data-[vaul-drawer-direction=right]:right-2 data-[vaul-drawer-direction=right]:w-[min(24rem,calc(100vw-1rem))] data-[vaul-drawer-direction=right]:rounded-[var(--radius)] data-[vaul-drawer-direction=right]:border data-[vaul-drawer-direction=top]:inset-x-2 data-[vaul-drawer-direction=top]:top-2 data-[vaul-drawer-direction=top]:mb-16 data-[vaul-drawer-direction=top]:max-h-[min(82dvh,42rem)] data-[vaul-drawer-direction=top]:rounded-[var(--radius)] data-[vaul-drawer-direction=top]:border",
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-2 hidden h-1 w-16 shrink-0 rounded-[var(--radius-sm)] bg-border group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-1 border-b border-border px-3 py-2 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left group-data-[vaul-drawer-direction=top]/drawer-content:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "mt-auto flex flex-col gap-2 border-t border-border px-3 py-2",
        className
      )}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        "font-heading text-sm leading-tight font-semibold text-foreground",
        className
      )}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-xs leading-snug text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
