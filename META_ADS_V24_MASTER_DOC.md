# META ADS v24 — MASTER DOC (Launcher Ready)

**Version**: v24 (ODAX - Outcome-Driven Ad Experiences)
**Last Updated**: 2025-01-14
**Purpose**: Complete reference for all Facebook campaign types, optimization goals, and valid combinations

---

## 📋 Table of Contents

1. [Campaign Objectives (ODAX v24)](#1-objectives)
2. [Destination Types](#2-destination-types)
3. [Optimization Goals](#3-optimization-goals)
4. [Billing Events](#4-billing-events)
5. [Mapping: Optimization Goal → Billing Event](#5-mapping-optimization-goal--billing-event)
6. [Bid Strategies](#6-bid-strategies)
7. [Scenarios by Objective](#7-scenarios-by-objective)
8. [Implementation Notes](#8-implementation-notes)

---

## 1. Objectives (ODAX v24)

Meta's new simplified objective structure:

| Objective Code | Display Name | Purpose |
|---------------|--------------|---------|
| `OUTCOME_AWARENESS` | Awareness | Build brand awareness and reach |
| `OUTCOME_TRAFFIC` | Traffic | Drive traffic to website/app/messaging apps |
| `OUTCOME_ENGAGEMENT` | Engagement | Increase engagement with posts, pages, events, videos |
| `OUTCOME_LEADS` | Leads | Generate leads via forms or messages |
| `OUTCOME_APP_PROMOTION` | App Promotion | Drive app installs and in-app actions |
| `OUTCOME_SALES` | Sales | Drive conversions and purchases |

---

## 2. Destination Types

The `destination_type` field in the ad set determines where users are directed:

| Destination Type | Description | Required For |
|-----------------|-------------|--------------|
| `null` (absent) | No specific destination | AWARENESS (optional) |
| `WEBSITE` | External website | TRAFFIC, SALES |
| `APP` | Mobile app (iOS/Android) | APP_PROMOTION |
| `MESSENGER` | Facebook Messenger | TRAFFIC, LEADS |
| `WHATSAPP` | WhatsApp | TRAFFIC, LEADS |
| `INSTAGRAM` | Instagram Direct | TRAFFIC |
| `SHOP_AUTOMATIC` | Facebook/Instagram Shop | SALES (Advantage+) |
| `ON_AD` | Lead form on the ad itself | LEADS (Lead Form) |

### Rules:
- **AWARENESS**: `destination_type` is optional (often `null`)
- **LEAD FORM**: `destination_type = ON_AD` is **required**
- **SALES to website**: `destination_type = WEBSITE` is **required**

---

## 3. Optimization Goals

Full list of available optimization goals:

```
APP_INSTALLS
AD_RECALL_LIFT
ENGAGED_USERS
EVENT_RESPONSES
IMPRESSIONS
LEAD_GENERATION
LINK_CLICKS
OFFSITE_CONVERSIONS
PAGE_LIKES
POST_ENGAGEMENT
REACH
REPLIES
SOCIAL_IMPRESSIONS
THRUPLAY
TWO_SECOND_CONTINUOUS_VIDEO_VIEWS
VIDEO_VIEWS
VALUE
LANDING_PAGE_VIEWS
```

---

## 4. Billing Events

Available billing events:

```
IMPRESSIONS (most common)
LINK_CLICKS
APP_INSTALLS
REACH
THRUPLAY
TWO_SECOND_CONTINUOUS_VIDEO_VIEWS
VIDEO_VIEWS
```

**Note**: `IMPRESSIONS` is valid for all optimization goals.

---

## 5. Mapping: Optimization Goal → Billing Event

```json
[
  { "optimization_goal": "APP_INSTALLS", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "AD_RECALL_LIFT", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "ENGAGED_USERS", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "EVENT_RESPONSES", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "IMPRESSIONS", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "LEAD_GENERATION", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "LINK_CLICKS", "valid_billing_events": ["LINK_CLICKS", "IMPRESSIONS"] },
  { "optimization_goal": "OFFSITE_CONVERSIONS", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "PAGE_LIKES", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "POST_ENGAGEMENT", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "REACH", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "REPLIES", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "SOCIAL_IMPRESSIONS", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "THRUPLAY", "valid_billing_events": ["IMPRESSIONS", "THRUPLAY"] },
  { "optimization_goal": "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS", "valid_billing_events": ["IMPRESSIONS", "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS"] },
  { "optimization_goal": "VIDEO_VIEWS", "valid_billing_events": ["IMPRESSIONS", "VIDEO_VIEWS"] },
  { "optimization_goal": "VALUE", "valid_billing_events": ["IMPRESSIONS"] },
  { "optimization_goal": "LANDING_PAGE_VIEWS", "valid_billing_events": ["IMPRESSIONS"] }
]
```

---

## 6. Bid Strategies

Available bid strategies with compatibility:

| Bid Strategy | Code | Compatible Objectives |
|-------------|------|----------------------|
| Lowest Cost (no cap) | `LOWEST_COST_WITHOUT_CAP` | All objectives |
| Cost Cap | `COST_CAP` | Most objectives (not REACH) |
| Min ROAS | `LOWEST_COST_WITH_MIN_ROAS` | SALES, APP_PROMOTION (value optimization) |
| Bid Cap | `LOWEST_COST_WITH_BID_CAP` | All objectives |

See [OPTIMIZATION_GOALS_MAPPING.md](./OPTIMIZATION_GOALS_MAPPING.md) for detailed bid strategy guide.

---

## 7. Scenarios by Objective

### 🎯 AWARENESS

```json
{
  "objective": "OUTCOME_AWARENESS",
  "scenarios": [
    {
      "label": "Awareness classique",
      "destination_type": null,
      "default_optimization_goal": "REACH",
      "allowed_optimization_goals": ["REACH", "IMPRESSIONS", "AD_RECALL_LIFT"],
      "billing_event_by_optimization": {
        "REACH": ["IMPRESSIONS"],
        "IMPRESSIONS": ["IMPRESSIONS"],
        "AD_RECALL_LIFT": ["IMPRESSIONS"]
      },
      "requires_pixel": false,
      "launcher_support": true
    }
  ]
}
```

**Launcher Implementation**:
- ✅ Supported
- No pixel required
- No redirection URL required

---

### 🚗 TRAFFIC

```json
{
  "objective": "OUTCOME_TRAFFIC",
  "scenarios": [
    {
      "label": "Traffic vers site",
      "destination_type": "WEBSITE",
      "default_optimization_goal": "LINK_CLICKS",
      "allowed_optimization_goals": [
        "LINK_CLICKS",
        "LANDING_PAGE_VIEWS",
        "IMPRESSIONS",
        "REACH"
      ],
      "billing_event_by_optimization": {
        "LINK_CLICKS": ["LINK_CLICKS", "IMPRESSIONS"],
        "LANDING_PAGE_VIEWS": ["IMPRESSIONS"],
        "IMPRESSIONS": ["IMPRESSIONS"],
        "REACH": ["IMPRESSIONS"]
      },
      "requires_pixel": true,
      "requires_url": true,
      "launcher_support": true
    },
    {
      "label": "Traffic vers Messenger / WhatsApp / IG",
      "destination_type": ["MESSENGER", "WHATSAPP", "INSTAGRAM"],
      "default_optimization_goal": "LINK_CLICKS",
      "allowed_optimization_goals": [
        "LINK_CLICKS",
        "IMPRESSIONS",
        "REACH"
      ],
      "billing_event_by_optimization": {
        "LINK_CLICKS": ["IMPRESSIONS"],
        "IMPRESSIONS": ["IMPRESSIONS"],
        "REACH": ["IMPRESSIONS"]
      },
      "requires_pixel": false,
      "launcher_support": false
    }
  ]
}
```

**Launcher Implementation**:
- ✅ Website traffic supported
- ❌ Messaging apps traffic (future)
- Requires redirection URL
- Pixel recommended for tracking

---

### 💬 ENGAGEMENT

```json
{
  "objective": "OUTCOME_ENGAGEMENT",
  "scenarios": [
    {
      "subtype": "POST_ENGAGEMENT",
      "label": "Engagement publication",
      "destination_type": "FACEBOOK",
      "default_optimization_goal": "POST_ENGAGEMENT",
      "allowed_optimization_goals": ["POST_ENGAGEMENT", "IMPRESSIONS", "REACH", "LINK_CLICKS"],
      "billing_event_by_optimization": {
        "POST_ENGAGEMENT": ["IMPRESSIONS"],
        "IMPRESSIONS": ["IMPRESSIONS"],
        "REACH": ["IMPRESSIONS"],
        "LINK_CLICKS": ["LINK_CLICKS", "IMPRESSIONS"]
      },
      "requires_pixel": false,
      "launcher_support": false
    },
    {
      "subtype": "PAGE_LIKES",
      "label": "Likes Page",
      "destination_type": "FACEBOOK",
      "default_optimization_goal": "PAGE_LIKES",
      "allowed_optimization_goals": ["PAGE_LIKES", "IMPRESSIONS"],
      "billing_event_by_optimization": {
        "PAGE_LIKES": ["IMPRESSIONS"],
        "IMPRESSIONS": ["IMPRESSIONS"]
      },
      "requires_pixel": false,
      "launcher_support": false
    },
    {
      "subtype": "EVENT_RESPONSES",
      "label": "Réponses à événements",
      "destination_type": "FACEBOOK",
      "default_optimization_goal": "EVENT_RESPONSES",
      "allowed_optimization_goals": ["EVENT_RESPONSES", "IMPRESSIONS", "REACH"],
      "billing_event_by_optimization": {
        "EVENT_RESPONSES": ["IMPRESSIONS"],
        "IMPRESSIONS": ["IMPRESSIONS"],
        "REACH": ["IMPRESSIONS"]
      },
      "requires_pixel": false,
      "launcher_support": false
    },
    {
      "subtype": "VIDEO_VIEWS",
      "label": "Vues vidéo",
      "destination_type": ["FACEBOOK", "INSTAGRAM"],
      "default_optimization_goal": "THRUPLAY",
      "allowed_optimization_goals": [
        "THRUPLAY",
        "VIDEO_VIEWS",
        "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS"
      ],
      "billing_event_by_optimization": {
        "THRUPLAY": ["IMPRESSIONS", "THRUPLAY"],
        "VIDEO_VIEWS": ["IMPRESSIONS", "VIDEO_VIEWS"],
        "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS": ["IMPRESSIONS", "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS"]
      },
      "requires_pixel": false,
      "launcher_support": false
    }
  ]
}
```

**Launcher Implementation**:
- ❌ Not yet supported (future roadmap)
- Requires post/page/event selection
- Video requires video creative

---

### 📝 LEADS

```json
{
  "objective": "OUTCOME_LEADS",
  "scenarios": [
    {
      "label": "Lead Form (Instant Form)",
      "destination_mode": "LEAD_FORM",
      "destination_type": "ON_AD",
      "default_optimization_goal": "LEAD_GENERATION",
      "allowed_optimization_goals": ["LEAD_GENERATION"],
      "billing_event_by_optimization": {
        "LEAD_GENERATION": ["IMPRESSIONS"]
      },
      "requires_pixel": false,
      "requires_lead_form": true,
      "launcher_support": true
    },
    {
      "label": "Leads via Messages",
      "destination_type": ["MESSENGER", "WHATSAPP"],
      "default_optimization_goal": "LEAD_GENERATION",
      "allowed_optimization_goals": ["LEAD_GENERATION"],
      "billing_event_by_optimization": {
        "LEAD_GENERATION": ["IMPRESSIONS"]
      },
      "requires_pixel": false,
      "launcher_support": false
    }
  ]
}
```

**Launcher Implementation**:
- ✅ Lead Form supported
- ❌ Messaging leads (future)
- No pixel required (native Facebook form)
- Requires lead form ID

---

### 📱 APP_PROMOTION

```json
{
  "objective": "OUTCOME_APP_PROMOTION",
  "scenarios": [
    {
      "label": "App Install",
      "destination_type": "APP",
      "default_optimization_goal": "APP_INSTALLS",
      "allowed_optimization_goals": ["APP_INSTALLS", "OFFSITE_CONVERSIONS", "VALUE", "LINK_CLICKS"],
      "billing_event_by_optimization": {
        "APP_INSTALLS": ["IMPRESSIONS"],
        "OFFSITE_CONVERSIONS": ["IMPRESSIONS"],
        "VALUE": ["IMPRESSIONS"],
        "LINK_CLICKS": ["LINK_CLICKS", "IMPRESSIONS"]
      },
      "requires_pixel": false,
      "requires_app_id": true,
      "launcher_support": false
    }
  ]
}
```

**Launcher Implementation**:
- ❌ Not yet supported (future)
- Requires app store ID
- Requires app event tracking setup

---

### 💰 SALES

```json
{
  "objective": "OUTCOME_SALES",
  "scenarios": [
    {
      "label": "Conversions site",
      "destination_type": "WEBSITE",
      "default_optimization_goal": "OFFSITE_CONVERSIONS",
      "allowed_optimization_goals": ["OFFSITE_CONVERSIONS", "VALUE", "LINK_CLICKS"],
      "billing_event_by_optimization": {
        "OFFSITE_CONVERSIONS": ["IMPRESSIONS"],
        "VALUE": ["IMPRESSIONS"],
        "LINK_CLICKS": ["LINK_CLICKS", "IMPRESSIONS"]
      },
      "requires_pixel": true,
      "requires_url": true,
      "requires_conversion_event": true,
      "launcher_support": false
    },
    {
      "label": "Advantage+ Shopping",
      "destination_type": "SHOP_AUTOMATIC",
      "default_optimization_goal": "OFFSITE_CONVERSIONS",
      "allowed_optimization_goals": ["OFFSITE_CONVERSIONS", "VALUE"],
      "billing_event_by_optimization": {
        "OFFSITE_CONVERSIONS": ["IMPRESSIONS"],
        "VALUE": ["IMPRESSIONS"]
      },
      "requires_pixel": true,
      "requires_catalog": true,
      "launcher_support": false
    }
  ]
}
```

**Launcher Implementation**:
- ❌ Not yet supported (requires pixel events)
- Requires pixel with conversion tracking
- Advantage+ Shopping requires product catalog

---

## 8. Implementation Notes

### Current Launcher Support (Phase 1)

✅ **Fully Supported**:
1. **AWARENESS** (no redirection)
   - Optimization: REACH, IMPRESSIONS, AD_RECALL_LIFT
   - No pixel required

2. **TRAFFIC to Website**
   - Optimization: LINK_CLICKS, LANDING_PAGE_VIEWS, IMPRESSIONS, REACH
   - Requires URL
   - Pixel optional (for tracking)

3. **LEADS via Lead Form**
   - Optimization: LEAD_GENERATION only
   - Requires lead form ID
   - No pixel required

### Future Roadmap (Phase 2+)

❌ **Not Yet Supported**:
- ENGAGEMENT (post, page, event, video)
- TRAFFIC to messaging apps (Messenger, WhatsApp, Instagram)
- LEADS via messaging apps
- APP_PROMOTION
- SALES (requires pixel conversion events)

### Key Validation Rules

1. **Pixel is ONLY required for**:
   - TRAFFIC to website (optional, for tracking)
   - SALES conversions (required)

2. **Pixel is NOT required for**:
   - AWARENESS
   - LEADS (lead form)
   - APP_PROMOTION

3. **Redirection URL required for**:
   - TRAFFIC to WEBSITE
   - SALES to WEBSITE

4. **No URL required for**:
   - AWARENESS (no destination)
   - LEADS (ON_AD form)
   - ENGAGEMENT (Facebook/Instagram content)

### Default Values by Objective

| Objective | Default Optimization Goal | Default Billing Event |
|-----------|---------------------------|----------------------|
| AWARENESS | REACH | IMPRESSIONS |
| TRAFFIC | LINK_CLICKS | LINK_CLICKS or IMPRESSIONS |
| ENGAGEMENT | POST_ENGAGEMENT | IMPRESSIONS |
| LEADS | LEAD_GENERATION | IMPRESSIONS |
| APP_PROMOTION | APP_INSTALLS | IMPRESSIONS |
| SALES | OFFSITE_CONVERSIONS | IMPRESSIONS |

---

## Related Documentation

- [OPTIMIZATION_GOALS_MAPPING.md](./OPTIMIZATION_GOALS_MAPPING.md) - Full mapping with bid strategies
- [Facebook Marketing API Docs](https://developers.facebook.com/docs/marketing-apis)
- [Campaign Structure Guide](https://www.facebook.com/business/help/1710077379209073)

---

**End of Document**
