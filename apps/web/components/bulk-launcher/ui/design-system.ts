/**
 * Design System pour Bulk Launcher Modal
 * Tailles, espacements, couleurs standardisés
 */

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Titres
  pageTitle: 'text-xl font-bold',          // 20px - Titre principal de step
  sectionTitle: 'text-base font-semibold', // 16px - Titre de section
  cardTitle: 'text-sm font-semibold',      // 14px - Titre de card

  // Labels
  label: 'text-sm font-medium',            // 14px - Labels de champs

  // Body text
  body: 'text-sm',                         // 14px - Texte normal
  bodyLarge: 'text-base',                  // 16px - Texte emphasized

  // Small text
  caption: 'text-xs',                      // 12px - Descriptions, hints
  micro: 'text-[10px]',                    // 10px - Badges, tiny labels

  // Input text
  input: 'text-sm',                        // 14px - Texte dans les inputs
  placeholder: 'text-sm text-muted-foreground', // 14px - Placeholders
} as const

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  // Gaps entre éléments
  gap: {
    xs: 'gap-2',   // 8px
    sm: 'gap-3',   // 12px
    md: 'gap-4',   // 16px
    lg: 'gap-6',   // 24px
    xl: 'gap-8',   // 32px
  },

  // Spacing vertical
  vertical: {
    xs: 'space-y-2', // 8px
    sm: 'space-y-3', // 12px
    md: 'space-y-4', // 16px
    lg: 'space-y-6', // 24px
    xl: 'space-y-8', // 32px
  },

  // Padding
  padding: {
    xs: 'p-2',     // 8px
    sm: 'p-3',     // 12px
    md: 'p-4',     // 16px
    lg: 'p-6',     // 24px
    xl: 'p-8',     // 32px
  },

  // Padding vertical (inputs)
  paddingY: {
    compact: 'py-2',    // 8px
    default: 'py-2.5',  // 10px
    comfortable: 'py-3', // 12px
  },

  // Padding horizontal (inputs)
  paddingX: {
    default: 'px-4',    // 16px
    compact: 'px-3',    // 12px
  },
} as const

// ============================================================================
// BORDERS & RADIUS
// ============================================================================

export const borders = {
  radius: {
    sm: 'rounded',      // 4px
    md: 'rounded-lg',   // 8px
    lg: 'rounded-xl',   // 12px
    full: 'rounded-full',
  },

  width: {
    default: 'border',
    thick: 'border-2',
  },
} as const

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow',
  lg: 'shadow-lg',
  none: 'shadow-none',
} as const

// ============================================================================
// COLORS (Semantic)
// ============================================================================

export const colors = {
  badge: {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300',
  },

  icon: {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    pink: 'bg-pink-100 text-pink-600',
  },
} as const

// ============================================================================
// COMPONENT HEIGHTS
// ============================================================================

export const heights = {
  input: {
    compact: 'h-10',    // 40px
    default: 'h-11',    // 44px
    large: 'h-12',      // 48px
  },

  button: {
    sm: 'h-8',          // 32px
    md: 'h-10',         // 40px
    lg: 'h-11',         // 44px
  },
} as const

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  default: 'transition-all duration-200',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-300',
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Combine plusieurs classes du design system
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Get badge color classes
 */
export function getBadgeColor(color: keyof typeof colors.badge = 'blue'): string {
  return colors.badge[color]
}

/**
 * Get icon color classes
 */
export function getIconColor(color: keyof typeof colors.icon = 'blue'): string {
  return colors.icon[color]
}

// ============================================================================
// COMPONENT PRESETS
// ============================================================================

export const componentPresets = {
  // Input standard
  input: cn(
    'w-full',
    spacing.paddingX.default,
    spacing.paddingY.default,
    borders.radius.md,
    'border border-border bg-background',
    typography.input,
    'text-foreground placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
    transitions.default
  ),

  // Select standard
  select: cn(
    'w-full',
    spacing.paddingX.default,
    spacing.paddingY.default,
    borders.radius.md,
    'border border-border bg-background',
    typography.input,
    'text-foreground',
    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
    'cursor-pointer',
    transitions.default
  ),

  // Button standard
  button: cn(
    spacing.paddingX.default,
    'py-2',
    borders.radius.md,
    typography.body,
    'font-medium',
    transitions.default
  ),

  // Card/Section standard
  card: cn(
    borders.radius.md,
    'border border-border bg-card',
    spacing.padding.md,
    spacing.vertical.md
  ),

  // Badge standard
  badge: cn(
    'inline-flex items-center',
    'px-2 py-0.5',
    borders.radius.sm,
    typography.micro,
    'font-medium'
  ),

  // Label standard
  label: cn(
    'block',
    typography.label,
    'text-foreground'
  ),

  // Hint/Caption standard
  hint: cn(
    typography.caption,
    'text-muted-foreground'
  ),
} as const

// Export tout pour usage facile
export const ds = {
  typography,
  spacing,
  borders,
  shadows,
  colors,
  heights,
  transitions,
  componentPresets,
  cn,
  getBadgeColor,
  getIconColor,
} as const

export default ds
