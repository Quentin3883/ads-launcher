'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check } from 'lucide-react'

interface UrlParamsModalProps {
  open: boolean
  onClose: () => void
  urlParams: string
  onSave: (params: string) => void
}

interface ParsedParam {
  key: string
  value: string
}

export function UrlParamsModal({ open, onClose, urlParams, onSave }: UrlParamsModalProps) {
  const [params, setParams] = useState<ParsedParam[]>([])
  const [rawMode, setRawMode] = useState(false)
  const [rawValue, setRawValue] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      parseParams(urlParams)
      setRawValue(urlParams)
    }
  }, [open, urlParams])

  const parseParams = (paramString: string) => {
    if (!paramString) {
      setParams([])
      return
    }

    const parsed: ParsedParam[] = paramString.split('&').map((param) => {
      const [key, value] = param.split('=')
      return { key: key || '', value: value || '' }
    })

    setParams(parsed)
  }

  const buildParamString = (paramList: ParsedParam[]) => {
    return paramList
      .filter((p) => p.key.trim())
      .map((p) => `${p.key}=${p.value}`)
      .join('&')
  }

  const handleParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...params]
    newParams[index][field] = value
    setParams(newParams)
  }

  const handleAddParam = () => {
    setParams([...params, { key: '', value: '' }])
  }

  const handleRemoveParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    const paramString = rawMode ? rawValue : buildParamString(params)
    onSave(paramString)
    onClose()
  }

  const handleCopy = () => {
    const paramString = rawMode ? rawValue : buildParamString(params)
    navigator.clipboard.writeText(paramString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRawModeChange = () => {
    if (!rawMode) {
      // Switching to raw mode
      setRawValue(buildParamString(params))
    } else {
      // Switching to table mode
      parseParams(rawValue)
    }
    setRawMode(!rawMode)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[85vh] bg-card rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold text-foreground">URL Parameters</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure tracking parameters for your ads
            </p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            type="button"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 py-3 border-b border-border bg-background flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => !rawMode && handleRawModeChange()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !rawMode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => rawMode && handleRawModeChange()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                rawMode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Raw View
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {rawMode ? (
            <div>
              <textarea
                value={rawValue}
                onChange={(e) => setRawValue(e.target.value)}
                placeholder="visuel={{ad.name}}&utm_source=facebook&..."
                className="w-full h-64 px-4 py-3 rounded-lg border border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Parameters should be in format: key1=value1&key2=value2
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                <div className="col-span-5">Parameter Name</div>
                <div className="col-span-6">Value</div>
                <div className="col-span-1"></div>
              </div>

              {params.map((param, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                      placeholder="utm_source"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                      placeholder="facebook or {{ad.name}}"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => handleRemoveParam(index)}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddParam}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                type="button"
              >
                + Add Parameter
              </button>

              {/* Available Variables */}
              <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Available Variables</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="font-mono bg-background px-2 py-1 rounded">
                    {'{{ad.name}}'}
                  </div>
                  <div className="font-mono bg-background px-2 py-1 rounded">
                    {'{{campaign.name}}'}
                  </div>
                  <div className="font-mono bg-background px-2 py-1 rounded">
                    {'{{adset.name}}'}
                  </div>
                  <div className="font-mono bg-background px-2 py-1 rounded">
                    {'{{campaign.id}}'}
                  </div>
                  <div className="font-mono bg-background px-2 py-1 rounded">
                    {'{{adset.id}}'}
                  </div>
                  <div className="font-mono bg-background px-2 py-1 rounded">
                    {'{{ad.id}}'}
                  </div>
                  <div className="font-mono bg-background px-2 py-1 rounded">
                    {'{{site_source_name}}'}
                  </div>
                  <div className="font-mono bg-background px-2 py-1 rounded">
                    {'{{placement}}'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Parameters will be appended to your landing page URL
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              type="button"
            >
              Save Parameters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
