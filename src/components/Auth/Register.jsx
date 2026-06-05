import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'

const SPECIALISATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist',
  'Gynaecologist', 'Neurologist', 'Orthopaedic Surgeon',
  'Paediatrician', 'Psychiatrist', 'Pulmonologist', 'Urologist', 'Other'
]

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    specialisation: '', clinic_name: '', registration_number: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const { full_name, email, password, specialisation, clinic_name, registration_number } = form

    if (!full_name || !email || !password || !specialisation || !clinic_name || !registration_number) {
      return setError('All fields are required.')
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setLoading(false)
      return setError(signUpError.message)
    }

    const userId = data.user?.id
    if (!userId) {
      setLoading(false)
      return setError('Signup failed. Please try again.')
    }

    const { error: insertError } = await supabase.from('doctors').insert({
      id: userId,
      full_name,
      specialisation,
      clinic_name,
      registration_number
    })

    setLoading(false)

    if (insertError) {
      return setError(insertError.message)
    }

    sessionStorage.setItem('msp_new_registration', 'true')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-xl">🩺</div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Create account</h1>
            <p className="text-xs text-gray-400">MedScript Pro — Doctor registration</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Full name</label>
            <input name="full_name" value={form.full_name} onChange={handleChange}
              placeholder="Dr. Arun Sharma"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="doctor@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="Min. 6 characters"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Specialisation</label>
            <select name="specialisation" value={form.specialisation} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select specialisation</option>
              {SPECIALISATIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Clinic / Hospital name</label>
            <input name="clinic_name" value={form.clinic_name} onChange={handleChange}
              placeholder="City Care Clinic"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Registration number (MCI/NMC)</label>
            <input name="registration_number" value={form.registration_number} onChange={handleChange}
              placeholder="MCI-12345"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-4">
          Already registered? <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}