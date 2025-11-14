# Meta Ads v24 ODAX Implementation Guide

## Overview

This guide documents the implementation of Meta Ads v24 ODAX (Outcome-Driven Ad Experiences) structure in the Launcher platform.

## Key Changes

### 1. Schema Updates (`packages/sdk/src/schemas/bulk-launcher.schema.ts`)

#### New Types
- **`destinationType`**: Replaces `redirectionType` with ODAX standard values
  - `WEBSITE` (was `LANDING_PAGE`)
  - `ON_AD` (was `LEAD_FORM`)
  - `APP` (was `DEEPLINK`)
  - `MESSENGER`, `WHATSAPP`, `SHOP_AUTOMATIC`, `NONE` (new)

#### New Constants
- **`ODAX_OPTIMIZATION_GOALS`**: Maps `Objective + Destination → Optimization Goals`
- **`OPTIMIZATION_GOAL_TO_BILLING_EVENTS`**: Maps `Optimization Goal → Billing Events`
- **`DEFAULT_OPTIMIZATION_GOAL`**: Default goal per objective/destination combo

#### New Helper Functions
```typescript
// Check if pixel required for configuration
requiresPixel(objective: CampaignType, destinationType?: DestinationType): boolean

// Check if URL required
requiresUrl(destinationType?: DestinationType): boolean

// Get available destinations for objective
getAvailableDestinations(objective: CampaignType): DestinationType[]
```

### 2. Frontend Updates

#### Redirection Section (`apps/web/components/bulk-launcher/subsections/redirection-section.tsx`)
- ✅ Updated to use `destinationType` with backward compatibility for `redirectionType`
- ✅ Mapping helpers to convert between old and new formats
- ✅ UI updated to use new destination types

#### Optimization Section (`apps/web/components/bulk-launcher/subsections/optimization-section.tsx`)
- ✅ Uses `ODAX_OPTIMIZATION_GOALS` to filter available goals
- ✅ Dynamic goal selection based on `objective + destinationType`
- ✅ Pixel requirement check using `requiresPixel()`
- ✅ Auto-selects default goal when objective/destination changes

#### Validation (`apps/web/components/dashboard/bulk-launcher-modal.tsx`)
- ✅ Updated validation rules for destination-based requirements
- ✅ WEBSITE requires URL
- ✅ ON_AD requires lead form ID
- ✅ NONE only allowed for Awareness

### 3. Store Updates (`apps/web/lib/store/bulk-launcher.ts`)
- ✅ Added `destinationType` field to campaign config
- ✅ Maintained `redirectionType` for backward compatibility

## ODAX v24 Campaign Structure

### Supported Objectives (Phase 1)

| Objective | Destinations | Optimization Goals | Pixel Required |
|-----------|--------------|-------------------|----------------|
| **Awareness** | NONE, WEBSITE | REACH, IMPRESSIONS | No |
| **Traffic** | WEBSITE | LINK_CLICKS, LANDING_PAGE_VIEWS, IMPRESSIONS | Optional |
| **Leads** | ON_AD, WEBSITE | LEAD_GENERATION | For WEBSITE only |

### Future Support (Phase 2+)

- **Engagement**: POST_ENGAGEMENT, VIDEO_VIEWS, THRUPLAY
- **Traffic**: MESSENGER, WHATSAPP (CONVERSATIONS)
- **Leads**: MESSENGER, WHATSAPP (CONVERSATIONS)
- **AppPromotion**: APP (APP_INSTALLS, APP_EVENTS, VALUE)
- **Sales**: WEBSITE, SHOP_AUTOMATIC (OFFSITE_CONVERSIONS, VALUE)

## Backend Integration

### Campaign Creation Flow

The backend should use the following logic when creating campaigns via Facebook Marketing API:

