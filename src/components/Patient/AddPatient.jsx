import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function AddPatient() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '', phone: '', age: '', gender: '', address: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleNext = async (e) => {
    e.preventDefault()
    if (!form.full_name) return setError('Full name is required.')
    if (!form.phone || form.phone.length < 10) return setError('Please enter a valid phone number.')
    if (!form.age) return setError('Age is required.')
    if (!form.gender) return setError('Gender is required.')

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: insertError } = await supabase
      .from('patients')
      .insert({
        doctor_id: user.id,
        full_name: form.full_name,
        phone: form.phone,
        age: parseInt(form.age),
        gender: form.gender,
        address: form.address
      })
      .select()
      .single()

    setLoading(false)

    if (insertError) return setError(insertError.message)

    navigate(`/patient/${data.id}/prescription/new`)
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
          <h1 className="text-lg font-semibold text-gray-900">New Patient</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs text-gray-400 mb-4">Enter the patient's details to get started. You'll be taken to the prescription form next.</p>

          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange}
                placeholder="Patient full name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone number</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="10-digit phone number" maxLength={10}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Age</label>
                <input name="age" type="number" value={form.age} onChange={handleChange}
                  placeholder="Age"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Address</label>
              <input name="address" value={form.address} onChange={handleChange}
                placeholder="Address (optional)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50">
              {loading ? 'Saving...' : 'Next →'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}