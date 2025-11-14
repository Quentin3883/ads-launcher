import { useState, useEffect } from 'react'
import { Facebook, Instagram, CheckCircle2, Loader2 } from 'lucide-react'
import { FormSection, Input, ds, Button } from '../ui/shadcn'

interface FacebookPage {
  id: string
  name: string
  picture?: {
    data?: { url: string }
    url?: string
  }
  connected_instagram_account?: {
    id: string
    name?: string
    username?: string
    profile_picture_url?: string
  }
}

interface FacebookPageSelectorProps {
  facebookPages?: FacebookPage[]
  isLoading: boolean
  selectedPageId?: string
  onSelectPage: (pageId: string) => void
}

/**
 * Facebook Page selector with dropdown
 * Shows page thumbnails and connected Instagram accounts
 */
export function FacebookPageSelector({
  facebookPages,
  isLoading,
  selectedPageId,
  onSelectPage,
}: FacebookPageSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const selectedPage = facebookPages?.find((page) => page.id === selectedPageId)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showDropdown) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showDropdown])

  if (isLoading) {
    return (
      <FormSection
        icon={
          <div className={ds.cn('p-1.5', ds.borders.radius.md, ds.getIconColor('blue'))}>
            <Facebook className="h-4 w-4" />
          </div>
        }
        title="Facebook Page"
      >
        <div className="flex items-center justify-center py-4">
          <Loader2 className={ds.cn('h-5 w-5 animate-spin text-primary')} />
        </div>
      </FormSection>
    )
  }

  if (!facebookPages || facebookPages.length === 0) {
    return (
      <FormSection
        icon={
          <div className={ds.cn('p-1.5', ds.borders.radius.md, ds.getIconColor('blue'))}>
            <Facebook className="h-4 w-4" />
          </div>
        }
        title="Facebook Page"
      >
        <Input
          value={selectedPageId || ''}
          onChange={onSelectPage}
          placeholder="ID de la page Facebook (ex: 397742766762941)"
        />
      </FormSection>
    )
  }

  return (
    <FormSection
      icon={
        <div className={ds.cn('p-1.5', ds.borders.radius.md, ds.getIconColor('blue'))}>
          <Facebook className="h-4 w-4" />
        </div>
      }
      title="Facebook Page"
    >
      <div className="relative">
        {/* Selected Page Display */}
        <Button
          onClick={(e) => {
            e.stopPropagation()
            setShowDropdown(!showDropdown)
          }}
          variant="outline"
          className={ds.cn(
            'w-full flex items-center justify-start',
            ds.spacing.gap.sm,
            ds.spacing.paddingX.compact,
            'py-2',
            ds.borders.radius.md,
            ds.transitions.default,
            'h-auto'
          )}
        >
          {selectedPage ? (
            <>
              <img
                src={selectedPage.picture?.data?.url || selectedPage.picture?.url}
                alt={selectedPage.name}
                className={ds.cn('h-8 w-8', ds.borders.radius.md, 'flex-shrink-0 object-cover')}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="flex-1 min-w-0">
                <div className={ds.cn(ds.typography.body, 'font-medium text-foreground')}>
                  {selectedPage.name}
                </div>
                {selectedPage.connected_instagram_account && (
                  <div className={ds.cn(ds.typography.caption, 'flex items-center gap-1')}>
                    <Instagram className="h-3 w-3" />
                    {selectedPage.connected_instagram_account.username
                      ? `@${selectedPage.connected_instagram_account.username}`
                      : selectedPage.connected_instagram_account.name || 'Instagram connecté'}
                  </div>
                )}
              </div>
              <svg
                className="h-4 w-4 text-muted-foreground flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          ) : (
            <>
              <div className={ds.cn('flex-1', ds.typography.body, 'text-muted-foreground')}>
                Choisir une page...
              </div>
              <svg
                className="h-4 w-4 text-muted-foreground flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </Button>

        {/* Dropdown List */}
        {showDropdown && (
          <div
            className={ds.cn(
              'absolute z-50 w-full mt-1',
              ds.borders.radius.md,
              'border border-border bg-card',
              ds.shadows.lg,
              'max-h-80 overflow-y-auto'
            )}
          >
            {facebookPages.map((page) => (
              <Button
                key={page.id}
                onClick={() => {
                  onSelectPage(page.id)
                  setShowDropdown(false)
                }}
                variant="ghost"
                className={ds.cn(
                  'w-full flex items-center justify-start',
                  ds.spacing.gap.sm,
                  ds.spacing.paddingX.compact,
                  'py-2',
                  'text-left',
                  ds.transitions.default,
                  'border-b border-border last:border-b-0 rounded-none h-auto',
                  selectedPageId === page.id && 'bg-primary/5'
                )}
              >
                <img
                  src={page.picture?.data?.url || page.picture?.url}
                  alt={page.name}
                  className={ds.cn('h-8 w-8', ds.borders.radius.md, 'flex-shrink-0 object-cover')}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className={ds.cn(ds.typography.body, 'font-medium text-foreground')}>{page.name}</div>
                  {page.connected_instagram_account ? (
                    <div className={ds.cn(ds.typography.caption, 'text-green-600 flex items-center gap-1')}>
                      <Instagram className="h-3 w-3" />
                      {page.connected_instagram_account.username
                        ? `@${page.connected_instagram_account.username}`
                        : page.connected_instagram_account.name || 'Instagram connecté'}
                    </div>
                  ) : (
                    <div className={ds.cn(ds.typography.caption)}>Pas d'Instagram connecté</div>
                  )}
                </div>
                {selectedPageId === page.id && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
              </Button>
            ))}
          </div>
        )}
      </div>
    </FormSection>
  )
}
