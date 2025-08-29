# InstantHPI Medical Platform Architecture

## 🏗️ System Architecture

### Complete Medical Consultation Platform

- **Patient Portal**: De-identified intake forms
- **Physician Portal**: Multi-clinic access with AI assistance
- **AI Processing**: Clinical transcription in French
- **Secure Storage**: Supabase PostgreSQL with RLS

## 🔐 Security Features

1. **De-identified Patient System**
   - 10-character alphanumeric IDs (A1B2C3D4E5 format)
   - No personal information in initial intake
   - HIPAA-compliant approach

2. **Authentication**
   - Email OTP verification
   - Google OAuth integration
   - Row-level security on all tables
   - Clinic-based access control

## 📊 Database Schema

### Core Tables

- `consultations`: Patient intake and clinical data
- `clinics`: Medical facilities
- `physicians`: Healthcare providers
- `ai_processing_logs`: AI command history
- `referrals`: Generated referrals

## 🤖 AI Integration Architecture

### Current Setup (Supabase + External AI)

```
Patient Form → Supabase → Edge Function → AI Service → Clinical Notes
```

### Recommended AI Hosting Solutions

#### Option 1: Modal.com (Best for 120GB Models)

```javascript
// Modal deployment example
modal deploy your-llm --gpu a100 --model-size 120gb
```

- Supports large models
- Pay-per-use pricing
- Auto-scaling

#### Option 2: Replicate

```javascript
// Replicate API integration
const output = await replicate.run("your-model-id", { input: consultationData });
```

#### Option 3: RunPod

- Dedicated GPU instances
- Fixed monthly pricing
- Full control

## 🏥 Clinical Workflow

### Patient Flow

1. Patient accesses intake form
2. Generates de-identified ID
3. Fills comprehensive medical form
4. AI generates clinical transcription
5. Consultation stored in Supabase

### Physician Flow

1. Login with clinic credentials
2. Select clinic from dropdown
3. Enter patient's 10-character ID
4. View AI-generated clinical notes
5. Use AI assistant for:
   - PT/OT referrals
   - Social work referrals
   - Imaging requests
   - SOAP notes
   - Follow-up plans

## 🌐 Deployment

### Current Infrastructure

- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Functions**: Supabase Edge Functions
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS

### Production Deployment

```bash
# Database is live at:
https://uoahrhroyqsqixusewwe.supabase.co

# Dashboard:
https://supabase.com/dashboard/project/uoahrhroyqsqixusewwe
```

## 📝 AI Clinical Transcription

### Input Variables

- Demographics (Gender, Age)
- Chief Complaint
- Symptom Details (Onset, Location, Severity)
- Medical History
- Current Medications
- Allergies

### Output Sections

1. **Confirmation Message** (Patient-facing)
2. **SOAP Note** (Clinical documentation)
3. **Plan Bullets** (Treatment plan)
4. **Telemedicine** (If applicable)
5. **Follow-up Questions** (10 questions)

## 🔄 API Endpoints

### Supabase REST API

```javascript
// Fetch consultation
GET /rest/v1/consultations?patient_id=eq.A1B2C3D4E5

// Create consultation
POST /rest/v1/consultations

// Update status
PATCH /rest/v1/consultations?id=eq.{id}
```

### AI Processing Endpoint

```javascript
POST /api/ai/process
{
  "command": "Prépare une référence PT",
  "consultation": {...},
  "template": "referral_pt"
}
```

## 🚀 Scaling Considerations

### For 120GB LLM Integration

1. **Use Streaming**: Process responses in chunks
2. **Cache Common Requests**: Store frequent AI outputs
3. **Queue System**: Handle multiple requests
4. **Load Balancing**: Distribute across multiple instances

### Database Optimization

- Indexed patient_id for fast lookups
- JSONB for flexible clinical data
- Materialized views for dashboards
- Connection pooling for high traffic

## 🔒 Compliance & Privacy

- **HIPAA Ready**: De-identified system
- **PIPEDA Compliant**: Canadian privacy laws
- **Encryption**: TLS in transit, AES at rest
- **Audit Logs**: Complete AI processing history
- **Access Control**: Role-based permissions

## 📱 Multi-Platform Access

- **Web**: Primary platform
- **Mobile**: Responsive design
- **API**: RESTful for third-party integration
- **Webhooks**: Real-time notifications

## 🎯 Next Steps for Full Production

1. **Deploy LLM**: Choose Modal/Replicate/RunPod
2. **Configure CDN**: For static assets
3. **Set up monitoring**: Sentry, LogRocket
4. **Add backups**: Automated daily backups
5. **Load testing**: Ensure scalability
6. **SSL certificates**: Full HTTPS
7. **Rate limiting**: Protect API endpoints
