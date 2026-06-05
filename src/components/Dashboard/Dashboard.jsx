import { supabase } from '../../lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [doctor, setDoctor] = useState(null)

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md text-center">
        {doctor && (
          <div className="text-left bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
            <p className="text-base font-semibold text-gray-900 mb-2">Welcome, {doctor.full_name} 👋</p>
            <p><span className="text-gray-400">Specialisation:</span> {doctor.specialisation}</p>
            <p><span className="text-gray-400">Clinic:</span> {doctor.clinic_name}</p>
            <p><span className="text-gray-400">Reg. no.:</span> {doctor.registration_number}</p>
          </div>
        )}
        <button onClick={handleLogout}
          className="mt-4 w-full border border-gray-200 rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-50 transition">
          Sign out
        </button>
      </div>
    </div>
  )
}