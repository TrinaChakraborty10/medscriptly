import { supabase } from '../../lib/supabaseClient'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [doctor, setDoctor] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [loadingRx, setLoadingRx] = useState(true)
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

      const { data: rxData } = await supabase
        .from('latest_prescriptions')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })
      setPrescriptions(rxData || [])
      setLoadingRx(false)
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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

        {/* New prescription button */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <button
            onClick={() => navigate('/prescription/new')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-medium transition flex items-center justify-center gap-2">
            + New Prescription
          </button>
        </div>

        {/* Past prescriptions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Patients — latest prescription</h2>

          {loadingRx ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
          ) : prescriptions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No prescriptions yet.</p>
          ) : (
            <div className="space-y-2">
              {prescriptions.map((rx) => (
                <div key={rx.id}
                  onClick={() => navigate(`/prescription/view/${rx.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50 cursor-pointer transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-medium">
                      {rx.patient_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rx.patient_name}</p>
                      <p className="text-xs text-gray-400">{rx.diagnosis || 'No diagnosis recorded'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatDate(rx.visit_date)}</p>
                    <p className="text-xs text-gray-400">{rx.visit_time?.slice(0, 5)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}