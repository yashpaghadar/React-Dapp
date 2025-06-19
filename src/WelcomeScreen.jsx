import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./WelcomeScreen.css";

export default function WelcomeScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/app');
    }, 5000);
    
    // Clean up the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [navigate]);

  // Generate 24 random particles
  const particles = Array.from({ length: 24 }, (_, i) => {
    const size = Math.random() * 7 + 4;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const duration = Math.random() * 2 + 3;
    return (
      <div
        key={i}
        className="welcome-particle"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          top: `${top}%`,
          animationDuration: `${duration}s`,
        }}
      />
    );
  });

  return (
    <div className="welcome-hero-bg">
      {/* Decorative background logo, top left */}
      <div className="welcome-bg-logo-corner">
        <img src="/vite.svg" alt="Logo" width={70} height={70} className="corner-logo" />
      </div>
      {/* Modern floating geometric shapes */}
      <div className="welcome-geo-shapes">
        <div className="geo-shape geo-square"></div>
        <div className="geo-shape geo-circle"></div>
        <div className="geo-shape geo-triangle"></div>
      </div>
      <div className="welcome-content">
        {/* Main app logo, centered */}
        <div className="welcome-logo-anim">
          <img src="/vite.svg" alt="Logo" width={90} height={90} />
        </div>
        <h1 className="welcome-title gradient-text">Welcome to the Dapp!</h1>
        <p className="welcome-desc"><span style={{ color: '#232946' }}>Experience the future of decentralized apps.<br />Get started by exploring our NFT Gallery or creating something new!</span></p>
        <button 
          className="welcome-shine-btn" 
          onClick={() => navigate('/app')}
          tabIndex={0}
          aria-label="Go to app"
        >
          Let's Go!
        </button>
      </div>
      <div className="welcome-animated-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
      </div>
    </div>
  );
}

