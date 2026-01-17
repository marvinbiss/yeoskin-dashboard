# YEOSKIN DASHBOARD - Documentation Enterprise

## Vue d'ensemble

Le Yeoskin Dashboard est une plateforme de gestion des paiements pour créateurs de contenu, développée avec des standards enterprise-grade.

### Stack Technique
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Authentification**: Supabase Auth + 2FA TOTP
- **API**: n8n Webhooks + Wise API

---

## 1. Authentification & Sécurité

### 1.1 Connexion Standard
```
Route: /login
Fichier: src/pages/LoginPage.jsx
```
- Email/mot de passe via Supabase Auth
- Remember me (session persistante)
- Gestion des tentatives échouées

### 1.2 Authentification à Deux Facteurs (2FA)
```
Fichiers:
- src/hooks/useTwoFactor.js
- src/components/Auth/TwoFactorSetup.jsx
- src/components/Auth/TwoFactorVerify.jsx
```

**Configuration:**
1. Aller dans Profil > Sécurité
2. Cliquer "Activer 2FA"
3. Scanner le QR code avec une app TOTP (Google Authenticator, Authy)
4. Entrer le code de vérification
5. Sauvegarder les codes de secours

**Colonnes Supabase requises:**
```sql
ALTER TABLE admin_profiles
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN two_factor_secret TEXT,
ADD COLUMN two_factor_backup_codes TEXT[],
ADD COLUMN two_factor_enabled_at TIMESTAMPTZ;
```

### 1.3 Gestion des Sessions
```
Fichier: src/hooks/useSession.js
```

**Fonctionnalités:**
- Timeout automatique après 30 minutes d'inactivité
- Avertissement 5 minutes avant expiration
- Suivi des sessions actives par appareil
- Possibilité de déconnecter les autres sessions

---

## 2. Gestion des Rôles

### Hiérarchie des Rôles
| Rôle | Permissions |
|------|-------------|
| `super_admin` | Accès complet, gestion admins, audit logs |
| `admin` | Gestion créateurs, batches, paiements |
| `viewer` | Lecture seule |

### Protection des Routes
```jsx
<Route path="/admins" element={
  <ProtectedRoute requiredRole="super_admin">
    <AdminsPage />
  </ProtectedRoute>
} />
```

---

## 3. Fonctionnalités Enterprise

### 3.1 Audit Logs
```
Route: /audit-logs (super_admin uniquement)
Fichier: src/hooks/useAuditLog.js
```

**Actions tracées:**
- CREATE, UPDATE, DELETE
- VIEW, EXPORT
- LOGIN, LOGOUT, LOGIN_FAILED
- APPROVE, EXECUTE

**Utilisation:**
```javascript
const { logCreate, logUpdate, logDelete, logExport } = useAuditLog()

// Exemple
await logCreate(RESOURCE_TYPES.ADMIN, adminId, { email: admin.email })
```

### 3.2 Centre de Notifications
```
Fichier: src/components/Layout/NotificationCenter.jsx
```

**Types de notifications:**
- `info`, `success`, `warning`, `error`
- `payment`, `user`, `batch`

**Notifications automatiques (via triggers SQL):**
- Nouveau batch créé
- Échec de transfert Wise
- Nouvel administrateur créé

### 3.3 Recherche Globale
```
Fichier: src/components/Layout/GlobalSearch.jsx
Raccourci: Cmd+K (Mac) / Ctrl+K (Windows)
```

**Recherche dans:**
- Créateurs (email, code promo)
- Administrateurs (email, nom)

### 3.4 Export de Données
```
Fichier: src/lib/exportUtils.js
```

**Formats disponibles:**
- CSV (UTF-8 avec BOM pour Excel)

**Exports disponibles:**
- `exportCreators()` - Liste des créateurs
- `exportCommissions()` - Historique des commissions
- `exportBatches()` - Lots de paiement
- `exportAdmins()` - Administrateurs
- `exportAuditLogs()` - Logs d'audit

### 3.5 Filtres Avancés
```
Fichier: src/components/Common/AdvancedFilters.jsx
```

**Types de filtres:**
- `select` - Liste déroulante
- `text` - Recherche textuelle
- `number` - Plage min/max
- `date` - Période début/fin
- `boolean` - Oui/Non

**Configurations prédéfinies:**
- `CREATOR_FILTERS` - Filtres créateurs
- `ADMIN_FILTERS` - Filtres admins
- `BATCH_FILTERS` - Filtres batches
- `COMMISSION_FILTERS` - Filtres commissions

### 3.6 Opérations Bulk
```
Fichier: src/components/Common/BulkActions.jsx
```

**Actions disponibles:**
- Sélection multiple avec checkbox
- Activation/Désactivation en masse
- Export de la sélection

---

## 4. Structure des Fichiers

