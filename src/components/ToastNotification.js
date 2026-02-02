import toast, { Toaster } from 'react-hot-toast'

// Reusable Toaster component with custom styling
export const ToastNotification = () => {
    return (
        <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                duration: 3000,
                style: {
                    background: '#fff',
                    color: '#333',
                    padding: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                    },
                    style: {
                        border: '1px solid #d1fae5',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    },
                    style: {
                        border: '1px solid #fee2e2',
                    },
                },
                loading: {
                    iconTheme: {
                        primary: '#3b82f6',
                        secondary: '#fff',
                    },
                },
            }}
        />
    )
}

// Export toast for use in components
export { toast }

// Custom toast helpers with better styling
export const showToast = {
    success: (message, options = {}) => {
        return toast.success(message, {
            ...options,
            className: 'toast-success',
        })
    },
    error: (message, options = {}) => {
        return toast.error(message, {
            ...options,
            className: 'toast-error',
        })
    },
    loading: (message, options = {}) => {
        return toast.loading(message, {
            ...options,
            className: 'toast-loading',
        })
    },
    promise: (promise, messages, options = {}) => {
        return toast.promise(
            promise,
            {
                loading: messages.loading || 'Loading...',
                success: messages.success || 'Success!',
                error: messages.error || 'Error occurred',
            },
            options
        )
    },
}

export default ToastNotification
