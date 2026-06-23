import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'
import PrescriptionPDF from './PrescriptionPDF'
import AutoComplete from '../UI/AutoComplete'
import { DAYS, FREQUENCIES, DURATIONS, DOSAGES } from '../../constants/prescription'
import { sanitizeText } from '../../utils/sanitize'

export default function PrescriptionForm() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [patient, setPatient] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPDF, setShowPDF] = useState(false)

  const now = new Date()
  const [rxData, setRxData] = useState({
    date: now.toISOString().split('T')[0],
    day: DAYS[now.getDay()],
    time: now.toTimeString().slice(0, 5),
    complaints: '',
    diagnosis: '',
    notes: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    tests: [{ name: '' }]
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: doctorData } = await supabase
        .from('doctors').select('*').eq('id', user.id).single()
      setDoctor(doctorData)
      if (patientId) {
        const { data: patientData } = await supabase
          .from('patients').select('*').eq('id', patientId).eq('doctor_id', user.id).single()
        setPatient(patientData)
      }
    }
    fetchData()
  }, [patientId])

  const fetchMedicines = async (query) => {
    const { data } = await supabase
      .from('medicines').select('*').ilike('name', `%${query}%`).limit(8)
    return data || []
  }

  const fetchTests = async (query) => {
    const { data } = await supabase
      .from('tests').select('*').ilike('name', `%${query}%`).limit(8)
    return data || []
  }

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

  const handleSavePrescription = async () => {
    if (!rxData.complaints) return setError('Please enter chief complaints.')
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: saveError } = await supabase.from('prescriptions').insert({
      doctor_id: user.id,
      patient_id: patient.id,
      visit_date: rxData.date,
      visit_time: rxData.time,
      complaints: sanitizeText(rxData.complaints),
      diagnosis: sanitizeText(rxData.diagnosis),
      medicines: rxData.medicines.filter(m => m.name).map(m => ({
        ...m,
        name: sanitizeText(m.name),
        instructions: sanitizeText(m.instructions)
      })),
      tests: rxData.tests.filter(t => t.name).map(t => ({
        ...t,
        name: sanitizeText(t.name)
      })),
      notes: sanitizeText(rxData.notes)
    })
    setSaving(false)
    if (saveError) return setError(saveError.message)
    setShowPDF(true)
  }

  if (showPDF) {
    return (
      <PrescriptionPDF
        doctor={doctor}
        patient={patient}
        rxData={rxData}
        onBack={() => navigate(`/patient/${patientId}/history`)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/patient/${patientId}/history`)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition text-lg">
              ←
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">Rx</div>
              <span className="font-semibold text-gray-900 text-sm">New Prescription</span>
            </div>
          </div>
          {patient && (
            <div className="text-right">
              <p className="text-xs font-medium text-gray-900">{patient.full_name}</p>
              <p className="text-xs text-gray-400">{patient.age} yrs · {patient.gender}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Patient bar */}
        {patient && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs mb-0.5">Writing prescription for</p>
              <p className="text-white font-bold text-base">{patient.full_name}</p>
              <p className="text-blue-200 text-xs mt-0.5">{patient.age} yrs · {patient.gender} · {patient.phone}</p>
            </div>
          </div>
        )}

        {/* Visit details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Visit details</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
              <input type="date" value={rxData.date}
                onChange={(e) => setRxData({ ...rxData, date: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Day</label>
              <select value={rxData.day} onChange={(e) => setRxData({ ...rxData, day: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Time</label>
              <input type="time" value={rxData.time}
                onChange={(e) => setRxData({ ...rxData, time: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
          </div>
        </div>

        {/* Clinical details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Clinical details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Chief complaints <span className="text-red-400">*</span></label>
              <textarea value={rxData.complaints}
                onChange={(e) => setRxData({ ...rxData, complaints: e.target.value })}
                placeholder="e.g. Fever, headache, body ache for 2 days"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Diagnosis</label>
              <textarea value={rxData.diagnosis}
                onChange={(e) => setRxData({ ...rxData, diagnosis: e.target.value })}
                placeholder="e.g. Viral fever"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" />
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Medicines</h2>
            <button onClick={addMedicine}
              className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition font-medium">
              + Add medicine
            </button>
          </div>
          <div className="space-y-4">
            {rxData.medicines.map((med, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 relative bg-gray-50/50">
                {rxData.medicines.length > 1 && (
                  <button onClick={() => removeMedicine(i)}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition text-xs">✕</button>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Medicine name</label>
                    <AutoComplete
                      value={med.name}
                      onChange={(val) => updateMedicine(i, 'name', val)}
                      onSelect={(option) => updateMedicine(i, 'name', option.name)}
                      placeholder="Type to search medicine..."
                      fetchOptions={fetchMedicines}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Dosage</label>
                      <select value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="">Select</option>
                        {DOSAGES.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Frequency</label>
                      <select value={med.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="">Select</option>
                        {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Duration</label>
                      <select value={med.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="">Select</option>
                        {DURATIONS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Instructions <span className="text-gray-300 font-normal">(optional)</span></label>
                    <input value={med.instructions} onChange={(e) => updateMedicine(i, 'instructions', e.target.value)}
                      placeholder="e.g. After food, with warm water"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Tests advised</h2>
            <button onClick={addTest}
              className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition font-medium">
              + Add test
            </button>
          </div>
          <div className="space-y-2">
            {rxData.tests.map((test, i) => (
              <div key={i} className="flex gap-2">
                <AutoComplete
                  value={test.name}
                  onChange={(val) => updateTest(i, val)}
                  onSelect={(option) => updateTest(i, option.name)}
                  placeholder="Type to search test..."
                  fetchOptions={fetchTests}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
                {rxData.tests.length > 1 && (
                  <button onClick={() => removeTest(i)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition text-sm border border-gray-200">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Notes / Advice</h2>
          <textarea value={rxData.notes}
            onChange={(e) => setRxData({ ...rxData, notes: e.target.value })}
            placeholder="e.g. Rest for 3 days, drink plenty of fluids, avoid cold food"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" />
        </div>

        {/* Save */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}
        <button onClick={handleSavePrescription} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl py-3.5 text-sm font-semibold transition-all disabled:opacity-50 shadow-sm shadow-blue-200">
          {saving ? 'Saving prescription...' : 'Save Prescription →'}
        </button>

      </div>
    </div>
  )
}