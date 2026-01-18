/**
 * YEOSKIN DASHBOARD - CreatorDetailPage
 * Full page view for a single creator with transaction history
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ArrowLeft,
  User,
  Mail,
  Tag,
  CreditCard,
  Calendar,
  Percent,
  Clock,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  History,
  RefreshCw,
  Download,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import {
  Card,
  Button,
  Badge,
  StatusBadge,
  Spinner,
  EmptyState,
  useToast,
  ConfirmDialog,
} from '../components/Common'
import { CreatorForm } from '../components/Creators'
import { supabase } from '../lib/supabase'

export const CreatorDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [creator, setCreator] = useState(null)
  const [ledger, setLedger] = useState([])
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [formModal, setFormModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Fetch creator data
  useEffect(() => {
    fetchCreatorData()
  }, [id])

  const fetchCreatorData = async () => {
    setLoading(true)
    try {
      // Fetch creator
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('id', id)
        .single()

      if (creatorError) throw creatorError

      // Fetch bank account
      const { data: bankData } = await supabase
        .from('creator_bank_accounts')
        .select('iban, is_verified, updated_at')
        .eq('creator_id', id)
        .single()

      // Add bank data to creator
      creatorData.iban = bankData?.iban
      creatorData.bank_verified = bankData?.is_verified
      creatorData.bank_verified_at = bankData?.updated_at

      // Fetch ledger entries
      const { data: ledgerData } = await supabase
        .from('financial_ledger')
        .select('*')
        .eq('creator_id', id)
        .order('created_at', { ascending: false })
        .limit(50)

      // Fetch commissions
      const { data: commissionsData } = await supabase
        .from('commissions')
        .select('*')
        .eq('creator_id', id)
        .order('created_at', { ascending: false })
        .limit(50)

      // Calculate stats
      const totalEarned = (ledgerData || [])
        .filter(e => e.transaction_type === 'commission_earned')
        .reduce((sum, e) => sum + Number(e.amount), 0)

      const totalPaid = (ledgerData || [])
        .filter(e => e.transaction_type === 'payout_sent')
        .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0)

      const pendingAmount = (commissionsData || [])
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + Number(c.commission_amount), 0)

      setCreator({
        ...creatorData,
        totalEarned,
        totalPaid,
        pendingAmount,
        commissionsCount: commissionsData?.length || 0,
        hasBankAccount: !!creatorData.iban,
        bankVerified: creatorData.bank_verified,
        bankAccount: { iban: creatorData.iban, account_type: 'iban' }
      })
      setLedger(ledgerData || [])
      setCommissions(commissionsData || [])
    } catch (error) {
      toast.error('Erreur lors du chargement du createur')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'd MMMM yyyy a HH:mm', { locale: fr })
    } catch {
      return '-'
    }
  }

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'd MMM yyyy, HH:mm', { locale: fr })
    } catch {
      return '-'
    }
  }

  // Mask IBAN
  const maskIBAN = (iban) => {
    if (!iban) return 'Non configure'
    if (iban.length <= 8) return iban
    return iban.slice(0, 4) + ' **** **** ' + iban.slice(-4)
  }

  // Handle toggle status
  const handleToggleStatus = async () => {
    setActionLoading(true)
    try {
      const newStatus = creator.status === 'active' ? 'inactive' : 'active'
      const { error } = await supabase
        .from('creators')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      setCreator(prev => ({ ...prev, status: newStatus }))
      toast.success(newStatus === 'active' ? 'Createur active' : 'Createur desactive')
    } catch (error) {
      toast.error('Erreur lors du changement de statut')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle verify bank
  const handleVerifyBank = async (verified) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('creator_bank_accounts')
        .update({
          is_verified: verified,
          updated_at: new Date().toISOString()
        })
        .eq('creator_id', id)

      if (error) throw error

      setCreator(prev => ({ ...prev, bankVerified: verified }))
      toast.success(verified ? 'Compte bancaire verifie' : 'Verification retiree')
    } catch (error) {
      toast.error('Erreur lors de la verification')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle form submit
  const handleFormSubmit = async (formData) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('creators')
        .update({
          email: formData.email,
          discount_code: formData.discount_code,
          commission_rate: formData.commission_rate,
          lock_days: formData.lock_days,
          iban: formData.iban,
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Createur modifie avec succes')
      setFormModal(false)
      fetchCreatorData()
    } catch (error) {
      toast.error('Erreur lors de la modification')
      throw error
    } finally {
      setActionLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    setActionLoading(true)
    try {
      if (creator.status === 'inactive') {
        // Hard delete
        const { error } = await supabase
          .from('creators')
          .delete()
          .eq('id', id)
        if (error) throw error
        toast.success('Createur supprime definitivement')
        navigate('/creators')
      } else {
        // Soft delete (deactivate)
        const { error } = await supabase
          .from('creators')
          .update({ status: 'inactive' })
          .eq('id', id)
        if (error) throw error
        setCreator(prev => ({ ...prev, status: 'inactive' }))
        toast.success('Createur desactive')
        setDeleteConfirm(false)
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setActionLoading(false)
    }
  }

  // Get transaction type label
  const getTransactionTypeLabel = (type) => {
    const labels = {
      commission_earned: 'Commission',
      payout_sent: 'Paiement',
      payout_fee: 'Frais',
      adjustment: 'Ajustement',
    }
    return labels[type] || type
  }

  // Get transaction type color
  const getTransactionTypeColor = (type) => {
    const colors = {
      commission_earned: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      payout_sent: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      payout_fee: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
      adjustment: 'text-gray-600 bg-gray-50 dark:bg-gray-700',
    }
    return colors[type] || 'text-gray-600 bg-gray-50'
  }

  if (loading) {
    return (
      <Layout title="Chargement..." subtitle="">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (!creator) {
    return (
      <Layout title="Createur non trouve" subtitle="">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Ce createur n'existe pas ou a ete supprime.</p>
          <Button onClick={() => navigate('/creators')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux createurs
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title={creator.email}
      subtitle={`Code: ${creator.discount_code}`}
    >
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/creators')}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux createurs
        </button>

        {/* Header with actions */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">
                {creator.email?.charAt(0).toUpperCase() || 'C'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {creator.email}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={creator.status} />
                <code className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono">
                  {creator.discount_code}
                </code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={fetchCreatorData}
              disabled={actionLoading}
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="secondary"
              onClick={handleToggleStatus}
              disabled={actionLoading}
              icon={creator.status === 'active' ? ToggleRight : ToggleLeft}
            >
              {creator.status === 'active' ? 'Desactiver' : 'Activer'}
            </Button>
            <Button
              variant="primary"
              onClick={() => setFormModal(true)}
              disabled={actionLoading}
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="danger"
              onClick={() => setDeleteConfirm(true)}
              disabled={actionLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <Card.Body>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-success-600" />
                <p className="text-sm text-gray-500">Total gagne</p>
              </div>
              <p className="text-2xl font-bold text-success-600">
                {creator.totalEarned.toFixed(2)} EUR
              </p>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-gray-500">Total paye</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {creator.totalPaid.toFixed(2)} EUR
              </p>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-warning-600" />
                <p className="text-sm text-gray-500">En attente</p>
              </div>
              <p className="text-2xl font-bold text-warning-600">
                {creator.pendingAmount.toFixed(2)} EUR
              </p>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center gap-2 mb-1">
                <History className="w-4 h-4 text-primary-600" />
                <p className="text-sm text-gray-500">Commissions</p>
              </div>
              <p className="text-2xl font-bold text-primary-600">
                {creator.commissionsCount}
              </p>
            </Card.Body>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creator info */}
          <div className="space-y-6">
            {/* General info */}
            <Card>
              <Card.Header>
                <h3 className="font-semibold text-gray-900 dark:text-white">Informations generales</h3>
              </Card.Header>
              <Card.Body className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{creator.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Code promo</p>
                    <p className="font-mono font-medium">{creator.discount_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Percent className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Taux de commission</p>
                    <p className="font-medium">{((creator.commission_rate || 0.15) * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Jours de blocage</p>
                    <p className="font-medium">{creator.lock_days || 30} jours</p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Bank account */}
            <Card>
              <Card.Header>
                <h3 className="font-semibold text-gray-900 dark:text-white">Compte bancaire</h3>
              </Card.Header>
              <Card.Body>
                {creator.hasBankAccount ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">IBAN</span>
                      </div>
                      {creator.bankVerified ? (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verifie
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Non verifie
                        </Badge>
                      )}
                    </div>
                    <p className="font-mono text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {maskIBAN(creator.bankAccount?.iban)}
                    </p>
                    {!creator.bankVerified && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleVerifyBank(true)}
                        disabled={actionLoading}
                        className="w-full"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Marquer comme verifie
                      </Button>
                    )}
                    {creator.bankVerified && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerifyBank(false)}
                        disabled={actionLoading}
                        className="w-full text-warning-600"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Retirer la verification
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucun compte bancaire configure</p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Metadata */}
            <Card>
              <Card.Body className="text-sm text-gray-500 space-y-1">
                <p>ID: <code className="text-xs font-mono">{creator.id}</code></p>
                <p>Cree le: {formatDate(creator.created_at)}</p>
                {creator.updated_at && (
                  <p>Modifie le: {formatDate(creator.updated_at)}</p>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Transaction history */}
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Historique des transactions ({ledger.length})
                  </h3>
                </div>
              </Card.Header>
              {ledger.length === 0 ? (
                <Card.Body>
                  <EmptyState
                    icon={History}
                    title="Aucune transaction"
                    description="Les transactions apparaitront ici"
                  />
                </Card.Body>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th className="text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((entry) => (
                        <tr key={entry.id}>
                          <td className="text-sm text-gray-500">
                            {formatDateShort(entry.created_at)}
                          </td>
                          <td>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getTransactionTypeColor(entry.transaction_type)}`}>
                              {getTransactionTypeLabel(entry.transaction_type)}
                            </span>
                          </td>
                          <td className="text-sm">{entry.description}</td>
                          <td className={`text-right font-medium ${
                            Number(entry.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Number(entry.amount) >= 0 ? '+' : ''}{Number(entry.amount).toFixed(2)} EUR
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <CreatorForm
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        creator={creator}
        onSubmit={handleFormSubmit}
        loading={actionLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={creator.status === 'inactive' ? 'Supprimer definitivement' : 'Desactiver le createur'}
        message={
          creator.status === 'inactive'
            ? 'Etes-vous sur de vouloir supprimer definitivement ce createur ? Cette action est irreversible.'
            : 'Etes-vous sur de vouloir desactiver ce createur ? Il ne pourra plus recevoir de commissions mais ses donnees seront conservees.'
        }
        confirmText={creator.status === 'inactive' ? 'Supprimer' : 'Desactiver'}
        variant="danger"
        loading={actionLoading}
      />
    </Layout>
  )
}

export default CreatorDetailPage
