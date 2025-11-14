import { api } from '../client'
import { z } from 'zod'

const NamingConventionSchema = z.object({
  id: z.string(),
  name: z.string(),
  template: z.string(),
  isDefault: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type NamingConvention = z.infer<typeof NamingConventionSchema>

export const conventionsAPI = {
  list: () => api.get('/naming-conventions', z.array(NamingConventionSchema)),

  get: (id: string) => api.get(`/naming-conventions/${id}`, NamingConventionSchema),

  create: (data: { name: string; template: string; isDefault?: boolean }) =>
    api.post('/naming-conventions', data, NamingConventionSchema),

  update: (id: string, data: Partial<NamingConvention>) =>
    api.put(`/naming-conventions/${id}`, data, NamingConventionSchema),

  delete: (id: string) => api.delete(`/naming-conventions/${id}`),

  setDefault: (id: string) =>
    api.post(`/naming-conventions/${id}/set-default`),
}
