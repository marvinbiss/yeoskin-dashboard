'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Mail,
  Instagram,
  MessageCircle
} from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const applicationId = searchParams.get('id')
  const autoApproved = searchParams.get('auto') === 'true'

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success animation */}
        <div className="mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
            autoApproved
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-pink-500 to-purple-600'
          } animate-bounce`}>
            {autoApproved ? (
              <Sparkles className="w-12 h-12 text-white" />
            ) : (
              <CheckCircle2 className="w-12 h-12 text-white" />
            )}
          </div>
        </div>

        {/* Main message */}
        {autoApproved ? (
          <>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Félicitations ! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Ta candidature a été <span className="text-green-600 font-semibold">automatiquement approuvée</span> !
              Tu fais désormais partie de la famille Yeoskin.
            </p>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-green-800 mb-3">Prochaines étapes</h2>
              <ul className="text-left space-y-3 text-green-700">
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Check ton email pour tes identifiants de connexion</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Connecte-toi à ton dashboard créateur</span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Configure ton profil et commence à partager !</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://dashboard.yeoskin.com"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Accéder à mon dashboard
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Candidature envoyée !
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Merci pour ta candidature ! Notre équipe va l'examiner et te répondra sous 48-72h.
            </p>

            <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-center gap-2 text-pink-600 mb-3">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">En attente de validation</span>
              </div>
              <p className="text-gray-600 text-sm">
                Ton ID de candidature : <code className="bg-white px-2 py-1 rounded text-pink-600">{applicationId}</code>
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">En attendant...</h2>
              <ul className="text-left space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span>Tu recevras un email de confirmation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Instagram className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span>Suis-nous sur Instagram pour les dernières news</span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span>Questions ? Contacte-nous à creators@yeoskin.com</span>
                </li>
              </ul>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Retour à l'accueil
            </Link>
          </>
        )}

        {/* Social follow */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Suis-nous sur les réseaux</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://instagram.com/yeoskin"
              className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white hover:scale-110 transition-transform"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://tiktok.com/@yeoskin"
              className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white hover:scale-110 transition-transform"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
