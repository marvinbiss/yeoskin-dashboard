/**
 * GET /api/routines?slug=xxx
 * Fetch routine by slug (for page editor linkage)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'slug requis' }, { status: 400 })
    }

    const { data: routine, error } = await supabase
      .from('routines')
      .select('id, title, slug, base_price, upsell_1_price, upsell_2_price, is_active, base_products')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ routine })

  } catch (error) {
    console.error('GET routines error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
