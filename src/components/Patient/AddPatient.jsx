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

      {/* Navbar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition text-lg">
            ←
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">Rx</div>
            <span className="font-semibold text-gray-900 text-sm">New Patient</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add new patient</h1>
          <p className="text-sm text-gray-400 mt-1">Fill in the patient's details. You'll be taken to the prescription form next.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleNext} className="space-y-5">

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Full name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange}
                placeholder="Patient full name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone number</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="10-digit phone number" maxLength={10}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Age</label>
                <input name="age" type="number" value={form.age} onChange={handleChange}
                  placeholder="Age"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50">
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Address <span className="text-gray-300 font-normal">(optional)</span></label>
              <input name="address" value={form.address} onChange={handleChange}
                placeholder="Patient's address"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-xs text-red-500">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 shadow-sm shadow-blue-200">
              {loading ? 'Saving...' : 'Next — Write prescription →'}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}