import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Loading from './Loading';

const Backend = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState('Not set yet');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");

  // Contract ABI
  const abi = [
    'constructor(string memory _greeting)',
    'function greet() view returns (string)',
    'function setGreeting(string memory _greeting)'
  ];

  // Contract address
  const contractAddress = '0x794922e3AfBd490D22B33b31E374F486Ef3803D0';

  // Update greeting
  const updateGreeting = async (newGreeting) => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      setLoading(true);
      setError('');

      // Update greeting
      const tx = await contract.setGreeting(newGreeting);
      await tx.wait(); // Wait for transaction to be mined

      // Get updated greeting
      const updatedGreeting = await contract.greet();
      setGreeting(updatedGreeting);
      return true; // Return success
    } catch (error) {
      console.error('Error updating greeting:', error);
      setError(error.message);
      return false; // Return failure
    } finally {
      setLoading(false);
    }
  };

  // Initialize contract
  const initContract = async (signer) => {
    try {
      if (!signer) return null;
      
      // Initialize contract
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      // Get initial greeting with retry
      try {
        // First try to get greeting
        const initialGreeting = await contract.greet();
        setGreeting(initialGreeting);
      } catch (greetingError) {
        console.error('Error getting initial greeting:', greetingError);
        // If error, try setting a default greeting
        try {
          // Set default greeting
          await contract.setGreeting("Hello World!");
          const initialGreeting = await contract.greet();
          setGreeting(initialGreeting);
        } catch (setGreetingError) {
          console.error('Error setting default greeting:', setGreetingError);
          setGreeting('Not set yet');
        }
      }
      
      return contract;
    } catch (error) {
      console.error('Error initializing contract:', error);
      setError('Error initializing contract');
      return null;
    }
  };

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
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
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

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

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



  return (
    <div className="backend-container">
      {loading && <Loading />}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <div className="header">
        <h1>Greeter dApp</h1>
        {!isConnected ? (
          <button onClick={handleConnect} className="connect-btn">
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <span>Connected: {walletAddress.substring(0, 6)}...</span>
            <button onClick={handleDisconnect} className="disconnect-btn">
              Disconnect
            </button>
          </div>
        )}
      </div>

      {isConnected && contract && (
        <div className="content">
          <div className="greeting-section">
            <p className="current-greeting">
              Current Greeting: {greeting}
            </p>
          </div>

          <div className="update-section">
            <input
              type="text"
              placeholder="Enter new greeting..."
              className="greeting-input"
              value={input}
              onChange={handleInputChange}
              disabled={loading}
            />
            <button
              onClick={handleUpdate}
              disabled={loading || !input.trim()}
              className="update-btn"
            >
              {loading ? 'Updating...' : 'Update Greeting'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backend;
