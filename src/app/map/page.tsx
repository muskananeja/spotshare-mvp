"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import BottomActionBar from "@/components/BottomActionBar"
import MapView from "@/components/MapView"
import { useTripStore } from "@/store/tripStore"
import { haversineDistanceMeters, formatElapsed, formatMeters } from "@/utils/geo"

export default function MapPage() {
  const router = useRouter()

  const destination = useTripStore((s) => s.destination)
  const lots = useTripStore((s) => s.lots)
  const selectedLotId = useTripStore((s) => s.selectedLotId)
  const session = useTripStore((s) => s.session)

  const startSession = useTripStore((s) => s.startSession)
  const markArrived = useTripStore((s) => s.markArrived)
  const setSessionDistance = useTripStore((s) => s.setSessionDistance)

  const selectedLot = useMemo(() => lots.find((l) => l.id === selectedLotId), [lots, selectedLotId])

  const [nowMs, setNowMs] = useState(() => Date.now())
  const watchIdRef = useRef<number | null>(null)

  // timer tick for elapsed display
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const elapsedSeconds = session ? Math.floor((nowMs - session.startTime) / 1000) : 0

  // Start/stop geolocation watching when navigating
  useEffect(() => {
    if (!destination || !selectedLot) return
    if (!session || session.status !== "navigating") return

    if (!("geolocation" in navigator)) return

    // already watching
    if (watchIdRef.current !== null) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const meters = haversineDistanceMeters(latitude, longitude, selectedLot.lat, selectedLot.lng)
        setSessionDistance(meters)

        if (meters <= 50) {
          markArrived()
        }
      },
      () => {
        // ignore errors; user can still manually mark arrived
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [destination, selectedLot, session, setSessionDistance, markArrived])

  // Stop watching after arrived
  useEffect(() => {
    if (session?.status === "arrived" && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [session?.status])

  if (!destination || !selectedLot) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-lg font-semibold">Missing trip info</div>
          <div className="text-sm text-neutral-600 mt-1">
            Select a destination and lot first.
          </div>
          <button
            onClick={() => router.push("/")}
            className="mt-4 w-full rounded-2xl bg-black py-3 text-white font-semibold"
          >
            Back to Home
          </button>
        </div>
      </main>
    )
  }

  const statusLabel =
    session?.status === "arrived"
      ? "Arrived"
      : session?.status === "navigating"
      ? "Navigating"
      : "Idle"

  const distanceLabel =
    session?.lastKnownDistanceMeters !== undefined
      ? formatMeters(session.lastKnownDistanceMeters)
      : undefined

  function onTrackStop() {
    // Start session (and geolocation watch will kick in if allowed)
    startSession()
  }

  return (
    <main className="min-h-screen flex items-start justify-center px-4 pb-28 pt-6">
      <div className="w-full max-w-sm space-y-4">
        <MapView destination={destination} lot={selectedLot} />

        {/* Bottom card like Figma */}
        <div className="rounded-3xl border bg-white p-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-xs text-neutral-500">Selected lot</div>
            <div className="text-xl font-semibold truncate">{selectedLot.name}</div>

            <div className="mt-1 text-sm text-neutral-700 flex flex-wrap gap-x-3 gap-y-1">
              <span>Status: <span className="font-medium">{statusLabel}</span></span>
              {session && (
                <span>
                  Elapsed: <span className="font-medium">{formatElapsed(elapsedSeconds)}</span>
                </span>
              )}
              {distanceLabel && session?.status === "navigating" && (
                <span>
                  Distance: <span className="font-medium">{distanceLabel}</span>
                </span>
              )}
            </div>
          </div>

          <div className="ml-3 h-10 w-10 rounded-2xl border flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-black" />
          </div>
        </div>

        <BottomActionBar
          label={session ? (session.status === "arrived" ? "Trip Completed" : "Track Stop") : "Track Stop"}
          disabled={session?.status === "arrived"}
          onClick={onTrackStop}
          secondaryLabel={session && session.status !== "arrived" ? "Mark Arrived" : undefined}
          onSecondaryClick={session && session.status !== "arrived" ? markArrived : undefined}
        />
      </div>
    </main>
  )
}
