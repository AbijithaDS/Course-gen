# 📚 Course File Generator

An AI-powered full-stack web application that automates the creation of academic course materials — including internal assessment papers, question banks, quizzes, assignments, HOTS questions, and beyond-syllabus topics — with professional-grade DOCX export and Google Forms integration.

Built for **Sri Shanmugha College of Engineering and Technology** to streamline faculty workflows and maintain consistent academic standards across departments.

---

## ✨ Features

### 🤖 AI-Powered Content Generation
- **CIA 1 & CIA 2 Papers** — Structured internal assessment papers (60 marks, Part A + Part B) with CO/K-level mappings
- **Question Banks** — Unit-wise question banks with 2-mark and 16-mark questions across all 5 units
- **MCQ Quizzes** — 15-question multiple-choice quizzes with correct answer keys
- **HOTS Questions** — 50 Higher Order Thinking Skills questions (10 per unit)
- **Assignments** — Practical assignment scenarios with configurable question count
- **Beyond Syllabus** — 25 industry-relevant topics mapped to each unit

### 📄 Document Export
- **Template-based DOCX** — CIA papers rendered into official college templates using `docxtemplater`
- **High-fidelity DOCX** — Question banks, HOTS, assignments, and beyond-syllabus content generated via Python-based document generators
- **HTML-Word Fallback** — Graceful `.doc` fallback when templates are unavailable

### 📝 Google Forms Integration
- **Apps Script Export** — Generate ready-to-paste Google Apps Script code that creates a quiz Google Form
- **Direct Form Creation** — Create Google Forms directly via the Google Forms API using OAuth2 access tokens

### 👥 Role-Based Access Control
- **Faculty** — Generate content, select department/regulation/semester/subject, export documents
- **Admin** — Manage departments, subjects, regulations, view generation audit logs and analytics
- **System Owner** — Full administrative privileges with hardcoded credential verification

### 🔐 Authentication
- **Local Authentication** — Username/password registration and login with SHA-256 hashing
- **Google Sign-In** — OAuth2-based Google login with automatic faculty account provisioning
- **Session Persistence** — LocalStorage-based session management

### 📊 Admin Dashboard
- **Analytics** — Total generations, word counts, active faculty metrics
- **Audit Logs** — Complete history of all content generations with filters
- **User Management** — View registered users and their roles
- **Catalog Management** — CRUD operations for departments, subjects, and regulations

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool and dev server |
| **React Router v7** | Client-side routing |
| **Lucide React** | Icon library |
| **Vanilla CSS** | Styling with glassmorphism design system |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **Google GenAI SDK** | Primary AI model (Gemini 2.5 Flash) |
| **Groq API** | Fallback AI model (Llama 3.3 70B) |
| **docxtemplater + PizZip** | DOCX template rendering |
| **Python (subprocess)** | High-fidelity document generation |
| **JSON file storage** | Lightweight flat-file database |

### Deployment
| Service | Purpose |
|---|---|
| **Netlify** | Frontend hosting (static SPA) |
| **Render** | Backend API hosting |

---

## 📁 Project Structure

```
course-gen/
├── frontend/                    # React SPA (Vite)
│   ├── public/                  # Static assets (favicon, logo, icons)
│   ├── src/
│   │   ├── assets/              # Image assets
│   │   ├── context/
│   │   │   └── AppContext.jsx   # Global state (auth, selections, data fetching)
│   │   ├── pages/
│   │   │   ├── Welcome.jsx          # Landing page with role selection
│   │   │   ├── Login.jsx            # Login form (local + Google SSO)
│   │   │   ├── Register.jsx         # Registration form
│   │   │   ├── RegulationSelection.jsx  # Academic regulation picker
│   │   │   ├── DepartmentSelection.jsx  # Department picker
│   │   │   ├── SemesterSelection.jsx    # Year/semester picker
│   │   │   ├── SubjectSelection.jsx     # Subject picker
│   │   │   ├── CourseContent.jsx        # AI generation & export hub
│   │   │   └── AdminDashboard.jsx       # Admin management console
│   │   ├── App.jsx              # Router with route guards
│   │   ├── config.js            # API base URL configuration
│   │   ├── index.css            # Global styles and design tokens
│   │   └── main.jsx             # React entry point
│   ├── index.html               # HTML shell with Google Identity Services
│   ├── vite.config.js           # Vite configuration
│   └── package.json
│
├── backend/                     # Express API server
│   ├── controllers/
│   │   ├── aiController.js      # AI content generation (Gemini + Groq fallback)
│   │   ├── authController.js    # Authentication (local + Google OAuth)
│   │   └── adminController.js   # Department/subject/regulation CRUD & analytics
│   ├── services/
│   │   ├── documentGenerator.js     # DOCX/HTML-Word document compiler
│   │   ├── templateService.js       # DOCX template file loader
│   │   ├── subjectStaffService.js   # Staff name resolver
│   │   ├── googleFormGenerator.js   # Google Apps Script generator
│   │   ├── googleFormService.js     # Google Forms API client
│   │   ├── quizParser.js            # Quiz markdown → structured JSON parser
│   │   ├── quizToGoogleForm.js      # Orchestrator: quiz → Google Form
│   │   ├── qbankGenerator.py        # Python DOCX generator for question banks
│   │   ├── hotsGenerator.py         # Python DOCX generator for HOTS
│   │   ├── assignmentGenerator.py   # Python DOCX generator for assignments
│   │   └── beyondGenerator.py       # Python DOCX generator for beyond-syllabus
│   ├── data/
│   │   ├── db.js                # Flat-file JSON database manager with seeding
│   │   ├── users.json           # User accounts
│   │   ├── departments.json     # Department catalog
│   │   ├── subjects.json        # Subject catalog
│   │   ├── regulations.json     # Academic regulations
│   │   └── generated_content.json   # Generation audit log
│   ├── config.js                # System owner credential hashes
│   ├── server.js                # Express app with all route definitions
│   ├── .env.example             # Environment variable template
│   └── package.json
│
├── DOC generation format/       # Reference DOCX/PDF templates for document formats
├── Subject syabllus/            # Syllabus PDF files for supported subjects
├── netlify.toml                 # Netlify deployment configuration
├── project_logs.md              # Development changelog
├── LICENSE                      # MIT License
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **Python** ≥ 3.8 (for high-fidelity DOCX generation)
- **npm** (bundled with Node.js)

### 1. Clone the Repository

```bash
git clone https://github.com/AbijithaDS/course-gen.git
cd course-gen
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file based on the example:

