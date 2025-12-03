import { useState } from 'react';
import {
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LinkIcon,
  QrCodeIcon,
  ChartBarIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Liens',
    question: 'Comment créer un lien court ?',
    answer:
      'Cliquez sur "Créer un lien" dans la barre latérale, entrez votre URL longue, personnalisez le slug si souhaité, puis cliquez sur "Créer". Votre lien court sera généré instantanément.',
  },
  {
    category: 'Liens',
    question: 'Puis-je personnaliser mon slug ?',
    answer:
      "Oui ! Lors de la création d'un lien, vous pouvez définir un slug personnalisé. Si vous le laissez vide, un slug court aléatoire sera généré automatiquement.",
  },
  {
    category: 'Liens',
    question: 'Mes liens expirent-ils ?',
    answer:
      "Par défaut, les liens n'expirent jamais. Cependant, vous pouvez définir une date d'expiration lors de la création ou modification d'un lien pour le désactiver automatiquement.",
  },
  {
    category: 'Liens',
    question: 'Puis-je protéger un lien avec un mot de passe ?',
    answer:
      "Oui, vous pouvez ajouter un mot de passe à n'importe quel lien. Les visiteurs devront entrer le mot de passe avant d'être redirigés vers l'URL de destination.",
  },
  {
    category: 'QR Codes',
    question: 'Quels types de QR codes puis-je créer ?',
    answer:
      'Vous pouvez créer des QR codes pour : URLs, texte libre, cartes de visite (vCard), WiFi, emails, numéros de téléphone, et SMS.',
  },
  {
    category: 'QR Codes',
    question: "Puis-je personnaliser l'apparence de mes QR codes ?",
    answer:
      'Absolument ! Vous pouvez modifier les couleurs (premier plan et arrière-plan) et ajouter votre logo au centre du QR code.',
  },
  {
    category: 'QR Codes',
    question: 'Dans quel format puis-je télécharger mes QR codes ?',
    answer:
      "Les QR codes sont téléchargeables en format PNG haute résolution, parfait pour l'impression ou l'utilisation numérique.",
  },
  {
    category: 'Analytics',
    question: 'Quelles statistiques sont disponibles ?',
    answer:
      "Vous avez accès aux clics totaux, visiteurs uniques, répartition géographique, types d'appareils, navigateurs utilisés, et sources de trafic.",
  },
  {
    category: 'Analytics',
    question: 'Les statistiques sont-elles en temps réel ?',
    answer:
      'Oui, les statistiques sont mises à jour en temps réel. Chaque clic ou scan est comptabilisé instantanément.',
  },
  {
    category: 'Compte',
    question: 'Comment modifier mes informations de profil ?',
    answer:
      'Allez dans Paramètres depuis le menu de votre profil. Vous pourrez y modifier votre nom, email, et mot de passe.',
  },
  {
    category: 'Compte',
    question: 'Comment supprimer mon compte ?',
    answer:
      'Dans les Paramètres, faites défiler jusqu\'à la section "Zone de danger" et cliquez sur "Supprimer le compte". Attention, cette action est irréversible.',
  },
];

const categories = [
  { id: 'all', label: 'Tout', icon: BookOpenIcon },
  { id: 'Liens', label: 'Liens', icon: LinkIcon },
  { id: 'QR Codes', label: 'QR Codes', icon: QrCodeIcon },
  { id: 'Analytics', label: 'Analytics', icon: ChartBarIcon },
  { id: 'Compte', label: 'Compte', icon: CogIcon },
];

export function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="bg-primary-100 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <QuestionMarkCircleIcon className="text-primary-600 h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Centre d'aide</h1>
        <p className="mt-2 text-gray-600">
          Trouvez des réponses à vos questions ou contactez notre équipe
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher dans l'aide..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input w-full py-3 pl-4 pr-10 text-lg"
        />
        <svg
          className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <a
          href="mailto:support@wrx-generator.com"
          className="hover:border-primary-300 hover:bg-primary-50 flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors"
        >
          <div className="rounded-lg bg-blue-100 p-3">
            <EnvelopeIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Email</h3>
            <p className="text-sm text-gray-500">support@wrx-generator.com</p>
          </div>
        </a>

        <a
          href="#"
          className="hover:border-primary-300 hover:bg-primary-50 flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors"
        >
          <div className="rounded-lg bg-green-100 p-3">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Chat en direct</h3>
            <p className="text-sm text-gray-500">Réponse en moins de 5 min</p>
          </div>
        </a>

        <a
          href="#"
          className="hover:border-primary-300 hover:bg-primary-50 flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors"
        >
          <div className="rounded-lg bg-purple-100 p-3">
            <BookOpenIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Documentation</h3>
            <p className="text-sm text-gray-500">Guides détaillés</p>
          </div>
        </a>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Questions fréquentes</h2>

        {filteredFAQs.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">Aucune question trouvée pour cette recherche</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-primary-600 hover:text-primary-700 mt-4"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          filteredFAQs.map((faq, index) => (
            <div key={index} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {faq.category}
                  </span>
                  <span className="font-medium text-gray-900">{faq.question}</span>
                </div>
                {expandedIndex === index ? (
                  <ChevronUpIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
                )}
              </button>
              {expandedIndex === index && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Still Need Help */}
      <div className="from-primary-600 to-primary-700 rounded-lg bg-gradient-to-r p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Vous n'avez pas trouvé votre réponse ?</h2>
        <p className="text-primary-100 mt-2">
          Notre équipe de support est disponible pour vous aider
        </p>
        <a
          href="mailto:support@wrx-generator.com"
          className="text-primary-700 mt-4 inline-block rounded-lg bg-white px-6 py-3 font-semibold transition-colors hover:bg-gray-100"
        >
          Contacter le support
        </a>
      </div>
    </div>
  );
}
