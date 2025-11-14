'use client'

import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { Image, FileText, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/**
 * Express Mode - Step 3: Créa & Lancement
 * - Media upload (simple)
 * - Ad copy
 * - Launch campaign
 */
export function ExpressCreativeStep() {
  const {
    adCreatives,
    setAdCreatives,
    adCopy,
    setAdCopy,
  } = useBulkLauncher()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Créa & Lancement</h2>
        <p className="text-muted-foreground">
          Ajoutez vos visuels et textes
        </p>
      </div>

      {/* Media Upload */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Image className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Visuels *</h3>
            <p className="text-xs text-muted-foreground">Images ou vidéos pour vos publicités</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            Cliquez pour ajouter des images ou vidéos
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, MP4, MOV jusqu'à 50 MB
          </p>
        </div>

        {adCreatives.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {adCreatives.map((creative, index) => (
              <div key={index} className="relative aspect-square rounded-lg border border-border overflow-hidden">
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ad Copy */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Texte de la publicité *</h3>
            <p className="text-xs text-muted-foreground">Message principal</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Texte principal
            </label>
            <Textarea
              value={adCopy.primaryText || ''}
              onChange={(e) => setAdCopy({ ...adCopy, primaryText: e.target.value })}
              placeholder="Écrivez votre message..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Titre
            </label>
            <Input
              type="text"
              value={adCopy.headline || ''}
              onChange={(e) => setAdCopy({ ...adCopy, headline: e.target.value })}
              placeholder="Un titre accrocheur..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <Input
              type="text"
              value={adCopy.description || ''}
              onChange={(e) => setAdCopy({ ...adCopy, description: e.target.value })}
              placeholder="Courte description..."
            />
          </div>
        </div>
      </div>

      {/* Launch Button */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          className="flex items-center gap-3 px-8 py-6 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl"
        >
          <Rocket className="h-6 w-6" />
          Lancer la campagne
        </Button>
      </div>
    </div>
  )
}
