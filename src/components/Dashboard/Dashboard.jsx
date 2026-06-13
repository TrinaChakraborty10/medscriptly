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
        .from('doctors')
        .select('*')
        .eq('id', user.id)
        .single()
      setDoctor(doctorData)

      const { data: patientData } = await supabase
        .from('doctor_patients')
        .select('*')
        .eq('doctor_id', user.id)
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
      p.full_name.toLowerCase().includes(q) ||
      p.phone.includes(q)
    ))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {doctor ? `Welcome, ${doctor.full_name}` : 'Loading...'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {doctor ? `${doctor.specialisation} · ${doctor.clinic_name}` : ''}
            </p>
          </div>
          <button onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-4 py-2 transition">
            Sign out
          </button>
        </div>

        {/* New Patient button */}
        <button
          onClick={() => navigate('/patient/new')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-medium transition mb-6">
          + New Patient
        </button>

        {/* Patient list */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Your patients</h2>
            <p className="text-xs text-gray-400">{patients.length} total</p>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or phone number..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              {search ? 'No patients found.' : 'No patients yet. Add your first patient!'}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <div key={p.id}
                  onClick={() => navigate(`/patient/${p.id}/history`)}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50 cursor-pointer transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-medium flex-shrink-0">
                      {p.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.full_name}</p>
                      <p className="text-xs text-gray-400">{p.age} yrs · {p.gender} · {p.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-300">›</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}