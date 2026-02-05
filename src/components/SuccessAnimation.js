import { useEffect, useState } from 'react'

function SuccessAnimation({ show, onComplete, amount, currency = 'KSh' }) {
    const [animationPhase, setAnimationPhase] = useState(0)

    useEffect(() => {
        if (show) {
            // Phase 1: Show checkmark
            setAnimationPhase(1)

            // Phase 2: Show amount
            const phase2Timer = setTimeout(() => {
                setAnimationPhase(2)
            }, 400)

            // Phase 3: Fade out
            const phase3Timer = setTimeout(() => {
                setAnimationPhase(3)
            }, 1800)

            // Complete
            const completeTimer = setTimeout(() => {
                setAnimationPhase(0)
                if (onComplete) onComplete()
            }, 2200)

            return () => {
                clearTimeout(phase2Timer)
                clearTimeout(phase3Timer)
                clearTimeout(completeTimer)
            }
        }
    }, [show, onComplete])

    if (!show && animationPhase === 0) return null

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
                animationPhase === 3 ? 'opacity-0' : 'opacity-100'
            }`}
        >
            <div className={`bg-white rounded-3xl p-8 shadow-2xl transform transition-all duration-500 ${
                animationPhase >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}>
                {/* Success Checkmark Circle */}
                <div className="relative mx-auto w-24 h-24 mb-6">
                    {/* Outer ring animation */}
                    <svg className="absolute inset-0 w-24 h-24" viewBox="0 0 100 100">
                        <circle
                            className="text-green-100"
                            cx="50"
                            cy="50"
                            r="45"
                            fill="currentColor"
                        />
                        <circle
                            className={`text-green-500 transition-all duration-700 ease-out ${
                                animationPhase >= 1 ? 'opacity-100' : 'opacity-0'
                            }`}
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray="283"
                            strokeDashoffset={animationPhase >= 1 ? 0 : 283}
                            style={{
                                transition: 'stroke-dashoffset 0.6s ease-out',
                                transform: 'rotate(-90deg)',
                                transformOrigin: 'center'
                            }}
                        />
                    </svg>

                    {/* Checkmark */}
                    <svg
                        className={`absolute inset-0 w-24 h-24 text-green-500 transition-all duration-300 delay-300 ${
                            animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        }`}
                        viewBox="0 0 100 100"
                    >
                        <path
                            className={`${animationPhase >= 1 ? 'animate-draw-check' : ''}`}
                            d="M30 50 L45 65 L70 35"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="60"
                            strokeDashoffset={animationPhase >= 1 ? 0 : 60}
                            style={{
                                transition: 'stroke-dashoffset 0.4s ease-out 0.3s'
                            }}
                        />
                    </svg>
                </div>

                {/* Text */}
                <div className={`text-center transition-all duration-300 ${
                    animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Sale Complete!</h2>

                    {/* Amount with pop effect */}
                    <div className={`transition-all duration-500 ${
                        animationPhase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                    }`}>
                        <p className="text-3xl font-bold text-green-600">
                            {currency} {parseFloat(amount || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>
                    </div>
                </div>

                {/* Confetti particles (for large sales) */}
                {amount >= 5000 && animationPhase >= 1 && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-2 h-2 rounded-full animate-confetti"
                                style={{
                                    backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'][i % 5],
                                    left: `${50 + (Math.random() - 0.5) * 20}%`,
                                    top: '40%',
                                    animationDelay: `${i * 0.05}s`,
                                    '--confetti-x': `${(Math.random() - 0.5) * 200}px`,
                                    '--confetti-y': `${Math.random() * -150 - 50}px`,
                                    '--confetti-rotate': `${Math.random() * 720}deg`
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SuccessAnimation
