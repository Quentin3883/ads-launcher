# Phase 3.2 Plan: audiences-bulk-step.tsx Refactoring

**Target File**: `apps/web/components/bulk-launcher/steps/audiences-bulk-step.tsx`
**Current Size**: 837 lines
**Target Size**: ~200 lines (76% reduction)
**Strategy**: Extract hooks for business logic + UI components

---

## Component Analysis

### Current Structure (837 lines)

**State Management** (~50 lines):
- `showBulkPaste`, `bulkPasteText`
- `newAudienceType`
- `selectedInterests`, `selectedGeoLocations`
- `lalSource`, `lalPercentages`
- `customAudienceId`
- `geoExpanded`, `placementsExpanded`

**Business Logic** (~150 lines):
- `handleAddAudience()` - 60 lines, audience creation logic
- `handleBulkPasteInterests()` - 25 lines
- `handleGeoToggle()` - 15 lines
- `handleLanguageToggle()` - 15 lines
- tRPC queries for pixel events
- Auto-set optimization event effect

**UI Sections** (~637 lines):
1. Header + Stats (15 lines)
2. Audience Builder (145 lines)
   - Type selector buttons (25 lines)
   - Interest form (40 lines)
   - Lookalike form (40 lines)
   - Custom audience form (30 lines)
   - Added audiences pills (25 lines)
3. Placement Presets (80 lines)
   - Quick selection buttons
   - Expandable advanced options
4. Geo Locations (115 lines)
   - Main autocomplete
   - Expandable by-type sections
5. Demographics (130 lines)
   - Age range dual slider (80 lines)
   - Gender selection (30 lines)
   - Languages dropdown (20 lines)
6. Optimization & Budget (152 lines)
   - Optimization event select
   - Budget input (ABO)
   - Pixel conversion event (100 lines)

---

## Extraction Plan

### 1. Custom Hook: `use-audience-builder.ts` (~120 lines)

**Purpose**: Manage audience creation state and handlers

**State**:
```typescript
- newAudienceType
- selectedInterests
- lalSource, lalPercentages
- customAudienceId
```

**Methods**:
```typescript
- handleAddAudience(type)
- resetAudienceForm()
- setters for each state
```

**Benefits**:
- Isolates complex audience creation logic
- Testable in isolation
- Reusable across different UIs

---

### 2. Component: `AudienceTypeSelector.tsx` (~60 lines)

**Purpose**: Quick add buttons for audience types

**Props**:
```typescript
interface AudienceTypeSelectorProps {
  selectedType: AudiencePresetType
  onSelectType: (type: AudiencePresetType) => void
  onQuickAddBroad: () => void
}
```

**Content**:
- BROAD, INTEREST, LOOKALIKE, CUSTOM_AUDIENCE buttons
- Auto-add Broad on click

---

### 3. Component: `AudienceForm.tsx` (~130 lines)

**Purpose**: Conditional forms for each audience type

**Props**:
```typescript
interface AudienceFormProps {
  type: AudiencePresetType
  // Interest props
  selectedInterests: Interest[]
  onAddInterest, onRemoveInterest
  // LAL props
  lalSource, lalPercentages
  onSetLalSource, onToggleLalPercentage
  // Custom props
  customAudienceId
  onSetCustomAudienceId
  // Action
  onAdd: () => void
  userId: string
}
```

**Content**:
- Interest autocomplete form
- Lookalike source + percentages form
- Custom audience ID form
- Conditional rendering based on type

---

### 4. Component: `PlacementSelector.tsx` (~90 lines)

**Purpose**: Placement presets with expandable advanced options

**Props**:
```typescript
interface PlacementSelectorProps {
  selectedPresets: PlacementPreset[]
  onTogglePreset: (preset: PlacementPreset) => void
}
```

**Content**:
- Quick selection buttons (ALL_PLACEMENTS, FEEDS_REELS, STORIES_ONLY)
- Expandable advanced options
  - By Platform (Facebook/Instagram)
  - By Placement Type (Feed/Reels)

---

### 5. Component: `DemographicsForm.tsx` (~150 lines)

**Purpose**: Age, gender, and language targeting

