import { useEffect, useRef } from 'react'

export interface FieldValidation {
  name: string
  isValid: boolean
  ref?: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
}

/**
 * Hook pour gérer l'auto-focus et l'auto-jump entre les champs
 * Permet de guider l'utilisateur dans la complétion du formulaire
 */
export function useAutoFocus(fields: FieldValidation[], enabled: boolean = true) {
  const previousValidity = useRef<Record<string, boolean>>({})

  useEffect(() => {
    if (!enabled) return

    // Trouver le premier champ invalide
    const firstInvalidField = fields.find((field) => !field.isValid)

    if (!firstInvalidField) return

    // Si le champ précédent vient d'être validé, focus sur le suivant
    const currentIndex = fields.findIndex((f) => f.name === firstInvalidField.name)
    if (currentIndex > 0) {
      const previousField = fields[currentIndex - 1]
      const wasInvalid = previousValidity.current[previousField.name] === false
      const isNowValid = previousField.isValid

      if (wasInvalid && isNowValid && firstInvalidField.ref?.current) {
        // Small delay to ensure the UI has updated
        setTimeout(() => {
          firstInvalidField.ref?.current?.focus()
        }, 100)
      }
    }

    // Mettre à jour l'état précédent
    fields.forEach((field) => {
      previousValidity.current[field.name] = field.isValid
    })
  }, [fields, enabled])

  // Focus sur le premier champ invalide au montage
  useEffect(() => {
    if (!enabled) return

    const firstInvalidField = fields.find((field) => !field.isValid)
    if (firstInvalidField?.ref?.current) {
      setTimeout(() => {
        firstInvalidField.ref?.current?.focus()
      }, 300)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    getFirstInvalidField: () => fields.find((field) => !field.isValid),
    isAllValid: fields.every((field) => field.isValid),
    invalidCount: fields.filter((field) => !field.isValid).length,
  }
}
