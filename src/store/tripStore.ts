import { create } from "zustand"
import { Destination, Lot, TripSession } from "@/types"

type TripState = {
  destinationQuery: string
  destination?: Destination

  lots: Lot[]
  lotsLoading: boolean
  lotsError?: string

  selectedLotId?: string

  session?: TripSession

  setDestinationQuery: (q: string) => void
  setDestination: (d: Destination) => void
  clearDestination: () => void

  setLots: (lots: Lot[]) => void
  setLotsLoading: (loading: boolean) => void
  setLotsError: (err?: string) => void

  selectLot: (lotId: string) => void

  startSession: () => void
  setSessionDistance: (meters: number) => void
  markArrived: () => void
  resetSession: () => void
}

export const useTripStore = create<TripState>((set) => ({
  destinationQuery: "",
  destination: undefined,

  lots: [],
  lotsLoading: false,
  lotsError: undefined,

  selectedLotId: undefined,

  session: undefined,

  setDestinationQuery: (q) => set({ destinationQuery: q }),

  setDestination: (d) =>
    set({
      destination: d,
      destinationQuery: d.name,
      lots: [],
      lotsError: undefined,
      selectedLotId: undefined,
      session: undefined,
    }),

  clearDestination: () =>
    set({
      destinationQuery: "",
      destination: undefined,
      lots: [],
      lotsError: undefined,
      selectedLotId: undefined,
      session: undefined,
    }),

  setLots: (lots) => set({ lots }),
  setLotsLoading: (lotsLoading) => set({ lotsLoading }),
  setLotsError: (lotsError) => set({ lotsError }),

  selectLot: (selectedLotId) => set({ selectedLotId }),

  startSession: () =>
    set({
      session: { startTime: Date.now(), status: "navigating" },
    }),

  setSessionDistance: (meters) =>
    set((state) => ({
      session: state.session
        ? { ...state.session, lastKnownDistanceMeters: meters }
        : state.session,
    })),

  markArrived: () =>
    set((state) => ({
      session: state.session ? { ...state.session, status: "arrived" } : state.session,
    })),

  resetSession: () => set({ session: undefined }),
}))
