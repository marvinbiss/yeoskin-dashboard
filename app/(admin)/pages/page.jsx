'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/Layout'
import {
  FileText,
  Edit3,
  Eye,
  Plus,
  RefreshCw,
  ShoppingBag,
  Users,
  ExternalLink
} from 'lucide-react'

const AVAILABLE_PAGES = [
  {
    slug: 'routine-hydratation',
    name: 'Routine Hydratation',
    description: 'Page produit K-Beauty avec upsells',
    icon: ShoppingBag,
    url: '/shop/routine-hydratation',
    status: 'active'
  },
  {
    slug: 'apply',
    name: 'Onboarding Créateurs',
    description: 'Landing page programme créateur',
    icon: Users,
    url: '/apply',
    status: 'coming_soon'
  }
]

export default function AdminPagesPage() {
  const [pages, setPages] = useState(AVAILABLE_PAGES)
  const [loading, setLoading] = useState(false)

  return (
    <Layout title="Pages" subtitle="Gérez le contenu de vos landing pages">
      <div className="space-y-6">

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4">
        <h3 className="font-semibold text-pink-900 mb-2">Éditeur de pages type Shopify</h3>
        <p className="text-sm text-pink-800">
          Modifiez facilement les textes, images et prix de vos landing pages sans toucher au code.
          Chaque modification est sauvegardée avec un historique de versions.
        </p>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pages.map(page => {
          const Icon = page.icon
          const isActive = page.status === 'active'

          return (
            <div
              key={page.slug}
              className={`bg-white rounded-xl border ${
                isActive ? 'border-gray-200' : 'border-dashed border-gray-300'
              } overflow-hidden hover:shadow-lg transition-shadow`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-pink-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-pink-600' : 'text-gray-400'}`} />
                  </div>
                  {!isActive && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      Bientôt
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-1">{page.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{page.description}</p>

                <div className="flex items-center gap-2">
                  {isActive ? (
                    <>
                      <Link
                        href={`/pages/${page.slug}`}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Éditer
                      </Link>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </a>
                    </>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                    >
                      <Edit3 className="w-4 h-4" />
                      Éditer
                    </button>
                  )}
                </div>
              </div>

              {isActive && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    URL: <code className="bg-white px-2 py-0.5 rounded text-pink-600">{page.url}</code>
                  </span>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-700 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )
        })}

        {/* Add New Page Card */}
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">Nouvelle page</h3>
          <p className="text-sm text-gray-500 mb-4">
            Créez une nouvelle landing page produit
          </p>
          <button
            disabled
            className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
          >
            Bientôt disponible
          </button>
        </div>
      </div>
      </div>
    </Layout>
  )
}
