import * as React from "react"
import { Drawer } from "@workspace/ui/components/drawer"

const DESKTOP_DRAWER_QUERY = "(min-width: 768px)"

type DrawerDirection = React.ComponentProps<typeof Drawer>["direction"]

export function ResponsiveDrawer({ children }: { children: React.ReactNode }) {
  const direction = useResponsiveDrawerDirection()

  return <Drawer direction={direction}>{children}</Drawer>
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
