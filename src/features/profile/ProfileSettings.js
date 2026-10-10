import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { FiUser, FiMail, FiLock, FiSave } from 'react-icons/fi'

const inputClass = 'w-full px-3.5 py-2.5 border border-brand-ink/[0.16] rounded-xl outline-none focus:border-brand-ink transition-colors'
const labelClass = 'block text-sm font-semibold mb-1.5'

const ProfileSettings = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || ''
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // TODO: Call API to update profile
      // await authAPI.updateProfile(formData)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // TODO: Call API to change password
      // await authAPI.changePassword(passwordData)
      setSuccess('Password changed successfully!')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 font-sans text-brand-ink">
      {/* Profile Information */}
      <div className="bg-white rounded-2xl border border-brand-ink/[0.09] p-6">
        <div className="flex items-center gap-3 mb-6">
          <FiUser className="w-5 h-5 text-brand-ink/60" />
          <h2 className="text-base font-semibold">Profile information</h2>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-[#2f7a5f]/10 border border-[#2f7a5f]/20 text-[#2f7a5f] rounded-xl text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-[#c8553d]/10 border border-[#c8553d]/20 text-[#c8553d] rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={inputClass}
                placeholder="John"
              />
            </div>

            <div>
              <label className={labelClass}>Last name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={inputClass}
              placeholder="johndoe"
            />
          </div>

          <div>
            <label className={labelClass}>
              <FiMail className="inline w-4 h-4 mr-1 -mt-0.5" />
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="john@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors disabled:opacity-50 font-semibold cursor-pointer"
          >
            <FiSave className="w-4 h-4" />
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-brand-ink/[0.09] p-6">
        <div className="flex items-center gap-3 mb-6">
          <FiLock className="w-5 h-5 text-brand-ink/60" />
          <h2 className="text-base font-semibold">Change password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="grid gap-4">
          <div>
            <label className={labelClass}>Current password</label>
            <input
              type="password"
              name="current_password"
              value={passwordData.current_password}
              onChange={handlePasswordChange}
              className={inputClass}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className={labelClass}>New password</label>
            <input
              type="password"
              name="new_password"
              value={passwordData.new_password}
              onChange={handlePasswordChange}
              className={inputClass}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className={labelClass}>Confirm new password</label>
            <input
              type="password"
              name="confirm_password"
              value={passwordData.confirm_password}
              onChange={handlePasswordChange}
              className={inputClass}
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors disabled:opacity-50 font-semibold cursor-pointer"
          >
            <FiLock className="w-4 h-4" />
            {loading ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfileSettings
