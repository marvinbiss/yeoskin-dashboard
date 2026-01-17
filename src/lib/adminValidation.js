/**
 * Admin Validation - Enterprise-grade validation utilities
 * @module lib/adminValidation
 */

// Email validation regex (RFC 5322)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// Password requirements
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REQUIREMENTS = {
  minLength: { test: (p) => p.length >= PASSWORD_MIN_LENGTH, message: `Au moins ${PASSWORD_MIN_LENGTH} caractères` },
  uppercase: { test: (p) => /[A-Z]/.test(p), message: 'Au moins une majuscule' },
  lowercase: { test: (p) => /[a-z]/.test(p), message: 'Au moins une minuscule' },
  number: { test: (p) => /[0-9]/.test(p), message: 'Au moins un chiffre' },
  special: { test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), message: 'Au moins un caractère spécial' },
}

// Valid roles
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  VIEWER: 'viewer',
}

export const ROLE_LABELS = {
  [ADMIN_ROLES.SUPER_ADMIN]: 'Super Administrateur',
  [ADMIN_ROLES.ADMIN]: 'Administrateur',
  [ADMIN_ROLES.VIEWER]: 'Lecteur',
}

export const ROLE_DESCRIPTIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: 'Accès complet à toutes les fonctionnalités',
  [ADMIN_ROLES.ADMIN]: 'Gestion des créateurs et paiements',
  [ADMIN_ROLES.VIEWER]: 'Consultation uniquement',
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'L\'email est requis' }
  }

  const trimmed = email.trim().toLowerCase()

  if (trimmed.length === 0) {
    return { valid: false, error: 'L\'email est requis' }
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'L\'email est trop long' }
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Format d\'email invalide' }
  }

  return { valid: true }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, errors: string[], strength: number }}
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      errors: ['Le mot de passe est requis'],
      strength: 0,
      requirements: Object.keys(PASSWORD_REQUIREMENTS).map(key => ({
        key,
        message: PASSWORD_REQUIREMENTS[key].message,
        met: false,
      })),
    }
  }

  const errors = []
  const requirements = []
  let metCount = 0

  for (const [key, requirement] of Object.entries(PASSWORD_REQUIREMENTS)) {
    const met = requirement.test(password)
    requirements.push({ key, message: requirement.message, met })
    if (met) {
      metCount++
    } else {
      errors.push(requirement.message)
    }
  }

  const strength = Math.round((metCount / Object.keys(PASSWORD_REQUIREMENTS).length) * 100)

  return {
    valid: errors.length === 0,
    errors,
    strength,
    requirements,
  }
}

/**
 * Get password strength level
 * @param {number} strength - Strength percentage (0-100)
 * @returns {{ level: string, color: string, label: string }}
 */
export const getPasswordStrengthLevel = (strength) => {
  if (strength < 40) {
    return { level: 'weak', color: 'danger', label: 'Faible' }
  }
  if (strength < 70) {
    return { level: 'medium', color: 'warning', label: 'Moyen' }
  }
  if (strength < 100) {
    return { level: 'strong', color: 'primary', label: 'Fort' }
  }
  return { level: 'excellent', color: 'success', label: 'Excellent' }
}

/**
 * Validate full name
 * @param {string} name - Name to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateFullName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Le nom est requis' }
  }

  const trimmed = name.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Le nom est requis' }
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'Le nom doit contenir au moins 2 caractères' }
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Le nom est trop long (max 100 caractères)' }
  }

  return { valid: true }
}

/**
 * Validate role
 * @param {string} role - Role to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateRole = (role) => {
  if (!role || typeof role !== 'string') {
    return { valid: false, error: 'Le rôle est requis' }
  }

  const validRoles = Object.values(ADMIN_ROLES)
  if (!validRoles.includes(role)) {
    return { valid: false, error: 'Rôle invalide' }
  }

  return { valid: true }
}

/**
 * Validate complete admin form
 * @param {object} data - Form data
 * @param {string} data.email - Admin email
 * @param {string} data.fullName - Admin full name
 * @param {string} data.password - Admin password (required for create, optional for edit)
 * @param {string} data.role - Admin role
 * @param {boolean} isEdit - Whether this is an edit operation
 * @returns {{ valid: boolean, errors: object }}
 */
export const validateAdminForm = (data, isEdit = false) => {
  const errors = {}

  // Validate email
  const emailResult = validateEmail(data.email)
  if (!emailResult.valid) {
    errors.email = emailResult.error
  }

  // Validate full name
  const nameResult = validateFullName(data.fullName)
  if (!nameResult.valid) {
    errors.fullName = nameResult.error
  }

  // Validate password (required for create, optional for edit)
  if (!isEdit || (data.password && data.password.length > 0)) {
    if (!isEdit && (!data.password || data.password.length === 0)) {
      errors.password = 'Le mot de passe est requis'
    } else if (data.password) {
      const passwordResult = validatePassword(data.password)
      if (!passwordResult.valid) {
        errors.password = passwordResult.errors[0]
      }
    }
  }

  // Validate role
  const roleResult = validateRole(data.role)
  if (!roleResult.valid) {
    errors.role = roleResult.error
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Sanitize email input
 * @param {string} email - Email to sanitize
 * @returns {string}
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return ''
  return email.trim().toLowerCase()
}

/**
 * Sanitize name input
 * @param {string} name - Name to sanitize
 * @returns {string}
 */
export const sanitizeName = (name) => {
  if (!name || typeof name !== 'string') return ''
  return name.trim().replace(/\s+/g, ' ')
}

/**
 * Check if a role has required permissions
 * @param {string} userRole - Current user role
 * @param {string} requiredRole - Required role for action
 * @returns {boolean}
 */
export const hasRequiredRole = (userRole, requiredRole) => {
  const roleHierarchy = {
    [ADMIN_ROLES.SUPER_ADMIN]: 3,
    [ADMIN_ROLES.ADMIN]: 2,
    [ADMIN_ROLES.VIEWER]: 1,
  }

  const userLevel = roleHierarchy[userRole] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0

  return userLevel >= requiredLevel
}

/**
 * Generate a secure random password
 * @returns {string}
 */
export const generateSecurePassword = () => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const special = '!@#$%^&*'

  const allChars = lowercase + uppercase + numbers + special

  // Ensure at least one of each type
  let password = ''
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill remaining with random chars
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
