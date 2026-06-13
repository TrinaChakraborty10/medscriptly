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
    if (password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setLoading(false); return setError(signUpError.message) }

    const userId = data.user?.id
    if (!userId) { setLoading(false); return setError('Signup failed. Please try again.') }

    const { error: insertError } = await supabase.from('doctors').insert({
      id: userId, full_name, specialisation, clinic_name, registration_number
    })
    setLoading(false)
    if (insertError) return setError(insertError.message)

    sessionStorage.setItem('msp_new_registration', 'true')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white text-sm font-bold">Rx</div>
            <span className="text-white font-semibold text-lg">MedScript Pro</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Your clinic,<br />your data.
          </h1>
          <p className="text-blue-200 text-base leading-relaxed">
            Register once and manage all your patients securely. Your data stays yours — always.
          </p>
        </div>
        <div className="space-y-4">
          {['End-to-end data isolation', 'Shared medicine database', 'Full prescription history'].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">✓</div>
              <p className="text-blue-100 text-sm">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">Rx</div>
            <span className="font-semibold text-gray-900">MedScript Pro</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
          <p className="text-sm text-gray-400 mb-8">Set up your doctor profile to get started</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleRegister} className="space-y-4">

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Full name</label>
                <input name="full_name" value={form.full_name} onChange={handleChange}
                  placeholder="Dr. Arun Sharma"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="doctor@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Specialisation</label>
                <select name="specialisation" value={form.specialisation} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50">
                  <option value="">Select specialisation</option>
                  {SPECIALISATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Clinic / Hospital name</label>
                <input name="clinic_name" value={form.clinic_name} onChange={handleChange}
                  placeholder="City Care Clinic"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Registration number (MCI/NMC)</label>
                <input name="registration_number" value={form.registration_number} onChange={handleChange}
                  placeholder="MCI-12345"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 shadow-sm shadow-blue-200">
                {loading ? 'Creating account...' : 'Create account →'}
              </button>
            </form>
          </div>

          <p className="text-xs text-center text-gray-400 mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

    </div>
  )
}