```
src/
├── components/
│   ├── Auth/
│   │   ├── LoginForm.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── SessionTimeoutWarning.jsx
│   │   ├── TwoFactorSetup.jsx
│   │   └── TwoFactorVerify.jsx
│   ├── Layout/
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── GlobalSearch.jsx
│   │   └── NotificationCenter.jsx
│   ├── Common/
│   │   ├── index.jsx (Button, Modal, Toast, etc.)
│   │   ├── AdvancedFilters.jsx
│   │   └── BulkActions.jsx
│   ├── Admins/
│   ├── Batches/
│   ├── Creators/
│   └── Dashboard/
├── hooks/
│   ├── useSupabase.js
│   ├── useAdmins.js
│   ├── useAuditLog.js
│   ├── useSession.js
│   └── useTwoFactor.js
├── contexts/
│   └── AuthContext.jsx
├── lib/
│   ├── supabase.js
│   ├── api.js
│   └── exportUtils.js
├── pages/
│   ├── index.jsx
│   ├── LoginPage.jsx
│   └── ProfilePage.jsx
└── App.jsx
```

---

## 5. Scripts SQL à Exécuter

### 5.1 Script de Sécurité
```
Fichier: supabase-security-upgrade.sql
```
Crée les tables:
- `audit_logs` - Journal d'audit
- `auth_logs` - Logs d'authentification
- `user_sessions` - Sessions actives
- `login_attempts` - Tentatives de connexion

### 5.2 Script Enterprise Features
```
Fichier: supabase-enterprise-features.sql
```
Crée/modifie:
- Colonnes 2FA sur `admin_profiles`
- Table `notifications`
- Table `system_settings`
- Triggers de notification automatique

**Exécution:**
1. Aller sur https://supabase.com/dashboard
2. Ouvrir le projet Yeoskin
3. SQL Editor > New Query
4. Coller et exécuter chaque script

---

## 6. Configuration

### Variables d'Environnement
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_N8N_WEBHOOK_URL=https://n8n.example.com/webhook
VITE_PAYOUT_SECRET=votre-secret-securise
```

### Paramètres Système
Les paramètres sont stockés dans `system_settings`:
- `session_timeout` - Durée session (secondes)
- `max_login_attempts` - Max tentatives login
- `lockout_duration` - Durée blocage compte
- `require_2fa_for_admins` - Forcer 2FA
- `notification_email_enabled` - Notifications email

---

## 7. Tests Recommandés

### Authentification
- [ ] Connexion avec email/mot de passe
- [ ] Échec connexion (mauvais mot de passe)
- [ ] Activation 2FA
- [ ] Connexion avec 2FA
- [ ] Utilisation code de secours
- [ ] Désactivation 2FA

### Gestion des Sessions
- [ ] Timeout après inactivité
- [ ] Avertissement avant expiration
- [ ] Extension de session
- [ ] Déconnexion manuelle
- [ ] Visualisation sessions actives

### Audit & Sécurité
- [ ] Logs de connexion
- [ ] Logs de création/modification
- [ ] Export des logs
- [ ] Filtrage des logs

### Fonctionnalités
- [ ] Recherche globale (Cmd+K)
- [ ] Centre de notifications
- [ ] Filtres avancés
- [ ] Sélection multiple
- [ ] Export CSV
- [ ] Opérations bulk

---

## 8. Dépannage

### Le 2FA ne fonctionne pas
1. Vérifier l'heure du téléphone (doit être synchronisée)
2. Utiliser un code de secours
3. Désactiver/réactiver le 2FA

### Les notifications ne s'affichent pas
1. Vérifier que la table `notifications` existe
2. Vérifier les policies RLS
3. Vérifier la publication realtime

### Les exports sont vides
1. Vérifier les permissions de lecture
2. Vérifier les filtres actifs
3. Vérifier la console pour les erreurs

---

## 9. Roadmap Future

### Phase 1 (Actuelle)
- [x] Authentification Supabase
- [x] Gestion des rôles
- [x] 2FA TOTP
- [x] Gestion des sessions
- [x] Audit logs
- [x] Notifications temps réel
- [x] Recherche globale
- [x] Filtres avancés
- [x] Opérations bulk
- [x] Export CSV

### Phase 2 (Prochaine)
- [ ] Notifications email (SendGrid/Resend)
- [ ] Rapports PDF
- [ ] Dashboard analytics avancé
- [ ] API publique documentée
- [ ] Webhooks sortants
- [ ] Multi-tenant support

### Phase 3 (Future)
- [ ] Application mobile
- [ ] Intégration Slack/Discord
- [ ] Machine learning (prédiction paiements)
- [ ] Compliance GDPR avancée

---

## 10. Support

Pour toute question ou problème:
1. Consulter cette documentation
2. Vérifier les logs dans la console
3. Contacter l'équipe technique

---

*Document généré le 17 janvier 2026*
*Version: 2.0.0 Enterprise*