```bash
cp .env.example .env
```

Configure the required environment variables in `.env`:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here

# Optional — fallback AI model
GROQ_API_KEY=your_groq_api_key_here

# Optional — Google Sign-In
GOOGLE_CLIENT_ID=your_google_client_id_here

# Optional — System owner credentials (SHA-256 hashes)
SYSTEM_OWNER_EMAIL_HASH=your_hash_here
SYSTEM_OWNER_PASSWORD_HASH=your_hash_here
```

Start the backend server:

```bash
npm run dev
```

The server will start on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` and automatically proxy API requests to the backend.

### 4. Default Credentials

The database auto-seeds with default accounts on first launch:

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin |
| `faculty` | `faculty123` | Faculty |

---

## 🔌 API Reference

### Health Check
```
GET /api/health
```

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login with username/password |
| `POST` | `/api/auth/google` | Login with Google ID token |
| `GET` | `/api/auth/config` | Get Google Client ID for frontend |

### AI Content Generation
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate` | Generate academic content (CIA, Q-Bank, Quiz, HOTS, Assignment, Beyond) |

### Document Export
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/export` | Export generated content as a formatted DOCX/DOC file |
| `POST` | `/api/export-google-form` | Generate Google Apps Script for form creation |
| `POST` | `/api/create-google-form` | Create a Google Form directly via API |

### Admin Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/departments` | List all departments |
| `POST` | `/api/admin/departments` | Add a new department |
| `DELETE` | `/api/admin/departments/:id` | Delete a department |
| `GET` | `/api/admin/subjects` | List subjects (filterable by department and semester) |
| `POST` | `/api/admin/subjects` | Add a new subject |
| `DELETE` | `/api/admin/subjects/:id` | Delete a subject |
| `GET` | `/api/admin/regulations` | List academic regulations |
| `POST` | `/api/admin/regulations` | Add a new regulation |
| `GET` | `/api/admin/generations` | Get generation audit logs |
| `GET` | `/api/admin/stats` | Get dashboard analytics |
| `GET` | `/api/admin/users` | Get registered users |

---

## 🔧 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend server port (default: `5000`) |
| `GEMINI_API_KEY` | Yes* | Google Gemini API key for AI generation |
| `GROQ_API_KEY` | No | Groq API key for fallback AI model |
| `GOOGLE_CLIENT_ID` | No | Google OAuth Client ID for Sign-In |
| `SYSTEM_OWNER_EMAIL_HASH` | No | SHA-256 hash of system owner email |
| `SYSTEM_OWNER_PASSWORD_HASH` | No | SHA-256 hash of system owner password |

\* At least one of `GEMINI_API_KEY` or `GROQ_API_KEY` must be configured.

---

## 🌐 Deployment

### Frontend (Netlify)

The project includes a `netlify.toml` configuration:
- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- SPA redirects are configured for client-side routing

### Backend (Render)

Deploy the `backend` directory as a Node.js web service on [Render](https://render.com):
- **Build command:** `npm install`
- **Start command:** `npm start`
- Configure all environment variables in the Render dashboard

---

## 🧪 AI Model Strategy

The application uses a **dual-model failover strategy**:

1. **Primary** — Google Gemini 2.5 Flash via `@google/genai` SDK
2. **Fallback** — Groq (Llama 3.3 70B Versatile) via REST API

If the primary model fails or returns empty results, the system automatically falls back to the secondary model. Both failures result in a `502` response.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright © 2026 Abijitha D S

---

## 👤 Author

**Abijitha D S** — [GitHub](https://github.com/AbijithaDS)
