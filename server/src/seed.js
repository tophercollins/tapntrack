// Seeds the server DB with the 4 default activities (mirrors src/db/seed.ts) so /api/log works
// before the app has synced anything up. Idempotent: ON CONFLICT (id) updates in place.
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const activities = [
  { id: 'vitamins',  name: 'Vitamins',   emoji: '💊', color: '#22c55e', tracking_type: 'tap',      unit: null,   daily_target: 1,  dimensions: null, value_formula: null,       sort_order: 0 },
  { id: 'pressups',  name: 'Pressups',   emoji: '💪', color: '#3b82f6', tracking_type: 'number',   unit: 'reps', daily_target: 50, dimensions: null, value_formula: null,       sort_order: 1 },
  { id: 'meditation',name: 'Meditation', emoji: '🧘', color: '#f97316', tracking_type: 'duration', unit: null,   daily_target: 10, dimensions: null, value_formula: null,       sort_order: 2 },
  { id: 'bouldering',name: 'Bouldering', emoji: '🧗', color: '#ef4444', tracking_type: 'custom',   unit: null,   daily_target: 10, value_formula: 'multiply', sort_order: 3,
    dimensions: [
      { id: 'grade', name: 'Grade', required: true, defaultValue: 'V2', options: [
        { value: 'V0', numericValue: 1 }, { value: 'V1', numericValue: 2 }, { value: 'V2', numericValue: 3 },
        { value: 'V3', numericValue: 4 }, { value: 'V4', numericValue: 5 }, { value: 'V5', numericValue: 6 },
        { value: 'V6', numericValue: 7 }, { value: 'V7', numericValue: 8 }, { value: 'V8', numericValue: 9 },
        { value: 'V9', numericValue: 10 } ] },
      { id: 'outcome', name: 'Outcome', required: true, defaultValue: 'Send', options: [
        { value: 'Attempt', numericValue: 0.5 }, { value: 'Send', numericValue: 1 } ] },
      { id: 'hang', name: 'Hang', required: true, defaultValue: 'No', options: [
        { value: 'Yes', numericValue: 1.5 }, { value: 'No', numericValue: 1 } ] },
    ] },
]

const sql = `INSERT INTO activities (id,name,emoji,color,tracking_type,unit,daily_target,dimensions,value_formula,sort_order,is_base)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
  ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, emoji=EXCLUDED.emoji, color=EXCLUDED.color,
    tracking_type=EXCLUDED.tracking_type, unit=EXCLUDED.unit, daily_target=EXCLUDED.daily_target,
    dimensions=EXCLUDED.dimensions, value_formula=EXCLUDED.value_formula, sort_order=EXCLUDED.sort_order, updated_at=NOW()`

for (const a of activities) {
  await pool.query(sql, [a.id, a.name, a.emoji, a.color, a.tracking_type, a.unit, a.daily_target,
    a.dimensions ? JSON.stringify(a.dimensions) : null, a.value_formula, a.sort_order])
  console.log('seeded', a.emoji, a.name)
}
await pool.end()
console.log('done')
