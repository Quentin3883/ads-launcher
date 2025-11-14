# Phase 3: Component Refactoring Plan

**Date**: 2025-11-14
**Status**: 🔄 Planning
**Goal**: Split massive components into smaller, maintainable pieces

---

## 📊 Target Components

### Files to Refactor

| File | Lines | Priority | Complexity |
|------|-------|----------|------------|
| `creatives-bulk-step.tsx` | 857 | 🔴 High | Very High |
| `audiences-bulk-step.tsx` | 837 | 🔴 High | Very High |
| `campaign-config-step.tsx` | 827 | 🟡 Medium | High |

**Total**: 2,521 lines to refactor

---

## 🎯 Phase 3 Strategy

### Approach: Extract & Compose

Instead of trying to refactor all 3 massive files at once, we'll:

1. **Start with the most complex**: `creatives-bulk-step.tsx`
2. **Extract reusable patterns** that can be applied to the others
3. **Create a library** of composable components
4. **Apply patterns** to remaining files

This allows us to:
- ✅ Learn from the first refactoring
- ✅ Establish clear patterns
- ✅ Reduce risk of breaking changes
- ✅ Make subsequent refactorings faster

---

## 🔍 Analysis: creatives-bulk-step.tsx (857 lines)

### Current Structure

```
CreativesBulkStep (main component)
├── State (8 useState hooks)
├── Event Handlers (5 functions, ~200 lines)
│   ├── handleFileSelect() - File upload logic
│   ├── handleDrop() - Drag & drop
│   ├── handleAssignFile() - Assign file to slot
│   ├── handleAssignFromLibrary() - Library integration
│   └── handleAddEmptyCreative() - Add empty creative
├── JSX Rendering (~600 lines)
│   ├── Header with stats
│   ├── Upload area (drag & drop)
│   ├── Creatives list (massive loop)
│   │   ├── Creative card
│   │   ├── Feed/Story slots
│   │   ├── Copy variants
│   │   └── Actions
│   └── Global copy section
└── MediaLibraryModal
```

### Problems Identified

1. **Massive JSX** (~600 lines in return statement)
2. **Complex event handlers** (handleFileSelect has 75 lines)
3. **Deeply nested JSX** (5-6 levels deep)
4. **Duplicate logic** for Feed/Story slots
5. **No separation of concerns**
6. **Hard to test** (everything in one component)
7. **Poor readability** (too much scrolling)

---

## 🛠️ Refactoring Plan for creatives-bulk-step.tsx

### Step 1: Extract Custom Hooks

**Create**: `apps/web/components/bulk-launcher/hooks/`

#### 1.1 `use-creative-file-upload.ts`
**Purpose**: Handle file upload, drag & drop, file processing
**Lines extracted**: ~150

```typescript
export function useCreativeFileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (files: FileList | null) => { /* ... */ }
  const handleDrop = (e: React.DragEvent) => { /* ... */ }
  const handleAssignFile = (creativeId, type, file) => { /* ... */ }

  return {
    fileInputRef,
    dragOver,
    setDragOver,
    handleFileSelect,
    handleDrop,
    handleAssignFile,
  }
}
```

#### 1.2 `use-media-library.ts`
**Purpose**: Manage media library modal state
**Lines extracted**: ~50

```typescript
export function useMediaLibrary() {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [mediaLibraryType, setMediaLibraryType] = useState<'image' | 'video'>('video')
  const [targetCreativeId, setTargetCreativeId] = useState<string>()
  const [targetSlot, setTargetSlot] = useState<'feed' | 'story'>()

  const openMediaLibrary = (type, creativeId?, slot?) => { /* ... */ }
  const closeMediaLibrary = () => { /* ... */ }
  const handleAssignFromLibrary = (mediaUrl, thumbnail, format, type) => { /* ... */ }

  return {
    showMediaLibrary,
    mediaLibraryType,
    targetCreativeId,
    targetSlot,
    openMediaLibrary,
    closeMediaLibrary,
    handleAssignFromLibrary,
  }
}
```

### Step 2: Extract UI Components

**Create**: `apps/web/components/bulk-launcher/creatives/`

#### 2.1 `CreativeUploadArea.tsx`
**Purpose**: Drag & drop upload zone
**Lines extracted**: ~80

```tsx
interface CreativeUploadAreaProps {
  dragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (files: FileList | null) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}

export function CreativeUploadArea({ ... }: CreativeUploadAreaProps) {
  return (
    <div
      className={/* ... */}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Upload UI */}
    </div>
  )
}
```

