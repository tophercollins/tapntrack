import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActivityStore } from '../stores/activityStore'
import { db } from '../db/database'
import type { SubItem } from '../types'

export function SubItemEditorPage() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const { activities, loadActivities } = useActivityStore()

  const activity = activities.find((a) => a.id === activityId)

  const [subItems, setSubItems] = useState<SubItem[]>([])
  const [newEmoji, setNewEmoji] = useState('')
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (activityId) {
      db.subItems
        .where('activityId')
        .equals(activityId)
        .sortBy('sortOrder')
        .then(setSubItems)
    }
  }, [activityId])

  const handleAddSubItem = async () => {
    if (!activityId || !newEmoji || !newName) return

    const subItem: SubItem = {
      id: crypto.randomUUID(),
      activityId,
      name: newName,
      emoji: newEmoji,
      sortOrder: subItems.length,
    }

    await db.subItems.add(subItem)
    setSubItems([...subItems, subItem])
    setNewEmoji('')
    setNewName('')
    await loadActivities()
  }

  const handleDeleteSubItem = async (id: string) => {
    await db.subItems.delete(id)
    setSubItems(subItems.filter((item) => item.id !== id))
    await loadActivities()
  }

  const handleDone = () => {
    navigate('/')
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Activity not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe">
        <div className="pt-4 pb-2">
          <button
            onClick={() => navigate(`/activity/${activityId}/edit`)}
            className="text-blue-400 hover:text-blue-300"
          >
            ← Back
          </button>
        </div>
        <h1 className="pt-4 pb-2 text-lg font-semibold flex items-center gap-2">
          <span>{activity.emoji}</span>
          <span>Sub-items</span>
        </h1>
        <div className="pt-4 pb-2">
          <button
            onClick={handleDone}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Done
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Existing sub-items */}
        {subItems.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No sub-items yet</p>
            <p className="text-sm">Add items that you'll track during a session</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteSubItem(item.id)}
                  className="text-red-400 hover:text-red-300 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new sub-item form - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 pb-safe">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <input
              type="text"
              value={newEmoji}
              onChange={(e) => {
                const value = e.target.value
                const lastChar = [...value].pop() || ''
                setNewEmoji(lastChar)
              }}
              placeholder="😀"
              className="w-14 h-12 rounded-xl bg-slate-800 text-center text-2xl
                placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Sub-item name"
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubItem()}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-white
              placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddSubItem}
            disabled={!newEmoji || !newName}
            className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500
              disabled:bg-slate-700 disabled:text-slate-500 font-semibold transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
