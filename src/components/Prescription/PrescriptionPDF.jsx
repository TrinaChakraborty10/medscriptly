import { useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function PrescriptionPDF({ doctor, patient, rxData, onBack }) {
  const printRef = useRef()

  const handleDownloadPDF = async () => {
    const element = printRef.current
    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`prescription_${patient.full_name}_${rxData.date}.pdf`)
  }

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`
      <html>
        <head>
          <title>Prescription</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 20px; }
            .rx-header { border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
            .doctor-name { font-size: 20px; font-weight: bold; color: #1d4ed8; }
            .doctor-sub { font-size: 12px; color: #555; margin-top: 2px; }
            .patient-bar { background: #eff6ff; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; display: flex; gap: 24px; }
            .patient-bar span { font-size: 12px; color: #555; }
            .patient-bar strong { color: #111; }
            .visit-bar { font-size: 12px; color: #555; margin-bottom: 16px; }
            .section { margin-bottom: 14px; }
            .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 6px; }
            .section-content { font-size: 13px; color: #111; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th { font-size: 11px; text-align: left; color: #888; padding: 4px 8px; border-bottom: 1px solid #e5e7eb; }
            td { font-size: 12px; padding: 6px 8px; border-bottom: 1px solid #f3f4f6; color: #111; }
            .rx-symbol { font-size: 28px; color: #1d4ed8; font-weight: bold; margin-bottom: 8px; }
            .footer { margin-top: 40px; text-align: right; font-size: 12px; color: #555; border-top: 1px solid #e5e7eb; padding-top: 12px; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  const medicines = rxData.medicines.filter(m => m.name)
  const tests = rxData.tests.filter(t => t.name)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Action buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 transition">
            ← Back to dashboard
          </button>
          <button onClick={handlePrint}
            className="text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-1.5 transition">
            🖨 Print
          </button>
          <button onClick={handleDownloadPDF}
            className="text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg px-4 py-1.5 transition">
            ⬇ Download PDF
          </button>
        </div>

        {/* Prescription preview */}
        <div ref={printRef} className="bg-white rounded-2xl border border-gray-200 p-8">

          {/* Header */}
          <div className="rx-header flex justify-between items-start border-b-2 border-blue-600 pb-4 mb-5">
            <div>
              <p className="doctor-name text-xl font-bold text-blue-700">{doctor.full_name}</p>
              <p className="doctor-sub text-xs text-gray-500 mt-0.5">{doctor.specialisation}</p>
              <p className="doctor-sub text-xs text-gray-500">{doctor.clinic_name}</p>
              <p className="doctor-sub text-xs text-gray-500">Reg. no.: {doctor.registration_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{rxData.day}, {rxData.date}</p>
              <p className="text-xs text-gray-500">{rxData.time}</p>
            </div>
          </div>

          {/* Patient info */}
          <div className="patient-bar bg-blue-50 rounded-lg px-4 py-3 mb-5 flex gap-6 flex-wrap">
            <span className="text-xs text-gray-500">Name: <strong className="text-gray-900">{patient.full_name}</strong></span>
            <span className="text-xs text-gray-500">Age: <strong className="text-gray-900">{patient.age} yrs</strong></span>
            <span className="text-xs text-gray-500">Gender: <strong className="text-gray-900">{patient.gender}</strong></span>
            <span className="text-xs text-gray-500">Phone: <strong className="text-gray-900">{patient.phone}</strong></span>
          </div>

          {/* Complaints */}
          {rxData.complaints && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Chief complaints</p>
              <p className="text-sm text-gray-800">{rxData.complaints}</p>
            </div>
          )}

          {/* Diagnosis */}
          {rxData.diagnosis && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Diagnosis</p>
              <p className="text-sm font-medium text-gray-800">{rxData.diagnosis}</p>
            </div>
          )}

          {/* Medicines */}
          {medicines.length > 0 && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">℞ Medicines</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs text-gray-400 pb-1 font-medium">Medicine</th>
                    <th className="text-left text-xs text-gray-400 pb-1 font-medium">Dosage</th>
                    <th className="text-left text-xs text-gray-400 pb-1 font-medium">Frequency</th>
                    <th className="text-left text-xs text-gray-400 pb-1 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                    {medicines.map((med, i) => (
                        <tr key={i} className="border-b border-gray-50">
                            <td className="py-2 text-gray-900">{med.name}</td>
                            <td className="py-2 text-gray-600">{med.dosage}</td>
                            <td className="py-2 text-gray-600">
                                {med.frequency}{med.instructions ? ` — ${med.instructions}` : ''}
                            </td>
                            <td className="py-2 text-gray-600">{med.duration}</td>
                        </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tests */}
          {tests.length > 0 && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Tests advised</p>
              <div className="flex flex-wrap gap-2">
                {tests.map((test, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{test.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {rxData.notes && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Advice / Notes</p>
              <p className="text-sm text-gray-700">{rxData.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="footer mt-8 pt-4 border-t border-gray-100 flex justify-between items-end">
            <p className="text-xs text-gray-400">This prescription is computer generated.</p>
            <div className="text-right">
              <div className="w-32 border-t border-gray-400 mb-1"></div>
              <p className="text-xs text-gray-500">Doctor's signature</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}