#### 2.2 `CreativeCard.tsx`
**Purpose**: Individual creative item
**Lines extracted**: ~200

```tsx
interface CreativeCardProps {
  creative: Creative
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (updates: Partial<Creative>) => void
  onRemove: () => void
  onAssignFile: (type: 'feed' | 'story', file: File) => void
  onOpenLibrary: (type: 'image' | 'video', slot: 'feed' | 'story') => void
}

export function CreativeCard({ creative, ... }: CreativeCardProps) {
  return (
    <div className="creative-card">
      <CreativeHeader ... />
      <CreativeSlots ... />
      <CreativeCopyVariants ... />
    </div>
  )
}
```

#### 2.3 `CreativeSlot.tsx`
**Purpose**: Feed or Story media slot
**Lines extracted**: ~100 (reusable for both slots)

```tsx
interface CreativeSlotProps {
  slot: 'feed' | 'story'
  version?: CreativeVersion
  format: 'Image' | 'Video'
  onAssignFile: (file: File) => void
  onOpenLibrary: (type: 'image' | 'video') => void
  onRemove: () => void
}

export function CreativeSlot({ slot, version, ... }: CreativeSlotProps) {
  return (
    <div className="creative-slot">
      {/* Slot UI with preview, upload, library buttons */}
    </div>
  )
}
```

#### 2.4 `CreativeCopyVariants.tsx`
**Purpose**: Headline, primary text, CTA variants
**Lines extracted**: ~150

```tsx
interface CreativeCopyVariantsProps {
  creative: Creative
  onAddVariant: (field: string) => void
  onRemoveVariant: (field: string, index: number) => void
  onUpdateVariant: (field: string, index: number, value: string) => void
}

export function CreativeCopyVariants({ ... }: CreativeCopyVariantsProps) {
  return (
    <div className="copy-variants">
      <CopyVariantSection field="headline" ... />
      <CopyVariantSection field="primaryText" ... />
      <CopyVariantSection field="cta" ... />
    </div>
  )
}
```

#### 2.5 `GlobalCopySection.tsx`
**Purpose**: Global copy settings
**Lines extracted**: ~100

```tsx
interface GlobalCopySectionProps {
  globalCopy: typeof bulkCreatives
  onUpdateGlobalCopy: (field: string, value: any) => void
  onApplyToAll: () => void
}

export function GlobalCopySection({ ... }: GlobalCopySectionProps) {
  return (
    <FormSection title="Global Copy Settings">
      {/* Global headline, primary text, CTA */}
    </FormSection>
  )
}
```

### Step 3: Refactored Main Component

**Result**: `creatives-bulk-step.tsx` reduced to ~150 lines

```tsx
export function CreativesBulkStep() {
  const store = useBulkLauncher()
  const upload = useCreativeFileUpload()
  const mediaLibrary = useMediaLibrary()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const stats = store.getMatrixStats()

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <StatsHeader stats={stats} />

      {/* Upload area */}
      <CreativeUploadArea
        dragOver={upload.dragOver}
        onDragOver={(e) => { e.preventDefault(); upload.setDragOver(true) }}
        onDragLeave={() => upload.setDragOver(false)}
        onDrop={upload.handleDrop}
        onFileSelect={upload.handleFileSelect}
        fileInputRef={upload.fileInputRef}
      />

      {/* Creatives list */}
      <div className="space-y-4">
        {store.bulkCreatives.creatives.map((creative) => (
          <CreativeCard
            key={creative.id}
            creative={creative}
            isExpanded={expandedId === creative.id}
            onToggleExpand={() => setExpandedId(expandedId === creative.id ? null : creative.id)}
            onUpdate={(updates) => store.updateCreative(creative.id, updates)}
            onRemove={() => store.removeCreative(creative.id)}
            onAssignFile={(type, file) => upload.handleAssignFile(creative.id, type, file)}
            onOpenLibrary={(type, slot) => mediaLibrary.openMediaLibrary(type, creative.id, slot)}
          />
        ))}
      </div>

      {/* Global copy */}
      <GlobalCopySection
        globalCopy={store.bulkCreatives}
        onUpdateGlobalCopy={store.updateBulkCreatives}
        onApplyToAll={() => {/* apply logic */}}
      />

      {/* Media library modal */}
      <MediaLibraryModal
        open={mediaLibrary.showMediaLibrary}
        onClose={mediaLibrary.closeMediaLibrary}
        adAccountId={store.adAccountId!}
        type={mediaLibrary.mediaLibraryType}
        targetCreativeId={mediaLibrary.targetCreativeId}
        targetSlot={mediaLibrary.targetSlot}
        onAssign={mediaLibrary.handleAssignFromLibrary}
      />
    </div>
  )
}
```

