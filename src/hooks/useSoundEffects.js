import { useCallback, useRef } from 'react'

// Sound effect frequencies and patterns
const SOUNDS = {
    // Quick beep for adding items
    addItem: {
        frequency: 800,
        duration: 80,
        type: 'sine',
        volume: 0.3
    },
    // Success cha-ching for completed sale
    success: {
        pattern: [
            { frequency: 523, duration: 100 }, // C5
            { frequency: 659, duration: 100 }, // E5
            { frequency: 784, duration: 150 }, // G5
            { frequency: 1047, duration: 200 } // C6
        ],
        type: 'sine',
        volume: 0.4
    },
    // Error sound
    error: {
        frequency: 200,
        duration: 200,
        type: 'square',
        volume: 0.2
    },
    // Remove item
    removeItem: {
        frequency: 400,
        duration: 60,
        type: 'sine',
        volume: 0.2
    },
    // Hold transaction
    hold: {
        pattern: [
            { frequency: 440, duration: 100 },
            { frequency: 330, duration: 150 }
        ],
        type: 'sine',
        volume: 0.3
    }
}

export function useSoundEffects() {
    const audioContextRef = useRef(null)
    const enabledRef = useRef(() => {
        const saved = localStorage.getItem('pos_sound_enabled')
        return saved === null ? true : JSON.parse(saved)
    })

    // Initialize or get AudioContext
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        }
        // Resume if suspended (browser autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume()
        }
        return audioContextRef.current
    }, [])

    // Play a single tone
    const playTone = useCallback((frequency, duration, type = 'sine', volume = 0.3) => {
        if (!enabledRef.current()) return

        try {
            const ctx = getAudioContext()
            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)

            oscillator.type = type
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

            // Fade in/out to avoid clicks
            gainNode.gain.setValueAtTime(0, ctx.currentTime)
            gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000)

            oscillator.start(ctx.currentTime)
            oscillator.stop(ctx.currentTime + duration / 1000)
        } catch (err) {
            console.warn('Sound playback failed:', err)
        }
    }, [getAudioContext])

    // Play a pattern of tones (for cha-ching effect)
    const playPattern = useCallback((pattern, type = 'sine', volume = 0.3) => {
        if (!enabledRef.current()) return

        let delay = 0
        pattern.forEach(({ frequency, duration }) => {
            setTimeout(() => {
                playTone(frequency, duration, type, volume)
            }, delay)
            delay += duration
        })
    }, [playTone])

    // Sound effect functions
    const playAddItem = useCallback(() => {
        const { frequency, duration, type, volume } = SOUNDS.addItem
        playTone(frequency, duration, type, volume)
    }, [playTone])

    const playSuccess = useCallback(() => {
        const { pattern, type, volume } = SOUNDS.success
        playPattern(pattern, type, volume)
    }, [playPattern])

    const playError = useCallback(() => {
        const { frequency, duration, type, volume } = SOUNDS.error
        playTone(frequency, duration, type, volume)
    }, [playTone])

    const playRemoveItem = useCallback(() => {
        const { frequency, duration, type, volume } = SOUNDS.removeItem
        playTone(frequency, duration, type, volume)
    }, [playTone])

    const playHold = useCallback(() => {
        const { pattern, type, volume } = SOUNDS.hold
        playPattern(pattern, type, volume)
    }, [playPattern])

    // Toggle sound on/off
    const toggleSound = useCallback((enabled) => {
        localStorage.setItem('pos_sound_enabled', JSON.stringify(enabled))
        enabledRef.current = () => enabled
    }, [])

    const isSoundEnabled = useCallback(() => {
        return enabledRef.current()
    }, [])

    return {
        playAddItem,
        playSuccess,
        playError,
        playRemoveItem,
        playHold,
        toggleSound,
        isSoundEnabled
    }
}

export default useSoundEffects
