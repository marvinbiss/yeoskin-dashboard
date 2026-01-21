import {
  Sparkles,
  TrendingUp,
  Gift,
  Users,
  CheckCircle2,
  ArrowRight,
  Star,
  Zap,
  Heart,
  ShieldCheck
} from 'lucide-react'

export const metadata = {
  title: 'Deviens Créateur Yeoskin | Programme Affiliation K-Beauty',
  description: 'Rejoins le programme créateur Yeoskin et gagne jusqu\'à 20% de commission sur chaque vente. Accès exclusif aux produits K-Beauty, support dédié et paiements rapides.',
  openGraph: {
    title: 'Deviens Créateur Yeoskin',
    description: 'Gagne jusqu\'à 20% de commission en partageant ta passion pour la K-Beauty',
    type: 'website',
  },
}

const benefits = [
  {
    icon: TrendingUp,
    title: 'Commissions attractives',
    description: 'Jusqu\'à 20% sur chaque vente générée via ton lien unique',
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
  {
    icon: Gift,
    title: 'Produits gratuits',
    description: 'Reçois des produits exclusifs pour créer ton contenu',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Zap,
    title: 'Paiements rapides',
    description: 'Virements automatiques chaque mois sur ton compte',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
  },
  {
    icon: Users,
    title: 'Communauté exclusive',
    description: 'Rejoins une communauté de créateurs passionnés',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: ShieldCheck,
    title: 'Dashboard dédié',
    description: 'Suis tes performances en temps réel',
    color: 'text-pink-500',
    bg: 'bg-pink-50',
  },
  {
    icon: Heart,
    title: 'Support prioritaire',
    description: 'Une équipe dédiée pour t\'accompagner',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
]

const tiers = [
  {
    name: 'Bronze',
    rate: '15%',
    color: 'from-amber-600 to-amber-800',
    borderColor: 'border-amber-300',
    features: ['Lien d\'affiliation unique', 'Dashboard analytics', 'Support email', 'Paiement mensuel'],
    requirement: 'Ouvert à tous',
  },
  {
    name: 'Silver',
    rate: '17%',
    color: 'from-gray-400 to-gray-600',
    borderColor: 'border-gray-300',
    features: ['Tout Bronze +', 'Produits gratuits', 'Accès anticipé nouveautés', 'Support prioritaire'],
    requirement: '5 000+ followers',
    popular: true,
  },
  {
    name: 'Gold',
    rate: '20%',
    color: 'from-yellow-400 to-yellow-600',
    borderColor: 'border-yellow-300',
    features: ['Tout Silver +', 'Commission maximale', 'Co-création produits', 'Manager dédié'],
    requirement: 'Sur invitation',
  },
]

const testimonials = [
  {
    name: 'Emma L.',
    handle: '@emma.skincare',
    avatar: '👩🏻',
    quote: 'Yeoskin m\'a permis de transformer ma passion en revenus. Le dashboard est super intuitif !',
    followers: '45K',
  },
  {
    name: 'Sarah M.',
    handle: '@sarahbeauty',
    avatar: '👩🏽',
    quote: 'Les produits sont incroyables et la commission est vraiment généreuse. Je recommande !',
    followers: '28K',
  },
  {
    name: 'Julie R.',
    handle: '@juliekbeauty',
    avatar: '👩🏼',
    quote: 'L\'équipe est réactive et les paiements toujours à l\'heure. Parfait pour les créateurs.',
    followers: '67K',
  },
]

const faqs = [
  {
    q: 'Qui peut devenir créateur Yeoskin ?',
    a: 'Toute personne passionnée par la K-Beauty avec une présence sur les réseaux sociaux peut postuler. Nous acceptons les créateurs de toutes tailles.',
  },
  {
    q: 'Combien puis-je gagner ?',
    a: 'Vos gains dépendent de votre audience et engagement. Nos créateurs gagnent entre 100€ et 5000€+ par mois selon leur activité.',
  },
  {
    q: 'Quand suis-je payé(e) ?',
    a: 'Les paiements sont effectués mensuellement, le 15 de chaque mois, pour toutes les commissions du mois précédent.',
  },
  {
    q: 'Dois-je acheter les produits ?',
    a: 'Non ! Nous envoyons gratuitement les produits aux créateurs Silver et Gold. Les Bronze bénéficient de réductions exclusives.',
  },
  {
    q: 'Comment fonctionne le tracking ?',
    a: 'Chaque créateur reçoit un code promo unique et un lien personnalisé. Toutes les ventes sont trackées automatiquement.',
  },
  {
    q: 'Puis-je promouvoir d\'autres marques ?',
    a: 'Oui, nous n\'exigeons pas d\'exclusivité. Vous êtes libre de collaborer avec d\'autres marques.',
  },
]

export default function ApplyLandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-pink-100 mb-8">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-medium text-gray-700">Programme Créateur 2025</span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Transforme ta passion pour la{' '}
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                K-Beauty
              </span>
              <br />en revenus
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Rejoins +200 créateurs qui gagnent jusqu'à <strong>20% de commission</strong> en partageant
              les meilleurs produits de beauté coréenne.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/apply/form"
                className="group bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
              >
                Postuler maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#benefits"
                className="text-gray-600 hover:text-gray-900 px-8 py-4 rounded-full text-lg font-medium transition-colors"
              >
                En savoir plus
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {['👩🏻', '👩🏽', '👩🏼', '👩🏾'].map((emoji, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-lg border-2 border-white">
                      {emoji}
                    </div>
                  ))}
                </div>
                <span>+200 créateurs</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi rejoindre Yeoskin ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Un programme conçu pour maximiser tes revenus et simplifier ta vie de créateur
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-pink-200 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 ${benefit.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers Section */}
      <section id="tiers" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Nos niveaux de commission
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Plus tu grandis, plus tes avantages augmentent
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl bg-white border-2 ${tier.borderColor} ${tier.popular ? 'shadow-xl scale-105' : 'shadow-sm'} transition-all hover:shadow-lg`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      POPULAIRE
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${tier.color} mb-4`}>
                    <span className="text-2xl font-bold text-white">{tier.rate}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{tier.requirement}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/apply/form"
                  className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
                    tier.popular
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Commencer
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ce que disent nos créateurs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.handle} · {testimonial.followers}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-600">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Prêt(e) à rejoindre l'aventure ?
          </h2>
          <p className="text-xl text-pink-100 mb-10 max-w-2xl mx-auto">
            Candidature en 2 minutes. Réponse sous 48h pour les créateurs avec 5K+ followers.
          </p>
          <a
            href="/apply/form"
            className="inline-flex items-center gap-2 bg-white text-pink-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:scale-105 transition-all"
          >
            Postuler maintenant
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </div>
  )
}
