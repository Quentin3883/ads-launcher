'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, Star } from 'lucide-react'
import { cn } from '@launcher-ads/ui'
import {
  generateCampaignName,
  extractTemplateVariables,
  validateTemplate,
  type NamingConventionTemplate,
} from '@launcher-ads/sdk'

interface NamingConvention {
  id: string
  name: string
  description?: string
  template: string
  variables: any
  isDefault: boolean
  isActive: boolean
  clients: { id: string; name: string }[]
}

export function NamingSettings() {
  const [conventions, setConventions] = useState<NamingConvention[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: '{{clientName}} | d:{{date}} - sub:{{subject}} - loc:{{location}} - obj:{{objective}} - redir:{{redirectionType}}',
    dateFormat: 'MMYYYY' as 'MMYYYY' | 'MMDDYYYY' | 'YYYY-MM-DD' | 'DD/MM/YYYY',
    locationStrategy: 'auto' as 'auto' | 'country' | 'city' | 'region',
    isDefault: false,
  })

  // Preview state
  const [preview, setPreview] = useState('')

  // Load conventions
  useEffect(() => {
    fetchConventions()
  }, [])

  // Update preview when template or variables change
  useEffect(() => {
    try {
      const previewName = generateCampaignName(
        {
          template: formData.template,
          variables: {
            date: { format: formData.dateFormat },
            location: { strategy: formData.locationStrategy },
          },
        },
        {
          clientName: 'Bulldozer',
          subject: 'Lancement',
          campaign: {
            type: 'Leads',
            objective: 'OUTCOME_LEADS',
            redirectionType: 'LANDING_PAGE',
            redirectionUrl: 'https://example.com/estimateur',
            startDate: '2025-02-01',
          },
          audiences: {
            audiences: [],
            placementPresets: ['ALL_PLACEMENTS'],
            customPlacements: [],
            geoLocations: {
              countries: [],
              regions: [],
              cities: ['Nantes'],
            },
            demographics: {
              ageMin: 18,
              ageMax: 65,
              gender: 'All',
            },
            optimizationEvent: 'LEAD_GENERATION',
          },
        }
      )
      setPreview(previewName)
    } catch (error) {
      setPreview('Erreur dans le template')
    }
  }, [formData.template, formData.dateFormat, formData.locationStrategy])

  async function fetchConventions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/naming-conventions`)
      const data = await response.json()
      setConventions(data)
    } catch (error) {
      console.error('Failed to fetch naming conventions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    const validation = validateTemplate(formData.template)
    if (!validation.valid) {
      alert(`Template invalide:\n${validation.errors.join('\n')}`)
      return
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/naming-conventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          template: formData.template,
          variables: {
            date: { format: formData.dateFormat },
            location: { strategy: formData.locationStrategy },
          },
          isDefault: formData.isDefault,
        }),
      })

      await fetchConventions()
      setIsCreating(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create convention:', error)
      alert('Erreur lors de la création')
    }
  }

  async function handleUpdate(id: string) {
    const validation = validateTemplate(formData.template)
    if (!validation.valid) {
      alert(`Template invalide:\n${validation.errors.join('\n')}`)
      return
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/naming-conventions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          template: formData.template,
          variables: {
            date: { format: formData.dateFormat },
            location: { strategy: formData.locationStrategy },
          },
          isDefault: formData.isDefault,
        }),
      })

      await fetchConventions()
      setEditingId(null)
      resetForm()
    } catch (error) {
      console.error('Failed to update convention:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette convention ?')) return

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/naming-conventions/${id}`, {
        method: 'DELETE',
      })
      await fetchConventions()
    } catch (error) {
      console.error('Failed to delete convention:', error)
      alert('Erreur lors de la suppression')
    }
  }

  async function toggleDefault(id: string) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/naming-conventions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      await fetchConventions()
    } catch (error) {
      console.error('Failed to set default:', error)
    }
  }

  function startEdit(convention: NamingConvention) {
    setFormData({
      name: convention.name,
      description: convention.description || '',
      template: convention.template,
      dateFormat: convention.variables?.date?.format || 'MMYYYY',
      locationStrategy: convention.variables?.location?.strategy || 'auto',
      isDefault: convention.isDefault,
    })
    setEditingId(convention.id)
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      template: '{{clientName}} | d:{{date}} - sub:{{subject}} - loc:{{location}} - obj:{{objective}} - redir:{{redirectionType}}',
      dateFormat: 'MMYYYY',
      locationStrategy: 'auto',
      isDefault: false,
    })
  }

  const variables = extractTemplateVariables(formData.template)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Conventions de Naming</h2>
          <p className="text-sm text-muted-foreground">
            Définissez des templates pour générer automatiquement les noms de campagne
          </p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Convention
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="mb-6 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-base font-semibold">
            {editingId ? 'Modifier la Convention' : 'Nouvelle Convention'}
          </h3>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nom</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Convention Standard"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Convention utilisée par défaut"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Template */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Template</label>
              <textarea
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Variables disponibles: {'{{'} clientName, date, subject, location, objective, redirectionType, redirectionName, type, budget {'}}'}
              </p>
            </div>

            {/* Date Format */}
            {variables.includes('date') && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Format de Date</label>
                <select
                  value={formData.dateFormat}
                  onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value as any })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="MMYYYY">MMYYYY (022025)</option>
                  <option value="MMDDYYYY">MMDDYYYY (02012025)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2025-02-01)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (01/02/2025)</option>
                </select>
              </div>
            )}

            {/* Location Strategy */}
            {variables.includes('location') && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Stratégie de Localisation</label>
                <select
                  value={formData.locationStrategy}
                  onChange={(e) => setFormData({ ...formData, locationStrategy: e.target.value as any })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="auto">Auto (ville &gt; région &gt; pays)</option>
                  <option value="city">Ville uniquement</option>
                  <option value="region">Région uniquement</option>
                  <option value="country">Pays uniquement</option>
                </select>
              </div>
            )}

            {/* Preview */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Aperçu</label>
              <div className="rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm">
                {preview}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Exemple avec: Bulldozer, Lancement, Nantes, LEAD, Landing Page
              </p>
            </div>

            {/* Default */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor="isDefault" className="text-sm">
                Définir comme convention par défaut
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => (editingId ? handleUpdate(editingId) : handleCreate())}
                disabled={!formData.name || !formData.template}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setEditingId(null)
                  resetForm()
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {conventions.map((convention) => (
          <div
            key={convention.id}
            className={cn(
              'rounded-lg border border-border bg-card p-4',
              convention.isDefault && 'border-primary/50 bg-primary/5'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{convention.name}</h3>
                  {convention.isDefault && (
                    <span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <Star className="h-3 w-3" />
                      Par défaut
                    </span>
                  )}
                </div>
                {convention.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{convention.description}</p>
                )}
                <div className="mt-2 rounded bg-muted px-2 py-1.5 font-mono text-xs">
                  {convention.template}
                </div>
                {convention.clients.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Utilisé par {convention.clients.length} client{convention.clients.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                {!convention.isDefault && (
                  <button
                    onClick={() => toggleDefault(convention.id)}
                    className="rounded p-2 hover:bg-accent"
                    title="Définir par défaut"
                  >
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => startEdit(convention)}
                  className="rounded p-2 hover:bg-accent"
                >
                  <Edit2 className="h-4 w-4 text-muted-foreground" />
                </button>
                {!convention.isDefault && (
                  <button
                    onClick={() => handleDelete(convention.id)}
                    className="rounded p-2 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {conventions.length === 0 && !isCreating && (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune convention de naming configurée
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
