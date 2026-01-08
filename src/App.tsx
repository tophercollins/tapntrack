import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/layout/BottomNav'
import { Logger } from './components/tracking/Logger'
import { HomePage } from './pages/HomePage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'
import { useActivityStore } from './stores/activityStore'
import { useEntryStore } from './stores/entryStore'
import { seedDatabase } from './db/seed'

export function App() {
  const { loadActivities } = useActivityStore()
  const { loadTodayEntries, loadEntries } = useEntryStore()

  useEffect(() => {
    const init = async () => {
      await seedDatabase()
      await loadActivities()
      await loadTodayEntries()
      await loadEntries()
    }
    init()
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <BottomNav />
        <Logger />
      </div>
    </BrowserRouter>
  )
}
