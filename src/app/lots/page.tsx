"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTripStore } from "@/store/tripStore"
import LotList from "@/components/LotList"
import BottomActionBar from "@/components/BottomActionBar"

export default function LotsPage() {
  const router = useRouter()

  const destination = useTripStore((s) => s.destination)
  const lots = useTripStore((s) => s.lots)
  const lotsLoading = useTripStore((s) => s.lotsLoading)
  const lotsError = useTripStore((s) => s.lotsError)
  const selectedLotId = useTripStore((s) => s.selectedLotId)

  const setLots = useTripStore((s) => s.setLots)
  const setLotsLoading = useTripStore((s) => s.setLotsLoading)
  const setLotsError = useTripStore((s) => s.setLotsError)
  const selectLot = useTripStore((s) => s.selectLot)

  useEffect(() => {
    if (!destination) return

    let cancelled = false

    async function fetchLots() {
      try {
        setLotsError(undefined)
        setLotsLoading(true)

        const res = await fetch(
          `/api/lots?lat=${destination.lat}&lng=${destination.lng}`
        )
        if (!res.ok) throw new Error("Failed to load lots")

        const data = await res.json()
        if (cancelled) return

        setLots(data)

        // auto-select first lot
        if (data?.[0]?.id) selectLot(data[0].id)
      } catch (e) {
        if (!cancelled) setLotsError("Could not load lots.")
      } finally {
        if (!cancelled) setLotsLoading(false)
      }
    }

    fetchLots()
    return () => {
      cancelled = true
    }
  }, [destination, setLots, setLotsLoading, setLotsError, selectLot])

  if (!destination) {
    // If user refreshes /lots without state, just route home-ish behavior
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-lg font-semibold">No destination selected</div>
          <div className="text-sm text-neutral-600 mt-1">
            Go back and enter a location.
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

  const selectedLot = lots.find((l) => l.id === selectedLotId)

  function openGoogleMapsAndContinue() {
    if (!selectedLot) return

    // Open Google Maps in new tab (MVP seam).
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedLot.lat},${selectedLot.lng}&travelmode=walking`
    window.open(url, "_blank", "noopener,noreferrer")

    // Still show Map screen in-app for tracking.
    router.push("/map")
  }

  return (
    <main className="min-h-screen flex items-start justify-center px-4 pb-24 pt-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Closest lots to {destination.name}
        </h1>

        <div className="mt-5">
          {lotsLoading && (
            <div className="rounded-2xl border bg-white p-4 text-sm text-neutral-600">
              Loading lots…
            </div>
          )}

          {!lotsLoading && lotsError && (
            <div className="rounded-2xl border bg-white p-4">
              <div className="font-semibold">Something went wrong</div>
              <div className="text-sm text-neutral-600 mt-1">{lotsError}</div>
              <button
                className="mt-3 w-full rounded-2xl bg-black py-3 text-white font-semibold"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}

          {!lotsLoading && !lotsError && lots.length === 0 && (
            <div className="rounded-2xl border bg-white p-4 text-sm text-neutral-600">
              No lots found near this destination.
            </div>
          )}

          {!lotsLoading && !lotsError && lots.length > 0 && (
            <>
              <LotList lots={lots} />

              {/* Dropdown selector (matches Figma “Choose the lot…” control) */}
              <div className="mt-6">
                <div className="text-sm text-neutral-700 mb-2">
                  Choose the lot you’d wish to park at
                </div>
                <select
                  value={selectedLotId ?? ""}
                  onChange={(e) => selectLot(e.target.value)}
                  className="w-full rounded-2xl border bg-white px-4 py-3"
                >
                  {lots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <BottomActionBar
          label="Get Directions"
          disabled={!selectedLot}
          onClick={openGoogleMapsAndContinue}
        />
      </div>
    </main>
  )
}
