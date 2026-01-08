import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { BottomNav } from './components/layout/BottomNav'
import { Logger } from './components/tracking/Logger'
import { HomePage } from './pages/HomePage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SessionScreen } from './pages/SessionScreen'
import { ActivityEditorPage } from './pages/ActivityEditorPage'
import { SubItemEditorPage } from './pages/SubItemEditorPage'
import { useActivityStore } from './stores/activityStore'
import { useEntryStore } from './stores/entryStore'
import { seedDatabase } from './db/seed'

function AppContent() {
  const location = useLocation()
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
        <Route path="/activity/:activityId/subitems" element={<SubItemEditorPage />} />
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
