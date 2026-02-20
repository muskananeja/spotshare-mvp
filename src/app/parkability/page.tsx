"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTripStore } from "@/store/tripStore"
import type { POI } from "@/types"

type ParkabilityResponse = {
  lotId: string
  lotName: string
  score: number
  label: string
  description: string
  counts: { food: number; essentials: number; transit: number }
  poisNearby: POI[]
}

export default function ParkabilityPage() {
  const router = useRouter()
  const selectedLotId = useTripStore((s) => s.selectedLotId)
  const lots = useTripStore((s) => s.lots)
  const selectedLot = useMemo(() => lots.find((l) => l.id === selectedLotId), [lots, selectedLotId])

  const [data, setData] = useState<ParkabilityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedLotId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/parkability?lotId=${selectedLotId}`)
        if (!res.ok) throw new Error("Could not load parkability")
        const json = (await res.json()) as ParkabilityResponse
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setError("Failed to load parkability")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [selectedLotId])

  if (!selectedLotId || !selectedLot) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <p className="font-semibold">No lot selected</p>
          <button className="mt-4 rounded-2xl bg-black px-4 py-3 text-white" onClick={() => router.push("/lots")}>Go to lots</button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8 flex justify-center">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Parkability</h1>
        {loading && <div className="rounded-2xl border bg-white p-4">Loading…</div>}
        {error && <div className="rounded-2xl border bg-white p-4 text-red-600">{error}</div>}
        {data && (
          <>
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-sm text-neutral-500">{data.lotName}</p>
              <p className="text-4xl font-bold mt-1">{data.score}</p>
              <p className="font-medium">{data.label}</p>
              <p className="text-sm text-neutral-700 mt-2">{data.description}</p>
            </div>

            <div className="rounded-2xl border bg-white p-4 grid grid-cols-3 gap-2 text-center">
              <div><p className="text-xs text-neutral-500">Food</p><p className="font-semibold">{data.counts.food}</p></div>
              <div><p className="text-xs text-neutral-500">Essentials</p><p className="font-semibold">{data.counts.essentials}</p></div>
              <div><p className="text-xs text-neutral-500">Transit</p><p className="font-semibold">{data.counts.transit}</p></div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-sm font-medium">Nearby POIs ({data.poisNearby.length})</p>
              <ul className="mt-2 space-y-2 text-sm">
                {data.poisNearby.slice(0, 12).map((poi) => (
                  <li key={poi.id} className="flex justify-between">
                    <span>{poi.name}</span>
                    <span className="text-neutral-500">{poi.category}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
