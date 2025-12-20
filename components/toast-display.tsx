"use client"

import { useToast } from '@/lib/toast-context'
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

export function ToastDisplay() {
    const { toasts, removeToast } = useToast()

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-600" />
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-600" />
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />
            case 'info':
                return <Info className="h-5 w-5 text-blue-600" />
            default:
                return null
        }
    }

    const getBackgroundColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200'
            case 'error':
                return 'bg-red-50 border-red-200'
            case 'warning':
                return 'bg-yellow-50 border-yellow-200'
            case 'info':
                return 'bg-blue-50 border-blue-200'
            default:
                return 'bg-slate-50 border-slate-200'
        }
    }

    const getTextColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'text-green-800'
            case 'error':
                return 'text-red-800'
            case 'warning':
                return 'text-yellow-800'
            case 'info':
                return 'text-blue-800'
            default:
                return 'text-slate-800'
        }
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 rounded-lg border p-4 ${getBackgroundColor(
                        toast.type
                    )} animate-in fade-in slide-in-from-bottom-4 duration-300`}
                >
                    {getIcon(toast.type)}
                    <p className={`flex-1 text-sm font-medium ${getTextColor(toast.type)}`}>
                        {toast.message}
                    </p>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
