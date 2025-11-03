-- Add performance indices for better query optimization
-- Migration: add_performance_indices
-- Date: 2025-11-02

-- FacebookCampaign indices
CREATE INDEX IF NOT EXISTS "facebook_campaigns_adAccountId_status_idx"
  ON "facebook_campaigns" ("adAccountId", "status");

CREATE INDEX IF NOT EXISTS "facebook_campaigns_lastSyncedAt_idx"
  ON "facebook_campaigns" ("lastSyncedAt");

-- FacebookCampaignInsight indices
CREATE INDEX IF NOT EXISTS "facebook_campaign_insights_dateStart_dateEnd_idx"
  ON "facebook_campaign_insights" ("dateStart", "dateEnd");

-- FacebookAdSet indices
CREATE INDEX IF NOT EXISTS "facebook_ad_sets_campaignId_status_idx"
  ON "facebook_ad_sets" ("campaignId", "status");

CREATE INDEX IF NOT EXISTS "facebook_ad_sets_lastSyncedAt_idx"
  ON "facebook_ad_sets" ("lastSyncedAt");

-- FacebookAdSetInsight indices
CREATE INDEX IF NOT EXISTS "facebook_ad_set_insights_dateStart_dateEnd_idx"
  ON "facebook_ad_set_insights" ("dateStart", "dateEnd");

-- Comments for documentation
COMMENT ON INDEX "facebook_campaigns_adAccountId_status_idx" IS
  'Composite index for filtering campaigns by account and status - improves WHERE queries';

COMMENT ON INDEX "facebook_campaigns_lastSyncedAt_idx" IS
  'Index for sync operations - speeds up finding campaigns that need updating';

COMMENT ON INDEX "facebook_campaign_insights_dateStart_dateEnd_idx" IS
  'Composite index for date range queries - essential for analytics';

COMMENT ON INDEX "facebook_ad_sets_campaignId_status_idx" IS
  'Composite index for filtering ad sets by campaign and status';

COMMENT ON INDEX "facebook_ad_sets_lastSyncedAt_idx" IS
  'Index for sync operations - speeds up finding ad sets that need updating';

COMMENT ON INDEX "facebook_ad_set_insights_dateStart_dateEnd_idx" IS
  'Composite index for date range queries - essential for analytics';
