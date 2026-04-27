import * as React from "react"
import { Drawer } from "@workspace/ui/components/drawer"

import {
  createDrawerHistoryState,
  isDrawerHistoryState,
} from "@/lib/drawer-history"

const DESKTOP_DRAWER_QUERY = "(min-width: 768px)"

type DrawerDirection = React.ComponentProps<typeof Drawer>["direction"]

export function ResponsiveDrawer({ children }: { children: React.ReactNode }) {
  const direction = useResponsiveDrawerDirection()
  const drawerId = React.useId()
  const [open, setOpen] = React.useState(false)
  const openRef = React.useRef(open)
  const pushedHistoryRef = React.useRef(false)
  const closingFromHistoryRef = React.useRef(false)

  React.useEffect(() => {
    openRef.current = open
  }, [open])

  React.useEffect(() => {
    const handlePopState = () => {
      if (!pushedHistoryRef.current || !openRef.current) {
        return
      }

      pushedHistoryRef.current = false
      closingFromHistoryRef.current = true
      setOpen(false)
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setOpen(true)

        if (!pushedHistoryRef.current) {
          window.history.pushState(
            createDrawerHistoryState(window.history.state, drawerId),
            ""
          )
          pushedHistoryRef.current = true
        }

        return
      }

      setOpen(false)

      if (closingFromHistoryRef.current) {
        closingFromHistoryRef.current = false
        return
      }

      if (
        pushedHistoryRef.current &&
        isDrawerHistoryState(window.history.state, drawerId)
      ) {
        pushedHistoryRef.current = false
        window.history.back()
      } else {
        pushedHistoryRef.current = false
      }
    },
    [drawerId]
  )

  return (
    <Drawer direction={direction} open={open} onOpenChange={handleOpenChange}>
      {children}
    </Drawer>
  )
}

function useResponsiveDrawerDirection(): DrawerDirection {
  const [direction, setDirection] = React.useState<DrawerDirection>(() =>
    getResponsiveDrawerDirection()
  )

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_DRAWER_QUERY)
    const syncDirection = () => {
      setDirection(mediaQuery.matches ? "right" : "bottom")
    }

    syncDirection()
    mediaQuery.addEventListener("change", syncDirection)

    return () => {
      mediaQuery.removeEventListener("change", syncDirection)
    }
  }, [])

  return direction
}

function getResponsiveDrawerDirection(): DrawerDirection {
  if (typeof window === "undefined") {
    return "bottom"
  }

  return window.matchMedia(DESKTOP_DRAWER_QUERY).matches ? "right" : "bottom"
}
