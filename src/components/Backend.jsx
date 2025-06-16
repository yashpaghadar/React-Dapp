import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Loading from './Loading';
import './Backend.css';

const Backend = () => {
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
  const [successMessage, setSuccessMessage] = useState("");

  // Contract ABI
  const abi = [
    'constructor(string memory _greeting)',
    'function greet() view returns (string)',
    'function setGreeting(string memory _greeting)',
    'event GreetingUpdated(string _greeting)'
  ];

  // Contract address
  const contractAddress = '0xeBc0d756a6A650b72d1e4ce0d10409EF5BAdEEae';

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

  // Update greeting
  const updateGreeting = async (newGreeting) => {
    try {
      if (!contract) {
        throw new Error('Contract Not Initialized');
      }

      setLoading(true);
      setError('');

      // Update greeting
      const tx = await contract.setGreeting(newGreeting);
      await tx.wait(); // Wait for transaction to be mined

      // Get updated greeting
      const updatedGreeting = await contract.greet();
      setGreeting(updatedGreeting);
      setSuccessMessage("Greeting updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000); // Clear message after 3 seconds
      return true; // Return success
    } catch (error) {
      console.error('Error Updating Greeting:', error);
      setError(error.message);
      return false; // Return failure
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

  // Handle connect
  const handleConnect = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask Wallet Not Detected. Please Install MetaMask First.');
        return;
      }

      // Check network before connecting
      if (!isCorrectNetwork) {
        setError('Please Switch to Sepolia Testnet in MetaMask First.');
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
        setIsReadOnly(false);
        
        // Initialize provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner(0); // Get the first account's signer
        
        // Initialize contract
        const initializedContract = await initContract(signer);
        setContract(initializedContract);
      }
    } catch (error) {
      if (error.code === 4001) {
        setError('You denied the connection request. Please try again.');
      } else {
        setError(error.message || 'Error connecting wallet');
      }
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
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

        // Set up periodic refresh (every 30 seconds)
        const refreshInterval = setInterval(fetchLatestGreeting, 30000);

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

  return (
    <div className="backend-container">
      {loading && <Loading />}
      
      {/* Network Error Message */}
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
      
      {isConnected || isReadOnly ? (
        <div className="content">
          <div className="greeting-section">
            <h2>Current Greeting:</h2>
            <p>{greeting}</p>
          </div>
          {isReadOnly && (
            <div className="read-only-warning">
              <div className="warning-icon">ℹ️</div>
              <div className="warning-text">
                <p>You Are In Read-Only Mode.</p>
                <p>Connect MetaMask to Update the Greeting.</p>
              </div>
            </div>
          )}
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}
          {!isReadOnly && (
            <div className="input-section">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Enter new greeting..."
                disabled={loading}
              />
              <button
                onClick={handleUpdate}
                disabled={loading || !input.trim()}
                className="update-btn"
              >
                Update Greeting
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="content">
          <div className="greeting-section">
            <h2>Current Greeting:</h2>
            <p>{greeting}</p>
          </div>
         <div className="read-only-warning">
          <div className="warning-icon">ℹ️</div>
            <div className="warning-text">
              <p>You Are In Read-Only Mode.</p>
              <p>Connect MetaMask to Update the Greeting.</p>
            </div>
          </div> 
        </div>
      )}
    </div>
  );
};

export default Backend;
