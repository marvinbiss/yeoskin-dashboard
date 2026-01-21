'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook to fetch CMS content for a page
 * @param {string} pageSlug - The page slug (e.g., 'routine-hydratation')
 * @param {object} fallbackContent - Default content to use if CMS fails
 */
export function useCmsContent(pageSlug, fallbackContent = {}) {
  const [content, setContent] = useState(fallbackContent)
  const [images, setImages] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchContent = useCallback(async () => {
    if (!pageSlug) return

    try {
      setLoading(true)
      const res = await fetch(`/api/cms/content?page_slug=${pageSlug}`)

      if (!res.ok) {
        throw new Error('Failed to fetch content')
      }

      const data = await res.json()

      if (data.content && data.content.length > 0) {
        // Convert array to object keyed by section_key
        const contentMap = {}
        data.content.forEach(section => {
          contentMap[section.section_key] = section.content
        })
        setContent(contentMap)
      }

      if (data.images) {
        setImages(data.images)
      }

      setError(null)
    } catch (err) {
      console.error('CMS fetch error:', err)
      setError(err.message)
      // Keep using fallback content
    } finally {
      setLoading(false)
    }
  }, [pageSlug])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  // Helper to get section content with fallback
  const getSection = (sectionKey) => {
    return content[sectionKey] || fallbackContent[sectionKey] || {}
  }

  // Helper to get image URL
  const getImage = (imageKey, fallbackUrl = '') => {
    return images[imageKey] || fallbackUrl
  }

  return {
    content,
    images,
    loading,
    error,
    getSection,
    getImage,
    refetch: fetchContent
  }
}

export default useCmsContent
