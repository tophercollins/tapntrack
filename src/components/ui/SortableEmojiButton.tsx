import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableEmojiButtonProps {
  id: string
  emoji: string
  label?: string
  color?: string
  onClick: () => void
  count?: number
  isDragMode: boolean
}

export function SortableEmojiButton({
  id,
  emoji,
  label,
  color,
  onClick,
  count,
  isDragMode,
}: SortableEmojiButtonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = () => {
    if (!isDragMode) {
      onClick()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-center gap-1 group"
    >
      <button
        onClick={handleClick}
        {...(isDragMode ? { ...attributes, ...listeners } : {})}
        className={`w-20 h-20 rounded-2xl flex items-center justify-center
          bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all
          shadow-lg hover:shadow-xl relative
          ${isDragMode ? 'cursor-grab active:cursor-grabbing animate-wiggle' : ''}
          ${isDragging ? 'z-50' : ''}`}
        style={{ borderColor: color, borderWidth: color ? 2 : 0 }}
      >
        <span className="select-none text-4xl">{emoji}</span>
        {count !== undefined && count > 0 && !isDragMode && (
          <span
            className="absolute -top-1 -right-1 bg-blue-500 text-white
              text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {count}
          </span>
        )}
      </button>
      {label && (
        <span className="text-xs text-slate-400 group-hover:text-slate-300 truncate max-w-full">
          {label}
        </span>
      )}
    </div>
  )
}
