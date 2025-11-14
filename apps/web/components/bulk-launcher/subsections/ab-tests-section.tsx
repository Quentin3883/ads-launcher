'use client'

import { FormSection, ds } from '../ui'

export function ABTestsSection() {
  return (
    <FormSection title="A/B Testing">
      <div className={ds.cn('text-center py-8', ds.spacing.vertical.md)}>
        <p className={ds.cn(ds.typography.body, 'text-muted-foreground')}>
          A/B Testing - Coming soon
        </p>
      </div>
    </FormSection>
  )
}
