import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// // import { PinataFDK } from 'pinata-web3'; // REMOVED: Use REST API with fetch // REMOVED: Use REST API with fetch
import Greeter from '../contracts/Greeter.json';
import HelloToken from '../contracts/HelloToken.json';
import helloTokenAddressJson from '../contracts/hello-token-address.json';
import contractAddressJson from '../contracts/contract-address.json';
import HelloNFT from '../contracts/HelloNFT.json';
import helloNFTAddressJson from '../contracts/hello-nft-address.json';

// Helper to get all NFT contract addresses from the JSON
const getHelloNFTAddresses = () => {
  return Object.values(helloNFTAddressJson).filter(
    (addr) => typeof addr === 'string' && addr.startsWith('0x')
  );
};
import Loading from './Loading';
import './Backend.css';

const Backend = () => {
  // NFT Mint Form State
  const [nftImage, setNftImage] = useState(null);
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  // Pinata JWT (never expose secret keys in frontend for production!)
  const [pinataJWT, setPinataJWT] = useState("");
  const [ipfsUploading, setIpfsUploading] = useState(false);
  const [ipfsError, setIpfsError] = useState("");
  // NFT Dashboard State
  const [nftIds, setNftIds] = useState([]); // List of owned tokenIds
  const [nftMeta, setNftMeta] = useState([]); // Metadata for owned NFTs
  const [nftLoading, setNftLoading] = useState(false);
  const [nftError, setNftError] = useState("");
  // ...existing state
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [mintMessage, setMintMessage] = useState("");
  const [mintError, setMintError] = useState("");
  const [mintSuccess, setMintSuccess] = useState("");
  const [lastMintedMetadata, setLastMintedMetadata] = useState(null); // { metadataURI, imageURI }
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [transferMessage, setTransferMessage] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [hltBalance, setHltBalance] = useState(null);
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  // Watch for wallet/network changes to refresh NFTs
  useEffect(() => {
    if (isConnected && isCorrectNetwork && walletAddress) {
      // Use window.ethereum or provider from ethers
      let provider;
      if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
      } else {
        provider = ethers.getDefaultProvider();
      }
      fetchHelloNFTs(walletAddress, provider);
    } else {
      setNftIds([]);
      setNftMeta([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, isConnected, isCorrectNetwork]);

  // Greeter ABI and address
  const abi = Greeter.abi;
  const contractAddress = contractAddressJson.address;

  // HelloToken ABI and address
  const helloTokenAbi = HelloToken.abi;
  const helloTokenAddress = helloTokenAddressJson.address;

  // HelloNFT ABI
  const helloNFTAbi = HelloNFT.abi;
  // All HelloNFT contract addresses
  const helloNFTAddresses = getHelloNFTAddresses();

  // Pick the first NFT contract for minting (demo)
  const mintNFTContract = helloNFTAddresses[0];

  /**
   * Mint a HelloNFT to the connected user, uploading image and metadata to IPFS
   */
  const mintNFT = async () => {
    setMinting(true);
    setMintError("");
    setMintSuccess("");
    setIpfsError("");
    setIpfsUploading(true);
    try {
      if (!window.ethereum || !walletAddress) throw new Error("Wallet not connected");
      if (!mintNFTContract) throw new Error("No NFT contract available");
      if (!nftImage) throw new Error("Please select an image for your NFT.");
      if (!nftName.trim()) throw new Error("Please enter a name for your NFT.");
      if (!pinataJWT.trim()) throw new Error("Please enter your Pinata JWT.");

      // 1. Upload image to IPFS via Pinata REST API
      setIpfsUploading(true);
      const imageFile = nftImage;
      const formData = new FormData();
      formData.append('file', imageFile);
      const imageRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${pinataJWT.trim()}` },
        body: formData
      });
      if (!imageRes.ok) throw new Error('Failed to upload image to Pinata');
      const imageResult = await imageRes.json();
      const imageCid = imageResult.IpfsHash;
      const imageIpfsUrl = `ipfs://${imageCid}`;

      // 2. Create metadata.json and upload to Pinata
      const metadata = {
        name: nftName,
        description: nftDescription,
        image: imageIpfsUrl
      };
      const metadataRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pinataJWT.trim()}`
        },
        body: JSON.stringify(metadata)
      });
      if (!metadataRes.ok) throw new Error('Failed to upload metadata to Pinata');
      const metadataResult = await metadataRes.json();
      const metadataCid = metadataResult.IpfsHash;
      const tokenURI = `ipfs://${metadataCid}`;

      setIpfsUploading(false);

      // 4. Mint NFT with tokenURI
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const nftContract = new ethers.Contract(mintNFTContract, helloNFTAbi, signer);
      const tx = await nftContract.mintNFT(walletAddress, tokenURI);
      await tx.wait();
      setLastMintedMetadata({
        metadataURI: tokenURI,
        imageURI: imageIpfsUrl
      });
      setMintSuccess("NFT minted successfully!");
setTimeout(() => setMintSuccess(""), 1000);
      // Refresh NFT list
      fetchHelloNFTs(walletAddress, signer);
    } catch (err) {
      setIpfsUploading(false);
      // Special handling for Ownable error
      const errMsg = err.reason || err.message || "Mint failed";
      if (errMsg.includes("Ownable: caller is not the owner")) {
        setMintError("execution reverted: Ownable: caller is not the owner");
        setTimeout(() => setMintError(""), 5000);
      } else if (errMsg.toLowerCase().includes('web3storage')) {
        setIpfsError(errMsg);
      } else {
        setMintError(errMsg);
      }
    } finally {
      setMinting(false);
      setIpfsUploading(false);
    }
  };

  /**
   * Fetch all HelloNFTs owned by the user from all contracts
   * @param {string} address - user's wallet address
   * @param {ethers.Signer|ethers.Provider} providerOrSigner
   */
  const fetchHelloNFTs = async (address, providerOrSigner) => {
    setNftLoading(true);
    setNftError("");
    setNftIds([]);
    setNftMeta([]);
    try {
      if (!address || !ethers.utils.isAddress(address)) {
        setNftLoading(false);
        return;
      }
      let allIds = [];
      let allMeta = [];
      let errors = [];
      for (const contractAddr of helloNFTAddresses) {
        try {
          const nftContract = new ethers.Contract(contractAddr, helloNFTAbi, providerOrSigner);
          const balance = await nftContract.balanceOf(address);
          for (let i = 0; i < balance; i++) {
            const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
            allIds.push(tokenId.toString());
            // Fetch tokenURI and metadata
            try {
              const tokenURI = await nftContract.tokenURI(tokenId);
              let metadata = { tokenId: tokenId.toString(), tokenURI, contract: contractAddr };
              if (tokenURI) {
                let url = tokenURI;
                if (url.startsWith('ipfs://')) {
                  url = url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                }
                let fetchError = null;
                let res = null;
                try {
                  res = await fetch(url);
                  if (res.ok) {
                    const meta = await res.json();
                    metadata = { ...metadata, ...meta };
                  } else {
                    fetchError = `HTTP ${res.status} ${res.statusText}`;
                  }
                } catch (fetchEx) {
                  fetchError = fetchEx.message;
                }
                if (fetchError) {
                  metadata.error = `Failed to load metadata from ${url}: ${fetchError}`;
                }
              }
              allMeta.push(metadata);
            } catch (metaErr) {
              allMeta.push({ tokenId: tokenId.toString(), contract: contractAddr, error: `Failed to load metadata: ${metaErr.message}` });
            }
          }
        } catch (err) {
          errors.push(`Error with contract ${contractAddr}: ${err.reason || err.message}`);
        }
      }
      setNftIds(allIds);
      setNftMeta(allMeta);
      if (errors.length > 0) setNftError(errors.join('; '));
    } catch (error) {
      setNftError("Error fetching NFTs: " + (error.reason || error.message));
      setNftIds([]);
      setNftMeta([]);
    } finally {
      setNftLoading(false);
    }
  };

  // Mint HLT faucet function
  const mintHLT = async () => {
    if (!walletAddress) return;
    setMinting(true);
    setMintMessage("");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const token = new ethers.Contract(helloTokenAddress, helloTokenAbi, signer);
      // Mint 10 HLT (assume 18 decimals)
      const decimals = await token.decimals();
      const amount = ethers.utils.parseUnits("10", decimals);
      const tx = await token.mint(walletAddress, amount);
      await tx.wait();
      setMintMessage("Successfully minted 10 HLT!");
      setMinted(true);
      // Hide mint message after 5 seconds
      setTimeout(() => setMintMessage("") , 5000);
      // Allow remint after 15 seconds
      setTimeout(() => setMinted(false), 15000);
      // Refresh balance
      fetchHLTBalance(walletAddress, signer);
    } catch (error) {
      if (error.code === 4001) {
        setMintMessage("User rejected transaction");
        if (window._mintMsgTimeout) clearTimeout(window._mintMsgTimeout);
        window._mintMsgTimeout = setTimeout(() => setMintMessage(""), 5000);
      } else {
        setMintMessage(error.reason || error.message || "Mint failed");
      }
    } finally {
      setMinting(false);
    }
  };

  // Initialize a public provider for read-only access
  const publicProvider = new ethers.providers.InfuraProvider('sepolia');

  // Fetch greeting in read-only mode
  const fetchGreetingReadOnly = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, abi, publicProvider);
      const greeting = await contract.greet();
      setGreeting(greeting);
      setIsReadOnly(true);
    } catch (error) {
      console.error('Error Fetching Greeting:', error);
      setError('Error Fetching Greeting from Network');
    }
  };

  // Update greeting with ERC20 approval flow (NEW)
  const updateGreeting = async (newGreeting) => {
    try {
      setLoading(true);
      setError("");
      setGreetingMessage("");

      // Check wallet connection
      if (!window.ethereum || !walletAddress) {
        setError("Wallet not connected");
        return false;
      }
      // Check contract instance
      if (!contract) {
        setError("Contract not initialized");
        return false;
      }

      // Get signer and re-initialize Greeter contract
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const greeterWithSigner = new ethers.Contract(contractAddress, abi, signer);
      const token = new ethers.Contract(helloTokenAddress, helloTokenAbi, signer);

      // Get decimals and calculate payment amount
      const decimals = await token.decimals();
      const amount = ethers.utils.parseUnits("10", decimals);
      const balance = await token.balanceOf(walletAddress);
      let allowance = await token.allowance(walletAddress, contractAddress);
      console.log('[updateGreeting] walletAddress:', walletAddress);
      console.log('[updateGreeting] contractAddress:', contractAddress);
      console.log('[updateGreeting] helloTokenAddress:', helloTokenAddress);
      console.log('[updateGreeting] decimals:', decimals);
      console.log('[updateGreeting] amount:', amount.toString());
      console.log('[updateGreeting] balance:', balance.toString());
      console.log('[updateGreeting] allowance:', allowance.toString());

      // Check balance
      if (balance.lt(amount)) {
        setError(`Insufficient HLT balance (need 10 HLT, have ${ethers.utils.formatUnits(balance, decimals)})`);
        return false;
      }

      // Approve if needed, then refresh allowance
      if (allowance.lt(amount)) {
        setGreetingMessage("Approving 10 HLT for greeting update...");
        try {
          const approveTx = await token.approve(contractAddress, amount);
          console.log('[updateGreeting] Sent approve tx:', approveTx.hash);
          await approveTx.wait();
          setGreetingMessage("Approval successful! Updating greeting...");
          // Refresh allowance after approval
          allowance = await token.allowance(walletAddress, contractAddress);
          console.log('[updateGreeting] allowance after approval:', allowance.toString());
          if (allowance.lt(amount)) {
            setError("Allowance did not update after approval. Please try again.");
            setGreetingMessage("");
            return false;
          }
        } catch (approveError) {
          setError((approveError && (approveError.reason || approveError.message)) || JSON.stringify(approveError) || "Failed to approve HLT");
          setGreetingMessage("");
          console.error('[updateGreeting] Approve error:', approveError);
          return false;
        }
      }

      // Call setGreeting
      try {
        console.log('[updateGreeting] Calling setGreeting...');
        const tx = await greeterWithSigner.setGreeting(newGreeting);
        console.log('[updateGreeting] setGreeting tx sent:', tx.hash);
        await tx.wait();
        setGreetingMessage("Greeting updated successfully!");
        setTimeout(() => setGreetingMessage(""), 5000);
        // Refresh greeting and balance
        const updatedGreeting = await greeterWithSigner.greet();
        setGreeting(updatedGreeting);
        fetchHLTBalance(walletAddress, signer);
        return true;
      } catch (greetError) {
        setError((greetError && (greetError.reason || greetError.message)) || JSON.stringify(greetError) || "Failed to update greeting");
        setGreetingMessage("");
        console.error('[updateGreeting] setGreeting error:', greetError);
        return false;
      }
    } catch (error) {
      setError((error && (error.reason || error.message)) || JSON.stringify(error) || "Failed to update greeting");
      setGreetingMessage("");
      console.error('[updateGreeting] General error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };


  // Check MetaMask status
  const checkMetaMask = () => {
    // Debug information
    console.log('Checking MetaMask status...');
    console.log('window.ethereum:', window.ethereum);
    console.log('typeof window.ethereum:', typeof window.ethereum);

    // Check if MetaMask is installed
    const isMetaMaskInstalled = 
      typeof window.ethereum !== 'undefined' &&
      window.ethereum?.isMetaMask === true;

    console.log('isMetaMaskInstalled:', isMetaMaskInstalled);
    setIsMetaMaskInstalled(isMetaMaskInstalled);
    
    if (!isMetaMaskInstalled) {
      setError('MetaMask Not Installed');
      return;
    }

    // Check network
    window.ethereum.request({ method: 'eth_chainId' })
      .then(chainId => {
        const isSepolia = chainId === '0xaa36a7'; // Sepolia network ID
        setIsCorrectNetwork(isSepolia);
        if (!isSepolia) {
          setNetworkError('Please Switch to Sepolia Testnet');
        } else {
          setNetworkError('');
        }
      })
      .catch(error => {
        console.error('Error Checking Network:', error);
        setNetworkError('Error Checking Network');
      });
  };

  // Initialize contract
  const initContract = async (signer) => {
    try {
      if (!signer) return null;
      
      // Check network before initializing contract
      if (!isCorrectNetwork) {
        throw new Error('Please Switch to Sepolia Testnet');
      }
      
      // Initialize contract
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      // Get initial greeting with retry
      try {
        // First try to get greeting
        const initialGreeting = await contract.greet();
        setGreeting(initialGreeting);
      } catch (greetingError) {
        console.error('Error Getting Initial Greeting:', greetingError);
        // If error, try setting a default greeting
        try {
          // Set default greeting
          await contract.setGreeting("Hello World!");
          const initialGreeting = await contract.greet();
          setGreeting(initialGreeting);
        } catch (setGreetingError) {
          console.error('Error Setting Default Greeting:', setGreetingError);
          setGreeting(null);
        }
      }
      
      return contract;
    } catch (error) {
      console.error('Error Initializing Contract:', error);
      setError(error.message);
      return null;
    }
  };

  // Fetch HLT balance
  const fetchHLTBalance = async (address, providerOrSigner) => {
    try {
      const token = new ethers.Contract(helloTokenAddress, helloTokenAbi, providerOrSigner);
      const balance = await token.balanceOf(address);
      const decimals = await token.decimals();
      setHltBalance(ethers.utils.formatUnits(balance, decimals));
    } catch (error) {
      setHltBalance(null);
      console.error('Error fetching HLT balance:', error);
    }
  };

  // Handle HLT transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferLoading(true);
    setError("");
    setTransferMessage("");
    try {
      if (!walletAddress) throw new Error('Wallet Not Connected');
      if (!transferTo || !transferAmount) throw new Error('Recipient and amount required');
      // Get signer from MetaMask
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      // Use HelloToken contract for transfer
      const token = new ethers.Contract(helloTokenAddress, helloTokenAbi, signer);
      const decimals = await token.decimals();
      const amount = ethers.utils.parseUnits(transferAmount, decimals);
      const tx = await token.transfer(transferTo, amount);
      await tx.wait();
      setTransferMessage('Transfer successful!');
      setTimeout(() => setTransferMessage(""), 5000); // Clear after 5 seconds
      setTransferTo("");
      setTransferAmount("");
      // Refresh balance
      fetchHLTBalance(walletAddress, signer);
    } catch (error) {
      setError(error.message);
      setTransferMessage("");
    } finally {
      setTransferLoading(false);
    }
  };


  // Handle connect
  const handleConnect = async () => {
    // ...existing logic...
    // After connecting wallet, fetch NFTs
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      await fetchHelloNFTs(walletAddress, signer);
    } catch (e) {
      setNftError("Could not fetch NFTs after connection.");
    }
  
    try {
      // Reset logic on connect (removed canMint/mintTimer logic)

      if (!window.ethereum) {
        setError('MetaMask Not Installed');
        return;
      }
      setLoading(true);
      setError("");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];
      setWalletAddress(address);
      setIsConnected(true);
      setIsReadOnly(false);
      setLoading(false);
      // Initialize contract with signer
      const signer = provider.getSigner();
      const initializedContract = await initContract(signer);
      setContract(initializedContract);
      // Fetch HLT balance
      fetchHLTBalance(address, signer);
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    setNftIds([]);
    setNftError("");
    setIsConnected(false);
    setWalletAddress("");
    setContract(null);
    setIsReadOnly(true);
    setError("");
    setNetworkError("");
  };

  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Handle update
  const handleUpdate = async () => {
    if (!input.trim()) return;

    try {
      setLoading(true);
      setError('');
      const result = await updateGreeting(input);
      if (result) {
        setInput("");
      } else {
        setError("Failed to update greeting");
      }
    } catch (error) {
      console.error('Error updating greeting:', error);
      setError(error.message || "Failed to update greeting");
    } finally {
      setLoading(false);
    }
  };

  // Handle account changes and network changes
  useEffect(() => {
    // First check MetaMask status
    checkMetaMask();

    // Initialize contract for event listening
    const initializeContractWithEvents = async () => {
      try {
        let provider;
        let contract;

        if (window.ethereum) {
          // Connected mode
          provider = new ethers.providers.Web3Provider(window.ethereum);
          contract = new ethers.Contract(contractAddress, abi, provider);
        } else {
          // Read-only mode
          provider = publicProvider;
          contract = new ethers.Contract(contractAddress, abi, provider);
        }

        // Listen to GreetingUpdated events
        contract.on('GreetingUpdated', (newGreeting) => {
          console.log('Greeting updated:', newGreeting);
          setGreeting(newGreeting);
        });

        // Also fetch latest greeting periodically
        const fetchLatestGreeting = async () => {
          try {
            const latestGreeting = await contract.greet();
            setGreeting(latestGreeting);
          } catch (error) {
            console.error('Error fetching latest greeting:', error);
          }
        };

        // Fetch initial greeting
        await fetchLatestGreeting();

        // Set up periodic refresh (every 20 seconds)
        const refreshInterval = setInterval(fetchLatestGreeting, 20000);

        // Cleanup interval on unmount
        return () => {
          clearInterval(refreshInterval);
          contract.removeAllListeners('GreetingUpdated');
        };
      } catch (error) {
        console.error('Error initializing contract:', error);
        setError('Error initializing contract');
      }
    };

    initializeContractWithEvents();

    // Set up event listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          
          try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner(0); // Get the first account's signer
            const initializedContract = await initContract(signer);
            setContract(initializedContract);
          } catch (error) {
            console.error('Error updating contract:', error);
            setError('Error updating contract');
          }
        }
      });

      window.ethereum.on('chainChanged', () => {
        checkMetaMask();
        handleDisconnect();
      });
    }

    // Cleanup event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []); // Empty dependency array to run only once on mount

  useEffect(() => {
    checkMetaMask();
    // Always show greeting in read-only mode if not connected
    if (!isConnected) {
      fetchGreetingReadOnly();
    }
  }, [isConnected]);

  if (transferLoading || loading) {
    return (
      <div className="backend-container">
        <Loading message="Transaction in progress..." />
      </div>
    );
  }

  return (
    <div className="backend-container">

      {networkError && (
        <div className="network-error">
          <div className="error-icon">⚠️</div>
          <div className="error-text">{networkError}</div>
        </div>
      )}

      {/* MetaMask Installation Check */}
      {!isMetaMaskInstalled && (
        <div className="metamask-install">
          <div className="install-icon">⚠️</div>
          <div className="install-text">
            <p>MetaMask Wallet Not Detected.</p>
            <p>Please Install MetaMask from <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">metamask.io</a></p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <div className="error-icon">❌</div>
          <div className="error-text">{error}</div>
        </div>
      )}

      <div className="header">
        <h1>Greeter dApp</h1>
        {!isConnected ? (
          <button onClick={handleConnect} className="connect-btn">
            {isCorrectNetwork ? 'Connect Wallet' : 'Switch to Sepolia'}
          </button>
        ) : (
          <div className="wallet-info">
            <p>Connected: {walletAddress}</p>
            <button onClick={handleDisconnect} className="disconnect-btn">
              Disconnect
            </button>
          </div>
        )}
      </div>

      {isConnected && isCorrectNetwork && (
        <div className="token-section">
          <h2>|| Your HLT Balance ||</h2>
          <p>{hltBalance !== null ? hltBalance : "-"} HLT {parseFloat(hltBalance) >= 1 ? <span className="badge eligible">Eligible</span> : <span className="badge not-eligible">Not Eligible</span>}</p>
          <button
            className="update-btn"
            onClick={mintHLT}
            disabled={minting || minted}
            style={{marginTop: '0.5rem', marginBottom: '1.5rem'}}
          >
            {minting
              ? 'Minting...'
              : minted
              ? 'Already Minted'
              : 'Mint 10 HLT (Faucet)'}
          </button>
          {mintMessage && (
            <div className="success-message" style={{marginTop: '-1.1rem', marginBottom: '2.5rem'}}>
              {mintMessage}
            </div>
          )}

          {/* Token Transfer Section - moved here under balance */}
          <form className="input-section" style={{marginTop: '2rem'}} onSubmit={e => { e.preventDefault(); handleTransfer(e); }}>
            <input
              type="text"
              placeholder="Recipient Address"
              value={transferTo}
              onChange={e => setTransferTo(e.target.value)}
              disabled={transferLoading}
              maxLength={42}
            />
            <input
              type="number"
              placeholder="Amount"
              value={transferAmount}
              onChange={e => setTransferAmount(e.target.value)}
              disabled={transferLoading}
              min={0}
              step={1}
            />
            <button
              type="submit"
              className="update-btn"
              disabled={transferLoading || !transferTo.trim() || !transferAmount}
            >
              Send HLT
            </button>
          </form>
          {transferMessage && (
            <div className="success-message">{transferMessage}</div>
          )}
        </div>
      )}

      {/* Greeting and Read-Only Section */}
      <div className="content">
        <div className="greeting-section">
          <h2>|| Current Greeting ||</h2>
          <p>{greeting}</p>
        </div>

        {/* Greeting Update Section */}
        {isConnected && isCorrectNetwork && (
          <form className="input-section" onSubmit={e => { e.preventDefault(); handleUpdate(); }}>
            <input
              type="text"
              placeholder="Enter new greeting"
              value={input}
              onChange={handleInputChange}
              disabled={loading}
              className="greeting-input"
              maxLength={64}
            />
            <button
              type="submit"
              className="update-btn"
              disabled={loading || !input.trim()}
            >
              Update Greeting
            </button>
          </form>
        )}
        {greetingMessage && (
          <div className="success-message">{greetingMessage}</div>
        )}

        {/* NFT Section: Only show if connected and on correct network */}
        {isConnected && isCorrectNetwork && (
          <section className="nft-dashboard">
            <header className="nft-dashboard-header">
              <h2 className="nft-dashboard-title">|| Your HelloNFT Collection ||</h2>
            </header>
            {/* NFT Mint Form */}
            <form
              className="nft-mint-form"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.2rem', gap: '0.5rem' }}
              onSubmit={e => { e.preventDefault(); mintNFT(); }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={e => setNftImage(e.target.files[0])}
                required
                disabled={minting || ipfsUploading}
                style={{ marginBottom: '0.5em' }}
              />
              <input
                type="text"
                placeholder="NFT Name"
                value={nftName}
                onChange={e => setNftName(e.target.value)}
                required
                disabled={minting || ipfsUploading}
                style={{ marginBottom: '0.5em' }}
              />
              <input
                type="text"
                placeholder="NFT Description (optional)"
                value={nftDescription}
                onChange={e => setNftDescription(e.target.value)}
                disabled={minting || ipfsUploading}
                style={{ marginBottom: '0.5em' }}
              />
              <input
                type="password"
                placeholder="Pinata JWT (see Pinata dashboard)"
                value={pinataJWT}
                onChange={e => setPinataJWT(e.target.value)}
                required
                disabled={minting || ipfsUploading}
                style={{ marginBottom: '0.5em' }}
              />
              <button className="mint-nft-btn" type="submit" disabled={minting || ipfsUploading}>
                {minting ? (ipfsUploading ? 'Uploading to IPFS...' : 'Minting...') : 'Mint HelloNFT'}
              </button>
              {ipfsError && <div className="error-message" style={{marginTop: '0.6em'}}>{ipfsError}</div>}
              {mintError && (
                <div className="error-message" style={{marginTop: '0.6em'}}>{mintError}</div>
              )}
              {mintSuccess && (
                <div className="success-message" style={{marginTop: '0.6em'}}>
                  {mintSuccess}
                  {lastMintedMetadata && (
                    <div style={{marginTop: '0.8em', fontSize: '0.98em'}}>
                      <div>
                        <strong>Metadata:</strong> <a href={`https://gateway.pinata.cloud/ipfs/${lastMintedMetadata.metadataURI.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer">View on Pinata</a>
                      </div>
                      <div>
                        <strong>Image:</strong> <a href={`https://gateway.pinata.cloud/ipfs/${lastMintedMetadata.imageURI.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer">View on Pinata</a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
            {nftLoading ? (
              <div className="loading-container"><div className="loading-spinner"></div>Loading Your Data...</div>
            ) : nftError ? (
              <div className="error-message">{nftError}</div>
            ) : nftIds.length > 0 ? (
              <>
                <div className="nft-list">
                      {nftMeta.map(nft => (
                        <div key={nft.tokenId + '-' + (nft.contract || '')} className="nft-card">
                          <div className="nft-token-id">Token ID: {nft.tokenId}</div>
                          <div className="nft-contract">Contract: {nft.contract && (nft.contract.slice(0, 6) + '...' + nft.contract.slice(-4))}</div>
                          {nft.image ? (
                            <img className="nft-image" src={nft.image.startsWith('ipfs://') ? nft.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') : nft.image} alt={nft.name || 'NFT'} />
                          ) : (
                            <div className="nft-no-image">No Image</div>
                          )}
                          <div className="nft-name">{nft.name || 'Unnamed NFT'}</div>
                          {nft.tokenURI && (
                            <div className="nft-tokenuri">
                              <strong>TokenURI:</strong> <a href={`https://gateway.pinata.cloud/ipfs/${nft.tokenURI.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer">{nft.tokenURI}</a>
                            </div>
                          )}
                          {nft.error && <div className="nft-error">{nft.error}</div>}
                        </div>
                      ))}
                    </div>
                {/* Gated content: Only visible to HelloNFT holders */}
                <div className="unlocked-section gated-content">
                  <div className="success-message" style={{fontSize: '1.15em', marginBottom: '1em'}}>🎉 NFT Holder Exclusive Area 🎉</div>
                  <div className="secret-message" style={{background: '#e3fcec', color: '#256029', padding: '1em', borderRadius: '8px', marginBottom: '1em'}}>
                    <strong>Secret Message:</strong> Welcome, NFT Holder! You have unlocked premium features.
                  </div>
                  <button className="special-action-btn" style={{background: '#6c63ff', color: '#fff', padding: '0.7em 1.5em', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginBottom: '1em'}} onClick={() => alert('!!You accessed a holder-only action !!')}>
                    Holder-Only Action
                  </button>
                  {/* Add more exclusive features/components here as needed */}
                </div>
              </>
            ) : (
              <div style={{textAlign: 'center', padding: '1.5rem 0'}}>
                <div className="access-warning" style={{color: '#c62828', fontWeight: 500, fontSize: '1.08em'}}>You do not own any HelloNFTs with this wallet.<br/>Mint or acquire one to unlock exclusive features!</div>
              </div>
            )}
          </section>
        )}

        {(!isConnected || !isCorrectNetwork) && (
          <div className="read-only-warning">
            <div className="warning-icon">ℹ️</div>
            <div className="warning-text">
              <p>You Are In Read-Only Mode.</p>
              <p>Connect MetaMask to Update the Greeting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Backend;