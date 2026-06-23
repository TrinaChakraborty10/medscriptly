import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { SPECIALISATIONS } from '../../constants/prescription'
import { sanitizeForm } from '../../utils/sanitize'

export default function Register() {
  const navigate = useNavigate()
  const fileInputRef = useRef()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signatureFile, setSignatureFile] = useState(null)
  const [signaturePreview, setSignaturePreview] = useState(null)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    specialisation: '', clinic_name: '', registration_number: '', phone: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSignatureSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please upload an image file.')
    if (file.size > 2 * 1024 * 1024) return setError('Image must be under 2MB.')
    setSignatureFile(file)
    setSignaturePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const { full_name, email, password, specialisation, clinic_name, registration_number } = form
    if (!full_name || !email || !password || !specialisation || !clinic_name || !registration_number) {
      return setError('All fields except phone and signature are required.')
    }
    if (password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true)
    setError('')

    const cleanForm = sanitizeForm(form)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setLoading(false); return setError(signUpError.message) }

    const userId = data.user?.id
    if (!userId) { setLoading(false); return setError('Signup failed. Please try again.') }

    let signatureUrl = null
    if (signatureFile) {
      const filePath = `${userId}/signature.${signatureFile.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, signatureFile, { upsert: true })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(filePath)
        signatureUrl = publicUrl
      }
    }

    const { error: insertError } = await supabase.from('doctors').insert({
      id: userId,
      full_name: cleanForm.full_name,
      specialisation: cleanForm.specialisation,
      clinic_name: cleanForm.clinic_name,
      registration_number: cleanForm.registration_number,
      phone: cleanForm.phone,
      signature_url: signatureUrl
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
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone number <span className="text-gray-300 font-normal">(optional)</span></label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                  placeholder="Clinic contact number"
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

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Digital signature <span className="text-gray-300 font-normal">(optional, can add later)</span></label>
                {signaturePreview ? (
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center justify-between">
                    <img src={signaturePreview} alt="Signature preview" className="max-h-12 object-contain" />
                    <button type="button" onClick={() => fileInputRef.current.click()}
                      className="text-xs text-blue-600 font-medium">Change</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current.click()}
                    className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl py-4 text-center transition">
                    <p className="text-xs text-gray-400">✍️ Click to upload your signature</p>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleSignatureSelect} className="hidden" />
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