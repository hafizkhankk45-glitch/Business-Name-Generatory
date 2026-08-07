import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', lineHeight: 1.6 }}>
      <h1>Business Name Generator</h1>
      <p>The app is running and ready for the Vite build.</p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
