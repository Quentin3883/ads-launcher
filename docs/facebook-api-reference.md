# Facebook Marketing API Reference

## Campaign API

### Overview
A campaign is the highest level organizational structure within an ad account and should represent a single objective for an advertiser, for example, to drive page post engagement. Setting objective of the campaign will enforce validation on any ads added to the campaign to ensure they also have the correct objective.

### Important Notes
- Le paramètre `date_preset = lifetime` a été désactivé dans l'API Graph v10.0 et remplacé par `date_preset = maximum`, qui renvoie 37 mois de données au maximum.
- For versions 9.0 and earlier, `date_preset = maximum` was activated on May 25, 2021, and all lifetime calls default to maximum.

### Limits
- You can only create **200 ad sets per ad campaign**
- If your campaign has more than 70 ad sets and uses Campaign Budget Optimization, you are not able to edit your current bid strategy or turn off CBO

### Required Field: Special Ad Categories
All businesses using the Marketing API must identify whether or not new and edited campaigns belong to a Special Ad Category:
- `housing`
- `employment`
- `credit`
- `issues, elections, and politics`
- `NONE` (if not applicable - send empty array)

As of Marketing API 7.0, the `special_ad_category` parameter has been deprecated and replaced with `special_ad_categories` (accepts an array).

---

## Campaign Fields

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | numeric string | Campaign's ID (Default) |
| `account_id` | numeric string | ID of the ad account that owns this campaign |
| `name` | string | Campaign's name (Supports Emoji) |
| `objective` | string | Campaign's objective (See Outcome-Driven objectives below) |
| `status` | enum | `ACTIVE`, `PAUSED`, `DELETED`, `ARCHIVED` |
| `configured_status` | enum | Same as status, prefer using `status` |
| `effective_status` | enum | `ACTIVE`, `PAUSED`, `DELETED`, `ARCHIVED`, `IN_PROCESS`, `WITH_ISSUES` |

### Budget Fields

| Field | Type | Description |
|-------|------|-------------|
| `daily_budget` | numeric string | Daily budget of the campaign (all adsets share this) |
| `lifetime_budget` | numeric string | Lifetime budget of the campaign |
| `budget_remaining` | numeric string | Remaining budget |
| `spend_cap` | numeric string | Campaign spend cap (minimum $100 USD) |

### Bid Strategy

| Value | Description |
|-------|-------------|
| `LOWEST_COST_WITHOUT_CAP` | Get most results without bid limit (automatic bidding) |
| `LOWEST_COST_WITH_BID_CAP` | Get most results with bid limit (manual max-cost bidding) |
| `COST_CAP` | Limit average cost per optimization event |
| `LOWEST_COST_WITH_MIN_ROAS` | Minimum ROAS bidding |

**Note:** If CBO is not enabled, set bid_strategy at ad set level. TARGET_COST deprecated in v9.

### Buying Type

| Value | Description |
|-------|-------------|
| `AUCTION` | Default buying type |
| `RESERVED` | For reach and frequency ads (disabled for housing, employment, credit ads) |

### Date Fields

| Field | Type | Description |
|-------|------|-------------|
| `created_time` | datetime | Created Time |
| `updated_time` | datetime | Updated Time (not auto-updated on budget changes) |
| `start_time` | datetime | Merging of ad sets start_times (read-only at campaign level) |
| `stop_time` | datetime | Merging of ad sets stop_times (read-only at campaign level) |

### Other Fields

| Field | Type | Description |
|-------|------|-------------|
| `promoted_object` | AdPromotedObject | Object campaign is promoting |
| `special_ad_categories` | list<enum> | Special ad categories |
| `is_skadnetwork_attribution` | bool | iOS 14+ SKAdNetwork attribution |
| `smart_promotion_type` | enum | `guided_creation` or `smart_app_promotion` |

---

## Campaign Objectives

### New Outcome-Driven Objectives (v17.0+)

