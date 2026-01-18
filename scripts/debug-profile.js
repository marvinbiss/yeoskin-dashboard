#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '..', '.env') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log('🔍 Debug: Checking creator_profiles...\n')

  // 1. Fetch the profile first
  const { data: profile, error: fetchErr } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('slug', 'testcreator')
    .single()

  if (fetchErr) {
    console.error('Fetch error:', fetchErr.message)
    return
  }

  console.log('Current profile:')
  console.log(JSON.stringify(profile, null, 2))

  // 2. Try to update using ID directly
  console.log('\n🔧 Trying update via ID...')

  const { data: updated, error: updateErr } = await supabase
    .from('creator_profiles')
    .update({ is_public: true })
    .eq('id', profile.id)
    .select('id, slug, is_public')

  if (updateErr) {
    console.error('Update error:', updateErr.message)
    console.log('\n⚠️  There might be a trigger or RLS policy causing this error.')
    console.log('Run the SQL migration 003_fix_rls_final.sql to fix.')
  } else {
    console.log('✅ Updated:', updated)
  }
}

main()
