"use client"

import { Lot } from "@/types"
import LotCard from "./LotCard"
import { useTripStore } from "@/store/tripStore"

export default function LotList({ lots }: { lots: Lot[] }) {
  const selectedLotId = useTripStore((s) => s.selectedLotId)
  const selectLot = useTripStore((s) => s.selectLot)

  return (
    <div className="space-y-3">
      {lots.map((lot) => (
        <LotCard
          key={lot.id}
          lot={lot}
          selected={selectedLotId === lot.id}
          onSelect={() => selectLot(lot.id)}
        />
      ))}
    </div>
  )
}
