/**
 * /api/routines/assignments
 * GET: fetch assignments for a routine
 * POST: assign creator to routine (upsert)
 * DELETE: unassign creator from routine
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
    const routineId = searchParams.get('routine_id')

    // Fetch all assignments
    const { data, error } = await supabase
      .from('creator_routines')
      .select('creator_id, routine_id')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignments: data || [] })
  } catch (error) {
    console.error('GET assignments error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { creator_id, routine_id } = await request.json()

    if (!creator_id || !routine_id) {
      return NextResponse.json({ error: 'creator_id et routine_id requis' }, { status: 400 })
    }

    const { error } = await supabase
      .from('creator_routines')
      .upsert({
        creator_id,
        routine_id,
        is_active: true,
      }, { onConflict: 'creator_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST assignments error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { creator_id, routine_id } = await request.json()

    if (!creator_id || !routine_id) {
      return NextResponse.json({ error: 'creator_id et routine_id requis' }, { status: 400 })
    }

    const { error } = await supabase
      .from('creator_routines')
      .delete()
      .eq('creator_id', creator_id)
      .eq('routine_id', routine_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE assignments error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
