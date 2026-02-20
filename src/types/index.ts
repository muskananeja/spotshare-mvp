export type Destination = {
  id?: string
  name: string
  lat: number
  lng: number
}

export type Confidence = "high" | "medium" | "low"

export type LotBase = {
  id: string
  name: string
  lat: number
  lng: number
  type?: "surface" | "underground" | "multistorey" | "street" | "unknown"
  address?: string
  confidence?: Confidence
  notes?: string
}

export type Lot = LotBase & {
  distanceMeters: number
  walkMins: number
}

export type TripStatus = "idle" | "navigating" | "arrived"

export type TripSession = {
  startTime: number
  status: TripStatus
  lastKnownDistanceMeters?: number
}

export type LatLng = { lat: number; lng: number }

export type POICategory =
  | "cafe"
  | "restaurant"
  | "atm"
  | "pharmacy"
  | "convenience"
  | "supermarket"
  | "bus_stop"
  | "rail_station"

export type POI = {
  id: string
  category: POICategory
  name: string
  lat: number
  lng: number
}
