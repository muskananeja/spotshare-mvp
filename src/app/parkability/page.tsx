import type { LatLng, POI } from "@/types"
import { haversineMeters } from "@/utils/geo"

export type ParkabilityCounts = {
  foodCoffee: number
  essentials: number
  transit: number
}

export type ParkabilityResult = {
  score: number // 0..100
  label: "Excellent last-mile walk" | "Good last-mile walk" | "Needs improvement"
  counts: ParkabilityCounts
  nearbyPOIs: POI[]
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

  const nearby = params.pois.filter((p) => {
    const d = haversineMeters(params.lot, { lat: p.lat, lng: p.lng })
    return d <= radius
  })

  const counts: ParkabilityCounts = {
    foodCoffee: nearby.filter((p) => FOOD.has(p.category)).length,
    essentials: nearby.filter((p) => ESSENTIALS.has(p.category)).length,
    transit: nearby.filter((p) => TRANSIT.has(p.category)).length,
  }

  // simple MVP weights
  const raw = counts.foodCoffee * 2 + counts.essentials * 4 + counts.transit * 2
  const score = clamp(Math.round(raw), 0, 100)

  const label =
    score >= 80 ? "Excellent last-mile walk" : score >= 60 ? "Good last-mile walk" : "Needs improvement"

  return { score, label, counts, nearbyPOIs: nearby }
}

export function categoryColor(category: POI["category"]) {
  // keep it simple. tune later.
  switch (category) {
    case "cafe":
    case "restaurant":
      return "#F97316" // orange
    case "atm":
      return "#22C55E" // green
    case "pharmacy":
      return "#EF4444" // red
    case "convenience":
    case "supermarket":
      return "#3B82F6" // blue
    case "bus_stop":
    case "rail_station":
      return "#EAB308" // yellow
    default:
      return "#6B7280" // gray
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}
