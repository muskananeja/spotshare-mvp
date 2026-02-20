"use client"

import { useRouter } from "next/navigation"
import DestinationInput from "@/components/DestinationInput"
import BottomActionBar from "@/components/BottomActionBar"
import { useTripStore } from "@/store/tripStore"

export default function HomePage() {
  const router = useRouter()
  const destination = useTripStore((s) => s.destination)

  return (
    <main className="min-h-screen flex items-center justify-center px-4 pb-24">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Where are you going?
          </h1>
        </div>

        <DestinationInput />

        <BottomActionBar
          label="Enter location"
          disabled={!destination}
          onClick={() => router.push("/lots")}
        />
      </div>
    </main>
  )
}
