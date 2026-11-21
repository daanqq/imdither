import type { TFunction } from "i18next"

const BRACKET_SEGMENT_PATTERN = /\[([^\]]+)\]/g

export function formatSourceNotice(notice: string, t: TFunction): string {
  const trimmed = notice.trim()

  if (!trimmed) {
    return ""
  }

  const formattedParts: string[] = []
  let lastIndex = 0

  for (const match of trimmed.matchAll(BRACKET_SEGMENT_PATTERN)) {
    const matchIndex = match.index ?? 0
    const before = trimmed.slice(lastIndex, matchIndex).trim()

    if (before) {
      formattedParts.push(before)
    }

    const inner = match[1]?.trim() ?? ""

    if (inner) {
      formattedParts.push(formatBracketToken(inner, t))
    }

    lastIndex = matchIndex + match[0].length
  }

  const trailing = trimmed.slice(lastIndex).trim()

  if (trailing) {
    formattedParts.push(trailing)
  }

  return formattedParts.join(" · ")
}

function formatBracketToken(token: string, t: TFunction): string {
  const colonIndex = token.indexOf(":")
  const rawKey = (colonIndex === -1 ? token : token.slice(0, colonIndex)).trim()
  const detail = colonIndex === -1 ? "" : token.slice(colonIndex + 1).trim()
  const key = rawKey.toUpperCase()

  switch (key) {
    case "DEMO SOURCE LOADED":
      return t("notice.demoLoaded")
    case "AUTO-TUNE APPLIED":
      return t("notice.autoTuneApplied", { detail })
    case "OUTPUT CLAMPED":
      return t("notice.outputClamped", { detail })
    case "OUTPUT AUTO-SIZED":
      return t("notice.outputAutoSized", { detail })
    case "SETTINGS COPIED TO CLIPBOARD":
      return t("notice.settingsCopied")
    case "SETTINGS PASTED FROM CLIPBOARD":
      return t("notice.settingsPasted")
    case "LOOK COPIED TO CLIPBOARD":
      return t("notice.lookCopied")
    case "LOOK PASTED FROM CLIPBOARD":
      return t("notice.lookPasted")
    case "LOOK APPLIED FROM URL":
      return t("notice.lookAppliedFromUrl")
    case "PALETTE IMPORTED":
      return t("notice.paletteImported")
    case "PALETTE IMPORTED FROM CLIPBOARD":
      return t("notice.paletteImportedClipboard")
    case "PALETTE JSON COPIED TO CLIPBOARD":
      return t("notice.paletteJsonCopied")
    case "PALETTE JSON EXPORTED":
      return t("notice.paletteJsonExported")
    case "PALETTE GPL EXPORTED":
      return t("notice.paletteGplExported")
    case "PALETTE EXTRACTED":
      return t("notice.paletteExtracted", { detail: detail.toLowerCase() })
    case "CUSTOM PALETTE REPLACED":
      return t("notice.customPaletteReplaced")
    case "IMAGE COPIED TO CLIPBOARD":
      return t("notice.imageCopied")
    case "IMAGE COPY FAILED":
      return t("notice.imageCopyFailed")
    case "IMAGE COPY UNSUPPORTED":
      return t("notice.imageCopyUnsupported")
    default: {
      const normalized = rawKey
        .toLowerCase()
        .replace(/^\w/, (char) => char.toUpperCase())

      return detail ? `${normalized}: ${detail}` : normalized
    }
  }
}
