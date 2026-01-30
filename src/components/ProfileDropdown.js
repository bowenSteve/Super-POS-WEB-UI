import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProfileDropdown = () => {
  const navigate = useNavigate()
  const { user, currentShop } = useAuth()

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <button
      onClick={() => navigate('/profile')}
      className="flex items-center gap-2 p-2 hover:bg-pos-hover rounded-lg transition-colors cursor-pointer"
      title="Go to Profile"
    >
      <div className="w-9 h-9 rounded-full bg-pos-primary text-white flex items-center justify-center font-medium text-sm">
        {getInitials(user?.username || 'User')}
      </div>
      <div className="text-left hidden md:block">
        <p className="text-sm font-medium text-pos-text">{user?.username || 'User'}</p>
        {currentShop && (
          <p className="text-xs text-gray-500">{currentShop.name}</p>
        )}
      </div>
    </button>
  )
}

export default ProfileDropdown
