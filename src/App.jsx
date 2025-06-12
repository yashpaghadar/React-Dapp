//  npm run dev:frontend

import React from 'react';
import Backend from './components/Backend';
import Frontend from './components/Frontend';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Backend />
      <Frontend />
    </div>
  );
}

export default App;
