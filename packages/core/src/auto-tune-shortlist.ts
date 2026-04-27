import type { AutoTuneCandidate, AutoTuneRecommendation } from "./auto-tune"

type ScoredSelectionCandidate = AutoTuneCandidate & {
  score?: number
}

export function selectDiverseAutoTuneRecommendations(
  rankedCandidates: ScoredSelectionCandidate[],
  count: number
): AutoTuneRecommendation[] {
  const targetCount = Math.max(0, Math.min(count, rankedCandidates.length))

  if (targetCount === 0) {
    return []
  }

  const selected: ScoredSelectionCandidate[] = [rankedCandidates[0]]
  const remaining = rankedCandidates.slice(1)

  while (selected.length < targetCount && remaining.length > 0) {
    let bestIndex = 0
    let bestSelectionScore = Number.NEGATIVE_INFINITY

    for (const [index, candidate] of remaining.entries()) {
      const rankIndex = rankedCandidates.indexOf(candidate)
      const qualityScore = getSelectionQuality(candidate, rankIndex)
      const diversityBonus = getDiversityBonus(candidate, selected)
      const selectionScore = qualityScore + diversityBonus - index / 1_000

      if (selectionScore > bestSelectionScore) {
        bestSelectionScore = selectionScore
        bestIndex = index
      }
    }

    selected.push(remaining.splice(bestIndex, 1)[0])
  }

  return selected.map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
    recommended: index === 0,
  }))
}

function getSelectionQuality(
  candidate: ScoredSelectionCandidate,
  rankIndex: number
): number {
  if (candidate.score !== undefined) {
    return candidate.score * 100
  }

  return Math.max(0, 100 - rankIndex * 12)
}

function getDiversityBonus(
  candidate: AutoTuneCandidate,
  selected: AutoTuneCandidate[]
): number {
  const settings = candidate.snapshot.settings
  const combo = `${settings.algorithm}:${settings.paletteId}`
  let penalty = 0

  for (const selectedCandidate of selected) {
    const selectedSettings = selectedCandidate.snapshot.settings

    if (selectedCandidate.id === candidate.id) {
      penalty += 34
    }

    if (
      `${selectedSettings.algorithm}:${selectedSettings.paletteId}` === combo
    ) {
      penalty += 12
    }

    if (selectedSettings.algorithm === settings.algorithm) {
      penalty += 4
    }

    if (selectedSettings.paletteId === settings.paletteId) {
      penalty += 3
    }
  }

  return 42 - penalty
}