**Props**:
```typescript
interface DemographicsFormProps {
  ageMin: number
  ageMax: number
  gender: 'All' | 'Male' | 'Female'
  languages: string[]
  onUpdateAge: (min: number, max: number) => void
  onUpdateGender: (gender: string) => void
  onUpdateLanguages: (languages: string[]) => void
}
```

**Content**:
- Age range dual slider (80 lines)
- Gender pills (30 lines)
- Languages dropdown (20 lines)

**Key Feature**: Self-contained age slider with labels

---

### 6. Component: `OptimizationForm.tsx` (~100 lines)

**Purpose**: Optimization event, budget, and pixel conversion

**Props**:
```typescript
interface OptimizationFormProps {
  optimizationEvent: string
  availableEvents: string[]
  budgetType: 'daily' | 'lifetime'
  budgetPerAdSet: number
  isABO: boolean
  facebookPixelId?: string
  pixelEvents?: string[]
  customConversions?: any[]
  customEventStr?: string
  customConversionId?: string
  onUpdateOptimization: (updates: object) => void
}
```

**Content**:
- Optimization event select
- Budget input (conditional on ABO)
- Pixel conversion event dropdown (100 lines)

---

## Refactored Component Structure

```
AudiencesBulkStep (target: ~200 lines)
  ├── useAudienceBuilder() hook
  ├── tRPC queries
  ├── Header + Stats (15 lines)
  ├── <FormSection title="Audiences">
  │   ├── <AudienceTypeSelector />
  │   ├── <AudienceForm />
  │   └── Added audiences pills (25 lines)
  ├── <FormSection title="Placement Presets">
  │   └── <PlacementSelector />
  ├── <FormSection title="Geo Locations">
  │   └── <GeoLocationAutocomplete /> (already exists)
  ├── <FormSection title="Demographics">
  │   └── <DemographicsForm />
  └── <FormSection title="Optimization & Budget">
      └── <OptimizationForm />
```

---

## Code Reduction Targets

| Section | Before | After | Savings |
|---------|--------|-------|---------|
| **Hooks** | 0 | 120 | +120 |
| Audience Builder | 145 | 30 | -115 |
| Placement Selector | 80 | 10 | -70 |
| Demographics | 130 | 10 | -120 |
| Optimization | 152 | 10 | -142 |
| Geo (already extracted) | 115 | 115 | 0 |
| Header/Stats | 15 | 15 | 0 |
| Added pills | 25 | 25 | 0 |
| **Main Component** | **837** | **200** | **-637 (-76%)** |

**Total Extracted**: 1 hook (120 lines) + 5 components (480 lines) = 600 lines

---

## Technical Decisions

### 1. Age Slider Component
**Decision**: Extract entire age slider to DemographicsForm
**Rationale**: 80 lines of complex slider styling/logic
**Result**: Cleaner main component

### 2. Pixel Conversion Dropdown
**Decision**: Move 100-line pixel conversion dropdown to OptimizationForm
**Rationale**: Complex conditional rendering, optgroup logic
**Result**: OptimizationForm is self-contained

### 3. Audience Forms Pattern
**Decision**: Single AudienceForm component with conditional rendering
**Rationale**: All forms share similar structure, easier to maintain
**Alternative**: Separate components per type (more verbose)

### 4. Hook vs Component Split
**Decision**: Extract state/handlers to hook, UI to components
**Rationale**: Same pattern as Phase 3.1 (proven successful)

---

## Execution Order

1. ✅ Create `use-audience-builder.ts` hook
2. ✅ Create `AudienceTypeSelector.tsx`
3. ✅ Create `AudienceForm.tsx`
4. ✅ Create `PlacementSelector.tsx`
5. ✅ Create `DemographicsForm.tsx`
6. ✅ Create `OptimizationForm.tsx`
7. ✅ Refactor main component to use all pieces
8. ✅ Verify TypeScript 0 errors
9. ✅ Commit with detailed message

---

## Expected Results

- Main component: 837 → 200 lines (-76%)
- 1 custom hook created (120 lines)
- 5 UI components created (480 lines)
- 0 TypeScript errors
- All functionality preserved
- Better separation of concerns
- Easier to test each piece

**Project Health Score**: 9.2/10 → 9.5/10 (+0.3 points)

---

## Next: Phase 3.3

After completing Phase 3.2, move to:
- `matrix-generation-step.tsx` (834 lines)
- Similar extraction approach
