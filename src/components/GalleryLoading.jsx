import React from 'react';
import './Gallery.css';

const GalleryLoading = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <h2>Loading All NFTs...</h2>
      <p>Fetching the complete HelloNFT gallery. Please wait!</p>
    </div>
  );
};

export default GalleryLoading;
