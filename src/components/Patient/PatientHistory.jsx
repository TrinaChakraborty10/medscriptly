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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 transition">
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Patient History</h1>
        </div>

        {/* Patient info card */}
        {patient && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-lg font-medium">
                  {patient.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">{patient.full_name}</p>
                  <p className="text-xs text-gray-400">{patient.age} yrs · {patient.gender} · {patient.phone}</p>
                  {patient.address && <p className="text-xs text-gray-400">{patient.address}</p>}
                </div>
              </div>
              <button
                onClick={() => navigate(`/patient/${patientId}/prescription/new`)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition">
                + New Prescription
              </button>
            </div>
          </div>
        )}

        {/* Prescriptions list */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Visit history
            {prescriptions.length > 0 && (
              <span className="ml-2 text-xs text-gray-400">({prescriptions.length} visit{prescriptions.length > 1 ? 's' : ''})</span>
            )}
          </h2>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
          ) : prescriptions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No prescriptions yet for this patient.</p>
          ) : (
            <div className="space-y-2">
              {prescriptions.map((rx, index) => (
                <div key={rx.id}
                  onClick={() => navigate(`/prescription/view/${rx.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50 cursor-pointer transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium flex-shrink-0">
                      {prescriptions.length - index}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {rx.diagnosis || 'No diagnosis recorded'}
                      </p>
                      <p className="text-xs text-gray-400">{rx.complaints?.slice(0, 50)}{rx.complaints?.length > 50 ? '...' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">{formatDate(rx.visit_date)}</p>
                    <p className="text-xs text-gray-400">{rx.visit_time?.slice(0, 5)}</p>
                    {index === 0 && (
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Latest</span>
                    )}
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