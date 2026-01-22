'use client'

/**
 * YEOSKIN DASHBOARD - Financial Ledger Components
 * ============================================================================
 * Enterprise-grade financial observability with:
 * - Immutable ledger display
 * - Real-time balance tracking
 * - Transaction history
 * - Audit trail visualization
 * ============================================================================
 */

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  DollarSign,
  CreditCard,
  FileText,
  Eye
} from 'lucide-react'
import clsx from 'clsx'
import { Card, Button, Badge, Spinner, EmptyState, Modal } from '../Common'
import { useFinancialLedger } from '../../hooks/usePaymentExecution'
import { LEDGER_TYPES, formatCurrency } from '../../lib/supabase'

// ============================================================================
// TRANSACTION TYPE CONFIG
// ============================================================================

const TRANSACTION_CONFIG = {
  [LEDGER_TYPES.COMMISSION_EARNED]: {
    label: 'Commission gagnee',
    icon: TrendingUp,
    color: 'success',
    direction: 'credit'
  },
  [LEDGER_TYPES.COMMISSION_CANCELED]: {
    label: 'Commission annulee',
    icon: XCircle,
    color: 'danger',
    direction: 'debit'
  },
  [LEDGER_TYPES.COMMISSION_ADJUSTED]: {
    label: 'Ajustement commission',
    icon: FileText,
    color: 'warning',
    direction: 'mixed'
  },
  [LEDGER_TYPES.PAYOUT_INITIATED]: {
    label: 'Paiement initie',
    icon: Clock,
    color: 'primary',
    direction: 'debit'
  },
  [LEDGER_TYPES.PAYOUT_SENT]: {
    label: 'Paiement envoye',
    icon: ArrowRight,
    color: 'primary',
    direction: 'debit'
  },
  [LEDGER_TYPES.PAYOUT_COMPLETED]: {
    label: 'Paiement termine',
    icon: CheckCircle,
    color: 'success',
    direction: 'debit'
  },
  [LEDGER_TYPES.PAYOUT_FAILED]: {
    label: 'Paiement echoue',
    icon: AlertTriangle,
    color: 'danger',
    direction: 'credit' // Money returned
  },
  [LEDGER_TYPES.PAYOUT_FEE]: {
    label: 'Frais Wise',
    icon: CreditCard,
    color: 'gray',
    direction: 'debit'
  },
  [LEDGER_TYPES.BALANCE_ADJUSTMENT]: {
    label: 'Ajustement solde',
    icon: DollarSign,
    color: 'warning',
    direction: 'mixed'
  },
  [LEDGER_TYPES.REFUND_PROCESSED]: {
    label: 'Remboursement',
    icon: TrendingDown,
    color: 'danger',
    direction: 'debit'
  }
}

// ============================================================================
// LEDGER ENTRY ROW
// ============================================================================

