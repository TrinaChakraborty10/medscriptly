# MedScript Pro

A secure, multi-doctor prescription management web application built for independent medical practitioners.

## Problem Statement

Doctors using existing prescription platforms often face two key concerns:
- Patient data privacy — sensitive patient records being accessible to others
- Inefficiency — having to retype the same patient details and medicines on every visit

MedScript Pro solves both.

## Features

- 🔐 **Secure doctor accounts** — each doctor's data is completely isolated from others via Row Level Security
- 🔍 **Patient lookup by phone** — returning patients auto-fill instantly; multiple patients can share a number
- 💊 **Smart medicine autocomplete** — type a few letters and matching medicines appear from a shared database
- 🧪 **Test autocomplete** — same for lab tests and investigations
- 📋 **Full prescription form** — complaints, diagnosis, medicines with dosage/frequency/duration, tests, notes
- 📄 **PDF generation** — clean, professional prescription PDF downloaded instantly
- 🖨️ **Print support** — one-click print for hard copy to hand to patients
- 📁 **Prescription history** — dashboard shows latest prescription per patient
- ✏️ **Edit & revisit** — open any past prescription, make changes, save as a new visit while preserving history

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS v3 |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| PDF Generation | jsPDF + html2canvas |
| Routing | React Router DOM |

## Project Structure
src/
├── components/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── Dashboard/
│   │   └── Dashboard.jsx
│   ├── Prescription/
│   │   ├── PrescriptionForm.jsx
│   │   ├── PrescriptionPDF.jsx
│   │   └── PrescriptionView.jsx
│   └── UI/
│       └── AutoComplete.jsx
├── lib/
│   └── supabaseClient.js
├── App.jsx
└── main.jsx

## Database Schema

- `doctors` — doctor profiles linked to Supabase auth users
- `patients` — patient records scoped per doctor
- `prescriptions` — full prescription records with medicines and tests stored as JSON
- `medicines` — shared medicine database with autocomplete support
- `tests` — shared tests/investigations database with autocomplete support

All tables have Row Level Security (RLS) enabled — doctors can only access their own data.

## Setup Instructions

1. Clone the repository
2. Run `npm install`
3. Create a Supabase project
4. Run the SQL schema in Supabase SQL Editor (contact for schema file)
5. Create a `.env` file:
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
6. Run `npm run dev`

## Current Status

- ✅ Phase 1 — Doctor registration & login
- ✅ Phase 2 — Patient lookup, prescription form, PDF & print
- ✅ Phase 3 — Prescription history, view, edit & revisit
- ✅ Phase 4 — Medicine & test autocomplete from shared database
- 🔄 More phases coming

## Built By

Trina Chakraborty
B.Tech CSE, Institute of Engineering and Management, Kolkata