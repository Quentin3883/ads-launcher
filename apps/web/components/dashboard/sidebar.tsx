'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Rocket,
  FileText,
  Settings,
  Search,
  Bell,
  ChevronRight,
  BookOpen,
  MessageCircle,
  Building2,
  Check,
  Target,
  Plug,
  BarChart3,
  Users,
  Terminal,
} from 'lucide-react'
import { cn } from '@launcher-ads/ui'
import { useClientsStore } from '@/lib/store/clients'

const mainNavigation = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Analyze', href: '/analyze', icon: Search },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Strategies', href: '/strategies', icon: Target },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Notifications', href: '/notifications', icon: Bell, disabled: true },
  { name: 'Launches', href: '/launches', icon: Rocket },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const otherNavigation = [
  { name: 'Debug Console', href: '/debug', icon: Terminal },
  { name: 'Documentation', href: '/docs', icon: BookOpen, disabled: true },
  { name: 'Templates', href: '/templates', icon: FileText, disabled: true },
  { name: 'Support', href: '/support', icon: MessageCircle, disabled: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { clients, selectedClientId, setSelectedClient, getSelectedClient, fetchClients } = useClientsStore()
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)

  const selectedClient = getSelectedClient()

  useEffect(() => {
    fetchClients()
  }, [])

  return (
    <aside className="relative w-[280px] bg-[#151515] border-r border-white/10"
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-7 w-7 items-center justify-center flex-shrink-0">
              <img src="/icon.png" alt="Pulza" className="h-7 w-7 object-contain" />
            </div>
            <span className="font-display text-lg font-bold text-white whitespace-nowrap">
              Pulza
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-9 pr-12 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-white/50 bg-white/10 border border-white/10 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
          <ul className="space-y-0.5">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <li key={item.name}>
                  <Link
                    href={item.disabled ? '#' : item.href}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white text-[#151515] shadow-sm'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                      item.disabled && 'cursor-not-allowed opacity-40'
                    )}
                    onClick={(e) => item.disabled && e.preventDefault()}
                  >
                    <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {item.name}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* OTHER Section */}
          <div>
                <p className="px-3 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                  Other
                </p>
                <ul className="space-y-0.5">
                  {otherNavigation.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                      <li key={item.name}>
                        <Link
                          href={item.disabled ? '#' : item.href}
                          className={cn(
                            'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                            isActive
                              ? 'bg-white text-[#151515] shadow-sm'
                              : 'text-white/70 hover:bg-white/10 hover:text-white',
                            item.disabled && 'cursor-not-allowed opacity-40'
                          )}
                          onClick={(e) => item.disabled && e.preventDefault()}
                        >
                          <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                          <span className="whitespace-nowrap">{item.name}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
        </nav>

        {/* Client Selector */}
        <div className="px-4 pb-4 border-t border-white/10 pt-4">
          <div className="relative">
            <button
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              className="w-full flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group px-4 py-3"
            >
              {selectedClient ? (
                <>
                  <div className="h-8 w-8 rounded-lg flex-shrink-0 bg-white flex items-center justify-center overflow-hidden p-1">
                    {selectedClient.logoUrl ? (
                      <img
                        src={selectedClient.logoUrl}
                        alt={selectedClient.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-white truncate">{selectedClient.name}</p>
                    <p className="text-xs text-white/60 truncate">Client selected</p>
                  </div>
                  <ChevronRight className={cn(
                    'h-4 w-4 text-white/60 transition-transform',
                    isClientDropdownOpen && 'rotate-90'
                  )} />
                </>
              ) : (
                <>
                  <Building2 className="h-8 w-8 text-white/60" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-white truncate">All Clients</p>
                    <p className="text-xs text-white/60 truncate">Overview mode</p>
                  </div>
                  <ChevronRight className={cn(
                    'h-4 w-4 text-white/60 transition-transform',
                    isClientDropdownOpen && 'rotate-90'
                  )} />
                </>
              )}
            </button>

              {/* Dropdown */}
                {isClientDropdownOpen && (
                  <div
                    className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                  >
                      <div className="p-2 max-h-64 overflow-y-auto">
                        {/* All Clients Option */}
                        <button
                          onClick={() => {
                            setSelectedClient(null)
                            setIsClientDropdownOpen(false)
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                            !selectedClientId ? 'bg-white text-[#151515]' : 'text-white/70 hover:bg-white/10'
                          )}
                        >
                          <Building2 className="h-5 w-5" />
                          <span className="text-sm font-medium">All Clients</span>
                          {!selectedClientId && <Check className="ml-auto h-4 w-4" />}
                        </button>

                        <div className="my-2 h-px bg-white/10" />

                        {/* Client List */}
                        {clients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => {
                              setSelectedClient(client.id)
                              setIsClientDropdownOpen(false)
                            }}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                              selectedClientId === client.id ? 'bg-white text-[#151515]' : 'text-white/70 hover:bg-white/10'
                            )}
                          >
                            <div className="h-5 w-5 rounded bg-white flex items-center justify-center overflow-hidden p-0.5">
                              {client.logoUrl ? (
                                <img
                                  src={client.logoUrl}
                                  alt={client.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Building2 className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                            <span className="text-sm font-medium truncate flex-1 text-left">{client.name}</span>
                            {selectedClientId === client.id && <Check className="ml-auto h-4 w-4 flex-shrink-0" />}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

        {/* Footer - User Profile */}
        <div className="border-t border-white/10 p-4">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-white to-white/90 text-sm font-semibold text-[#151515] flex-shrink-0">
              Q
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-white truncate">Quentin V.</p>
              <p className="text-xs text-white/60 truncate">quentin@pulza.io</p>
            </div>
            <ChevronRight className="h-4 w-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </aside>
  )
}
