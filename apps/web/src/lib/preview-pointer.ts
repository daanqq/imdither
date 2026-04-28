import type { ViewportCenter } from "@/lib/preview-viewport"

export function getViewportPointFromClientPoint(
  element: Pick<HTMLElement, "getBoundingClientRect">,
  point: { clientX: number; clientY: number }
): ViewportCenter {
  const rect = element.getBoundingClientRect()

  return {
    x: point.clientX - rect.left,
    y: point.clientY - rect.top,
  }
}
