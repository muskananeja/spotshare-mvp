export type Destination = {
  name: string
  lat: number
  lng: number
}

export type LotBase = {
  id: string
  name: string
  lat: number
  lng: number
  address?: string
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

export type Destination = {
  name: string
  lat: number
  lng: number
}

export type Lot = {
  id: string
  name: string
  lat: number
  lng: number
  address?: string
  distanceMeters: number
  walkMins: number
}

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
  name?: string
  lat: number
  lng: number
}

