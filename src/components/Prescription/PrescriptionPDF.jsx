import { useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function PrescriptionPDF({ doctor, patient, rxData, onBack, onEdit }) {
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
            body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 24px; }
            .rx-header { border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
            .doctor-name { font-size: 20px; font-weight: bold; color: #1d4ed8; }
            .doctor-sub { font-size: 12px; color: #555; margin-top: 2px; }
            .patient-bar { background: #eff6ff; border-radius: 8px; padding: 10px 14px; margin-bottom: 18px; display: flex; gap: 24px; flex-wrap: wrap; }
            .patient-bar span { font-size: 12px; color: #555; }
            .patient-bar strong { color: #111; }
            .section { margin-bottom: 16px; }
            .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 6px; font-weight: 600; }
            .section-content { font-size: 13px; color: #111; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th { font-size: 11px; text-align: left; color: #888; padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; }
            td { font-size: 12px; padding: 7px 8px; border-bottom: 1px solid #f3f4f6; color: #111; }
            .test-pill { display: inline-block; background: #f3f4f6; border-radius: 20px; padding: 3px 10px; font-size: 12px; margin: 2px; color: #374151; }
            .footer { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e5e7eb; padding-top: 14px; }
            .footer-left { font-size: 11px; color: #9ca3af; }
            .signature { text-align: right; }
            .signature-line { width: 130px; border-top: 1px solid #6b7280; margin-bottom: 4px; margin-left: auto; }
            .signature-label { font-size: 11px; color: #6b7280; }
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

      {/* Navbar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition text-lg">
              ←
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">Rx</div>
              <span className="font-semibold text-gray-900 text-sm">Prescription</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={onEdit}
                className="text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg px-3 py-1.5 transition font-medium">
                ✏ Edit & revisit
              </button>
            )}
            <button onClick={handlePrint}
              className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition font-medium">
              🖨 Print
            </button>
            <button onClick={handleDownloadPDF}
              className="text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 transition font-medium">
              ⬇ Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Prescription card */}
        <div ref={printRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {/* Header */}
          <div className="rx-header flex justify-between items-start border-b-2 border-blue-600 pb-5 mb-6">
            <div>
              <p className="doctor-name text-xl font-bold text-blue-700">{doctor?.full_name}</p>
              <p className="doctor-sub text-xs text-gray-500 mt-1">{doctor?.specialisation}</p>
              <p className="doctor-sub text-xs text-gray-500">{doctor?.clinic_name}</p>
              <p className="doctor-sub text-xs text-gray-500">Reg. no.: {doctor?.registration_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-700">{rxData.day}, {rxData.date}</p>
              <p className="text-xs text-gray-400 mt-0.5">{rxData.time}</p>
            </div>
          </div>

          {/* Patient info */}
          <div className="patient-bar bg-blue-50 rounded-xl px-4 py-3 mb-6 flex gap-6 flex-wrap">
            <span className="text-xs text-gray-500">Name: <strong className="text-gray-900">{patient?.full_name}</strong></span>
            <span className="text-xs text-gray-500">Age: <strong className="text-gray-900">{patient?.age} yrs</strong></span>
            <span className="text-xs text-gray-500">Gender: <strong className="text-gray-900">{patient?.gender}</strong></span>
            <span className="text-xs text-gray-500">Phone: <strong className="text-gray-900">{patient?.phone}</strong></span>
          </div>

          {/* Complaints */}
          {rxData.complaints && (
            <div className="section mb-5">
              <p className="section-title text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1.5">Chief complaints</p>
              <p className="section-content text-sm text-gray-800">{rxData.complaints}</p>
            </div>
          )}

          {/* Diagnosis */}
          {rxData.diagnosis && (
            <div className="section mb-5">
              <p className="section-title text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1.5">Diagnosis</p>
              <p className="section-content text-sm font-semibold text-gray-900">{rxData.diagnosis}</p>
            </div>
          )}

          {/* Medicines */}
          {medicines.length > 0 && (
            <div className="section mb-5">
              <p className="section-title text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">℞ Medicines</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs text-gray-400 pb-2 font-semibold">Medicine</th>
                    <th className="text-left text-xs text-gray-400 pb-2 font-semibold">Dosage</th>
                    <th className="text-left text-xs text-gray-400 pb-2 font-semibold">Frequency</th>
                    <th className="text-left text-xs text-gray-400 pb-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2.5 text-gray-900 font-medium">{med.name}</td>
                      <td className="py-2.5 text-gray-600">{med.dosage}</td>
                      <td className="py-2.5 text-gray-600">
                        {med.frequency}{med.instructions ? ` — ${med.instructions}` : ''}
                      </td>
                      <td className="py-2.5 text-gray-600">{med.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tests */}
          {tests.length > 0 && (
            <div className="section mb-5">
              <p className="section-title text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Tests advised</p>
              <div className="flex flex-wrap gap-2">
                {tests.map((test, i) => (
                  <span key={i} className="test-pill text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">{test.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {rxData.notes && (
            <div className="section mb-5">
              <p className="section-title text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1.5">Advice / Notes</p>
              <p className="section-content text-sm text-gray-700">{rxData.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="footer mt-10 pt-4 border-t border-gray-100 flex justify-between items-end">
            <p className="text-xs text-gray-400">This prescription is computer generated.</p>
            <div className="text-right">
              <div className="w-32 border-t border-gray-400 mb-1 ml-auto"></div>
              <p className="text-xs text-gray-500">Doctor's signature</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}