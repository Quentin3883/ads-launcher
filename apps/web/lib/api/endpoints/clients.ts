import { api } from '../client'
import { z } from 'zod'

const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type Client = z.infer<typeof ClientSchema>

const ClientsArraySchema = z.array(ClientSchema)

const UploadLogoResponseSchema = z.object({
  logoUrl: z.string(),
})

export const clientsAPI = {
  list: () => api.get('/clients', ClientsArraySchema),

  get: (id: string) => api.get(`/clients/${id}`, ClientSchema),

  create: (data: { name: string; logoUrl?: string }) =>
    api.post('/clients', data, ClientSchema),

  update: (id: string, data: Partial<Client>) =>
    api.put(`/clients/${id}`, data, ClientSchema),

  delete: (id: string) => api.delete(`/clients/${id}`),

  uploadLogo: async (clientId: string, formData: FormData) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}/upload-logo`,
      {
        method: 'POST',
        body: formData,
      }
    )
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }
    const data = await response.json()
    return UploadLogoResponseSchema.parse(data)
  },
}