---

## 📁 New File Structure

```
apps/web/components/bulk-launcher/
├── steps/
│   └── creatives-bulk-step.tsx (150 lines, down from 857)
├── creatives/ (NEW)
│   ├── CreativeUploadArea.tsx (80 lines)
│   ├── CreativeCard.tsx (200 lines)
│   ├── CreativeSlot.tsx (100 lines)
│   ├── CreativeCopyVariants.tsx (150 lines)
│   ├── GlobalCopySection.tsx (100 lines)
│   └── StatsHeader.tsx (50 lines)
├── hooks/ (NEW)
│   ├── use-creative-file-upload.ts (150 lines)
│   └── use-media-library.ts (50 lines)
```

**Before**: 1 file, 857 lines
**After**: 9 files, ~1,030 lines (includes new structure/types)
**Main component**: 857 → 150 lines (-82% complexity)

---

## 📊 Expected Benefits

### Code Quality
- ✅ **Readability**: Main component 150 lines (vs 857)
- ✅ **Maintainability**: Single responsibility components
- ✅ **Testability**: Each component/hook testable independently
- ✅ **Reusability**: Components can be used elsewhere

### Developer Experience
- ✅ **Faster navigation**: Find code in seconds
- ✅ **Easier debugging**: Isolated components
- ✅ **Better IDE support**: Smaller files = better autocomplete
- ✅ **Clearer git diffs**: Changes localized to specific files

### Performance
- ✅ **Better memoization**: Components can be React.memo'd
- ✅ **Selective re-renders**: Only changed components re-render
- ✅ **Code splitting**: Easier to lazy load if needed

---

## 🎯 Implementation Steps

### Phase 3.1: creatives-bulk-step.tsx (This session)
1. ✅ Create folders structure
2. ✅ Extract `use-creative-file-upload` hook
3. ✅ Extract `use-media-library` hook
4. ✅ Extract `CreativeUploadArea` component
5. ✅ Extract `CreativeSlot` component (reusable)
6. ✅ Extract `CreativeCard` component
7. ✅ Extract `CreativeCopyVariants` component
8. ✅ Extract `GlobalCopySection` component
9. ✅ Refactor main component to use extracted pieces
10. ✅ Test functionality
11. ✅ Commit changes

**Estimated time**: 4-5 hours

### Phase 3.2: audiences-bulk-step.tsx (Next session)
Apply similar patterns:
- Extract interest/behavior search components
- Extract location picker components
- Extract demographics components
- Extract placement components

**Estimated time**: 3-4 hours

### Phase 3.3: campaign-config-step.tsx (Next session)
Apply similar patterns:
- Extract budget/schedule components
- Extract objective selector
- Extract naming preview

**Estimated time**: 2-3 hours

---

## ⚠️ Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation**:
- Keep original file as backup
- Test each extraction thoroughly
- Commit after each successful extraction

### Risk 2: Props Drilling
**Mitigation**:
- Use Zustand store for shared state
- Pass only necessary props
- Create context if needed for deeply nested components

### Risk 3: Performance Regression
**Mitigation**:
- Use React.memo for expensive components
- Profile before/after with React DevTools
- Ensure no unnecessary re-renders

---

## 📋 Success Criteria

- [ ] Main component reduced to <200 lines
- [ ] Each extracted component <200 lines
- [ ] All functionality works identically
- [ ] TypeScript: 0 errors
- [ ] No console errors/warnings
- [ ] Clear component responsibilities
- [ ] Reusable components identified
- [ ] Documentation updated

---

## 🔄 Next Actions

**Ready to start?** Type "go" to begin Phase 3.1: Refactoring `creatives-bulk-step.tsx`

---

**Phase 3 Status**: 📋 Planned
**Complexity**: High
**Estimated Total Time**: 9-12 hours
**Expected Code Reduction**: -1,500 lines in main components
**Health Score Impact**: +0.5 to +1.0 points

🤖 Generated with [Claude Code](https://claude.com/claude-code)
