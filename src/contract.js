import { ethers } from 'ethers';

// Contract ABI
const abi = [
  'function greet() view returns (string)',
  'function setGreeting(string memory _greeting) public'
];

// Helper function to validate Ethereum addresses
const validateAddress = (address) => {
  if (!address || !ethers.isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  return address.toLowerCase();
};

export const initializeContract = async (contractAddress) => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    // Validate contract address
    const validatedContractAddress = validateAddress(contractAddress);

    // Initialize provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Initialize contract
    const contract = new ethers.Contract(validatedContractAddress, abi, signer);
    
    // Check balance
    const balance = await provider.getBalance(signer.getAddress());
    console.log('Account balance:', ethers.formatEther(balance));
    
    return contract;
  } catch (error) {
    console.error('Error initializing contract:', error);
    throw error;
  }
};

// Export helper function to update greeting
export const updateGreeting = async (contract, newGreeting) => {
  try {
    const tx = await contract.setGreeting(newGreeting);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error updating greeting:', error);
    throw error;
  }
};

export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    // Request accounts
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }
    
    // Validate account address
    const validatedAccount = validateAddress(accounts[0]);
    
    // Get provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Check balance
    const balance = await provider.getBalance(signer.getAddress());
    console.log('Account balance:', ethers.formatEther(balance));
    
    return validatedAccount;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const getProvider = () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  return new ethers.BrowserProvider(window.ethereum);
};

// Helper function to check balance
export const checkBalance = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const balance = await provider.getBalance(signer.getAddress());
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error checking balance:', error);
    throw error;
  }
};
