import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return setError('Please enter email and password.')
    setLoading(true)
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })
    setLoading(false)
    if (loginError) return setError(loginError.message)
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
            Prescriptions,<br />simplified.
          </h1>
          <p className="text-blue-200 text-base leading-relaxed">
            Secure, fast, and paperless prescription management for modern doctors.
          </p>
        </div>
        <div className="space-y-4">
          {['Patient data isolated per doctor', 'PDF generation in one click', 'Medicine & test autocomplete'].map((f) => (
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

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-400 mb-8">Sign in to your doctor account</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="doctor@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 shadow-sm shadow-blue-200">
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>
          </div>

          <p className="text-xs text-center text-gray-400 mt-6">
            New doctor?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">Create an account</Link>
          </p>
        </div>
      </div>

    </div>
  )
}