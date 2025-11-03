'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Globe,
  Mail,
  X,
  Upload,
  Search,
} from 'lucide-react'

interface Contact {
  id?: string
  firstName: string
  lastName: string
  name?: string // For backend compatibility
  email: string
  phone?: string
  position?: string
  isPrimary?: boolean
}

interface AdAccount {
  id: string
  facebookId: string
  name: string
  currency: string
  accountStatus: string
  clientId?: string | null
}

interface Client {
  id: string
  name: string
  industry?: string
  website?: string
  logoUrl?: string
  notes?: string
  isActive: boolean
  createdAt: string
  contacts?: Contact[]
  adAccounts?: AdAccount[]
  _count?: {
    adAccounts: number
    contacts: number
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    notes: '',
  })
  const [contacts, setContacts] = useState<Contact[]>([])
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [allAdAccounts, setAllAdAccounts] = useState<AdAccount[]>([])
  const [selectedAdAccounts, setSelectedAdAccounts] = useState<string[]>([])
  const [adAccountSearchQuery, setAdAccountSearchQuery] = useState('')

  useEffect(() => {
    fetchClients()
    fetchAdAccounts()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients`,
      )
      const data = await response.json()
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAdAccounts = async () => {
    try {
      const userId = localStorage.getItem('facebook_user_id')
      if (!userId) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/facebook/admin/accounts/${userId}`,
      )
      const data = await response.json()

      if (!data.error && Array.isArray(data)) {
        setAllAdAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching ad accounts:', error)
      setAllAdAccounts([])
    }
  }

  const linkAdAccountsToClient = async (clientId: string, adAccountIds: string[]) => {
    try {
      // Link selected ad accounts
      for (const adAccountId of adAccountIds) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/facebook/admin/ad-accounts/${adAccountId}/link-client`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clientId }),
          },
        )
      }

      // Refresh clients and ad accounts
      await fetchClients()
      await fetchAdAccounts()
    } catch (error) {
      console.error('Error linking ad accounts:', error)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async (clientId: string) => {
    if (!logoFile) return null

    const formData = new FormData()
    formData.append('logo', logoFile)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}/upload-logo`,
        {
          method: 'POST',
          body: formData,
        },
      )

      if (response.ok) {
        const data = await response.json()
        return data.logoUrl
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Filter out empty contacts and combine firstName + lastName
    const validContacts = contacts
      .filter((c) => c.firstName && c.lastName && c.email)
      .map((c) => ({
        name: `${c.firstName} ${c.lastName}`.trim(),
        email: c.email,
        phone: c.phone,
        position: c.position,
        isPrimary: c.isPrimary,
      }))

    try {
      const url = editingClient
        ? `${process.env.NEXT_PUBLIC_API_URL}/clients/${editingClient.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/clients`

      const method = editingClient ? 'PUT' : 'POST'

      const payload = editingClient
        ? formData
        : { ...formData, contacts: validContacts }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const savedClient = await response.json()

        // Upload logo if there's one
        if (logoFile) {
          await uploadLogo(savedClient.id)
        }

        // Link ad accounts if editing client
        if (editingClient && selectedAdAccounts.length > 0) {
          await linkAdAccountsToClient(savedClient.id, selectedAdAccounts)
        }

        await fetchClients()
        handleCloseModal()
      }
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`,
        {
          method: 'DELETE',
        },
      )

      if (response.ok) {
        await fetchClients()
      }
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setFormData({
        name: client.name,
        website: client.website || '',
        notes: client.notes || '',
      })
      setLogoPreview(client.logoUrl || null)
      setContacts(
        client.contacts && client.contacts.length > 0
          ? client.contacts.map((c) => {
              const nameParts = c.name?.split(' ') || []
              return {
                ...c,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
              }
            })
          : [],
      )
      // Set selected ad accounts for this client
      setSelectedAdAccounts(
        client.adAccounts?.map((a) => a.facebookId) || []
      )
    } else {
      setEditingClient(null)
      setFormData({
        name: '',
        website: '',
        notes: '',
      })
      setLogoPreview(null)
      setContacts([])
      setSelectedAdAccounts([])
    }
    setLogoFile(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingClient(null)
    setFormData({
      name: '',
      website: '',
      notes: '',
    })
    setContacts([])
    setLogoFile(null)
    setLogoPreview(null)
    setSelectedAdAccounts([])
    setAdAccountSearchQuery('')
  }

  const addContact = () => {
    setContacts([
      ...contacts,
      {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        isPrimary: false,
      },
    ])
  }

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index))
  }

  const updateContact = (
    index: number,
    field: keyof Contact,
    value: string,
  ) => {
    const newContacts = [...contacts]
    newContacts[index] = { ...newContacts[index], [field]: value }
    setContacts(newContacts)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#151515]">Clients</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos entreprises clientes et leurs contacts
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau Client
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-lg border border-[#d9d8ce] p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden p-1.5">
                  {client.logoUrl ? (
                    <img
                      src={client.logoUrl}
                      alt={client.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Users className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#151515]">
                    {client.name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenModal(client)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {client.website && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4" />
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:text-blue-600"
                  >
                    {client.website}
                  </a>
                </div>
              )}
              {client.contacts && client.contacts.length > 0 && (
                <div className="space-y-1">
                  {client.contacts.slice(0, 2).map((contact, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  ))}
                  {client.contacts.length > 2 && (
                    <p className="text-xs text-gray-500 ml-6">
                      +{client.contacts.length - 2} autres contacts
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {client._count?.adAccounts || 0} compte(s) pub
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {client.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border border-[#d9d8ce]">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#151515] mb-2">
            Aucun client
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre premier client pour commencer
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Créer un Client
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#151515]">
                {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  Informations de l'entreprise
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo
                  </label>
                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <div className="w-16 h-16 rounded-lg border border-[#d9d8ce] overflow-hidden flex items-center justify-center bg-gray-50">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border border-[#d9d8ce] rounded-lg hover:bg-gray-50 transition-colors">
                        <Upload className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          {logoFile
                            ? logoFile.name
                            : logoPreview
                              ? 'Changer le logo'
                              : 'Télécharger un logo'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notes internes..."
                  />
                </div>
              </div>

              {/* Ad Accounts */}
              {editingClient && allAdAccounts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase">
                    Comptes Publicitaires
                  </h3>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={adAccountSearchQuery}
                      onChange={(e) => setAdAccountSearchQuery(e.target.value)}
                      placeholder="Rechercher un compte publicitaire..."
                      className="w-full pl-10 pr-3 py-2 border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allAdAccounts
                      .filter((account) => {
                        if (!adAccountSearchQuery) return true
                        const query = adAccountSearchQuery.toLowerCase()
                        return (
                          account.name.toLowerCase().includes(query) ||
                          account.facebookId.toLowerCase().includes(query) ||
                          account.currency.toLowerCase().includes(query)
                        )
                      })
                      .map((account) => (
                        <label
                          key={account.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAdAccounts.includes(account.facebookId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAdAccounts([...selectedAdAccounts, account.facebookId])
                              } else {
                                setSelectedAdAccounts(
                                  selectedAdAccounts.filter((id) => id !== account.facebookId),
                                )
                              }
                            }}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-[#151515] truncate">
                              {account.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {account.facebookId} • {account.currency}
                            </div>
                          </div>
                        </label>
                      ))}
                    {allAdAccounts.filter((account) => {
                      if (!adAccountSearchQuery) return true
                      const query = adAccountSearchQuery.toLowerCase()
                      return (
                        account.name.toLowerCase().includes(query) ||
                        account.facebookId.toLowerCase().includes(query) ||
                        account.currency.toLowerCase().includes(query)
                      )
                    }).length === 0 && (
                      <div className="text-center py-6 text-sm text-gray-500">
                        Aucun compte trouvé
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contacts */}
              {!editingClient && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase">
                      Contacts
                    </h3>
                    <button
                      type="button"
                      onClick={addContact}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter un contact
                    </button>
                  </div>

                  {contacts.map((contact, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Contact {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={contact.firstName}
                          onChange={(e) =>
                            updateContact(index, 'firstName', e.target.value)
                          }
                          className="px-3 py-2 border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Prénom *"
                        />
                        <input
                          type="text"
                          value={contact.lastName}
                          onChange={(e) =>
                            updateContact(index, 'lastName', e.target.value)
                          }
                          className="px-3 py-2 border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nom *"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={contact.position || ''}
                          onChange={(e) =>
                            updateContact(index, 'position', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Poste"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) =>
                            updateContact(index, 'email', e.target.value)
                          }
                          className="px-3 py-2 border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Email *"
                          required
                        />
                        <input
                          type="tel"
                          value={contact.phone || ''}
                          onChange={(e) =>
                            updateContact(index, 'phone', e.target.value)
                          }
                          className="px-3 py-2 border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Téléphone"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingClient ? 'Mettre à jour' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-[#d9d8ce] rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
