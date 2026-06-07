import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import PrescriptionPDF from './PrescriptionPDF'
import PrescriptionForm from './PrescriptionForm'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function PrescriptionView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [patient, setPatient] = useState(null)
  const [rxData, setRxData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('view')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', user.id)
        .single()
      setDoctor(doctorData)

      const { data: rx } = await supabase
        .from('prescriptions')
        .select(`*, patients(*)`)
        .eq('id', id)
        .eq('doctor_id', user.id)
        .single()

      if (!rx) {
        navigate('/dashboard')
        return
      }

      setPatient(rx.patients)
      setRxData({
        date: rx.visit_date,
        day: DAYS[new Date(rx.visit_date).getDay()],
        time: rx.visit_time?.slice(0, 5),
        complaints: rx.complaints || '',
        diagnosis: rx.diagnosis || '',
        notes: rx.notes || '',
        medicines: rx.medicines?.length > 0 ? rx.medicines : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        tests: rx.tests?.length > 0 ? rx.tests : [{ name: '' }]
      })
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading prescription...</p>
      </div>
    )
  }

  if (mode === 'view') {
    return (
      <PrescriptionPDF
        doctor={doctor}
        patient={patient}
        rxData={rxData}
        onBack={() => navigate('/dashboard')}
        onEdit={() => setMode('edit')}
      />
    )
  }

  if (mode === 'edit') {
    return (
      <EditPrescription
        doctor={doctor}
        patient={patient}
        rxData={rxData}
        setRxData={setRxData}
        onBack={() => setMode('view')}
        onSaved={() => navigate('/dashboard')}
      />
    )
  }
}

function EditPrescription({ doctor, patient, rxData, setRxData, onBack, onSaved }) {
  const FREQUENCIES = ['Once daily', 'Twice daily', 'Thrice daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed']
  const DURATIONS = ['1 day', '2 days', '3 days', '5 days', '7 days', '10 days', '14 days', '1 month', 'Ongoing', 'As needed']
  const DOSAGES = ['1 tablet', '2 tablets', '1/2 tablet', '5ml', '10ml', '1 capsule', '2 capsules', '1 drop', '2 drops', 'As directed']
  const DAYS_LIST = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPDF, setShowPDF] = useState(false)

  const now = new Date()

  const addMedicine = () => setRxData({ ...rxData, medicines: [...rxData.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }] })
  const removeMedicine = (i) => setRxData({ ...rxData, medicines: rxData.medicines.filter((_, idx) => idx !== i) })
  const updateMedicine = (i, field, value) => {
    const updated = rxData.medicines.map((m, idx) => idx === i ? { ...m, [field]: value } : m)
    setRxData({ ...rxData, medicines: updated })
  }

  const addTest = () => setRxData({ ...rxData, tests: [...rxData.tests, { name: '' }] })
  const removeTest = (i) => setRxData({ ...rxData, tests: rxData.tests.filter((_, idx) => idx !== i) })
  const updateTest = (i, value) => {
    const updated = rxData.tests.map((t, idx) => idx === i ? { name: value } : t)
    setRxData({ ...rxData, tests: updated })
  }

  const handleSave = async () => {
    if (!rxData.complaints) return setError('Please enter chief complaints.')
    setSaving(true)
    setError('')

    const today = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)

    const { data: { user } } = await supabase.auth.getUser()
    const { error: saveError } = await supabase.from('prescriptions').insert({
      doctor_id: user.id,
      patient_id: patient.id,
      visit_date: today,
      visit_time: currentTime,
      complaints: rxData.complaints,
      diagnosis: rxData.diagnosis,
      medicines: rxData.medicines.filter(m => m.name),
      tests: rxData.tests.filter(t => t.name),
      notes: rxData.notes
    })

    setSaving(false)
    if (saveError) return setError(saveError.message)

    setRxData({
      ...rxData,
      date: today,
      day: DAYS_LIST[now.getDay()],
      time: currentTime
    })
    setShowPDF(true)
  }

  if (showPDF) {
    return (
      <PrescriptionPDF
        doctor={doctor}
        patient={patient}
        rxData={{ ...rxData, date: now.toISOString().split('T')[0], day: DAYS_LIST[now.getDay()], time: now.toTimeString().slice(0, 5) }}
        onBack={onSaved}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 transition">
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Edit Prescription</h1>
        </div>

        {/* Patient info bar */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-4">
          <p className="text-sm text-blue-700">Editing prescription for <strong>{patient.full_name}</strong> · {patient.age} yrs · {patient.gender}</p>
        </div>

        {/* Visit info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Visit details</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input type="date" value={rxData.date}
                onChange={(e) => setRxData({ ...rxData, date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Day</label>
              <select value={rxData.day} onChange={(e) => setRxData({ ...rxData, day: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {DAYS_LIST.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Time</label>
              <input type="time" value={rxData.time}
                onChange={(e) => setRxData({ ...rxData, time: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Complaints & Diagnosis */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Clinical details</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chief complaints</label>
              <textarea value={rxData.complaints}
                onChange={(e) => setRxData({ ...rxData, complaints: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Diagnosis</label>
              <textarea value={rxData.diagnosis}
                onChange={(e) => setRxData({ ...rxData, diagnosis: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">Medicines</h2>
            <button onClick={addMedicine}
              className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1 transition">
              + Add medicine
            </button>
          </div>
          <div className="space-y-4">
            {rxData.medicines.map((med, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 relative">
                {rxData.medicines.length > 1 && (
                  <button onClick={() => removeMedicine(i)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-400 text-xs transition">✕</button>
                )}
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Medicine name</label>
                    <input value={med.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                      placeholder="e.g. Paracetamol 500mg"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Dosage</label>
                      <select value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        {DOSAGES.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Frequency</label>
                      <select value={med.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Duration</label>
                      <select value={med.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        {DURATIONS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Instructions (optional)</label>
                    <input value={med.instructions} onChange={(e) => updateMedicine(i, 'instructions', e.target.value)}
                      placeholder="e.g. After food, with warm water"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tests */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">Tests advised</h2>
            <button onClick={addTest}
              className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1 transition">
              + Add test
            </button>
          </div>
          <div className="space-y-2">
            {rxData.tests.map((test, i) => (
              <div key={i} className="flex gap-2">
                <input value={test.name} onChange={(e) => updateTest(i, e.target.value)}
                  placeholder="e.g. CBC, LFT, Blood Sugar"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {rxData.tests.length > 1 && (
                  <button onClick={() => removeTest(i)}
                    className="text-gray-300 hover:text-red-400 text-sm transition px-2">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Notes / Advice</h2>
          <textarea value={rxData.notes}
            onChange={(e) => setRxData({ ...rxData, notes: e.target.value })}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {/* Save */}
        {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-medium transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Save as new visit'}
        </button>

      </div>
    </div>
  )
}