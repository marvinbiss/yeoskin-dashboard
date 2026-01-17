/**
 * YEOSKIN DASHBOARD - Export Utilities
 * CSV and Excel export functionality
 */

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Format value for CSV export
 */
const formatCsvValue = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (value instanceof Date) return format(value, 'dd/MM/yyyy HH:mm', { locale: fr })
  if (typeof value === 'object') return JSON.stringify(value)

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  const stringValue = String(value)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

/**
 * Convert array of objects to CSV string
 */
export const arrayToCsv = (data, columns) => {
  if (!data || data.length === 0) return ''

  // Header row
  const headers = columns.map(col => formatCsvValue(col.label)).join(',')

  // Data rows
  const rows = data.map(row =>
    columns.map(col => {
      const value = col.accessor ? col.accessor(row) : row[col.key]
      return formatCsvValue(value)
    }).join(',')
  )

  return [headers, ...rows].join('\n')
}

/**
 * Download CSV file
 */
export const downloadCsv = (csvContent, filename) => {
  // Add BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data as CSV
 */
export const exportToCsv = (data, columns, filename) => {
  const csv = arrayToCsv(data, columns)
  downloadCsv(csv, filename)
}

// ============================================================================
// PREDEFINED EXPORT CONFIGURATIONS
// ============================================================================

/**
 * Admin export columns
 */
export const ADMIN_EXPORT_COLUMNS = [
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Nom complet' },
  { key: 'role', label: 'Rôle', accessor: (row) => {
    const roles = { super_admin: 'Super Admin', admin: 'Admin', viewer: 'Lecteur' }
    return roles[row.role] || row.role
  }},
  { key: 'is_active', label: 'Actif', accessor: (row) => row.is_active ? 'Oui' : 'Non' },
  { key: 'created_at', label: 'Date création', accessor: (row) =>
    row.created_at ? format(new Date(row.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''
  },
  { key: 'last_login', label: 'Dernière connexion', accessor: (row) =>
    row.last_login ? format(new Date(row.last_login), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Jamais'
  },
]

/**
 * Creator export columns
 */
export const CREATOR_EXPORT_COLUMNS = [
  { key: 'email', label: 'Email' },
  { key: 'discount_code', label: 'Code promo' },
  { key: 'status', label: 'Statut', accessor: (row) => {
    const statuses = { active: 'Actif', inactive: 'Inactif', pending: 'En attente' }
    return statuses[row.status] || row.status
  }},
  { key: 'commission_rate', label: 'Taux commission (%)', accessor: (row) =>
    row.commission_rate ? `${(row.commission_rate * 100).toFixed(0)}%` : '0%'
  },
  { key: 'total_earned', label: 'Total gagné (€)', accessor: (row) =>
    row.total_earned?.toFixed(2) || '0.00'
  },
  { key: 'pending_amount', label: 'En attente (€)', accessor: (row) =>
    row.pending_amount?.toFixed(2) || '0.00'
  },
  { key: 'has_bank_account', label: 'Compte bancaire', accessor: (row) =>
    row.bank_accounts?.length > 0 ? 'Oui' : 'Non'
  },
  { key: 'created_at', label: 'Date création', accessor: (row) =>
    row.created_at ? format(new Date(row.created_at), 'dd/MM/yyyy', { locale: fr }) : ''
  },
]

/**
 * Batch export columns
 */
export const BATCH_EXPORT_COLUMNS = [
  { key: 'id', label: 'ID Batch' },
  { key: 'status', label: 'Statut', accessor: (row) => {
    const statuses = {
      draft: 'Brouillon',
      approved: 'Approuvé',
      executing: 'En cours',
      sent: 'Envoyé',
      paid: 'Payé'
    }
    return statuses[row.status] || row.status
  }},
  { key: 'total_amount', label: 'Montant total (€)', accessor: (row) =>
    row.total_amount?.toFixed(2) || '0.00'
  },
  { key: 'items_count', label: 'Nombre de paiements', accessor: (row) =>
    row.payout_items?.length || 0
  },
  { key: 'period_start', label: 'Période début', accessor: (row) =>
    row.period_start ? format(new Date(row.period_start), 'dd/MM/yyyy', { locale: fr }) : ''
  },
  { key: 'period_end', label: 'Période fin', accessor: (row) =>
    row.period_end ? format(new Date(row.period_end), 'dd/MM/yyyy', { locale: fr }) : ''
  },
  { key: 'created_at', label: 'Date création', accessor: (row) =>
    row.created_at ? format(new Date(row.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''
  },
  { key: 'approved_at', label: 'Date approbation', accessor: (row) =>
    row.approved_at ? format(new Date(row.approved_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''
  },
  { key: 'sent_at', label: 'Date envoi', accessor: (row) =>
    row.sent_at ? format(new Date(row.sent_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''
  },
]

/**
 * Commission export columns
 */
export const COMMISSION_EXPORT_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'creator_email', label: 'Email créateur', accessor: (row) =>
    row.creator?.email || row.creator_email || ''
  },
  { key: 'order_number', label: 'N° Commande', accessor: (row) =>
    row.order?.order_number || row.order_number || ''
  },
  { key: 'commission_amount', label: 'Montant commission (€)', accessor: (row) =>
    row.commission_amount?.toFixed(2) || '0.00'
  },
  { key: 'status', label: 'Statut', accessor: (row) => {
    const statuses = {
      pending: 'En attente',
      locked: 'Verrouillé',
      payable: 'Payable',
      paid: 'Payé',
      canceled: 'Annulé'
    }
    return statuses[row.status] || row.status
  }},
  { key: 'created_at', label: 'Date', accessor: (row) =>
    row.created_at ? format(new Date(row.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''
  },
]

/**
 * Audit log export columns
 */
export const AUDIT_LOG_EXPORT_COLUMNS = [
  { key: 'created_at', label: 'Date/Heure', accessor: (row) =>
    row.created_at ? format(new Date(row.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr }) : ''
  },
  { key: 'user_email', label: 'Utilisateur' },
  { key: 'action', label: 'Action', accessor: (row) => {
    const actions = {
      CREATE: 'Création',
      UPDATE: 'Modification',
      DELETE: 'Suppression',
      VIEW: 'Consultation',
      EXPORT: 'Export',
      LOGIN: 'Connexion',
      LOGOUT: 'Déconnexion',
      LOGIN_FAILED: 'Échec connexion',
      APPROVE: 'Approbation',
      EXECUTE: 'Exécution'
    }
    return actions[row.action] || row.action
  }},
  { key: 'resource_type', label: 'Type ressource', accessor: (row) => {
    const types = {
      admin: 'Administrateur',
      creator: 'Créateur',
      batch: 'Batch',
      transfer: 'Transfert',
      commission: 'Commission',
      settings: 'Paramètres',
      session: 'Session',
      system: 'Système'
    }
    return types[row.resource_type] || row.resource_type
  }},
  { key: 'resource_name', label: 'Ressource' },
]

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export admins to CSV
 */
export const exportAdmins = (admins, filename = 'administrateurs') => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
  exportToCsv(admins, ADMIN_EXPORT_COLUMNS, `${filename}_${timestamp}`)
}

/**
 * Export creators to CSV
 */
export const exportCreators = (creators, filename = 'createurs') => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
  exportToCsv(creators, CREATOR_EXPORT_COLUMNS, `${filename}_${timestamp}`)
}

/**
 * Export batches to CSV
 */
export const exportBatches = (batches, filename = 'batches') => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
  exportToCsv(batches, BATCH_EXPORT_COLUMNS, `${filename}_${timestamp}`)
}

/**
 * Export commissions to CSV
 */
export const exportCommissions = (commissions, filename = 'commissions') => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
  exportToCsv(commissions, COMMISSION_EXPORT_COLUMNS, `${filename}_${timestamp}`)
}

/**
 * Export audit logs to CSV
 */
export const exportAuditLogs = (logs, filename = 'audit_logs') => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
  exportToCsv(logs, AUDIT_LOG_EXPORT_COLUMNS, `${filename}_${timestamp}`)
}

export default {
  arrayToCsv,
  downloadCsv,
  exportToCsv,
  exportAdmins,
  exportCreators,
  exportBatches,
  exportCommissions,
  exportAuditLogs,
}
