interface EmojiButtonProps {
  emoji: string
  label?: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  onClick: () => void
  count?: number
}

const sizeClasses = {
  sm: 'w-14 h-14 text-2xl',
  md: 'w-20 h-20 text-4xl',
  lg: 'w-24 h-24 text-5xl',
}

export function EmojiButton({
  emoji,
  label,
  color,
  size = 'md',
  onClick,
  count,
}: EmojiButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
    >
      <div
        className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center
          bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all
          shadow-lg hover:shadow-xl relative`}
        style={{ borderColor: color, borderWidth: color ? 2 : 0 }}
      >
        <span className="select-none">{emoji}</span>
        {count !== undefined && count > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-blue-500 text-white
              text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {count}
          </span>
        )}
      </div>
      {label && (
        <span className="text-xs text-slate-400 group-hover:text-slate-300 truncate max-w-full">
          {label}
        </span>
      )}
    </button>
  )
}
