// @ts-nocheck - tRPC type collision with reserved names, works correctly at runtime
'use client'

import { useState, useEffect } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { Loader2, Facebook, Instagram } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function AccountsPixelSection() {
  const {
    adAccountId,
    facebookPageId,
    setFacebookPageId,
    instagramAccountId,
    setInstagramAccountId,
  } = useBulkLauncher()

  // Fetch Facebook Pages
  const { data: facebookPages, isLoading: isLoadingPages } = trpc.facebookCampaigns.getUserPages.useQuery(
    { adAccountId: adAccountId! },
    { enabled: !!adAccountId }
  )

  // Auto-detect Instagram account
  const selectedPage = facebookPages?.find((page: any) => page.id === facebookPageId)
  const connectedInstagramId = selectedPage?.connected_instagram_account?.id

  // Auto-set Instagram account
  useEffect(() => {
    if (connectedInstagramId && instagramAccountId !== connectedInstagramId) {
      setInstagramAccountId(connectedInstagramId)
    }
  }, [connectedInstagramId, instagramAccountId, setInstagramAccountId])

  // Auto-select first page if only one exists
  useEffect(() => {
    if (adAccountId && facebookPages && facebookPages.length === 1 && !facebookPageId) {
      setFacebookPageId(facebookPages[0].id)
    }
  }, [adAccountId, facebookPages, facebookPageId, setFacebookPageId])

  return (
    <div className="space-y-6">
      {/* Facebook Page Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
              <Facebook className="h-4 w-4" />
            </div>
            Facebook Page
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPages ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : facebookPages && facebookPages.length > 0 ? (
            <Select value={facebookPageId || ''} onValueChange={setFacebookPageId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a page...">
                  {selectedPage && (
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedPage.picture?.data?.url || selectedPage.picture?.url}
                        alt={selectedPage.name}
                        className="h-6 w-6 rounded-md object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">
                          {selectedPage.name}
                        </div>
                        {selectedPage.connected_instagram_account && (
                          <div className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Instagram className="h-3 w-3" />
                            <span className="truncate">
                              {selectedPage.connected_instagram_account.username
                                ? `@${selectedPage.connected_instagram_account.username}`
                                : selectedPage.connected_instagram_account.name || 'Instagram connected'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {facebookPages.map((page: any) => (
                  <SelectItem key={page.id} value={page.id}>
                    <div className="flex items-center gap-2">
                      <img
                        src={page.picture?.data?.url || page.picture?.url}
                        alt={page.name}
                        className="h-6 w-6 rounded-md object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {page.name}
                        </div>
                        {page.connected_instagram_account && (
                          <div className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Instagram className="h-3 w-3" />
                            <span className="truncate">
                              {page.connected_instagram_account.username
                                ? `@${page.connected_instagram_account.username}`
                                : page.connected_instagram_account.name || 'Instagram connected'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground">No Facebook pages available</div>
          )}
        </CardContent>
      </Card>

      {/* Instagram Account (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-pink-500/10 text-pink-500">
              <Instagram className="h-4 w-4" />
            </div>
            Instagram Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedPage?.connected_instagram_account ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30">
              <Instagram className="h-4 w-4 text-pink-500" />
              <span className="text-sm">
                {selectedPage.connected_instagram_account.username
                  ? `@${selectedPage.connected_instagram_account.username}`
                  : selectedPage.connected_instagram_account.name || 'Instagram connected'}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground px-3 py-2">
              No Instagram account connected to this page
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
