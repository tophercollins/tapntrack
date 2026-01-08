interface ConfirmationProps {
  message: string
}

export function Confirmation({ message }: ConfirmationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl
        animate-bounce-in flex items-center gap-3">
        <span className="text-3xl">✓</span>
        <span className="text-lg font-semibold">{message}</span>
      </div>
    </div>
  )
}