**Active objectives:**
- `OUTCOME_APP_PROMOTION`
- `OUTCOME_AWARENESS`
- `OUTCOME_ENGAGEMENT`
- `OUTCOME_LEADS`
- `OUTCOME_SALES`
- `OUTCOME_TRAFFIC`

**Deprecated objectives** (being phased out):
- `APP_INSTALLS`
- `BRAND_AWARENESS`
- `CONVERSIONS`
- `EVENT_RESPONSES`
- `LEAD_GENERATION`
- `LINK_CLICKS`
- `LOCAL_AWARENESS`
- `MESSAGES`
- `OFFER_CLAIMS`
- `PAGE_LIKES`
- `POST_ENGAGEMENT`
- `PRODUCT_CATALOG_SALES`
- `REACH`
- `STORE_VISITS`
- `VIDEO_VIEWS`

### Objective Mapping Table

| Old Objective | New Objective | Destination Type | Optimization Goal | Promoted Object |
|---------------|---------------|------------------|-------------------|-----------------|
| `BRAND_AWARENESS` | `OUTCOME_AWARENESS` | — | `AD_RECALL_LIFT` | `page_id` |
| `REACH` | `OUTCOME_AWARENESS` | — | `REACH`, `IMPRESSIONS` | `page_id` |
| `LINK_CLICKS` | `OUTCOME_TRAFFIC` | — | `LINK_CLICKS`, `LANDING_PAGE_VIEWS`, `REACH`, `IMPRESSIONS` | `application_id`, `object_store_url` |
| `LINK_CLICKS` | `OUTCOME_TRAFFIC` | `MESSENGER` | `LINK_CLICKS`, `REACH`, `IMPRESSIONS` | — |
| `LINK_CLICKS` | `OUTCOME_TRAFFIC` | `WHATSAPP` | `LINK_CLICKS`, `REACH`, `IMPRESSIONS` | `page_id` |
| `LINK_CLICKS` | `OUTCOME_TRAFFIC` | `PHONE_CALL` | `QUALITY_CALL`, `LINK_CLICKS` | — |
| `POST_ENGAGEMENT` | `OUTCOME_ENGAGEMENT` | `ON_POST` | `POST_ENGAGEMENT`, `REACH`, `IMPRESSIONS` | — |
| `PAGE_LIKES` | `OUTCOME_ENGAGEMENT` | `ON_PAGE` | `PAGE_LIKES` | `page_id` |
| `EVENT_RESPONSES` | `OUTCOME_ENGAGEMENT` | `ON_EVENT` | `EVENT_RESPONSES`, `POST_ENGAGEMENT`, `REACH`, `IMPRESSIONS` | — |
| `APP_INSTALLS` | `OUTCOME_APP_PROMOTION` | — | `LINK_CLICKS`, `OFFSITE_CONVERSIONS`, `APP_INSTALLS` | `application_id`, `object_store_url` |
| `VIDEO_VIEWS` | `OUTCOME_AWARENESS` | — | `THRUPLAY`, `TWO_SECOND_CONTINUOUS_VIDEO_VIEWS` | `page_id` |
| `VIDEO_VIEWS` | `OUTCOME_ENGAGEMENT` | `ON_VIDEO` | `THRUPLAY`, `TWO_SECOND_CONTINUOUS_VIDEO_VIEWS` | — |
| `LEAD_GENERATION` | `OUTCOME_LEADS` | `ON_AD` | `LEAD_GENERATION`, `QUALITY_LEAD` | `page_id` |
| `LEAD_GENERATION` | `OUTCOME_LEADS` | `LEAD_FROM_MESSENGER` | `LEAD_GENERATION` | `page_id` |
| `LEAD_GENERATION` | `OUTCOME_LEADS` | `LEAD_FROM_IG_DIRECT` | `LEAD_GENERATION` | `page_id` |
| `LEAD_GENERATION` | `OUTCOME_LEADS` | `PHONE_CALL` | `QUALITY_CALL` | `page_id` |
| `MESSAGES` | `OUTCOME_ENGAGEMENT` | `MESSENGER` | `CONVERSATIONS`, `LINK_CLICKS` | `page_id` |
| `MESSAGES` | `OUTCOME_ENGAGEMENT` | `MESSENGER` | `LEAD_GENERATION` | `page_id` |
| `CONVERSIONS` | `OUTCOME_ENGAGEMENT` | — | `OFFSITE_CONVERSIONS`, `LINK_CLICKS`, `REACH`, `LANDING_PAGE_VIEWS`, `IMPRESSIONS` | `pixel_id`, `custom_event_type`, `application_id`, `object_store_url` |
| `CONVERSIONS` | `OUTCOME_LEADS` | — | `OFFSITE_CONVERSIONS`, `LINK_CLICKS`, `REACH`, `LANDING_PAGE_VIEWS`, `IMPRESSIONS` | `pixel_id`, `custom_event_type`, `application_id`, `object_store_url` |
| `CONVERSIONS` | `OUTCOME_SALES` | — | `OFFSITE_CONVERSIONS` | `pixel_id`, `custom_event_type`, `application_id`, `object_store_url` |
| `CONVERSIONS` | `OUTCOME_SALES` | `MESSENGER` | `CONVERSATIONS` | `page_id`, `pixel_id`, `custom_event_type` |
| `CONVERSIONS` | `OUTCOME_SALES` | `PHONE_CALL` | `QUALITY_CALL` | `page_id` |
| `PRODUCT_CATALOG_SALES` | `OUTCOME_SALES` | `WEBSITE` | `LINK_CLICKS` | Campaign: `product_catalog_id`, Ad set: `product_set_id`, `custom_event_type` |
| `STORE_VISITS` | `OUTCOME_AWARENESS` | — | `REACH` | `place_page_set_id` |

