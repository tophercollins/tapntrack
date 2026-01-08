import { type ReactNode } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl
          shadow-2xl animate-slide-up max-h-[80vh] overflow-auto"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {title && (
          <h2 className="text-xl font-semibold text-center text-white pb-2">
            {title}
          </h2>
        )}

        <div className="px-4 pb-8">{children}</div>
      </div>
    </div>
  )
}
