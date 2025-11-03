'use client'

interface BudgetSliderProps {
  firstCursor: number
  secondCursor: number
  onFirstCursorChange: (value: number) => void
  onSecondCursorChange: (value: number) => void
  labels: {
    first: string
    second: string
    third: string
  }
  colors: {
    first: string
    second: string
    third: string
  }
  cursorCount?: number // 0 = no cursors, 1 = first cursor only, 2 = both cursors
  percentages: {
    first: number
    second: number
    third: number
  }
}

export function BudgetSlider({
  firstCursor,
  secondCursor,
  onFirstCursorChange,
  onSecondCursorChange,
  labels,
  colors,
  cursorCount = 0,
  percentages,
}: BudgetSliderProps) {
  const firstPercentage = percentages.first
  const secondPercentage = percentages.second
  const thirdPercentage = percentages.third

  // Determine min/max for cursors based on cursor count
  const getFirstCursorLimits = () => {
    if (cursorCount === 1) {
      // For 2 active stages, allow 1% to 99%
      return { min: 1, max: 99 }
    }
    // For 3 active stages, first cursor limited by second cursor
    return { min: 1, max: secondCursor - 1 }
  }

  const getSecondCursorLimits = () => {
    // Second cursor only exists when cursorCount === 2 (3 active stages)
    return { min: firstCursor + 1, max: 99 }
  }

  return (
    <div className="border-b border-[#d9d8ce] bg-white px-6 py-3">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#151515]">Budget Distribution</h3>
          <div className="text-xs text-gray-600">Adjust allocation across funnel stages</div>
        </div>

        {/* Dual Handle Slider */}
        <div className="relative px-2 pb-2 pt-2">
          {/* Track */}
          <div className="relative h-1.5 bg-gray-200 rounded-full">
            {/* Show colored segments only if there are active stages */}
            {(firstPercentage > 0 || secondPercentage > 0 || thirdPercentage > 0) ? (
              <>
                {firstPercentage > 0 && (
                  <div
                    className="absolute left-0 h-full bg-blue-400 transition-all"
                    style={{
                      width: `${firstPercentage}%`,
                      borderRadius: secondPercentage === 0 && thirdPercentage === 0 ? '9999px' : '9999px 0 0 9999px'
                    }}
                  />
                )}
                {secondPercentage > 0 && (
                  <div
                    className="absolute h-full bg-purple-400 transition-all"
                    style={{
                      left: `${firstPercentage}%`,
                      width: `${secondPercentage}%`,
                      borderRadius: firstPercentage === 0 && thirdPercentage === 0 ? '9999px' :
                                    firstPercentage === 0 ? '9999px 0 0 9999px' :
                                    thirdPercentage === 0 ? '0 9999px 9999px 0' : '0'
                    }}
                  />
                )}
                {thirdPercentage > 0 && (
                  <div
                    className="absolute right-0 h-full bg-green-400 transition-all"
                    style={{
                      width: `${thirdPercentage}%`,
                      borderRadius: firstPercentage === 0 && secondPercentage === 0 ? '9999px' : '0 9999px 9999px 0'
                    }}
                  />
                )}
              </>
            ) : (
              /* Empty state - gray bar when no blocks */
              <div className="absolute left-0 h-full w-full bg-gray-300 rounded-full" />
            )}
          </div>

          {/* First Cursor (End of first section) - Only show if cursorCount >= 1 */}
          {cursorCount >= 1 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-grab active:cursor-grabbing z-30"
              style={{ left: `calc(${firstCursor}% - 10px)` }}
              onMouseDown={(e) => {
                e.preventDefault()
                const slider = e.currentTarget.parentElement
                if (!slider) return
                const rect = slider.getBoundingClientRect()

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const currentX = moveEvent.clientX - rect.left
                  let newPercentage = Math.round((currentX / rect.width) * 100)
                  const limits = getFirstCursorLimits()
                  newPercentage = Math.max(limits.min, Math.min(limits.max, newPercentage))
                  onFirstCursorChange(newPercentage)
                }

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove)
                  document.removeEventListener('mouseup', handleMouseUp)
                }

                document.addEventListener('mousemove', handleMouseMove)
                document.addEventListener('mouseup', handleMouseUp)
              }}
            />
          )}

          {/* Second Cursor (End of second section) - Only show if cursorCount >= 2 */}
          {cursorCount >= 2 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-purple-500 rounded-full shadow-md cursor-grab active:cursor-grabbing z-30"
              style={{ left: `calc(${secondCursor}% - 10px)` }}
              onMouseDown={(e) => {
                e.preventDefault()
                const slider = e.currentTarget.parentElement
                if (!slider) return
                const rect = slider.getBoundingClientRect()

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const currentX = moveEvent.clientX - rect.left
                  let newPercentage = Math.round((currentX / rect.width) * 100)
                  const limits = getSecondCursorLimits()
                  newPercentage = Math.max(limits.min, Math.min(limits.max, newPercentage))
                  onSecondCursorChange(newPercentage)
                }

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove)
                  document.removeEventListener('mouseup', handleMouseUp)
                }

                document.addEventListener('mousemove', handleMouseMove)
                document.addEventListener('mouseup', handleMouseUp)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
