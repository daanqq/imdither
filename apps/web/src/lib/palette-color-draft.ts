export function normalizeHexColorDraft(value: string): string | null {
  const token = value.trim()
  const hex = token.startsWith("#") ? token.slice(1) : token

  if (!/^[0-9a-fA-F]{1,6}$/.test(hex)) {
    return null
  }

  return `#${hex.padEnd(6, "0").toLowerCase()}`
}
