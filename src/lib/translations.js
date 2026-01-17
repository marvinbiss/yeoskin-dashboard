// Fichier de traductions françaises pour Yeoskin Dashboard
// src/lib/translations.js

export const fr = {
  // Navigation
  nav: {
    dashboard: 'Tableau de bord',
    payouts: 'Paiements',
    creators: 'Créateurs',
    commissions: 'Commissions',
    settings: 'Paramètres',
    help: 'Aide',
  },
  
  // Dashboard
  dashboard: {
    title: 'Tableau de bord',
    subtitle: 'Bienvenue ! Voici le récapitulatif de vos gains.',
    totalPaidThisMonth: 'Montant total payé ce mois-ci',
    activeCreators: 'Créateurs actifs',
    pendingBatches: 'Lots en attente',
    successRate: 'Taux de réussite',
    excellent: 'Excellent',
    needsAttention: 'Attention requise',
    payoutTrends: 'Tendances des paiements',
    transferStatus: 'État du transfert',
    recentTransfers: 'Transferts récents',
    liveUpdates: 'Mises à jour en direct',
    noRecentTransfers: 'Aucun transfert récent',
    quickActions: 'Actions rapides',
    triggerDailyBatch: 'Déclenchement par lots quotidiens',
    viewPendingBatches: 'Afficher les lots en attente',
  },
  
  // Batches / Paiements
  batches: {
    title: 'Lots de paiement',
    batchId: 'ID du lot',
    period: 'Période',
    status: 'Statut',
    creators: 'Créateurs',
    amount: 'Montant',
    created: 'Créé le',
    actions: 'Actions',
    approve: 'Approuver',
    execute: 'Exécuter',
    view: 'Voir',
    refresh: 'Actualiser',
    noBatches: 'Aucun lot pour le moment',
    noBatchesDesc: 'Les lots apparaîtront ici lorsque des commissions seront prêtes à être payées.',
    approveBatch: 'Approuver le lot',
    approveConfirm: 'Êtes-vous sûr de vouloir approuver le lot',
    approveDesc: 'Cela le marquera comme prêt à être exécuté.',
    executeBatch: 'Exécuter le lot',
    executeConfirm: 'Êtes-vous sûr de vouloir exécuter le lot',
    executeWarning: 'Cela va initier de vrais paiements !',
    executeDesc: 'créateurs recevront un total de',
    executePayments: 'Exécuter les paiements',
    total: 'Total',
    draft: 'Brouillon',
    approved: 'Approuvé',
    sent: 'Envoyé',
    totalValue: 'Valeur totale',
    payoutItems: 'Éléments de paiement',
  },
  
  // Creators
  creators: {
    title: 'Créateurs',
    search: 'Rechercher des créateurs...',
    export: 'Exporter',
    noCreators: 'Aucun créateur trouvé',
    noCreatorsSearch: 'Essayez de modifier votre recherche',
    noCreatorsYet: 'Aucun créateur enregistré pour le moment',
    creator: 'Créateur',
    discountCode: 'Code promo',
    totalEarned: 'Total gagné',
    pending: 'En attente',
    bankAccount: 'Compte bancaire',
    verified: 'Vérifié',
    pendingVerification: 'Vérification en attente',
    notSet: 'Non configuré',
    creatorDetails: 'Détails du créateur',
    commissionRate: 'Taux de commission',
    lockDays: 'Jours de blocage',
    joined: 'Inscrit le',
    totalCreators: 'Total créateurs',
    active: 'Actifs',
    withBank: 'Avec compte bancaire',
  },
  
  // Commissions
  commissions: {
    title: 'Commissions',
    allCommissions: 'Toutes les commissions',
    order: 'Commande',
    noCommissions: 'Aucune commission pour le moment',
    noCommissionsDesc: 'Les commissions apparaîtront ici lorsque des commandes seront traitées.',
  },
  
  // Status
  status: {
    draft: 'Brouillon',
    approved: 'Approuvé',
    executing: 'En cours',
    sent: 'Envoyé',
    paid: 'Payé',
    pending: 'En attente',
    processing: 'Traitement',
    failed: 'Échoué',
    locked: 'Verrouillé',
    payable: 'Payable',
    canceled: 'Annulé',
    active: 'Actif',
    inactive: 'Inactif',
    completed: 'Terminé',
  },
  
  // Chart labels
  chart: {
    completed: 'Terminé',
    processing: 'Traitement',
    failed: 'Échec',
    pending: 'En attente',
  },
  
  // Settings
  settings: {
    title: 'Paramètres',
    subtitle: 'Configurez votre tableau de bord',
    apiConfiguration: 'Configuration API',
    n8nBaseUrl: 'URL de base n8n',
    payoutSecret: 'Clé secrète de paiement',
    configured: 'Configuré',
    missing: 'Manquant',
    database: 'Base de données',
    supabaseConnection: 'Connexion Supabase',
    postgresDb: 'Base de données PostgreSQL',
    connected: 'Connecté',
    notifications: 'Notifications',
    batchCreatedNotif: 'Notifications de création de lot',
    paymentFailureAlerts: 'Alertes d\'échec de paiement',
    dailySummaryEmail: 'Email de résumé quotidien',
  },
  
  // Help
  help: {
    title: 'Aide',
    subtitle: 'Documentation et support',
    quickLinks: 'Liens rapides',
    documentation: 'Documentation',
    readRunbook: 'Lire le guide complet',
    apiReference: 'Référence API',
    webhookEndpoints: 'Points de terminaison webhook',
    incidentResponse: 'Réponse aux incidents',
    emergencyProcedures: 'Procédures d\'urgence',
    support: 'Support',
    contactTeam: 'Contacter l\'équipe',
  },
  
  // Common
  common: {
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Attention',
    info: 'Information',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
    search: 'Rechercher...',
    noData: 'Aucune donnée',
    offline: 'Hors ligne',
    synced: 'Synchronisé',
    ago: 'il y a',
    admin: 'Administrateur',
  },
  
  // Header
  header: {
    search: 'Rechercher...',
    lightMode: 'Mode clair',
    darkMode: 'Mode sombre',
  },
}

export default fr
