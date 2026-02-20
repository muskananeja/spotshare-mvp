"use client"

export default function BottomActionBar({
  label,
  disabled,
  onClick,
  secondaryLabel,
  onSecondaryClick,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  secondaryLabel?: string
  onSecondaryClick?: () => void
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t">
      <div className="mx-auto max-w-sm px-4 py-3 space-y-2">
        {secondaryLabel && onSecondaryClick && (
          <button
            onClick={onSecondaryClick}
            className="w-full rounded-2xl border border-neutral-300 py-3 font-medium"
          >
            {secondaryLabel}
          </button>
        )}

        <button
          disabled={disabled}
          onClick={onClick}
          className="w-full rounded-2xl bg-black py-4 text-white text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {label}
        </button>
      </div>
    </div>
  )
}
