# Requirements Summary: PII Collection System

## 📦 Dependencies to Install

### **New Dependencies (Not in requirements.txt)**

```bash
pip install phonenumbers==8.13.36 email-validator==2.2.0
```

**Why:**
- `phonenumbers`: Validates and formats phone numbers (international support)
- `email-validator`: Enhanced email validation beyond Django's basic validation

### **Existing Dependencies (Already Installed)**

✅ `openai==1.106.1` - For AI responses  
✅ `pydantic==2.11.7` - For data validation  
✅ `djangorestframework==3.14.0` - For API endpoints  
✅ `Django==5.0.1` - Web framework  
✅ `psycopg2-binary==2.9.9` - PostgreSQL driver  

---

## 🗄️ Database Requirements

- ✅ PostgreSQL database (already configured)
- ✅ Django migrations support
- **New tables to be created:**
  - `user_profiles` (from UserProfile model)

---

## 🔧 System Requirements

- ✅ Python 3.8+
- ✅ Django 5.0.1+
- ✅ OpenAI API key configured
- ✅ PostgreSQL database running
- ✅ Redis (optional, for caching)

---

## 📁 Files to Create/Modify

### **New Files:**
1. `core/pii_service.py` - PII extraction and validation
2. `core/pii_collection_manager.py` - Collection flow management

### **Files to Modify:**
1. `core/chat_models.py` - Add `UserProfile` model
2. `core/services.py` - Enhance system prompt
3. `core/chat_views.py` - Integrate PII collection
4. `core/chat_serializers.py` - Add `UserProfileSerializer`
5. `core/urls.py` - Add profile endpoint

### **Migrations:**
- New migration for `UserProfile` model

---

## ⚙️ Configuration Required

### **1. Environment Variables**
No new environment variables needed (uses existing OpenAI key)

### **2. Django Settings**
No new settings required

### **3. Database Migration**
```bash
python manage.py makemigrations core
python manage.py migrate
```

---

## 🧪 Testing Requirements

### **Manual Testing:**
- Test PII extraction from various text formats
- Test validation (valid/invalid emails, phones)
- Test collection flow during conversations
- Test API endpoints

### **Test Data:**
- Valid emails: `john@example.com`, `user.name+tag@domain.co.uk`
- Valid phones: `+1234567890`, `(123) 456-7890`, `123-456-7890`
- Invalid formats to test error handling

---

## 📊 API Endpoints

### **New Endpoints:**
- `GET /api/chat/profile/<session_id>/` - Get user profile
- `PATCH /api/chat/profile/<session_id>/` - Update user profile

### **Existing Endpoints (Enhanced):**
- `POST /api/chat/text/` - Now extracts and stores PII automatically

---

## 🔒 Security Considerations

### **Current Implementation:**
- ✅ Email validation (format + basic checks)
- ✅ Phone validation (format + international support)
- ✅ Data quality tracking (confirmed/unconfirmed)

### **Future Enhancements (Phase 2):**
- Data encryption at rest
- Consent management
- Data retention policies
- Audit logging

---

## 📈 Success Metrics

Track these after implementation:
- Collection rate (% of sessions with PII collected)
- Completion rate (% with all required fields)
- Data quality (% confirmed vs unconfirmed)
- User satisfaction (sentiment of collection interactions)

---

## ✅ Quick Start Checklist

- [ ] Install new dependencies: `pip install phonenumbers email-validator`
- [ ] Create `core/pii_service.py`
- [ ] Create `core/pii_collection_manager.py`
- [ ] Add `UserProfile` model to `core/chat_models.py`
- [ ] Update system prompt in `core/services.py`
- [ ] Integrate PII collection in `core/chat_views.py`
- [ ] Add serializers and API endpoints
- [ ] Run migrations: `python manage.py makemigrations && python manage.py migrate`
- [ ] Test PII extraction
- [ ] Test collection flow
- [ ] Verify database storage

---

## 🚨 Important Notes

1. **Privacy**: Always request consent before storing PII (Phase 2)
2. **Validation**: All extracted PII is validated before storage
3. **State Management**: Collection state stored in `conversation_state` JSONField
4. **Error Handling**: Invalid PII is logged but doesn't break conversation flow
5. **Progressive Collection**: Only one field requested at a time

---

## 📚 Documentation

- Full design: `AI_PII_COLLECTION_DESIGN.md`
- Implementation guide: `IMPLEMENTATION_GUIDE_PII_COLLECTION.md`
- This file: `REQUIREMENTS_PII_COLLECTION.md`













