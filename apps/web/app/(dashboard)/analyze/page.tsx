'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'

interface VideoAd {
  id: number
  name: string
  videoUrl: string
  posterUrl: string
  stats: {
    impressions: string
    clicks: number
    ctr: string
    spend: string
  }
}

export default function AnalyzePage() {
  const [ads] = useState<VideoAd[]>([])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analyze</h1>
          <p className="text-sm text-gray-600 mt-1">
            Video ad performance analysis - Facebook Ads Library style
          </p>
        </div>
      </div>

      {/* Video Grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ad Analysis - Video Creatives
        </h2>

        {ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-gray-500">No ads to analyze yet</p>
            <p className="text-xs text-gray-400 mt-1">Launch campaigns to see performance data here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ads.map((ad) => (
              <VideoAdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VideoAdCard({ ad }: { ad: VideoAd }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">{ad.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">Facebook Video Embed</p>
      </div>

      {/* Facebook Video Iframe - S'adapte à la taille */}
      <div className="bg-black relative" style={{ paddingBottom: '178.28%' /* ratio 267:476 */ }}>
        <iframe
          src={ad.videoUrl}
          style={{
            border: 'none',
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
          scrolling="no"
          frameBorder="0"
          allowFullScreen={true}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        />
      </div>

      {/* Stats */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Impressions:</span>
            <span className="ml-1 font-semibold text-gray-900">{ad.stats.impressions}</span>
          </div>
          <div>
            <span className="text-gray-500">Clicks:</span>
            <span className="ml-1 font-semibold text-gray-900">{ad.stats.clicks}</span>
          </div>
          <div>
            <span className="text-gray-500">CTR:</span>
            <span className="ml-1 font-semibold text-green-600">{ad.stats.ctr}</span>
          </div>
          <div>
            <span className="text-gray-500">Spend:</span>
            <span className="ml-1 font-semibold text-gray-900">{ad.stats.spend}</span>
          </div>
        </div>
      </div>

      {/* CTA Button (Facebook style) */}
      <div className="p-3 border-t border-gray-200">
        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          Watch More
        </button>
      </div>
    </div>
  )
}
