import React from 'react';

export default function TestPage() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Test Sayfası</h1>
      <p>Eğer bunu görüyorsanız, React çalışıyor.</p>
      <button onClick={() => alert('Test butonu çalışıyor!')}>
        Test Et
      </button>
    </div>
  );
}