---

## Creating a Campaign

### Endpoint
```
POST /act_{ad_account_id}/campaigns
```

### Required Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Campaign name (supports emoji) |
| `objective` | enum | Yes | Campaign objective (use OUTCOME_* values) |
| `special_ad_categories` | array | Yes | Special ad categories or empty array `[]` |
| `status` | enum | No | `ACTIVE` or `PAUSED` (default: `PAUSED`) |

### Optional Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `daily_budget` | int64 | Daily budget (all adsets share this) |
| `lifetime_budget` | int64 | Lifetime budget (all adsets share this) |
| `bid_strategy` | enum | Bid strategy when using CBO |
| `buying_type` | string | `AUCTION` (default) or `RESERVED` |
| `spend_cap` | int64 | Campaign spend cap (min $100 USD) |
| `start_time` | datetime | Campaign start time |
| `stop_time` | datetime | Campaign stop time |
| `is_skadnetwork_attribution` | boolean | Enable SKAdNetwork for iOS 14+ |
| `promoted_object` | Object | Object being promoted |

### Example Request

```bash
POST /v24.0/act_<AD_ACCOUNT_ID>/campaigns HTTP/1.1
Host: graph.facebook.com

name=My+campaign&objective=OUTCOME_TRAFFIC&status=PAUSED&special_ad_categories=%5B%5D&is_adset_budget_sharing_enabled=0
```

### Response

```json
{
  "id": "123456789",
  "success": true
}
```

---

## Compatible Ad Types by Objective

### OUTCOME_APP_PROMOTION (was APP_INSTALLS)
- Image Ads
- Video Ads
- Carousel Ads
- Instant Experience Ads
- App Ads
- Instagram Ads
- Dynamic Ads
- Dynamic Creative

### OUTCOME_AWARENESS (was BRAND_AWARENESS, REACH)
- Image Ads
- Video Ads
- Carousel Ads
- Instant Experience Ads
- Instagram Ads
- Dynamic Creative

### OUTCOME_TRAFFIC (was LINK_CLICKS)
- Image Ads
- Video Ads
- Carousel Ads
- Instant Experience Ads
- Collection Ads
- App Ads
- Instagram Ads
- Offer Ads
- Dynamic Ads
- Dynamic Creative

