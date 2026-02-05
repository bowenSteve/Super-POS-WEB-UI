import { useState } from 'react'

function KeyboardShortcutsHelp() {
    const [isOpen, setIsOpen] = useState(false)

    const shortcuts = [
        { key: 'F1', action: 'Focus search' },
        { key: 'F2', action: 'Cash payment' },
        { key: 'F3', action: 'M-Pesa payment' },
        { key: 'F4', action: 'Hold transaction' },
        { key: 'F5', action: 'Recall held' },
        { key: 'Enter', action: 'Complete sale' },
        { key: 'Esc', action: 'Close modal / Clear' },
        { key: '+', action: 'Increase last item qty' },
        { key: '-', action: 'Decrease last item qty' },
        { key: 'Del', action: 'Remove last item' },
        { key: '0-9', action: 'Quantity first mode' },
    ]

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-500 hover:text-pos-primary hover:bg-pos-hover rounded-lg transition-colors"
                title="Keyboard shortcuts"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                    <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10"></path>
                </svg>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-pos-border z-50 overflow-hidden">
                        <div className="px-4 py-3 bg-pos-primary text-white">
                            <h3 className="font-semibold text-sm">Keyboard Shortcuts</h3>
                        </div>
                        <div className="p-2 max-h-80 overflow-y-auto">
                            {shortcuts.map((shortcut, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg"
                                >
                                    <span className="text-sm text-gray-600">{shortcut.action}</span>
                                    <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded text-gray-700">
                                        {shortcut.key}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                        <div className="px-4 py-2 bg-gray-50 border-t border-pos-border">
                            <p className="text-xs text-gray-500">
                                Press <kbd className="px-1 py-0.5 text-xs bg-gray-200 rounded">?</kbd> to toggle
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default KeyboardShortcutsHelp
