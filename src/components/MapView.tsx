"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import { Destination, Lot } from "@/types"

// Load react-leaflet client-side only (avoids SSR window issues).
const LeafletMap = dynamic(() => import("./_LeafletMapImpl"), { ssr: false })

export default function MapView({
  destination,
  lot,
}: {
  destination: Destination
  lot: Lot
}) {
  // stable props
  const dest = useMemo(() => destination, [destination])
  const selected = useMemo(() => lot, [lot])

  return <LeafletMap destination={dest} lot={selected} />
}
