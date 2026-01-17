import { useState, useEffect, useMemo } from 'react'
import { Mail, User, Lock, Eye, EyeOff, RefreshCw, Check, X } from 'lucide-react'
import clsx from 'clsx'
import { Modal, Button } from '../Common'
import {
  validateEmail,
  validatePassword,
  validateFullName,
  getPasswordStrengthLevel,
  generateSecurePassword,
  ADMIN_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from '../../lib/adminValidation'

/**
 * Admin form modal for create/edit operations
 * @param {object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {function} props.onClose - Close handler
 * @param {object} [props.admin] - Admin data for edit mode
 * @param {function} props.onSubmit - Submit handler
 * @param {boolean} [props.loading] - Loading state
 */
export const AdminForm = ({ isOpen, onClose, admin, onSubmit, loading }) => {
  const isEdit = !!admin

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    role: ADMIN_ROLES.VIEWER,
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({})

  // Reset form when modal opens/closes or admin changes
  useEffect(() => {
    if (isOpen) {
      if (admin) {
        setFormData({
          email: admin.email || '',
          fullName: admin.full_name || '',
          password: '',
          role: admin.role || ADMIN_ROLES.VIEWER,
        })
      } else {
        setFormData({
          email: '',
          fullName: '',
          password: '',
          role: ADMIN_ROLES.VIEWER,
        })
      }
      setErrors({})
      setTouched({})
      setShowPassword(false)
    }
  }, [isOpen, admin])

  // Password validation result
  const passwordValidation = useMemo(() => {
    if (!formData.password) return null
    return validatePassword(formData.password)
  }, [formData.password])

  const passwordStrength = useMemo(() => {
    if (!passwordValidation) return null
    return getPasswordStrengthLevel(passwordValidation.strength)
  }, [passwordValidation])

  // Handle field change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  // Handle field blur (validate on blur)
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))

    let validation
    switch (field) {
      case 'email':
        validation = validateEmail(formData.email)
        break
      case 'fullName':
        validation = validateFullName(formData.fullName)
        break
      case 'password':
        if (!isEdit || formData.password) {
          validation = validatePassword(formData.password)
          if (!validation.valid) {
            validation = { valid: false, error: validation.errors[0] }
          }
        }
        break
      default:
        return
    }

    if (validation && !validation.valid) {
      setErrors(prev => ({ ...prev, [field]: validation.error }))
    }
  }

  // Generate random password
  const handleGeneratePassword = () => {
    const password = generateSecurePassword()
    handleChange('password', password)
    setShowPassword(true)
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all fields
    const newErrors = {}

    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.valid) newErrors.email = emailValidation.error

    const nameValidation = validateFullName(formData.fullName)
    if (!nameValidation.valid) newErrors.fullName = nameValidation.error

    if (!isEdit || formData.password) {
      if (!isEdit && !formData.password) {
        newErrors.password = 'Le mot de passe est requis'
      } else if (formData.password) {
        const pwValidation = validatePassword(formData.password)
        if (!pwValidation.valid) newErrors.password = pwValidation.errors[0]
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setTouched({ email: true, fullName: true, password: true })
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      // Error is handled by parent
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Modifier l\'administrateur' : 'Nouvel administrateur'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div>
          <label
            htmlFor="admin-email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Adresse email <span className="text-danger-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              id="admin-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              disabled={isEdit || loading}
              placeholder="admin@example.com"
              className={clsx(
                'input pl-10',
                errors.email && touched.email && 'border-danger-500 focus:ring-danger-500',
                isEdit && 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
              )}
              aria-invalid={errors.email && touched.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              autoComplete="email"
            />
          </div>
          {errors.email && touched.email && (
            <p id="email-error" className="mt-1 text-sm text-danger-600 dark:text-danger-400">
              {errors.email}
            </p>
          )}
        </div>

        {/* Full Name Field */}
        <div>
          <label
            htmlFor="admin-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Nom complet <span className="text-danger-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              id="admin-name"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              disabled={loading}
              placeholder="Jean Dupont"
              className={clsx(
                'input pl-10',
                errors.fullName && touched.fullName && 'border-danger-500 focus:ring-danger-500'
              )}
              aria-invalid={errors.fullName && touched.fullName ? 'true' : 'false'}
              aria-describedby={errors.fullName ? 'name-error' : undefined}
              autoComplete="name"
            />
          </div>
          {errors.fullName && touched.fullName && (
            <p id="name-error" className="mt-1 text-sm text-danger-600 dark:text-danger-400">
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="admin-password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Mot de passe {!isEdit && <span className="text-danger-500">*</span>}
            {isEdit && <span className="text-gray-400 text-xs ml-1">(laisser vide pour ne pas modifier)</span>}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              disabled={loading}
              placeholder="••••••••"
              className={clsx(
                'input pl-10 pr-20',
                errors.password && touched.password && 'border-danger-500 focus:ring-danger-500'
              )}
              aria-invalid={errors.password && touched.password ? 'true' : 'false'}
              aria-describedby="password-requirements"
              autoComplete="new-password"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Générer un mot de passe"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 text-gray-400" aria-hidden="true" />
                <span className="sr-only">Générer un mot de passe</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={showPassword ? 'Masquer' : 'Afficher'}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" aria-hidden="true" />
                )}
                <span className="sr-only">{showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}</span>
              </button>
            </div>
          </div>

          {/* Password strength indicator */}
          {formData.password && passwordValidation && (
            <div className="mt-2 space-y-2">
              {/* Strength bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full transition-all duration-300 rounded-full',
                      passwordStrength?.color === 'danger' && 'bg-danger-500',
                      passwordStrength?.color === 'warning' && 'bg-warning-500',
                      passwordStrength?.color === 'primary' && 'bg-primary-500',
                      passwordStrength?.color === 'success' && 'bg-success-500'
                    )}
                    style={{ width: `${passwordValidation.strength}%` }}
                  />
                </div>
                <span className={clsx(
                  'text-xs font-medium',
                  passwordStrength?.color === 'danger' && 'text-danger-600',
                  passwordStrength?.color === 'warning' && 'text-warning-600',
                  passwordStrength?.color === 'primary' && 'text-primary-600',
                  passwordStrength?.color === 'success' && 'text-success-600'
                )}>
                  {passwordStrength?.label}
                </span>
              </div>

              {/* Requirements list */}
              <ul id="password-requirements" className="grid grid-cols-2 gap-1 text-xs">
                {passwordValidation.requirements.map((req) => (
                  <li
                    key={req.key}
                    className={clsx(
                      'flex items-center gap-1',
                      req.met ? 'text-success-600 dark:text-success-400' : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {req.met ? (
                      <Check className="w-3 h-3" aria-hidden="true" />
                    ) : (
                      <X className="w-3 h-3" aria-hidden="true" />
                    )}
                    {req.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errors.password && touched.password && (
            <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
              {errors.password}
            </p>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rôle <span className="text-danger-500">*</span>
          </label>
          <div className="space-y-2">
            {Object.values(ADMIN_ROLES).map((role) => (
              <label
                key={role}
                className={clsx(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  formData.role === role
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={formData.role === role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  disabled={loading}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {ROLE_LABELS[role]}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {isEdit ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
