import { NextRequest, NextResponse } from "next/server"
import { readFileSync } from "node:fs"
import path from "node:path"
import { haversineDistanceMeters, estimateWalkMinutes } from "@/utils/geo"
import type { LotBase } from "@/types"

function loadParkingData(): LotBase[] {
  const filePath = path.join(process.cwd(), "data", "parking.json")
  const raw = readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as LotBase[]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get("lat"))
  const lng = Number(searchParams.get("lng"))
  const limit = Number(searchParams.get("limit") ?? "20")

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng query params are required numeric values" },
      { status: 400 }
    )
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "lat/lng out of range" }, { status: 422 })
  }

  const cappedLimit = Math.max(1, Math.min(limit, 30))
  const baseLots = loadParkingData()

  const lots = baseLots
    .map((lot) => {
      const distanceMeters = Math.round(haversineDistanceMeters(lat, lng, lot.lat, lot.lng))
      return {
        ...lot,
        distanceMeters,
        walkMins: estimateWalkMinutes(distanceMeters),
      }
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, cappedLimit)

  return NextResponse.json({ lots, total: lots.length, destLat: lat, destLng: lng })
}