### OUTCOME_ENGAGEMENT (was POST_ENGAGEMENT, PAGE_LIKES, EVENT_RESPONSES, MESSAGES)
- Image Ads
- Video Ads
- Carousel Ads
- Instant Experience Ads
- Instagram Ads
- Messenger Ads

### OUTCOME_LEADS (was LEAD_GENERATION)
- Image Ads
- Video Ads
- Carousel Ads
- Lead Ads
- Instagram Ads
- Dynamic Creative

### OUTCOME_SALES (was CONVERSIONS, PRODUCT_CATALOG_SALES)
- Image Ads
- Video Ads
- Carousel Ads
- Instant Experience Ads
- Collection Ads
- App Ads
- Instagram Ads
- Dynamic Ads
- Collaborative Ads

---

## Promoted Object Requirements by Objective

| Objective | Required promoted_object Fields |
|-----------|--------------------------------|
| `OUTCOME_APP_PROMOTION` | `application_id` and `object_store_url` |
| | If optimization_goal is OFFSITE_CONVERSIONS: add `custom_event_type` |
| `OUTCOME_SALES` (conversions) | `pixel_id` (Conversion pixel ID) |
| | `pixel_id` and `custom_event_type` |
| | `pixel_id`, `pixel_rule`, and `custom_event_type` |
| | `event_id` and `custom_event_type` |
| | Mobile app events: `application_id`, `object_store_url`, `custom_event_type` |
| | Offline conversions: `offline_conversion_data_set_id`, `custom_event_type` |
| `OUTCOME_TRAFFIC` (mobile app) | `application_id` and `object_store_url` |
| `OUTCOME_SALES` (catalog) | `product_set_id` or `product_set_id` and `custom_event_type` |
| `OUTCOME_ENGAGEMENT` (page likes) | `page_id` |
| Offer claims | `page_id` |

---

## Ad Set API Reference

### Endpoint
```
GET /act_<AD_ACCOUNT_ID>/adsets?fields=name,id,status
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `date_preset` | enum | Predefined date range for insights |
| `effective_status` | list | Filter by status: `ACTIVE`, `PAUSED`, `DELETED`, etc. |
| `is_completed` | boolean | Filter by completion status |
| `time_range` | object | `{'since':'YYYY-MM-DD','until':'YYYY-MM-DD'}` |
| `updated_since` | integer | Time since adset was updated |

### Date Preset Values
- `today`, `yesterday`
- `this_month`, `last_month`
- `this_quarter`, `last_quarter`
- `this_year`, `last_year`
- `last_3d`, `last_7d`, `last_14d`, `last_28d`, `last_30d`, `last_90d`
- `last_week_mon_sun`, `last_week_sun_sat`
- `maximum` (37 months max)

---

## Error Codes

| Code | Description |
|------|-------------|
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |
| 200 | Permissions error |
| 300 | Edit failure |
| 613 | Rate limit exceeded |
| 801 | Invalid operation |
| 2500 | Error parsing graph query |
| 2635 | Deprecated API version |
| 3018 | Start date cannot be beyond 37 months |
| 80004 | Too many calls to ad account |

---

## Best Practices

### Campaign Creation
1. Always specify `special_ad_categories` (use empty array `[]` if none apply)
2. Use new OUTCOME_* objectives instead of deprecated ones
3. Set budget at campaign level (CBO) OR ad set level, not both
4. Default status to `PAUSED` when creating, then activate when ready

### Budget Management
- Campaign can have either `daily_budget` OR `lifetime_budget`, not both
- Minimum spend cap: $100 USD
- Ad sets under campaign share the campaign budget when using CBO

### iOS 14+ Campaigns
- Set `is_skadnetwork_attribution: true`
- Must specify `application_id` and `object_store_url` in promoted_object
- Mobile App Custom Audiences no longer supported for inclusion targeting
- App connections targeting not available

### Limitations
- Duplicating campaigns to new OUTCOME_* objectives may throw errors
- Max 200 ad sets per campaign
- CBO campaigns with 70+ ad sets cannot edit bid strategy or disable CBO
