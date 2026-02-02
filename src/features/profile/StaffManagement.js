import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { shopsAPI } from '../../api/api'
import { FiUsers, FiPlus, FiTrash2, FiMail, FiShield, FiX, FiEdit2 } from 'react-icons/fi'

const StaffManagement = () => {
  const { currentShop } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    role: 'cashier'
  })
  const [editRole, setEditRole] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const getInitials = (username) => {
    if (!username) return 'U'
    return username.substring(0, 2).toUpperCase()
  }

  useEffect(() => {
    if (currentShop?.id) {
      fetchStaff()
    }
  }, [currentShop])

  const fetchStaff = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await shopsAPI.getMembers(currentShop.id)
      setStaff(response.data)
    } catch (err) {
      setError('Failed to fetch staff members')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleAddStaff = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await shopsAPI.inviteStaff(currentShop.id, formData)
      setSuccess('Staff member invited successfully!')
      setFormData({ email: '', role: 'cashier' })
      setShowAddModal(false)
      fetchStaff()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to invite staff member')
    }
  }

  const handleRemoveStaff = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) {
      return
    }

    try {
      await shopsAPI.removeMember(currentShop.id, userId)
      setSuccess('Staff member removed successfully!')
      fetchStaff()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove staff member')
    }
  }

  const openEditModal = (member) => {
    setSelectedMember(member)
    setEditRole(member.role)
    setShowEditModal(true)
  }

  const handleUpdateRole = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await shopsAPI.updateMemberRole(currentShop.id, selectedMember.user?.id, editRole)
      setSuccess('Role updated successfully!')
      setShowEditModal(false)
      setSelectedMember(null)
      fetchStaff()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role')
    }
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-700',
      manager: 'bg-blue-100 text-blue-700',
      cashier: 'bg-green-100 text-green-700',
      inventory: 'bg-orange-100 text-orange-700'
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  if (!currentShop) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">Please select a shop to manage staff</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiUsers className="w-6 h-6 text-pos-primary" />
            <div>
              <h2 className="text-xl font-semibold text-pos-text">Staff Management</h2>
              <p className="text-sm text-gray-500">{currentShop.name}</p>
            </div>
          </div>
          {(currentShop.role === 'owner' || currentShop.role === 'manager') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-primary/90 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Add Staff
            </button>
          )}
        </div>

        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading staff members...
          </div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center">
            <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No staff members yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-pos-primary text-white flex items-center justify-center font-medium">
                          {getInitials(member.user?.username)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-pos-text">
                            {member.user?.username || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.user?.first_name} {member.user?.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FiMail className="w-4 h-4" />
                        {member.user?.email || 'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                        <FiShield className="w-3 h-3" />
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {member.role !== 'owner' && (currentShop?.role === 'owner' || currentShop?.role === 'manager') && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit role"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveStaff(member.user?.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Remove staff member"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-pos-text">Invite Staff Member</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                  placeholder="staff@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The user must have an account with this email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                >
                  <option value="cashier">Cashier</option>
                  <option value="inventory">Inventory Staff</option>
                  <option value="manager">Manager</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Defines what the staff member can access
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-primary/90 transition-colors"
                >
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-pos-text">Edit Staff Role</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedMember(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-pos-primary text-white flex items-center justify-center font-medium">
                  {getInitials(selectedMember.user?.username)}
                </div>
                <div>
                  <p className="font-medium text-pos-text">{selectedMember.user?.username}</p>
                  <p className="text-sm text-gray-500">{selectedMember.user?.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                >
                  <option value="cashier">Cashier</option>
                  <option value="inventory">Inventory Staff</option>
                  <option value="manager">Manager</option>
                </select>
                <div className="mt-2 text-xs text-gray-500">
                  <p><strong>Cashier:</strong> Can process sales and manage customers</p>
                  <p><strong>Inventory:</strong> Can manage products and stock</p>
                  <p><strong>Manager:</strong> Full access to all features</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedMember(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-primary/90 transition-colors"
                >
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffManagement
