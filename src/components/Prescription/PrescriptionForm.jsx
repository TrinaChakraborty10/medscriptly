import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import PrescriptionPDF from './PrescriptionPDF'
import AutoComplete from '../UI/AutoComplete'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const FREQUENCIES = ['Once daily', 'Twice daily', 'Thrice daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed']
const DURATIONS = ['1 day', '2 days', '3 days', '5 days', '7 days', '10 days', '14 days', '1 month', 'Ongoing', 'As needed']
const DOSAGES = ['1 tablet', '2 tablets', '1/2 tablet', '5ml', '10ml', '1 capsule', '2 capsules', '1 drop', '2 drops', 'As directed']

export default function PrescriptionForm() {
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [phone, setPhone] = useState('')
  const [matchedPatients, setMatchedPatients] = useState([])
  const [patient, setPatient] = useState(null)
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [patientForm, setPatientForm] = useState({ full_name: '', age: '', gender: '', address: '' })
  const [lookupDone, setLookupDone] = useState(false)
  const [loading, setLoading] = useState(false)
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
    const fetchDoctor = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('doctors').select('*').eq('id', user.id).single()
      setDoctor(data)
    }
    fetchDoctor()
  }, [])

  const fetchMedicines = async (query) => {
    const { data } = await supabase
      .from('medicines')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(8)
    return data || []
  }

  const fetchTests = async (query) => {
    const { data } = await supabase
      .from('tests')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(8)
    return data || []
  }

  const handlePhoneLookup = async () => {
    if (phone.length < 10) return setError('Please enter a valid phone number.')
    setError('')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('phone', phone)
    setLoading(false)
    if (data && data.length > 0) {
      setMatchedPatients(data)
      setPatient(data[0])
      setIsNewPatient(false)
      setShowNewPatientForm(false)
    } else {
      setMatchedPatients([])
      setPatient(null)
      setIsNewPatient(true)
      setShowNewPatientForm(true)
    }
    setLookupDone(true)
  }

  const handleSelectPatient = (p) => {
    setPatient(p)
    setShowNewPatientForm(false)
  }

  const handlePatientChange = (e) => setPatientForm({ ...patientForm, [e.target.name]: e.target.value })

  const handleSavePatient = async () => {
    if (!patientForm.full_name || !patientForm.age || !patientForm.gender) return setError('Name, age and gender are required.')
    setError('')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: insertError } = await supabase.from('patients').insert({
      doctor_id: user.id,
      phone,
      full_name: patientForm.full_name,
      age: parseInt(patientForm.age),
      gender: patientForm.gender,
      address: patientForm.address
    }).select().single()
    setLoading(false)
    if (insertError) return setError(insertError.message)
    setPatient(data)
    setMatchedPatients([...matchedPatients, data])
    setShowNewPatientForm(false)
    setIsNewPatient(false)
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
    if (!patient) return setError('Please confirm patient first.')
    if (!rxData.complaints) return setError('Please enter chief complaints.')
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: saveError } = await supabase.from('prescriptions').insert({
      doctor_id: user.id,
      patient_id: patient.id,
      visit_date: rxData.date,
      visit_time: rxData.time,
      complaints: rxData.complaints,
      diagnosis: rxData.diagnosis,
      medicines: rxData.medicines.filter(m => m.name),
      tests: rxData.tests.filter(t => t.name),
      notes: rxData.notes
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
        onBack={() => navigate('/dashboard')}
      />
    )
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
          <h1 className="text-lg font-semibold text-gray-900">New Prescription</h1>
        </div>

        {/* Phone lookup */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Patient lookup</h2>
          <div className="flex gap-2">
            <input type="tel" value={phone}
              onChange={(e) => { setPhone(e.target.value); setLookupDone(false); setPatient(null); setMatchedPatients([]); setIsNewPatient(false); setShowNewPatientForm(false) }}
              placeholder="Enter patient phone number" maxLength={10}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handlePhoneLookup} disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mt-2">{error}</p>}
        </div>

        {/* Multiple patients found */}
        {lookupDone && matchedPatients.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              {matchedPatients.length === 1 ? 'Patient found' : `${matchedPatients.length} patients found — select one`}
            </h2>
            <div className="space-y-2">
              {matchedPatients.map((p) => (
                <div key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${patient?.id === p.id ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.full_name}</p>
                    <p className="text-xs text-gray-400">{p.age} yrs · {p.gender}{p.address ? ` · ${p.address}` : ''}</p>
                  </div>
                  {patient?.id === p.id && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Selected</span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => { setShowNewPatientForm(true); setPatient(null); setPatientForm({ full_name: '', age: '', gender: '', address: '' }) }}
              className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg py-2 transition">
              + Add new patient with this number
            </button>
          </div>
        )}

        {/* New patient form */}
        {(isNewPatient || showNewPatientForm) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">New patient</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Full name</label>
                <input name="full_name" value={patientForm.full_name} onChange={handlePatientChange}
                  placeholder="Patient full name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Age</label>
                  <input name="age" type="number" value={patientForm.age} onChange={handlePatientChange}
                    placeholder="Age"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Gender</label>
                  <select name="gender" value={patientForm.gender} onChange={handlePatientChange}
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
                <input name="address" value={patientForm.address} onChange={handlePatientChange}
                  placeholder="Address (optional)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mt-3">{error}</p>}
            <button onClick={handleSavePatient} disabled={loading}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50">
              {loading ? 'Saving...' : 'Save patient & continue'}
            </button>
          </div>
        )}

        {/* Prescription form */}
        {patient && (
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
              <p className="text-sm text-blue-700">Writing prescription for <strong>{patient.full_name}</strong></p>
              <button onClick={() => setPatient(null)} className="text-xs text-blue-400 hover:text-blue-600">Change</button>
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
                    {DAYS.map(d => <option key={d}>{d}</option>)}
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
                    placeholder="e.g. Fever, headache, body ache for 2 days"
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Diagnosis</label>
                  <textarea value={rxData.diagnosis}
                    onChange={(e) => setRxData({ ...rxData, diagnosis: e.target.value })}
                    placeholder="e.g. Viral fever"
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
                        <AutoComplete
                          value={med.name}
                          onChange={(val) => updateMedicine(i, 'name', val)}
                          onSelect={(option) => updateMedicine(i, 'name', option.name)}
                          placeholder="Type to search medicine..."
                          fetchOptions={fetchMedicines}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
                    <AutoComplete
                      value={test.name}
                      onChange={(val) => updateTest(i, val)}
                      onSelect={(option) => updateTest(i, option.name)}
                      placeholder="Type to search test..."
                      fetchOptions={fetchTests}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                placeholder="e.g. Rest for 3 days, drink plenty of fluids, avoid cold food"
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            {/* Save */}
            {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
            <button onClick={handleSavePrescription} disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-medium transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Prescription'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}