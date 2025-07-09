# Kamera Trigger Sistemi - Çakışma Çözümü

## 🎯 AMAÇ
Hair analysis ve ana kamera arasındaki çakışmaları çözmek için trigger kelimeler sistemi eklendi.

## 🔧 UYGULANAN ÇÖZÜM

### 1. **Camera Manager'a Trigger Kontrol Eklendi**
```typescript
// camera-manager.ts
export let isCameraForcedOff = false;

export async function ensureCameraReady(): Promise<MediaStream> {
  if (isCameraForcedOff) {
    console.log("🔴 Kamera trigger ile kapatılmış - stream yok");
    throw new Error("Camera disabled by trigger");
  }
  // ... rest of logic
}

export function triggerCameraOff(): void {
  console.log("🔴 TRIGGER: kadirli - Kamera kapatılıyor");
  isCameraForcedOff = true;
  stopCameraStream();
}

export function triggerCameraOn(): void {
  console.log("🟢 TRIGGER: kozan - Kamera açılıyor");
  isCameraForcedOff = false;
}
```

### 2. **Chat Input Trigger Detection**
```typescript
// avatar-chat-widget.tsx - handleSendMessage
const message = text.trim().toLowerCase();
if (message === 'kadirli') {
  const { triggerCameraOff } = await import('../utils/camera-manager');
  triggerCameraOff();
  // Show confirmation message
  return;
}

if (message === 'kozan') {
  const { triggerCameraOn } = await import('../utils/camera-manager');
  triggerCameraOn();
  // Show confirmation message
  return;
}
```

### 3. **Voice Input Trigger Detection**
Speech recognition results otomatik olarak `handleSendMessage` fonksiyonuna gidiyor, bu nedenle hem text hem voice input'ta trigger kelimeler çalışıyor.

## 🎮 KULLANIM

### **Kamera Kapatma**
- Chat input'a "kadirli" yaz
- Mikrofona "kadirli" söyle
- Kamera derhal kapatılır ve stream durdurulur

### **Kamera Açma**
- Chat input'a "kozan" yaz
- Mikrofona "kozan" söyle
- Kamera açılır ve yeniden kullanılabilir

## ✅ BEKLENEN SONUÇLAR

1. **Kamera Çakışması Çözümü**: Hair analysis ile ana kamera arasında çakışma olmayacak
2. **Kolay Kontrol**: Kullanıcı basit kelimelerle kamerayı kontrol edebilecek
3. **Güvenli Trigger**: Sadece exact match "kadirli" ve "kozan" kelimelerinde çalışır
4. **Responsive Feedback**: Chat'te confirmation mesajları gösterilir

## 🎯 TEST SENARYOSU

1. Normal kullanım → Hair butonuna tıkla → Kamera çakışması görürsen
2. Chat'e "kadirli" yaz → Kamera kapatıldı mesajı gelir
3. Hair butonuna tekrar tıkla → Kamera kapalı olduğu için hata vermez
4. Chat'e "kozan" yaz → Kamera açıldı mesajı gelir
5. Hair butonuna tekrar tıkla → Kamera normal çalışır