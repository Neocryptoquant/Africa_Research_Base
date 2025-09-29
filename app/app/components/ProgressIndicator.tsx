"use client"

interface ProgressIndicatorProps {
  message: string;
}

export function ProgressIndicator({ message }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="flex items-center space-x-4">
          {/* Progress Icon */}
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-2">{message}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}