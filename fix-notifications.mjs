import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juqlogfujiagtpvxmeux.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  console.log('🔔 Création des notifications manquantes...\n')

  // Get all ledger entries
  const { data: ledgerEntries, error: ledgerError } = await supabase
    .from('financial_ledger')
    .select('id, creator_id, transaction_type, amount, description, created_at')
    .order('created_at', { ascending: true })

  if (ledgerError) {
    console.error('❌ Erreur:', ledgerError)
    return
  }

  console.log(`📋 ${ledgerEntries.length} entrées ledger trouvées`)

  // Get existing notifications
  const { data: existingNotifs } = await supabase
    .from('creator_notifications')
    .select('creator_id, amount, created_at')

  // Create a set of existing notification keys
  const existingKeys = new Set(
    existingNotifs?.map(n => `${n.creator_id}-${n.amount}-${new Date(n.created_at).toISOString().slice(0, 16)}`) || []
  )

  // Find missing notifications
  const missingNotifs = []
  for (const entry of ledgerEntries) {
    const key = `${entry.creator_id}-${entry.amount}-${new Date(entry.created_at).toISOString().slice(0, 16)}`
    if (!existingKeys.has(key)) {
      missingNotifs.push({
        creator_id: entry.creator_id,
        type: entry.transaction_type === 'commission_earned' ? 'commission_earned' :
              entry.transaction_type === 'payout_sent' ? 'payout_sent' : 'info',
        title: entry.transaction_type === 'commission_earned' ? 'Commission gagnée' :
               entry.transaction_type === 'payout_sent' ? 'Paiement envoyé' :
               entry.transaction_type === 'payout_fee' ? 'Frais de transfert' : 'Transaction',
        message: entry.description,
        amount: entry.amount,
        read: true,
        created_at: entry.created_at
      })
    }
  }

  console.log(`🔔 ${missingNotifs.length} notifications manquantes`)

  if (missingNotifs.length > 0) {
    const { error: insertError } = await supabase
      .from('creator_notifications')
      .insert(missingNotifs)

    if (insertError) {
      console.error('❌ Erreur insertion:', insertError)
    } else {
      console.log(`✅ ${missingNotifs.length} notifications créées`)
    }
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('creator_notifications')
    .select('*', { count: 'exact', head: true })

  console.log(`\n📊 Total notifications: ${finalCount}`)
}

main()
