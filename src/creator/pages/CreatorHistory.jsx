import { useState } from 'react'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { useCreatorTimeline } from '../hooks/useCreatorTimeline'
import { useCreatorLedger } from '../hooks/useCreatorLedger'
import {
  CreatorLayout,
  TimelineView,
  LedgerTable,
} from '../components'

/**
 * Creator History - Full history view with timeline and ledger table
 */
export const CreatorHistory = () => {
  const { creator } = useCreatorAuth()
  const [activeTab, setActiveTab] = useState('timeline') // 'timeline' | 'ledger'

  const timeline = useCreatorTimeline(creator?.id)
  const ledger = useCreatorLedger(creator?.id)

  const tabs = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'ledger', label: 'Journal' },
  ]

  return (
    <CreatorLayout
      title="Historique"
      subtitle="Consultez l'historique complet de vos transactions"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'timeline' && (
          <TimelineView
            events={timeline.events}
            loading={timeline.loading}
            hasMore={timeline.hasMore}
            onLoadMore={timeline.loadMore}
            getEventIcon={timeline.getEventIcon}
            getEventColor={timeline.getEventColor}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerTable
            entries={ledger.entries}
            loading={ledger.loading}
            hasMore={ledger.hasMore}
            onLoadMore={ledger.loadMore}
            transactionType={ledger.transactionType}
            onFilterChange={ledger.setTransactionType}
            transactionTypeLabels={ledger.transactionTypeLabels}
            getTypeLabel={ledger.getTypeLabel}
            getTypeColor={ledger.getTypeColor}
            onRefresh={ledger.refresh}
          />
        )}
      </div>
    </CreatorLayout>
  )
}
