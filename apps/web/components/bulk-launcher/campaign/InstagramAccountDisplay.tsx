import { Instagram, CheckCircle2 } from 'lucide-react'
import { FormSection, Input, ds } from '../ui/shadcn'

interface InstagramAccount {
  id: string
  name?: string
  username?: string
  profile_picture_url?: string
}

interface InstagramAccountDisplayProps {
  facebookPageId?: string
  connectedAccount?: InstagramAccount
  manualAccountId?: string
  onSetManualAccountId: (id: string) => void
}

/**
 * Instagram account display component
 * Shows connected Instagram or allows manual ID input
 */
export function InstagramAccountDisplay({
  facebookPageId,
  connectedAccount,
  manualAccountId,
  onSetManualAccountId,
}: InstagramAccountDisplayProps) {
  if (!facebookPageId) {
    return (
      <FormSection
        icon={
          <div className={ds.cn('p-1.5', ds.borders.radius.md, ds.getIconColor('pink'))}>
            <Instagram className="h-4 w-4" />
          </div>
        }
        title="Instagram Account"
      >
        <div className={ds.cn('flex items-center justify-center py-4', ds.typography.caption)}>
          Sélectionnez d'abord une page Facebook
        </div>
      </FormSection>
    )
  }

  if (connectedAccount) {
    return (
      <FormSection
        icon={
          <div className={ds.cn('p-1.5', ds.borders.radius.md, ds.getIconColor('pink'))}>
            <Instagram className="h-4 w-4" />
          </div>
        }
        title="Instagram Account"
      >
        <div
          className={ds.cn(
            'flex items-center',
            ds.spacing.gap.sm,
            ds.spacing.paddingX.compact,
            'py-2',
            ds.borders.radius.md,
            'bg-green-50 border border-green-200'
          )}
        >
          {connectedAccount.profile_picture_url ? (
            <img
              src={connectedAccount.profile_picture_url}
              alt="Instagram profile"
              className="h-8 w-8 rounded-full flex-shrink-0 object-cover"
            />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className={ds.cn(ds.typography.body, 'font-semibold text-green-900 truncate')}>
              {connectedAccount.name || connectedAccount.username || 'Instagram connecté'}
            </p>
            {connectedAccount.username && (
              <p className={ds.cn(ds.typography.caption, 'text-green-700 truncate')}>
                @{connectedAccount.username}
              </p>
            )}
            <p className={ds.cn(ds.typography.caption, 'text-green-700')}>Détecté automatiquement</p>
          </div>
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
        </div>
      </FormSection>
    )
  }

  return (
    <FormSection
      icon={
        <div className={ds.cn('p-1.5', ds.borders.radius.md, ds.getIconColor('pink'))}>
          <Instagram className="h-4 w-4" />
        </div>
      }
      title="Instagram Account"
    >
      <div className={ds.spacing.vertical.xs}>
        <div
          className={ds.cn(
            'flex items-center',
            ds.spacing.gap.xs,
            ds.spacing.paddingX.compact,
            'py-2',
            ds.borders.radius.md,
            'bg-yellow-50 border border-yellow-200'
          )}
        >
          <div className="text-yellow-600 text-xs">⚠️</div>
          <div className="flex-1 min-w-0">
            <p className={ds.cn(ds.typography.caption, 'font-medium text-yellow-900')}>
              Aucun compte connecté
            </p>
            <p className={ds.cn(ds.typography.caption, 'text-yellow-700 truncate')}>
              Entrez un ID manuellement
            </p>
          </div>
        </div>
        <Input
          value={manualAccountId || ''}
          onChange={onSetManualAccountId}
          placeholder="ID Instagram"
        />
      </div>
    </FormSection>
  )
}
