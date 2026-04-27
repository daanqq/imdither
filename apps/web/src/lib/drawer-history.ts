const DRAWER_HISTORY_KEY = "__imditherDrawer"

export function createDrawerHistoryState(
  currentState: unknown,
  drawerId: string
): Record<string, unknown> {
  return {
    ...(isRecord(currentState) ? currentState : {}),
    [DRAWER_HISTORY_KEY]: drawerId,
  }
}

export function isDrawerHistoryState(
  state: unknown,
  drawerId: string
): boolean {
  return isRecord(state) && state[DRAWER_HISTORY_KEY] === drawerId
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
