import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

const SPECIALISATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist',
  'Gynaecologist', 'Neurologist', 'Orthopaedic Surgeon',
  'Paediatrician', 'Psychiatrist', 'Pulmonologist', 'Urologist', 'Other'
]

export default function DoctorProfile() {
  const navigate = useNavigate()
  const fileInputRef = useRef()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingSig, setUploadingSig] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    specialisation: '',
    clinic_name: '',
    registration_number: '',
    phone: ''
  })
  const [signatureUrl, setSignatureUrl] = useState(null)

  useEffect(() => {
    const fetchDoctor = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('doctors').select('*').eq('id', user.id).single()
      if (data) {
        setForm({
          full_name: data.full_name || '',
          specialisation: data.specialisation || '',
          clinic_name: data.clinic_name || '',
          registration_number: data.registration_number || '',
          phone: data.phone || ''
        })
        setSignatureUrl(data.signature_url || null)
      }
      setLoading(false)
    }
    fetchDoctor()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setSuccess('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.specialisation || !form.clinic_name || !form.registration_number) {
      return setError('All fields except phone are required.')
    }
    setSaving(true)
    setError('')
    setSuccess('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: updateError } = await supabase
      .from('doctors')
      .update({
        full_name: form.full_name,
        specialisation: form.specialisation,
        clinic_name: form.clinic_name,
        registration_number: form.registration_number,
        phone: form.phone
      })
      .eq('id', user.id)
    setSaving(false)
    if (updateError) return setError(updateError.message)
    setSuccess('Profile updated successfully!')
  }

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please upload an image file.')
    if (file.size > 2 * 1024 * 1024) return setError('Image must be under 2MB.')

    setUploadingSig(true)
    setError('')
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()
    const filePath = `${user.id}/signature.${file.name.split('.').pop()}`

    const { error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setUploadingSig(false)
      return setError(uploadError.message)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('signatures')
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('doctors')
      .update({ signature_url: publicUrl })
      .eq('id', user.id)

    setUploadingSig(false)
    if (updateError) return setError(updateError.message)
    setSignatureUrl(publicUrl)
    setSuccess('Signature uploaded successfully!')
  }

  const handleRemoveSignature = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('doctors').update({ signature_url: null }).eq('id', user.id)
    setSignatureUrl(null)
    setSuccess('Signature removed.')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition text-lg">
            ←
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">Rx</div>
            <span className="font-semibold text-gray-900 text-sm">My Profile</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile settings</h1>
          <p className="text-sm text-gray-400 mt-1">Update your details and upload your signature for prescriptions.</p>
        </div>

        {/* Profile form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Personal & clinic details</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Full name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Specialisation</label>
              <select name="specialisation" value={form.specialisation} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                {SPECIALISATIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Clinic / Hospital name</label>
              <input name="clinic_name" value={form.clinic_name} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Registration number</label>
              <input name="registration_number" value={form.registration_number} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone number <span className="text-gray-300 font-normal">(optional)</span></label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="Your clinic contact number"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-xs text-red-500">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                <p className="text-xs text-green-600">{success}</p>
              </div>
            )}

            <button type="submit" disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 shadow-sm shadow-blue-200">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Signature upload */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Digital signature</h2>
          <p className="text-xs text-gray-400 mb-4">This signature will appear on all your prescriptions automatically.</p>

          {signatureUrl ? (
            <div>
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 mb-3">
                <img src={signatureUrl} alt="Your signature"
                  className="max-h-20 object-contain" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current.click()}
                  className="flex-1 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl py-2.5 transition font-medium">
                  Replace signature
                </button>
                <button onClick={handleRemoveSignature}
                  className="flex-1 text-sm text-red-500 bg-red-50 hover:bg-red-100 rounded-xl py-2.5 transition font-medium">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current.click()}
              disabled={uploadingSig}
              className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl py-8 text-center transition group">
              <p className="text-2xl mb-2">✍️</p>
              <p className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition">
                {uploadingSig ? 'Uploading...' : 'Click to upload signature'}
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleSignatureUpload}
            className="hidden"
          />
        </div>

      </div>
    </div>
  )
}