const LedgerEntryRow = ({ entry, onViewDetails }) => {
  const config = TRANSACTION_CONFIG[entry.transaction_type] || {
    label: entry.transaction_type,
    icon: FileText,
    color: 'gray',
    direction: 'mixed'
  }

  const Icon = config.icon
  const isCredit = config.direction === 'credit' ||
    (config.direction === 'mixed' && entry.balance_after > 0)

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Entry Number */}
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-gray-500">
          #{entry.entry_number}
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-3">
        <div className="text-sm text-gray-900 dark:text-white">
          {format(new Date(entry.created_at), 'd MMM yyyy', { locale: fr })}
        </div>
        <div className="text-xs text-gray-500">
          {format(new Date(entry.created_at), 'HH:mm:ss')}
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            config.color === 'success' && 'bg-success-100 dark:bg-success-900/30',
            config.color === 'danger' && 'bg-danger-100 dark:bg-danger-900/30',
            config.color === 'warning' && 'bg-warning-100 dark:bg-warning-900/30',
            config.color === 'primary' && 'bg-primary-100 dark:bg-primary-900/30',
            config.color === 'gray' && 'bg-gray-100 dark:bg-gray-800'
          )}>
            <Icon className={clsx(
              'w-4 h-4',
              config.color === 'success' && 'text-success-600',
              config.color === 'danger' && 'text-danger-600',
              config.color === 'warning' && 'text-warning-600',
              config.color === 'primary' && 'text-primary-600',
              config.color === 'gray' && 'text-gray-500'
            )} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {config.label}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">
              {entry.description}
            </p>
          </div>
        </div>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-right">
        <span className={clsx(
          'font-medium',
          isCredit ? 'text-success-600' : 'text-danger-600'
        )}>
          {isCredit ? '+' : '-'}{formatCurrency(entry.amount)}
        </span>
      </td>

      {/* Balance After */}
      <td className="px-4 py-3 text-right">
        <span className="font-medium text-gray-900 dark:text-white">
          {formatCurrency(entry.balance_after)}
        </span>
      </td>

      {/* References */}
      <td className="px-4 py-3">
        <div className="text-xs space-y-1">
          {entry.shopify_order_id && (
            <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
              Shopify: {entry.shopify_order_id}
            </span>
          )}
          {entry.wise_transfer_reference && (
            <span className="inline-block px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 rounded text-primary-700 dark:text-primary-300">
              Wise: {entry.wise_transfer_reference}
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <button
          onClick={() => onViewDetails?.(entry)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Voir les details"
        >
          <Eye className="w-4 h-4 text-gray-500" />
        </button>
      </td>
    </tr>
  )
}

// ============================================================================
// LEDGER DETAIL MODAL
// ============================================================================

const LedgerDetailModal = ({ entry, isOpen, onClose }) => {
  if (!entry) return null

  const config = TRANSACTION_CONFIG[entry.transaction_type] || {}

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Details de l'entree" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className={clsx(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            config.color === 'success' && 'bg-success-100',
            config.color === 'danger' && 'bg-danger-100',
            config.color === 'warning' && 'bg-warning-100',
            config.color === 'primary' && 'bg-primary-100'
          )}>
            {config.icon && <config.icon className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {config.label}
            </h3>
            <p className="text-sm text-gray-500">
              Entree #{entry.entry_number}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 uppercase">Montant</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(entry.amount)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 uppercase">Solde apres</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(entry.balance_after)}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
          <p className="text-gray-900 dark:text-white">{entry.description}</p>
        </div>

        {/* References */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase">References</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {entry.commission_id && (
              <div>
                <span className="text-gray-500">Commission:</span>{' '}
                <code className="text-xs">{entry.commission_id}</code>
              </div>
            )}
            {entry.payout_item_id && (
              <div>
                <span className="text-gray-500">Payout Item:</span>{' '}
                <code className="text-xs">{entry.payout_item_id}</code>
              </div>
            )}
            {entry.payout_batch_id && (
              <div>
                <span className="text-gray-500">Batch:</span>{' '}
                <code className="text-xs">{entry.payout_batch_id}</code>
              </div>
            )}
            {entry.order_id && (
              <div>
                <span className="text-gray-500">Order:</span>{' '}
                <code className="text-xs">{entry.order_id}</code>
              </div>
            )}
            {entry.shopify_order_id && (
              <div>
                <span className="text-gray-500">Shopify:</span>{' '}
                <code className="text-xs">{entry.shopify_order_id}</code>
              </div>
            )}
            {entry.wise_transfer_reference && (
              <div>
                <span className="text-gray-500">Wise:</span>{' '}
                <code className="text-xs">{entry.wise_transfer_reference}</code>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Metadata</p>
            <pre className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs overflow-auto max-h-40">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Timestamps */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          <p>ID: {entry.id}</p>
          <p>Cree le: {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
          {entry.idempotency_key && <p>Cle idempotence: {entry.idempotency_key}</p>}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================================
// MAIN LEDGER TABLE COMPONENT
// ============================================================================

export const FinancialLedgerTable = ({
  creatorId = null,
  limit = 50,
  showSearch = true,
  showFilters = true,
  showExport = true
}) => {
  const { entries, balance, loading, error, refresh } = useFinancialLedger(creatorId)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedEntry, setSelectedEntry] = useState(null)

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchQuery ||
      entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.shopify_order_id?.includes(searchQuery) ||
      entry.wise_transfer_reference?.includes(searchQuery)

    const matchesType = !typeFilter || entry.transaction_type === typeFilter

    return matchesSearch && matchesType
  })

  // Export to CSV
  const handleExport = () => {
    const csv = [
      ['Entry #', 'Date', 'Type', 'Amount', 'Balance', 'Description', 'Shopify ID', 'Wise Ref'].join(','),
      ...filteredEntries.map(e => [
        e.entry_number,
        format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss'),
        e.transaction_type,
        e.amount,
        e.balance_after,
        `"${e.description?.replace(/"/g, '""') || ''}"`,
        e.shopify_order_id || '',
        e.wise_transfer_reference || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ledger-${creatorId || 'all'}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading && entries.length === 0) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        </Card.Body>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <Card.Body>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
            <p className="text-danger-600">{error}</p>
            <Button variant="secondary" onClick={refresh} className="mt-4">
              Reessayer
            </Button>
          </div>
        </Card.Body>
      </Card>
    )
  }

  return (
    <>
      <Card>
        {/* Header */}
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Journal financier
              </h3>
              {balance && (
                <p className="text-sm text-gray-500">
                  Solde actuel: <span className="font-semibold text-primary-600">
                    {formatCurrency(balance.current_balance)}
                  </span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm w-48"
                  />
                </div>
              )}

              {/* Type Filter */}
              {showFilters && (
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">Tous les types</option>
                  {Object.entries(TRANSACTION_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              )}

              {/* Actions */}
              <Button variant="ghost" size="sm" onClick={refresh} title="Rafraichir">
                <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
              </Button>

              {showExport && (
                <Button variant="secondary" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              )}
            </div>
          </div>
        </Card.Header>

        {/* Table */}
        {filteredEntries.length === 0 ? (
          <Card.Body>
            <EmptyState
              icon={FileText}
              title="Aucune entree"
              description="Le journal financier est vide"
            />
          </Card.Body>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Solde
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    References
                  </th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEntries.map(entry => (
                  <LedgerEntryRow
                    key={entry.id}
                    entry={entry}
                    onViewDetails={setSelectedEntry}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <LedgerDetailModal
        entry={selectedEntry}
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </>
  )
}

// ============================================================================
// BALANCE CARD
// ============================================================================

export const CreatorBalanceCard = ({ creatorId }) => {
  const { balance, loading, error } = useFinancialLedger(creatorId)

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        </Card.Body>
      </Card>
    )
  }

  if (error || !balance) {
    return null
  }

  return (
    <Card>
      <Card.Body>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Current Balance */}
          <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20">
            <p className="text-xs text-primary-600 uppercase font-medium">Solde actuel</p>
            <p className="text-2xl font-bold text-primary-600">
              {formatCurrency(balance.current_balance)}
            </p>
          </div>

          {/* Total Earned */}
          <div className="p-4 rounded-lg bg-success-50 dark:bg-success-900/20">
            <p className="text-xs text-success-600 uppercase font-medium">Total gagne</p>
            <p className="text-2xl font-bold text-success-600">
              {formatCurrency(balance.total_earned)}
            </p>
          </div>

          {/* Total Paid */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 uppercase font-medium">Total paye</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(balance.total_paid)}
            </p>
          </div>

          {/* Fees */}
          <div className="p-4 rounded-lg bg-warning-50 dark:bg-warning-900/20">
            <p className="text-xs text-warning-600 uppercase font-medium">Frais totaux</p>
            <p className="text-2xl font-bold text-warning-600">
              {formatCurrency(balance.total_fees)}
            </p>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FinancialLedgerTable
