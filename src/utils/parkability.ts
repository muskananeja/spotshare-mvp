import type { LatLng, POI } from "@/types"
import { haversineDistanceMeters } from "@/utils/geo"

export type ParkabilityCounts = {
  food: number
  essentials: number
  transit: number
}

export type ParkabilityLabel =
  | "Excellent last-mile walk"
  | "Great last-mile walk"
  | "Good last-mile walk"
  | "Fair last-mile walk"
  | "Limited amenities nearby"

export type ParkabilityResult = {
  score: number
  label: ParkabilityLabel
  counts: ParkabilityCounts
  nearbyPOIs: POI[]
  description: string
}

const FOOD = new Set(["cafe", "restaurant"])
const ESSENTIALS = new Set(["atm", "pharmacy", "convenience", "supermarket"])
const TRANSIT = new Set(["bus_stop", "rail_station"])

export function computeParkability(params: {
  lot: LatLng
  pois: POI[]
  radiusMeters?: number
}): ParkabilityResult {
  const radius = params.radiusMeters ?? 1000

  const nearby = params.pois.filter((p) =>
    haversineDistanceMeters(params.lot.lat, params.lot.lng, p.lat, p.lng) <= radius
  )

  const counts: ParkabilityCounts = {
    food: nearby.filter((p) => FOOD.has(p.category)).length,
    essentials: nearby.filter((p) => ESSENTIALS.has(p.category)).length,
    transit: nearby.filter((p) => TRANSIT.has(p.category)).length,
  }

  const score = Math.round(
    (Math.min(counts.food, 8) / 8) * 35 +
      (Math.min(counts.essentials, 6) / 6) * 30 +
      (Math.min(counts.transit, 4) / 4) * 35
  )

  const label = scoreToLabel(score)

  return {
    score,
    label,
    counts,
    nearbyPOIs: nearby,
    description: buildDescription(counts),
  }
}

function scoreToLabel(score: number): ParkabilityLabel {
  if (score >= 85) return "Excellent last-mile walk"
  if (score >= 65) return "Great last-mile walk"
  if (score >= 45) return "Good last-mile walk"
  if (score >= 25) return "Fair last-mile walk"
  return "Limited amenities nearby"
}

function buildDescription(counts: ParkabilityCounts) {
  if (counts.transit >= 3) {
    return `Great pick: ${counts.food} food options, ${counts.essentials} essentials, and strong transit access (${counts.transit}) within ~10 minutes.`
  }

  if (counts.food + counts.essentials + counts.transit <= 3) {
    return `Amenities are limited around this lot (${counts.food} food, ${counts.essentials} essentials, ${counts.transit} transit).`
  }

  return `Balanced last-mile comfort with ${counts.food} food spots, ${counts.essentials} essential services, and ${counts.transit} transit points nearby.`
}

export function categoryColor(category: POI["category"]) {
  switch (category) {
    case "cafe":
    case "restaurant":
      return "#F97316"
    case "atm":
    case "pharmacy":
    case "convenience":
    case "supermarket":
      return "#22C55E"
    case "bus_stop":
    case "rail_station":
      return "#3B82F6"
    default:
      return "#6B7280"
  }
}
