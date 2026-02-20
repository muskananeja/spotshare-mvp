import { NextRequest, NextResponse } from "next/server"
import { haversineDistanceMeters, estimateWalkMinutes } from "@/utils/geo"

// Hardcoded lots near Bandra-ish for demo. Swap this later for real data.
const BASE_LOTS = [
  {
    id: "abc",
    name: "ABC Lot",
    lat: 19.0605,
    lng: 72.8298,
    address: "Near Hill Road",
  },
  {
    id: "bmc",
    name: "BMC Station Lot",
    lat: 19.0635,
    lng: 72.8300,
    address: "Linking Road",
  },
  {
    id: "rm",
    name: "RM Mall Parking",
    lat: 19.0620,
    lng: 72.8260,
    address: "Pali Hill",
  },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get("lat"))
  const lng = Number(searchParams.get("lng"))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "Invalid lat/lng" },
      { status: 400 }
    )
  }

  const lots = BASE_LOTS.map((lot) => {
    const distanceMeters = haversineDistanceMeters(lat, lng, lot.lat, lot.lng)
    return {
      ...lot,
      distanceMeters,
      walkMins: estimateWalkMinutes(distanceMeters),
    }
  }).sort((a, b) => a.distanceMeters - b.distanceMeters)

  return NextResponse.json(lots)
}
