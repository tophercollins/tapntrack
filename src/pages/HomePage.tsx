import { Header } from '../components/layout/Header'
import { ActivityGrid } from '../components/activities/ActivityGrid'
import { useEntryStore } from '../stores/entryStore'

export function HomePage() {
  const { todayEntries } = useEntryStore()

  const todayCount = todayEntries.length
  const subtitle = todayCount > 0
    ? `${todayCount} ${todayCount === 1 ? 'activity' : 'activities'} logged today`
    : 'Tap to start tracking'

  return (
    <div className="min-h-screen pb-20">
      <Header title="Tap N Track" subtitle={subtitle} />
      <ActivityGrid />
    </div>
  )
}
