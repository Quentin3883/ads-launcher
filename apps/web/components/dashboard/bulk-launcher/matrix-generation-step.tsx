'use client'

import { useState } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { Eye, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function MatrixGenerationStep() {
  const { matrixConfig, toggleDimension, getMatrixStats, generateCampaign, generatedAdSets } = useBulkLauncher()
  const [showDryRun, setShowDryRun] = useState(false)
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set())

  const stats = getMatrixStats()
  const isOverLimit = stats.totalAds > matrixConfig.softLimit

  const handleDryRun = () => {
    const result = generateCampaign()
    if (result) {
      setShowDryRun(true)
    } else {
      alert('Please complete all required fields')
    }
  }

  const handleCreate = () => {
    const result = generateCampaign()
    if (result) {
      console.log('💥 BULK CAMPAIGN CREATED:', JSON.stringify(result, null, 2))
      alert(`✅ Campaign created!\n${stats.adSets} Ad Sets with ${stats.totalAds} total Ads\n\nCheck console for JSON output.`)
    } else {
      alert('Please complete all required fields')
    }
  }

  const toggleAdSet = (id: string) => {
    setExpandedAdSets((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Matrix Generation</h3>
        <p className="text-sm text-muted-foreground">Configure dimensions and generate campaign</p>
      </div>

      {/* Dimension Switches */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h4 className="font-semibold text-foreground">Dimensions to Combine</h4>

        <div className="space-y-3">
          {[
            { key: 'audiences' as const, label: 'Audiences', description: 'Create one Ad Set per audience' },
            { key: 'placements' as const, label: 'Placement Presets', description: 'Multiply Ad Sets by placements' },
            { key: 'creatives' as const, label: 'Creatives', description: 'Create one Ad per creative' },
            { key: 'formatVariants' as const, label: 'Format Variants (Feed/Story)', description: 'Create Feed + Story version per creative' },
            { key: 'copyVariants' as const, label: 'Copy Variants', description: 'Multiply Ads by copy variants' },
          ].map((dim) => (
            <label
              key={dim.key}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={matrixConfig.dimensions[dim.key]}
                  onChange={() => toggleDimension(dim.key)}
                  className="rounded border-border"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">{dim.label}</div>
                  <div className="text-xs text-muted-foreground">{dim.description}</div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Stats Card */}
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Ad Sets</div>
            <div className="text-3xl font-bold text-foreground">{stats.adSets}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Ads per Ad Set</div>
            <div className="text-3xl font-bold text-foreground">{stats.adsPerAdSet}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Total Ads</div>
            <div className={`text-3xl font-bold ${isOverLimit ? 'text-destructive' : 'text-primary'}`}>
              {stats.totalAds}
            </div>
            {isOverLimit && (
              <div className="text-xs text-destructive mt-1">
                ⚠️ Exceeds soft limit ({matrixConfig.softLimit})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleDryRun}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors font-semibold"
        >
          <Eye className="h-5 w-5" />
          Dry Run (Preview)
        </button>
        <button
          onClick={handleCreate}
          disabled={isOverLimit}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            isOverLimit
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg'
          }`}
        >
          <Zap className="h-5 w-5" />
          💥 Create Full Campaign
        </button>
      </div>

      {/* Dry Run Preview */}
      <AnimatePresence>
        {showDryRun && generatedAdSets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-border bg-card p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Dry Run Preview</h4>
              <button
                onClick={() => setShowDryRun(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {generatedAdSets.map((adSet, idx) => (
                <div key={adSet.id} className="rounded-lg border border-border bg-background">
                  <button
                    onClick={() => toggleAdSet(adSet.id)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedAdSets.has(adSet.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          Ad Set #{idx + 1}: {adSet.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {adSet.ads.length} ads • {adSet.audience.type} • {adSet.placementPreset}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {adSet.budget ? `$${adSet.budget}/${adSet.budgetType}` : 'CBO'}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedAdSets.has(adSet.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border bg-muted/20 p-3 space-y-2"
                      >
                        {adSet.ads.map((ad, adIdx) => (
                          <div key={ad.id} className="text-xs p-2 rounded bg-background">
                            <div className="font-medium text-foreground">
                              Ad #{adIdx + 1}: {ad.name}
                            </div>
                            <div className="text-muted-foreground mt-1">
                              {ad.format} • {ad.headline.substring(0, 30)}...
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
