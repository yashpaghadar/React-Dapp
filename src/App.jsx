import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import './components/NavButtons.css';
import Backend from './components/Backend';
import Gallery from './components/Gallery';
import './App.css';

function AppRoutes() {
  const location = useLocation();
  return (
    <div className="app-container">
      <nav className="nav-buttons">
        <Link className={location.pathname === "/" ? "nav-button nav-button-active" : "nav-button"} to="/">Home</Link>
        <Link className={location.pathname === "/gallery" ? "nav-button nav-button-active" : "nav-button"} to="/gallery">NFT Gallery</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Backend />} />
        <Route path="/gallery" element={<Gallery />} />
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
