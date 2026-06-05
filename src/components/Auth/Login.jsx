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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">🩺</div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Sign in</h1>
            <p className="text-xs text-gray-400">MedScript Pro</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="doctor@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="••••••"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-4">
          New doctor? <Link to="/register" className="text-blue-500 hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  )
}