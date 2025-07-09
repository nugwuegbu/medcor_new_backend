# Sayfa Tabanlı Kamera Sistemi - Tab-Based Camera Control

## 🎯 KONSEPT
Her sayfa Google Chrome tab'i gibi ayrı kamera kontrolüne sahip. Sadece Hair Analysis sayfası trigger kelimelerden etkilenir.

## 🔧 SISTEM YAPISI

### 1. **Ana Kamera (UserCameraView)**
- Trigger kelimelerden ETKİLENMEZ
- Tüm sayfalarda normal çalışır
- Chat widget'ındaki kamera görünümü
- "kadirli" / "kozan" komutlarından bağımsız

### 2. **Hair Analysis Kamerası**
- Sadece Hair Analysis sayfası için
- Trigger kelimelerden ETKİLENİR
- "kadirli" → Hair analysis kamerası kapatılır
- "kozan" → Hair analysis kamerası açılır

## 📋 TRIGGER KONTROLLERI

### **Camera Manager Yapısı**
```typescript
export let isHairAnalysisCameraOff = false; // Sadece Hair Analysis için

// Ana kamera - trigger'dan etkilenmez
export async function ensureCameraReady(): Promise<MediaStream>

// Hair Analysis kamerası - trigger kontrolü var
export async function ensureHairAnalysisCameraReady(): Promise<MediaStream>
```

### **Trigger Fonksiyonları**
```typescript
// Sadece Hair Analysis kamerasını etkiler
export function triggerHairAnalysisCameraOff(): void
export function triggerHairAnalysisCameraOn(): void

// Legacy - backward compatibility
export function triggerCameraOff(): void // → Hair Analysis'e yönlendiriliyor
export function triggerCameraOn(): void  // → Hair Analysis'e yönlendiriliyor
```

## 🎮 KULLANIM SENARYOSU

### **Normal Kullanım**
1. Ana kamera her zaman çalışır
2. Hair butonuna tıkla → Hair Analysis kamerası açılır
3. Diğer sayfalara git → Ana kamera çalışmaya devam eder

### **Trigger Kullanımı**
1. "kadirli" yaz → Sadece Hair Analysis kamerası kapanır
2. Hair butonuna tıkla → "Hair analysis kamerası kapalı" mesajı
3. Diğer sayfalara git → Ana kamera normal çalışır
4. "kozan" yaz → Hair Analysis kamerası tekrar açılır

## ✅ AVANTAJLAR

1. **Sayfa Bağımsızlığı**: Her sayfa kendi kamera kontrolüne sahip
2. **Kullanıcı Dostu**: Ana kamera hiçbir zaman kesintiye uğramaz
3. **Spesifik Kontrol**: Sadece Hair Analysis trigger'dan etkilenir
4. **Flexible**: Gelecekte diğer sayfalar için farklı trigger'lar eklenebilir

## 🔍 DEBUG LOGLARI

- 🎥 DEBUG: Ana kamera logları
- 🎬 HAIR DEBUG: Hair Analysis kamera logları
- 🔴 TRIGGER: Trigger aktivasyonu logları
- 🟢 TRIGGER: Trigger deaktivasyon logları