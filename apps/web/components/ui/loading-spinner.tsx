interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  fullScreen = true
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  const spinner = (
    <div className="text-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-[#151515] mx-auto mb-4 ${sizeClasses[size]}`}
      />
      <p className="text-gray-600">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#edece5]">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  )
}
