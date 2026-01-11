import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/layout/BottomNav'
import { Logger } from './components/tracking/Logger'
import { HomePage } from './pages/HomePage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ActivityEditorPage } from './pages/ActivityEditorPage'
import { useActivityStore } from './stores/activityStore'
import { useEventStore } from './stores/eventStore'
import { useUIStore } from './stores/uiStore'
import { seedDatabase } from './db/seed'

function AppContent() {
  const { loadActivities } = useActivityStore()
  const { loadTodayEvents, loadEvents } = useEventStore()
  const { showError } = useUIStore()

  useEffect(() => {
    const init = async () => {
      try {
        await seedDatabase()
        await loadActivities()
        await loadTodayEvents()
        await loadEvents()
      } catch (error) {
        console.error('Failed to initialize app:', error)
        showError('Failed to load data. Please refresh.')
      }
    }
    init()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/activity/new" element={<ActivityEditorPage />} />
        <Route path="/activity/:activityId/edit" element={<ActivityEditorPage />} />
      </Routes>
      <BottomNav />
      <Logger />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
