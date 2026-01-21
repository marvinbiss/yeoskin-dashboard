/**
 * POST /api/cms/upload
 * Upload images to Supabase Storage for CMS
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const pageSlug = formData.get('page_slug') as string
    const imageKey = formData.get('image_key') as string

    if (!file || !pageSlug || !imageKey) {
      return NextResponse.json(
        { error: 'Missing file, page_slug, or image_key' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou GIF.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 5MB.' },
        { status: 400 }
      )
    }

    // Generate storage path
    const ext = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const storagePath = `pages/${pageSlug}/${imageKey}-${timestamp}.${ext}`

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cms-images')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload: ' + uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cms-images')
      .getPublicUrl(storagePath)

    // Save to database
    const { data: imageData, error: dbError } = await supabase
      .from('page_images')
      .upsert({
        page_slug: pageSlug,
        image_key: imageKey,
        storage_path: storagePath,
        url: publicUrl,
        alt_text: imageKey.replace(/-/g, ' '),
        file_size: file.size,
        mime_type: file.type
      }, {
        onConflict: 'page_slug,image_key'
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath,
      image: imageData
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
