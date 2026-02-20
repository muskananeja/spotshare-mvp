"use client"

import { useMemo, useState } from "react"
import { DESTINATIONS } from "@/utils/destinations"
import { Destination } from "@/types"
import { useTripStore } from "@/store/tripStore"

function parseCoords(input: string): { lat: number; lng: number } | null {
  const cleaned = input.replace(/\s+/g, " ").trim()
  const parts = cleaned.includes(",")
    ? cleaned.split(",").map((p) => p.trim())
    : cleaned.split(" ").map((p) => p.trim())

  if (parts.length !== 2) return null
  const lat = Number(parts[0])
  const lng = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

export default function DestinationInput() {
  const destinationQuery = useTripStore((s) => s.destinationQuery)
  const setDestinationQuery = useTripStore((s) => s.setDestinationQuery)
  const setDestination = useTripStore((s) => s.setDestination)

  const [showCoords, setShowCoords] = useState(false)
  const [coordsText, setCoordsText] = useState("")
  const [coordsName, setCoordsName] = useState("Custom location")

  const suggestions = useMemo(() => {
    const q = destinationQuery.trim().toLowerCase()
    if (!q) return DESTINATIONS.slice(0, 6)
    return DESTINATIONS.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 6)
  }, [destinationQuery])

  function pick(d: Destination) {
    setDestination(d)
    setShowCoords(false)
  }

  function useCoords() {
    const parsed = parseCoords(coordsText)
    if (!parsed) return
    pick({ name: coordsName.trim() || "Custom location", ...parsed })
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border bg-white px-4 py-3">
        <input
          value={destinationQuery}
          onChange={(e) => setDestinationQuery(e.target.value)}
          placeholder="Type a place"
          className="w-full text-base outline-none"
        />
      </div>

      <div className="mt-3 rounded-2xl border bg-white overflow-hidden">
        {suggestions.length === 0 ? (
          <div className="p-4 text-sm text-neutral-600">No matches. Use coordinates below.</div>
        ) : (
          <div className="divide-y">
            {suggestions.map((d) => (
              <button
                key={`${d.name}-${d.lat}-${d.lng}`}
                onClick={() => pick(d)}
                className="w-full text-left px-4 py-3 hover:bg-neutral-50"
              >
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-neutral-500">
                  {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowCoords((v) => !v)}
        className="mt-3 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium"
      >
        {showCoords ? "Hide coordinates" : "Enter coordinates instead"}
      </button>

      {showCoords && (
        <div className="mt-3 rounded-2xl border bg-white p-4 space-y-3">
          <div>
            <label className="text-xs text-neutral-500">Label</label>
            <input
              value={coordsName}
              onChange={(e) => setCoordsName(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none"
              placeholder="e.g., Boujee Cafe"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-500">Lat, Lng</label>
            <input
              value={coordsText}
              onChange={(e) => setCoordsText(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none"
              placeholder="19.0596, 72.8295"
            />
            <div className="mt-1 text-xs text-neutral-500">Format: “lat, lng” or “lat lng”</div>
          </div>

          <button
            onClick={useCoords}
            disabled={!parseCoords(coordsText)}
            className="w-full rounded-2xl bg-black py-3 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Use coordinates
          </button>
        </div>
      )}
    </div>
  )
}
