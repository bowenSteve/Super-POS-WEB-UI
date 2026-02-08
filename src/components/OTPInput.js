import { useState, useRef, useEffect } from 'react'

/**
 * OTP Input Component
 *
 * A user-friendly OTP input that creates 6 separate boxes for each digit
 *
 * How it works:
 * - Creates 6 input boxes for a 6-digit OTP
 * - Auto-focuses next box when you type a digit
 * - Auto-focuses previous box when you delete
 * - Supports paste (try pasting "123456" and it splits into boxes)
 * - Mobile-friendly with numeric keyboard
 *
 * Props:
 * - value: The OTP value (string)
 * - onChange: Callback when OTP changes
 * - length: Number of digits (default: 6)
 */
function OTPInput({ value = '', onChange, length = 6 }) {
    const [otp, setOtp] = useState(value.split(''))
    const inputRefs = useRef([])

    // Initialize otp array with empty strings
    useEffect(() => {
        if (otp.length === 0) {
            setOtp(Array(length).fill(''))
        }
    }, [length, otp.length])

    // Update parent when otp changes
    useEffect(() => {
        const otpString = otp.join('')
        onChange(otpString)
    }, [otp, onChange])

    // Update otp when value prop changes (for reset/clear)
    useEffect(() => {
        if (value === '' && otp.join('') !== '') {
            setOtp(Array(length).fill(''))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, length])

    const handleChange = (index, e) => {
        const val = e.target.value

        // Only allow digits
        if (val !== '' && !/^\d$/.test(val)) {
            return
        }

        const newOtp = [...otp]
        newOtp[index] = val
        setOtp(newOtp)

        // Auto-focus next input
        if (val !== '' && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index, e) => {
        // Handle backspace - move to previous input
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }

        // Handle arrow keys for navigation
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault()
            inputRefs.current[index - 1]?.focus()
        }

        if (e.key === 'ArrowRight' && index < length - 1) {
            e.preventDefault()
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text/plain').trim()

        // Only process if it's all digits
        if (!/^\d+$/.test(pastedData)) {
            return
        }

        // Split pasted data into individual digits
        const digits = pastedData.slice(0, length).split('')
        const newOtp = [...otp]

        digits.forEach((digit, i) => {
            newOtp[i] = digit
        })

        setOtp(newOtp)

        // Focus the next empty box or the last box
        const nextEmptyIndex = digits.length < length ? digits.length : length - 1
        inputRefs.current[nextEmptyIndex]?.focus()
    }

    const handleFocus = (index) => {
        // Select the text when focused for easier editing
        inputRefs.current[index]?.select()
    }

    return (
        <div className="flex gap-2 justify-center">
            {Array(length).fill(0).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[index] || ''}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={() => handleFocus(index)}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/50 focus:border-pos-primary transition-all"
                    autoFocus={index === 0}
                />
            ))}
        </div>
    )
}

export default OTPInput
