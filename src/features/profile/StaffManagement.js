import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { shopsAPI } from '../../api/api'
import { FiUsers, FiPlus, FiTrash2, FiMail, FiShield, FiX, FiEdit2 } from 'react-icons/fi'

const inputClass = 'w-full px-3.5 py-2.5 border border-brand-ink/[0.16] rounded-xl outline-none focus:border-brand-ink transition-colors'
const labelClass = 'block text-sm font-semibold mb-1.5'

const StaffManagement = () => {
  const { currentShop } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setFormData({ name: '', email: '', role: 'cashier' })
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

  const getRoleBadgeStyle = (role) => {
    const styles = {
      owner: { background: '#14373b', color: '#f0f8f5' },
      manager: { background: 'rgba(237,134,116,0.18)', color: '#14373b' },
      cashier: { background: 'rgba(47,122,95,0.12)', color: '#2f7a5f' },
      inventory: { background: 'rgba(20,55,59,0.08)', color: '#14373b' }
    }
    return styles[role] || { background: 'rgba(20,55,59,0.08)', color: '#14373b' }
  }

  if (!currentShop) {
    return (
      <div className="bg-white p-10 text-center font-sans text-brand-ink">
        <FiUsers className="w-12 h-12 text-brand-ink/30 mx-auto mb-3" />
        <p className="text-brand-ink/55">Please select a shop to manage staff</p>
      </div>
    )
  }

  return (
    <div className="font-sans text-brand-ink">
      {/* Header */}
      <div className="px-6 py-5 border-b border-brand-ink/[0.08]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <FiUsers className="w-5 h-5 text-brand-ink/60" />
            <div>
              <h2 className="text-base font-semibold">Staff management</h2>
              <p className="text-sm text-brand-ink/55">{currentShop.name}</p>
            </div>
          </div>
          {(currentShop.role === 'owner' || currentShop.role === 'manager') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              Add staff
            </button>
          )}
        </div>

        {success && (
          <div className="mt-4 p-3 bg-[#2f7a5f]/10 border border-[#2f7a5f]/20 text-[#2f7a5f] rounded-xl text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-[#c8553d]/10 border border-[#c8553d]/20 text-[#c8553d] rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Staff List */}
      {loading ? (
        <div className="p-8 text-center text-brand-ink/55">
          Loading staff members…
        </div>
      ) : staff.length === 0 ? (
        <div className="p-8 text-center">
          <FiUsers className="w-12 h-12 text-brand-ink/30 mx-auto mb-3" />
          <p className="text-brand-ink/55">No staff members yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead className="bg-[#fafcfb] border-b border-brand-ink/[0.07]">
              <tr>
                <th className="px-6 py-3 text-left text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">User</th>
                <th className="px-6 py-3 text-left text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Email</th>
                <th className="px-6 py-3 text-left text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Role</th>
                <th className="px-6 py-3 text-left text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Joined</th>
                <th className="px-6 py-3 text-left text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-ink/[0.06]">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-brand-surface/60 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-ink text-brand-surface flex items-center justify-center font-semibold text-xs flex-none">
                        {getInitials(member.user?.username)}
                      </div>
                      <div>
                        <p className="font-semibold">{member.user?.username || 'Unknown'}</p>
                        <p className="text-xs text-brand-ink/55">{member.user?.first_name} {member.user?.last_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-brand-ink/60">
                      <FiMail className="w-4 h-4" />
                      {member.user?.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={getRoleBadgeStyle(member.role)}>
                        <FiShield className="w-3 h-3" />
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                      {member.invite_pending && (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(217,139,43,0.14)', color: '#9a6319' }}>
                          Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-brand-ink/55">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    {member.role !== 'owner' && (currentShop?.role === 'owner' || currentShop?.role === 'manager') && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(member)}
                          className="text-brand-ink/60 hover:text-brand-ink transition-colors cursor-pointer"
                          title="Edit role"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveStaff(member.user?.id)}
                          className="text-[#c8553d] hover:text-[#c8553d]/80 transition-colors cursor-pointer"
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

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-brand-ink/10">
              <h3 className="text-lg font-semibold">Invite staff member</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-brand-ink/40 hover:text-brand-ink transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 grid gap-4">
              <div>
                <label className={labelClass}>Full name (optional)</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Jane Wanjiru"
                />
              </div>

              <div>
                <label className={labelClass}>Email address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="staff@example.com"
                />
                <p className="mt-1.5 text-xs text-brand-ink/55">
                  We'll email them a link to set their password
                </p>
              </div>

              <div>
                <label className={labelClass}>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="cashier">Cashier</option>
                  <option value="inventory">Inventory Staff</option>
                  <option value="manager">Manager</option>
                </select>
                <p className="mt-1.5 text-xs text-brand-ink/55">
                  Defines what the staff member can access
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer"
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
        <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-brand-ink/10">
              <h3 className="text-lg font-semibold">Edit staff role</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedMember(null)
                }}
                className="text-brand-ink/40 hover:text-brand-ink transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="p-6 grid gap-4">
              <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-ink text-brand-surface flex items-center justify-center font-semibold">
                  {getInitials(selectedMember.user?.username)}
                </div>
                <div>
                  <p className="font-semibold">{selectedMember.user?.username}</p>
                  <p className="text-sm text-brand-ink/55">{selectedMember.user?.email}</p>
                </div>
              </div>

              <div>
                <label className={labelClass}>New role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className={inputClass}
                >
                  <option value="cashier">Cashier</option>
                  <option value="inventory">Inventory Staff</option>
                  <option value="manager">Manager</option>
                </select>
                <div className="mt-2 text-xs text-brand-ink/55 grid gap-0.5">
                  <p><strong>Cashier:</strong> Can process sales and manage customers</p>
                  <p><strong>Inventory:</strong> Can manage products and stock</p>
                  <p><strong>Manager:</strong> Full access to all features</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedMember(null)
                  }}
                  className="flex-1 px-4 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer"
                >
                  Update role
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
