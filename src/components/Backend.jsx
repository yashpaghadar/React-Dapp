import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Backend = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState('Not set yet');
  const [contract, setContract] = useState(null);
  const [newGreeting, setNewGreeting] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Contract ABI
  const abi = [
    'function greet() view returns (string)',
    'function setGreeting(string memory _greeting) public',
    'function owner() view returns (address)',
    'event GreetingUpdated(string oldGreeting, string newGreeting)'
  ];

  // Contract address
  const contractAddress = '0x60FCC1CCA8D6661Dcd573af7370EaED61F99B768';

  // Initialize contract
  const initContract = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask');
        return null;
      }

      // Initialize provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Initialize contract
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      // Check contract exists
      try {
        const code = await provider.getCode(contractAddress);
        if (code === '0x') {
          throw new Error('Contract not deployed at this address');
        }
      } catch (err) {
        throw new Error('Could not verify contract deployment');
      }
      
      // Check if we can call a contract function
      try {
        const greeting = await contract.greet();
        if (!greeting) {
          throw new Error('Contract is not responding');
        }
      } catch (err) {
        throw new Error('Could not interact with contract');
      }
      
      return contract;
    } catch (err) {
      console.error('Contract initialization error:', err);
      setError(err.message || 'Error connecting to contract');
      return null;
    }
  };

  // Get initial greeting
  useEffect(() => {
    const loadInitialGreeting = async () => {
      const contract = await initContract();
      if (contract) {
        const initialGreeting = await contract.greet();
        setGreeting(initialGreeting);
      }
    };
    loadInitialGreeting();
  }, []);

  // Handle connect
  const handleConnect = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask not installed');
        return;
      }

      // Request accounts
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        setError("");
        
        // Initialize provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Initialize contract
        const initializedContract = await initContract(signer);
        setContract(initializedContract);
      }      
    } catch (error) {
      setError(error.message || 'Error connecting wallet');
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress("");
    setError("");
    setGreeting('Not set yet');
    setContract(null);
    setNewGreeting('');
  };

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const initializedContract = await initContract(signer);
            setContract(initializedContract);
          } catch (error) {
            console.error('Error updating contract:', error);
            setError('Error updating contract');
          }
        }
      });

      window.ethereum.on('chainChanged', () => {
        handleDisconnect();
        // Don't reload page automatically
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Update greeting
  const updateGreeting = async (newGreeting) => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      if (!newGreeting.trim()) {
        throw new Error('Please enter a valid greeting');
      }

      setIsLoading(true);
      
      // Get current greeting first
      const currentGreeting = await contract.greet();
      
      // Call contract
      const tx = await contract.setGreeting(newGreeting);
      
      // Wait for transaction
      const receipt = await tx.wait();
      
      // Verify transaction success
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }
      
      // Verify new greeting
      const newGreetingOnChain = await contract.greet();
      if (newGreetingOnChain !== newGreeting) {
        throw new Error('Greeting update failed - value mismatch');
      }
      
      // Update state
      setGreeting(newGreeting);
      setNewGreeting('');
      setError('Greeting updated successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error updating greeting:', error);
      setError(error.message || 'Error updating greeting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="backend-container">
      <div className="header">
        <div className="title-section">
          <h1 className="app-title">Greeter dApp</h1>
        </div>
        <div className="wallet-actions">
          {!isConnected ? ( 
            <button 
              onClick={handleConnect} 
              className="connect-btn primary-btn"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="wallet-info">
              <div className="address-display">
                <span className="address-label">Connected:</span>
                <span className="address-value">{walletAddress.substring(0, 6)}...</span>
              </div>
              <button 
                onClick={handleDisconnect} 
                className="disconnect-btn secondary-btn"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message error-alert">
          <div className="error-icon">⚠️</div>
          <span className="error-text">{error}</span>
        </div>
      )}

      {isConnected && contract && (
        <div className="content">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Updating greeting...</p>
            </div>
          ) : (
            <>
              <div className="greeting-section card">
                <div className="greeting-display">
                  <h2>Current Greeting</h2>
                  <p className="current-greeting">{greeting}</p>
                </div>
              </div>
              <div className="update-section card">
                <div className="input-group">
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      placeholder="Enter new greeting..."
                      className="input-field"
                      value={newGreeting}
                      onChange={(e) => setNewGreeting(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          updateGreeting(e.target.value);
                        }
                      }}
                      disabled={isLoading}
                    />
                    <div className="input-hint">
                      {newGreeting.length > 0 && !isLoading && (
                        <>
                          <span className="char-count">{newGreeting.length}/50</span>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${(newGreeting.length / 50) * 100}%` }}
                            ></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (newGreeting.trim()) {
                        updateGreeting(newGreeting);
                      }
                    }}
                    className={`primary-btn ${isLoading ? 'disabled-btn' : ''} ${!newGreeting.trim() ? 'disabled-btn' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <div className="button-spinner"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Greeting'
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Backend;