```typescript
// 1. Get campaign configuration
const { type, destinationType, optimizationGoal, pixelId } = campaignConfig

// 2. Validate destination is allowed for objective
const allowedDestinations = getAvailableDestinations(type)
if (!allowedDestinations.includes(destinationType)) {
  throw new Error(`Destination ${destinationType} not allowed for ${type}`)
}

// 3. Validate optimization goal is allowed
const allowedGoals = ODAX_OPTIMIZATION_GOALS[type][destinationType]
if (!allowedGoals.includes(optimizationGoal)) {
  throw new Error(`Goal ${optimizationGoal} not allowed for ${type} + ${destinationType}`)
}

// 4. Get billing event from optimization goal
const billingEvents = OPTIMIZATION_GOAL_TO_BILLING_EVENTS[optimizationGoal]
const billingEvent = billingEvents[0] // Use first (preferred) billing event

// 5. Check pixel requirements
const needsPixel = requiresPixel(type, destinationType)
if (needsPixel && !pixelId) {
  throw new Error(`Pixel required for ${type} campaigns with ${destinationType} destination`)
}

// 6. Create campaign via Meta API
const campaign = await metaAPI.createCampaign({
  name: campaignConfig.name,
  objective: type.toUpperCase(), // AWARENESS, TRAFFIC, LEADS, etc.
  status: 'PAUSED',
  special_ad_categories: campaignConfig.specialAdCategories || []
})

// 7. Create ad set with promoted_object
const promotedObject: any = {}

if (destinationType === 'WEBSITE') {
  if (pixelId) {
    promotedObject.pixel_id = pixelId
    promotedObject.custom_event_type = campaignConfig.customEventType || 'LEAD'
  }
}

if (destinationType === 'ON_AD') {
  promotedObject.page_id = campaignConfig.pageId
}

if (destinationType === 'APP') {
  promotedObject.application_id = campaignConfig.applicationId
  promotedObject.object_store_url = campaignConfig.objectStoreUrl
}

const adset = await metaAPI.createAdSet({
  campaign_id: campaign.id,
  name: adSetName,
  optimization_goal: optimizationGoal, // LINK_CLICKS, LEAD_GENERATION, etc.
  billing_event: billingEvent, // IMPRESSIONS, LINK_CLICKS, etc.
  bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
  promoted_object: promotedObject,
  targeting: {...},
  status: 'PAUSED'
})

// 8. Create ad with creative
const ad = await metaAPI.createAd({
  adset_id: adset.id,
  name: adName,
  creative: {
    object_story_spec: {
      page_id: campaignConfig.pageId,
      link_data: {
        link: destinationType === 'WEBSITE' ? campaignConfig.redirectionUrl : undefined,
        message: creative.primaryText,
        name: creative.headline,
        call_to_action: { type: creative.cta }
      }
    }
  },
  status: 'PAUSED'
})
```

### Validation Rules

```typescript
// Required fields by destination type
const requiredFields = {
  WEBSITE: ['redirectionUrl'],
  ON_AD: ['redirectionFormId', 'pageId'],
  APP: ['applicationId', 'objectStoreUrl'],
  MESSENGER: ['pageId'],
  WHATSAPP: ['pageId'],
  SHOP_AUTOMATIC: ['productCatalogId'],
  NONE: []
}

// Pixel requirements
const pixelRequired = {
  'Sales + WEBSITE': true,
  'Leads + WEBSITE': true,
  'Traffic + WEBSITE': false, // Optional
  'Awareness': false,
  'Leads + ON_AD': false
}
```

## Testing

### Manual Test Cases

1. **Awareness → NONE**
   - ✅ No destination selected
   - ✅ No pixel required
   - ✅ Optimization goals: REACH, IMPRESSIONS

2. **Traffic → WEBSITE**
   - ✅ Website URL required
   - ✅ Pixel optional
   - ✅ Optimization goals: LINK_CLICKS, LANDING_PAGE_VIEWS, IMPRESSIONS

3. **Leads → ON_AD**
   - ✅ Lead form required
   - ✅ No pixel required
   - ✅ Optimization goal: LEAD_GENERATION

4. **Leads → WEBSITE**
   - ✅ Website URL required
   - ✅ Pixel required
   - ✅ Optimization goals: LEAD_GENERATION, LANDING_PAGE_VIEWS

5. **Validation Edge Cases**
   - ✅ Cannot select NONE for non-Awareness campaigns
   - ✅ Cannot select ON_AD for non-Leads campaigns
   - ✅ Optimization goals update when destination changes
   - ✅ Invalid goals cleared when switching destination

## Migration Notes

### Backward Compatibility

- Old `redirectionType` field still exists in schema
- Mapping functions convert between old/new formats
- Frontend reads `destinationType` first, falls back to `redirectionType`
- Both fields stored during transition period

### Data Migration (if needed)

```sql
-- Update existing campaigns to use new destinationType
UPDATE campaigns
SET destination_type = CASE
  WHEN redirection_type = 'LANDING_PAGE' THEN 'WEBSITE'
  WHEN redirection_type = 'LEAD_FORM' THEN 'ON_AD'
  WHEN redirection_type = 'DEEPLINK' THEN 'APP'
  ELSE NULL
END
WHERE destination_type IS NULL;
```

## References

- [META_ADS_V24_MASTER_DOC.md](./META_ADS_V24_MASTER_DOC.md) - Complete ODAX documentation
- [OPTIMIZATION_GOALS_MAPPING.md](./OPTIMIZATION_GOALS_MAPPING.md) - Goal/billing event mappings
- Meta Marketing API v24.0 Documentation
