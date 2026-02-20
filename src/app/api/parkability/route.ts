import { NextRequest, NextResponse } from "next/server"
import { readFileSync } from "node:fs"
import path from "node:path"
import type { LotBase, POI } from "@/types"
import { computeParkability } from "@/utils/parkability"

function loadJson<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "data", filename)
  const raw = readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as T
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lotId = searchParams.get("lotId")

  if (!lotId) {
    return NextResponse.json({ error: "lotId is required" }, { status: 400 })
  }

  const lots = loadJson<LotBase[]>("parking.json")
  const pois = loadJson<POI[]>("pois.json")

  const lot = lots.find((item) => item.id === lotId)

  if (!lot) {
    return NextResponse.json({ error: "lot not found" }, { status: 404 })
  }

  const result = computeParkability({ lot: { lat: lot.lat, lng: lot.lng }, pois, radiusMeters: 1000 })

  return NextResponse.json({
    lotId: lot.id,
    lotName: lot.name,
    lotLat: lot.lat,
    lotLng: lot.lng,
    radiusMeters: 1000,
    score: result.score,
    label: result.label,
    description: result.description,
    counts: result.counts,
    poisNearby: result.nearbyPOIs,
  })
}
