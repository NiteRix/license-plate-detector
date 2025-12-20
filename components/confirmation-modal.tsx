"use client"

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'

export interface ConfirmationModalProps {
    isOpen: boolean
    title: string
    description: string
    message?: string
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
    isLoading?: boolean
    onConfirm: () => Promise<void> | void
    onCancel: () => void
}

export function ConfirmationModal({
    isOpen,
    title,
    description,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false,
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmationModalProps) {
    const [error, setError] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleConfirm = async () => {
        try {
            setError(null)
            setIsProcessing(true)
            await onConfirm()
        } catch (err: any) {
            setError(err.message || 'An error occurred')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {isDangerous && <AlertCircle className="h-5 w-5 text-red-600" />}
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {message && (
                    <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isProcessing || isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isProcessing || isLoading}
                        variant={isDangerous ? 'destructive' : 'default'}
                    >
                        {isProcessing || isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
