"use client"

import { Lot } from "@/types"
import { formatMeters } from "@/utils/geo"

export default function LotCard({
  lot,
  selected,
  onSelect,
}: {
  lot: Lot
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl border bg-white p-4 text-left flex items-center justify-between hover:bg-neutral-50 ${
        selected ? "border-black" : "border-neutral-200"
      }`}
    >
      <div className="min-w-0">
        <div className="font-semibold truncate">{lot.name}</div>
        {lot.address && (
          <div className="text-xs text-neutral-500 truncate">{lot.address}</div>
        )}
        <div className="mt-1 text-sm text-neutral-700">
          {formatMeters(lot.distanceMeters)} • {lot.walkMins} min walk
        </div>
      </div>

      <div className="ml-3 flex items-center">
        <div
          className={`h-5 w-5 rounded-full border flex items-center justify-center ${
            selected ? "border-black" : "border-neutral-300"
          }`}
        >
          {selected && <div className="h-3 w-3 rounded-full bg-black" />}
        </div>
      </div>
    </button>
  )
}
