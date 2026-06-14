import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function PatientHistory() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .eq('doctor_id', user.id)
        .single()

      if (!patientData) {
        navigate('/dashboard')
        return
      }

      setPatient(patientData)

      const { data: rxData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })

      setPrescriptions(rxData || [])
      setLoading(false)
    }
    fetchData()
  }, [patientId])

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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

  const getInitials = (name) => {
    const parts = name?.split(' ')
    if (parts?.length >= 2) return parts[0][0] + parts[1][0]
    return name?.charAt(0) || '?'
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition text-lg">
              ←
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">Rx</div>
              <span className="font-semibold text-gray-900 text-sm">Patient History</span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/patient/${patientId}/prescription/new`)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition shadow-sm shadow-blue-200">
            + New Prescription
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Patient card */}
        {patient && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${getColor(patient.full_name)}`}>
                {getInitials(patient.full_name).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-900">{patient.full_name}</h1>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{patient.age} yrs</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{patient.gender}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">📞 {patient.phone}</span>
                  {patient.address && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">📍 {patient.address}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visit history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Visit history</h2>
            {prescriptions.length > 0 && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                {prescriptions.length} visit{prescriptions.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="p-4">
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-sm font-medium text-gray-500">No prescriptions yet</p>
                <p className="text-xs text-gray-400 mt-1">Click "+ New Prescription" to write the first one.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {prescriptions.map((rx, index) => (
                  <div key={rx.id}
                    onClick={() => navigate(`/prescription/view/${rx.id}`)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition group">
                    <div className="flex-shrink-0 text-center">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {prescriptions.length - index}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {rx.diagnosis || 'No diagnosis recorded'}
                        </p>
                        {index === 0 && (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full flex-shrink-0">Latest</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{rx.complaints?.slice(0, 60)}{rx.complaints?.length > 60 ? '...' : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-600">{formatDate(rx.visit_date)}</p>
                      <p className="text-xs text-gray-400">{rx.visit_time?.slice(0, 5)}</p>
                    </div>
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