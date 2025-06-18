import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import HelloNFT from '../contracts/HelloNFT.json';
import helloNFTAddressJson from '../contracts/hello-nft-address.json';
import './Gallery.css';
import GalleryLoading from './GalleryLoading';

const getHelloNFTAddresses = () => Object.values(helloNFTAddressJson).filter(
  (addr) => typeof addr === 'string' && addr.startsWith('0x')
);

const Gallery = () => {
  const [galleryNFTs, setGalleryNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let stop = false;
    const fetchAllNFTs = async () => {
      setLoading(true);
      setError('');
      let allNFTs = [];
      const provider = window.ethereum
        ? new ethers.providers.Web3Provider(window.ethereum)
        : ethers.getDefaultProvider();
      const helloNFTAddresses = getHelloNFTAddresses();
      try {
        for (const contractAddr of helloNFTAddresses) {
          const nftContract = new ethers.Contract(contractAddr, HelloNFT.abi, provider);
          let totalSupply;
          try {
            totalSupply = await nftContract.totalSupply();
          } catch (err) {
            setError('Failed to fetch totalSupply for contract ' + contractAddr);
            continue;
          }
          for (let i = 0; i < totalSupply; i++) {
            let tokenId = i;
            try {
              const owner = await nftContract.ownerOf(tokenId);
              const tokenURI = await nftContract.tokenURI(tokenId);
              let url = tokenURI;
              if (url.startsWith('ipfs://')) {
                url = url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
              }
              let metadata = { tokenId: tokenId.toString(), contract: contractAddr, owner };
              try {
                const res = await fetch(url);
                if (res.ok) {
                  const meta = await res.json();
                  metadata = { ...metadata, ...meta };
                } else {
                  metadata.error = `HTTP ${res.status} ${res.statusText}`;
                }
              } catch (fetchEx) {
                metadata.error = fetchEx.message;
              }
              allNFTs.push(metadata);
            } catch (err) {
              // skip if token does not exist or error
              continue;
            }
          }
        }
        if (!stop) setGalleryNFTs(allNFTs);
      } catch (err) {
        setError('Failed to load NFTs: ' + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    fetchAllNFTs();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchAllNFTs, 30000);
    return () => { stop = true; clearInterval(interval); };
  }, []);

  return (
    <div className="gallery-container">
      <h1 className="gallery-title"><strong>|| HelloNFTs Gallery ||</strong></h1>
      {loading && <GalleryLoading />}

      {error && <div className="error-message">{error}</div>}
      <div className="gallery-list">
        {galleryNFTs.length === 0 && !loading && (
          <div style={{textAlign: 'center', color: '#666'}}>No NFTs minted yet.</div>
        )}
        {galleryNFTs.map((nft, idx) => (
          <div key={nft.contract + '-' + nft.tokenId} className="gallery-card">
            <div className="nft-token-id">Token ID: {nft.tokenId}</div>
            <div className="nft-contract">Contract: {nft.contract && (nft.contract.slice(0, 6) + '...' + nft.contract.slice(-4))}</div>
            {nft.image ? (
              <div className="nft-image-box">
                <img
                  src={nft.image.startsWith('ipfs://') ? nft.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') : nft.image}
                  alt={nft.name || 'NFT'}
                  onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300?text=No+Image'; }}
                />
              </div>
            ) : (
              <div className="nft-no-image">No Image</div>
            )}
            <div className="nft-name">Name: {nft.name || 'Unnamed NFT'}</div>
            <div className="nft-desc">Description: {nft.description || 'No description available'}</div>
            <div className="nft-owner"><strong>Owner: </strong><span className="monospace">{nft.owner}</span></div>
            {nft.error && <div className="nft-error">{nft.error}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
