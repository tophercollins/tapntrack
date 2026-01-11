import { Header } from '../components/layout/Header'
import { ActivityGrid } from '../components/activities/ActivityGrid'
import { useEventStore } from '../stores/eventStore'

export function HomePage() {
  const { todayEvents } = useEventStore()

  const todayCount = todayEvents.length
  const subtitle = todayCount > 0
    ? `${todayCount} ${todayCount === 1 ? 'activity' : 'activities'} logged today`
    : 'Tap to start tracking'

  return (
    <div className="min-h-screen pb-24">
      <Header title="Tap N Track" subtitle={subtitle} />
      <ActivityGrid />
    </div>
  )
}
