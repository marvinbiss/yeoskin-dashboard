/**
 * YEOSKIN - Admin Payouts Page
 * Interface complete pour gerer les paiements Wise via n8n
 */
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  DollarSign,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  CreditCard,
  Loader,
  ExternalLink,
  Users,
  TrendingUp,
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
import { supabase } from '../lib/supabase'

// N8N webhook URL
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || ''

export const AdminPayoutsPage = () => {
  const toast = useToast()

  // States
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [payableCreators, setPayableCreators] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [batches, setBatches] = useState([])
  const [currentBatch, setCurrentBatch] = useState(null)
  const [minAmount, setMinAmount] = useState(10)
  const [confirmDialog, setConfirmDialog] = useState(false)

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch payable creators with their balances
      const { data: creators, error: creatorsError } = await supabase
        .from('creators')
        .select(`
          id, email, discount_code, status,
          commissions:commissions(commission_amount, status)
        `)
        .eq('status', 'active')

      if (creatorsError) throw creatorsError

      // Calculate payable amounts
      const payable = creators
        .map(c => {
          const payableCommissions = (c.commissions || []).filter(co => co.status === 'payable')
          const payableAmount = payableCommissions.reduce((sum, co) => sum + Number(co.commission_amount), 0)
          return {
            ...c,
            payableAmount,
            payableCount: payableCommissions.length,
          }
        })
        .filter(c => c.payableAmount >= minAmount)
        .sort((a, b) => b.payableAmount - a.payableAmount)

      setPayableCreators(payable)

      // Fetch recent batches
      const { data: batchData, error: batchError } = await supabase
        .from('payout_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (!batchError) {
        setBatches(batchData || [])
        // Find current processing batch
        const processing = batchData?.find(b => b.status === 'processing')
        setCurrentBatch(processing || null)
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des donnees')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle selection
  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Select all
  const selectAll = () => {
    if (selectedIds.length === payableCreators.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(payableCreators.map(c => c.id))
    }
  }

  // Calculate totals
  const selectedTotal = payableCreators
    .filter(c => selectedIds.includes(c.id))
    .reduce((sum, c) => sum + c.payableAmount, 0)

  // Execute payouts
  const handleExecutePayouts = async () => {
    if (selectedIds.length === 0) {
      toast.warning('Selectionnez au moins un createur')
      return
    }

    setExecuting(true)
    setConfirmDialog(false)

    try {
      // Create batch in database
      const { data: batch, error: batchError } = await supabase
        .from('payout_batches')
        .insert({
          total_amount: selectedTotal,
          item_count: selectedIds.length,
          status: 'processing',
        })
        .select()
        .single()

      if (batchError) throw batchError

      // Create batch items
      const items = payableCreators
        .filter(c => selectedIds.includes(c.id))
        .map(c => ({
          batch_id: batch.id,
          creator_id: c.id,
          amount: c.payableAmount,
          status: 'pending',
        }))

      const { error: itemsError } = await supabase
        .from('payout_items')
        .insert(items)

      if (itemsError) throw itemsError

      // Trigger n8n webhook
      if (N8N_BASE_URL) {
        try {
          const response = await fetch(`${N8N_BASE_URL}/webhook/payout_engine_execute_v1`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              batch_id: batch.id,
              creator_ids: selectedIds,
              total_amount: selectedTotal,
            }),
          })

          if (!response.ok) {
            console.warn('n8n webhook returned non-OK status')
          }

          // Update batch with n8n execution info
          await supabase
            .from('payout_batches')
            .update({ n8n_execution_id: 'triggered' })
            .eq('id', batch.id)
        } catch (webhookError) {
          console.error('n8n webhook error:', webhookError)
          // Don't fail the whole operation if webhook fails
        }
      }

      toast.success(`Batch de paiement cree! ${selectedIds.length} createurs, ${selectedTotal.toFixed(2)}€`)
      setSelectedIds([])
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de la creation du batch: ' + error.message)
    } finally {
      setExecuting(false)
    }
  }

  // Get status badge
  const getStatusBadge = (status) => {
    const configs = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Loader },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      partial: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    }
    const config = configs[status] || configs.pending
    const Icon = config.icon
    return (
      <span key={status} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {status}
      </span>
    )
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return '-'
    return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: fr })
  }

  if (loading) {
    return (
      <Layout title="Paiements Wise" subtitle="Chargement...">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Paiements Wise"
      subtitle="Gestion des paiements createurs via Wise"
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <Card.Body>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total payable</p>
                  <p className="text-xl font-bold text-green-600">
                    {payableCreators.reduce((s, c) => s + c.payableAmount, 0).toFixed(2)} €
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Createurs eligibles</p>
                  <p className="text-xl font-bold text-blue-600">
                    {payableCreators.length}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Selectionne</p>
                  <p className="text-xl font-bold text-purple-600">
                    {selectedTotal.toFixed(2)} €
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">En cours</p>
                  <p className="text-xl font-bold text-orange-600">
                    {currentBatch ? '1 batch' : 'Aucun'}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Current Processing Batch */}
        {currentBatch && (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <Card.Body>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Batch en cours de traitement
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {currentBatch.item_count} createurs · {currentBatch.total_amount?.toFixed(2)}€
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payable Creators */}
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Createurs a payer ({payableCreators.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-500">Min:</label>
                      <input
                        type="number"
                        value={minAmount}
                        onChange={(e) => setMinAmount(Number(e.target.value))}
                        className="w-20 px-2 py-1 text-sm border rounded"
                        min="0"
                      />
                      <span className="text-sm text-gray-500">€</span>
                    </div>
                    <Button variant="secondary" size="sm" onClick={fetchData}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card.Header>

              {payableCreators.length === 0 ? (
                <Card.Body>
                  <EmptyState
                    icon={DollarSign}
                    title="Aucun createur a payer"
                    description="Tous les paiements sont a jour ou en dessous du minimum"
                  />
                </Card.Body>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="w-10">
                            <input
                              type="checkbox"
                              checked={selectedIds.length === payableCreators.length}
                              onChange={selectAll}
                              className="rounded"
                            />
                          </th>
                          <th>Createur</th>
                          <th className="text-right">Montant</th>
                          <th className="text-right">Commissions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payableCreators.map((creator) => (
                          <tr
                            key={creator.id}
                            className={selectedIds.includes(creator.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(creator.id)}
                                onChange={() => toggleSelection(creator.id)}
                                className="rounded"
                              />
                            </td>
                            <td>
                              <div>
                                <p className="font-medium">{creator.email}</p>
                                <p className="text-xs text-gray-500">{creator.discount_code}</p>
                              </div>
                            </td>
                            <td className="text-right">
                              <span className="font-bold text-green-600">
                                {creator.payableAmount.toFixed(2)} €
                              </span>
                            </td>
                            <td className="text-right text-gray-500">
                              {creator.payableCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Card.Body className="border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {selectedIds.length} selectionne(s) · {selectedTotal.toFixed(2)}€
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => setConfirmDialog(true)}
                        disabled={selectedIds.length === 0 || executing}
                        loading={executing}
                        icon={executing ? undefined : Send}
                      >
                        {executing ? 'Execution...' : 'Lancer les paiements'}
                      </Button>
                    </div>
                  </Card.Body>
                </>
              )}
            </Card>
          </div>

          {/* Recent Batches */}
          <div>
            <Card>
              <Card.Header>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Historique des batches
                </h3>
              </Card.Header>

              {batches.length === 0 ? (
                <Card.Body>
                  <EmptyState
                    icon={Clock}
                    title="Aucun batch"
                    description="Les batches de paiement apparaitront ici"
                  />
                </Card.Body>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                  {batches.map((batch) => (
                    <div key={batch.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {batch.item_count} createurs
                        </span>
                        {getStatusBadge(batch.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {formatDate(batch.created_at)}
                        </span>
                        <span className="font-bold">
                          {batch.total_amount?.toFixed(2)}€
                        </span>
                      </div>
                      {batch.wise_batch_id && (
                        <p className="text-xs text-gray-400 mt-1">
                          Wise: {batch.wise_batch_id}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* N8N Connection Status */}
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${N8N_BASE_URL ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="font-medium">Connexion n8n</p>
                  <p className="text-sm text-gray-500">
                    {N8N_BASE_URL || 'Non configure - Definir VITE_N8N_BASE_URL'}
                  </p>
                </div>
              </div>
              {N8N_BASE_URL && (
                <a
                  href={N8N_BASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline flex items-center gap-1"
                >
                  Ouvrir n8n
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        onConfirm={handleExecutePayouts}
        title="Confirmer les paiements"
        message={`Vous allez lancer ${selectedIds.length} paiement(s) pour un total de ${selectedTotal.toFixed(2)}€. Cette action va declencher les virements Wise.`}
        confirmText="Confirmer et payer"
        variant="primary"
        loading={executing}
      />
    </Layout>
  )
}

export default AdminPayoutsPage
