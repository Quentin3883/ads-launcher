'use client'

import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { Target, MapPin, Layout, Users } from 'lucide-react'

/**
 * Express Mode - Step 2: Objectif & Cible
 * - Campaign objective
 * - Unified geo targeting (country/region/city)
 * - Placement presets
 * - Audience presets
 */
export function ExpressObjectiveStep() {
  const {
    campaignObjective,
    setCampaignObjective,
    geoTargeting,
    setGeoTargeting,
    placementPreset,
    setPlacementPreset,
    audiencePreset,
    setAudiencePreset,
  } = useBulkLauncher()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Objectif & Cible</h2>
        <p className="text-muted-foreground">
          Définissez votre objectif et votre audience cible
        </p>
      </div>

      {/* Campaign Objective */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Objectif de campagne *</h3>
            <p className="text-xs text-muted-foreground">Que voulez-vous accomplir ?</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'OUTCOME_TRAFFIC', label: 'Trafic', description: 'Envoyer des visiteurs vers votre site' },
            { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement', description: 'Obtenir plus d\'interactions' },
            { value: 'OUTCOME_LEADS', label: 'Prospects', description: 'Collecter des informations' },
            { value: 'OUTCOME_SALES', label: 'Ventes', description: 'Générer des conversions' },
          ].map((objective) => (
            <button
              key={objective.value}
              onClick={() => setCampaignObjective(objective.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                campaignObjective === objective.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="font-semibold text-foreground">{objective.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{objective.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Geo Targeting */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <MapPin className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Ciblage géographique *</h3>
            <p className="text-xs text-muted-foreground">Pays, régions ou villes</p>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="Rechercher un pays, région ou ville..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">
            Tapez au moins 2 caractères pour rechercher
          </p>
        </div>
      </div>

      {/* Placement Preset */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <Layout className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Emplacements *</h3>
            <p className="text-xs text-muted-foreground">Où diffuser vos publicités</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'automatic', label: 'Automatique', description: 'Meta choisit pour vous' },
            { value: 'feed-only', label: 'Feed uniquement', description: 'FB & IG Feed' },
            { value: 'stories-only', label: 'Stories uniquement', description: 'FB & IG Stories' },
          ].map((placement) => (
            <button
              key={placement.value}
              onClick={() => setPlacementPreset(placement.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                placementPreset === placement.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="font-semibold text-sm text-foreground">{placement.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{placement.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Audience Preset */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <Users className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Audience *</h3>
            <p className="text-xs text-muted-foreground">Qui voulez-vous cibler ?</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'broad', label: 'Large', description: '18-65 ans, tous genres' },
            { value: 'young-adults', label: 'Jeunes adultes', description: '18-34 ans' },
            { value: 'parents', label: 'Parents', description: 'Parents avec enfants' },
            { value: 'professionals', label: 'Professionnels', description: '25-54 ans, actifs' },
          ].map((audience) => (
            <button
              key={audience.value}
              onClick={() => setAudiencePreset(audience.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                audiencePreset === audience.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="font-semibold text-foreground">{audience.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{audience.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
