"use client"

import { useEffect } from "react"
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet"
import L from "leaflet"
import { Destination, Lot } from "@/types"

// Fix default marker icons in Next.js (Leaflet otherwise shows missing marker images)
function setupLeafletIcons() {
  // @ts-expect-error leaflet typings allow these private fields
  delete L.Icon.Default.prototype._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  })
}

export default function LeafletMapImpl({
  destination,
  lot,
}: {
  destination: Destination
  lot: Lot
}) {
  useEffect(() => {
    setupLeafletIcons()
  }, [])

  const center: [number, number] = [destination.lat, destination.lng]
  const destPos: [number, number] = [destination.lat, destination.lng]
  const lotPos: [number, number] = [lot.lat, lot.lng]

  return (
    <div className="rounded-3xl overflow-hidden border bg-white">
      <MapContainer center={center} zoom={15} className="h-[420px] w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={destPos} />
        <Marker position={lotPos} />
        <Polyline positions={[destPos, lotPos]} />
      </MapContainer>
    </div>
  )
}
