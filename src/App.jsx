import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import './components/NavButtons.css';
import Backend from './components/Backend';
import Gallery from './components/Gallery';
import WelcomeScreen from './WelcomeScreen';
import './App.css';

function AppRoutes() {
  const location = useLocation();
  const isWelcomePage = location.pathname === "/";
  
  return (
    <div className="app-container">
      {!isWelcomePage && (
        <nav className="nav-buttons">
          <Link 
            className={location.pathname === "/app" ? "nav-button nav-button-active" : "nav-button"} 
            to="/app"
          >
            Home
          </Link>
          <Link 
            className={location.pathname === "/gallery" ? "nav-button nav-button-active" : "nav-button"} 
            to="/gallery"
          >
            NFT Gallery
          </Link>
        </nav>
      )}
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/app" element={<Backend />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
