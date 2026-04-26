export function getNextPaletteColor(colors: readonly string[]): string {
  const usedColors = new Set(colors.map((color) => color.toLowerCase()))
  const fallbackColors = [
    "#ffffff",
    "#000000",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
  ]
  const availableFallback = fallbackColors.find(
    (color) => !usedColors.has(color)
  )

  if (availableFallback) {
    return availableFallback
  }

  for (let value = 0; value <= 0xffffff; value += 1) {
    const color = `#${value.toString(16).padStart(6, "0")}`

    if (!usedColors.has(color)) {
      return color
    }
  }

  return "#ffffff"
}
