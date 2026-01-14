import { Link } from 'react-router-dom'

interface HeaderProps {
  title: string
  subtitle?: string
  backTo?: string
}

export function Header({ title, subtitle, backTo }: HeaderProps) {
  return (
    <header className="px-4 pt-safe">
      <div className="pt-4 pb-2">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center text-blue-400 text-sm mb-2 hover:text-blue-300"
          >
            <span className="mr-1">←</span> Back
          </Link>
        )}
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
      </div>
    </header>
  )
}
