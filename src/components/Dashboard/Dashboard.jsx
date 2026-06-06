import { supabase } from '../../lib/supabaseClient'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [doctor, setDoctor] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDoctor = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('doctors').select('*').eq('id', user.id).single()
      setDoctor(data)
    }
    fetchDoctor()
  }, [])

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

        {/* Action card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Quick actions</h2>
          <button
            onClick={() => navigate('/prescription/new')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-medium transition flex items-center justify-center gap-2">
            + New Prescription
          </button>
        </div>

      </div>
    </div>
  )
}