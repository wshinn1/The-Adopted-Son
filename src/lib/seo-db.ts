'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getSeoSuggestions(key: string) {
  const { data } = await supabaseAdmin
    .from('seo_suggestions')
    .select('suggestions, updated_at')
    .eq('table_name', key.split(':')[0])
    .eq('record_id', key.split(':')[1] ?? key)
    .single()
  if (!data) return null
  return { data: data.suggestions, savedAt: new Date(data.updated_at).toISOString() }
}

export async function saveSeoSuggestions(key: string, suggestions: unknown) {
  const [tableName, recordId] = key.split(':')
  if (!tableName || !recordId) return
  await supabaseAdmin.from('seo_suggestions').upsert(
    { table_name: tableName, record_id: recordId, suggestions, updated_at: new Date().toISOString() },
    { onConflict: 'table_name,record_id' }
  )
}

export async function deleteSeoSuggestions(key: string) {
  const [tableName, recordId] = key.split(':')
  if (!tableName || !recordId) return
  await supabaseAdmin.from('seo_suggestions').delete()
    .eq('table_name', tableName).eq('record_id', recordId)
}
