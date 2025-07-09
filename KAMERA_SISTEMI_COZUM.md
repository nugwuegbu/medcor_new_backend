# 🔧 KAMERA SİSTEMİ - KÖKLÜ ÇÖZÜM PLANI

## 📋 PROBLEM ANALİZİ

### **Mevcut Sorun:**
1. **Dual Stream Conflict**: Hair widget kendi kamerası yaratıyor
2. **Browser Limitation**: Chrome aynı anda 2 kamera stream'i açmıyor
3. **Stream Sharing Yok**: Shared stream kullanılmıyor

### **Hata Akışı:**
```
Hair Button → ensureCameraReady() → Hair Widget → getUserMedia() → FAIL (already in use)
```

## 🎯 ÇÖZÜM STRATEJİSİ

### **1. Single Stream Architecture**
- Tek kamera stream'i tüm widgetlar için paylaşılacak
- Hair widget kendi stream yaratmayacak
- Shared stream props olarak geçilecek

### **2. Props-Based Stream Sharing**
```typescript
// Avatar Widget
const stream = await ensureCameraReady();
<HairAnalysisWidget videoStream={stream} />

// Hair Widget
export function HairAnalysisWidget({ videoStream }: { videoStream: MediaStream })
```

### **3. Refactor Plan**
1. Hair widget'dan kamera initialization kaldır
2. Props ile stream geçişi sağla
3. Shared stream kullanımı zorla

## 🔄 IMPLEMENTATION STEPS

### **Step 1: Hair Widget Refactor**
- Remove: `getUserMedia()` from Hair widget
- Add: `videoStream` prop requirement
- Use: Shared stream for video display

### **Step 2: Avatar Widget Update**
- Pass: `videoStreamRef.current` to Hair widget
- Ensure: Stream ready before Hair widget render

### **Step 3: Stream Validation**
- Validate: Stream exists before Hair widget
- Error: Show proper error if no stream

## 🧪 TEST PLAN

### **Test Case 1: Single Stream**
1. Hair button → Check only 1 getUserMedia call
2. Hair widget → Uses shared stream
3. No permission errors

### **Test Case 2: Stream Reuse**
1. Main camera active
2. Hair button → Reuses same stream
3. Both widgets work simultaneously

## 📊 SUCCESS METRICS

- ✅ Single `getUserMedia()` call
- ✅ Hair widget uses shared stream
- ✅ No browser permission errors
- ✅ Both cameras work simultaneously