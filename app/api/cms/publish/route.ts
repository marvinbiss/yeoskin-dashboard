/**
 * PUT /api/cms/publish
 * Toggle publish status for a page (all sections + linked routine)
 * Uses service_role to bypass RLS and trigger permission issues
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { page_slug, is_published } = body

    if (!page_slug || typeof is_published !== 'boolean') {
      return NextResponse.json(
        { error: 'page_slug et is_published requis' },
        { status: 400 }
      )
    }

    // 1. Update all CMS sections for this page
    const { error: sectionsError } = await supabase
      .from('page_content')
      .update({
        is_published,
        updated_at: new Date().toISOString()
      })
      .eq('page_slug', page_slug)

    if (sectionsError) {
      return NextResponse.json(
        { error: `Erreur sections: ${sectionsError.message}` },
        { status: 500 }
      )
    }

    // 2. Update linked routine is_active to match
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .update({ is_active: is_published })
      .eq('slug', page_slug)
      .select('id, title, is_active')
      .maybeSingle()

    if (routineError) {
      // Non-blocking: routine update failed but sections are already updated
      console.error('Routine update error:', routineError.message)
    }

    return NextResponse.json({
      success: true,
      is_published,
      routine_updated: !!routine
    })

  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
