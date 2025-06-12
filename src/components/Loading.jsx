import React from 'react';
import './components.css';

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <h2>Deploying Smart Contract...</h2>
      <p>Please wait while we deploy the contract to the blockchain.</p>
    </div>
  );
};

export default Loading;
