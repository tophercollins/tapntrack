import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { BottomNav } from './components/layout/BottomNav'
import { Logger } from './components/tracking/Logger'
import { HomePage } from './pages/HomePage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SessionScreen } from './pages/SessionScreen'
import { ActivityEditorPage } from './pages/ActivityEditorPage'
import { ChildActivitiesPage } from './pages/ChildActivitiesPage'
import { useActivityStore } from './stores/activityStore'
import { useEventStore } from './stores/eventStore'
import { seedDatabase } from './db/seed'

function AppContent() {
  const location = useLocation()
  const { loadActivities } = useActivityStore()
  const { loadTodayEvents, loadEvents } = useEventStore()

  useEffect(() => {
    const init = async () => {
      await seedDatabase()
      await loadActivities()
      await loadTodayEvents()
      await loadEvents()
    }
    init()
  }, [])

  // Hide bottom nav on certain pages
  const hideBottomNav =
    location.pathname.startsWith('/session') ||
    location.pathname.startsWith('/activity')

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/session/:activityId" element={<SessionScreen />} />
        <Route path="/activity/new" element={<ActivityEditorPage />} />
        <Route path="/activity/:activityId/edit" element={<ActivityEditorPage />} />
        <Route path="/activity/:activityId/children" element={<ChildActivitiesPage />} />
      </Routes>
      {!hideBottomNav && <BottomNav />}
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
