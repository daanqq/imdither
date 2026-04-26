import type { EditorSettings } from "@workspace/core"

export function applyAutoTuneLookSettings({
  current,
  recommended,
}: {
  current: EditorSettings
  recommended: EditorSettings
}): EditorSettings {
  return {
    ...recommended,
    resize: {
      ...recommended.resize,
      height: current.resize.height,
      width: current.resize.width,
    },
  }
}
