import { supabase } from '../../lib/supabaseClient'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [doctor, setDoctor] = useState(null)
  const [patients, setPatients] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: doctorData } = await supabase
        .from('doctors').select('*').eq('id', user.id).single()
      setDoctor(doctorData)
      const { data: patientData } = await supabase
        .from('doctor_patients').select('*').eq('doctor_id', user.id)
        .order('full_name', { ascending: true })
      setPatients(patientData || [])
      setFiltered(patientData || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase()
    setSearch(e.target.value)
    setFiltered(patients.filter(p =>
      p.full_name.toLowerCase().includes(q) || p.phone.includes(q)
    ))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const getInitials = (name) => {
    const parts = name?.split(' ')
    if (parts?.length >= 2) return parts[0][0] + parts[1][0]
    return name?.charAt(0) || '?'
  }

  const avatarColors = [
    'bg-blue-100 text-blue-600',
    'bg-purple-100 text-purple-600',
    'bg-green-100 text-green-600',
    'bg-orange-100 text-orange-600',
    'bg-pink-100 text-pink-600',
    'bg-teal-100 text-teal-600',
  ]

  const getColor = (name) => {
    const index = (name?.charCodeAt(0) || 0) % avatarColors.length
    return avatarColors[index]
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top navbar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">Rx</div>
            <span className="font-semibold text-gray-900 text-sm">MedScript Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{doctor?.full_name}</p>
              <p className="text-xs text-gray-400">{doctor?.specialisation}</p>
            </div>
            <button onClick={() => navigate('/profile')}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 transition hover:bg-gray-50">
              Profile
            </button>
            <button onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 transition hover:bg-gray-50">
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm mb-1">Good to see you,</p>
            <h1 className="text-xl font-bold text-white">{doctor?.full_name || 'Doctor'}</h1>
            <p className="text-blue-200 text-xs mt-1">{doctor?.clinic_name}</p>
          </div>
          <button
            onClick={() => navigate('/patient/new')}
            className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl px-5 py-2.5 text-sm font-semibold transition shadow-sm flex-shrink-0">
            + New Patient
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">Total patients</p>
            <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">Clinic</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{doctor?.clinic_name}</p>
            <p className="text-xs text-gray-400">{doctor?.registration_number}</p>
          </div>
        </div>

        {/* Patient list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Your patients</h2>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{patients.length} total</span>
            </div>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="🔍  Search by name or phone..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>

          <div className="p-4">
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">Loading patients...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">👤</p>
                <p className="text-sm font-medium text-gray-500">
                  {search ? 'No patients found.' : 'No patients yet.'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {!search && 'Click "+ New Patient" to add your first patient.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((p) => (
                  <div key={p.id}
                    onClick={() => navigate(`/patient/${p.id}/history`)}
                    className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${getColor(p.full_name)}`}>
                        {getInitials(p.full_name).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition">{p.full_name}</p>
                        <p className="text-xs text-gray-400">{p.age} yrs · {p.gender} · {p.phone}</p>
                      </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-blue-400 transition text-lg">›</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}