/**
 * GET/PUT/POST/DELETE /api/cms/content
 * Manage page content for CMS
 *
 * GET: Public (for displaying content)
 * PUT/POST/DELETE: Admin only (for editing)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAuth, unauthorizedResponse } from '@/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// GET - Fetch page content (public for published, admin for unpublished)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSlug = searchParams.get('page_slug')
    const sectionKey = searchParams.get('section_key')
    const includeUnpublished = searchParams.get('include_unpublished') === 'true'

    // If requesting unpublished content, require admin auth
    if (includeUnpublished) {
      const auth = await verifyAdminAuth(request)
      if (!auth.authenticated) {
        return unauthorizedResponse('Admin access required for unpublished content')
      }
    }

    let query = supabase
      .from('page_content')
      .select('*')
      .order('sort_order', { ascending: true })

    if (pageSlug) {
      query = query.eq('page_slug', pageSlug)
    }

    if (sectionKey) {
      query = query.eq('section_key', sectionKey)
    }

    if (!includeUnpublished) {
      query = query.eq('is_published', true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also fetch images for this page
    let imagesQuery = supabase.from('page_images').select('*')
    if (pageSlug) {
      imagesQuery = imagesQuery.eq('page_slug', pageSlug)
    }
    const { data: images } = await imagesQuery

    // Map images by key for easy access
    const imageMap: Record<string, string> = {}
    images?.forEach(img => {
      imageMap[img.image_key] = img.url
    })

    return NextResponse.json({
      content: data,
      images: imageMap
    })

  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Update page content (admin only)
export async function PUT(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const body = await request.json()
    const { page_slug, section_key, content, is_published } = body

    if (!page_slug || !section_key) {
      return NextResponse.json(
        { error: 'page_slug et section_key requis' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      content,
      updated_at: new Date().toISOString()
    }

    if (typeof is_published === 'boolean') {
      updateData.is_published = is_published
    }

    // First try to update existing row
    const { data: existing } = await supabase
      .from('page_content')
      .select('id')
      .eq('page_slug', page_slug)
      .eq('section_key', section_key)
      .maybeSingle()

    let data, error

    if (existing) {
      // Update existing
      const result = await supabase
        .from('page_content')
        .update(updateData)
        .eq('page_slug', page_slug)
        .eq('section_key', section_key)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Insert new
      const result = await supabase
        .from('page_content')
        .insert({
          page_slug,
          section_key,
          ...updateData,
          sort_order: 0
        })
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('CMS PUT error detail:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('PUT error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Create new section (admin only)
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const body = await request.json()
    const { page_slug, section_key, content, sort_order } = body

    if (!page_slug || !section_key) {
      return NextResponse.json(
        { error: 'page_slug et section_key requis' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('page_content')
      .insert({
        page_slug,
        section_key,
        content: content || {},
        sort_order: sort_order || 0,
        is_published: false
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Remove section (admin only)
export async function DELETE(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }

    const { error } = await supabase
      .from('page_content')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
