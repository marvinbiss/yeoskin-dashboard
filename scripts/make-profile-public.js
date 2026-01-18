#!/usr/bin/env node
/**
 * Make testcreator profile public for testing
 * Uses service role to bypass RLS
 */

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
  console.log('📝 Making testcreator profile public...\n')

  const { data, error } = await supabase
    .from('creator_profiles')
    .update({ is_public: true })
    .eq('slug', 'testcreator')
    .select()
    .single()

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log('✅ Profile updated:')
  console.log('   slug:', data.slug)
  console.log('   is_public:', data.is_public)
  console.log('   is_active:', data.is_active)
  console.log('')
  console.log('🌐 Public URL: http://localhost:3009/c/testcreator')
}

main()
