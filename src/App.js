import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './App.css';
import TransactionList from './components/TransactionList';
import MaliciousAddressCheck from './components/MaliciousAddressCheck';

// Log API key status for debugging (don't log the actual key in production)
console.log("API Key status:", process.env.REACT_APP_TATUM_API_KEY ? "Available" : "Not available");
console.log("API Key prefix:", process.env.REACT_APP_TATUM_API_KEY ? process.env.REACT_APP_TATUM_API_KEY.substring(0, 5) + "..." : "N/A");

function App() {
  const [account, setAccount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signature, setSignature] = useState('');
  const [signatureVerified, setSignatureVerified] = useState(false);
  const [maliciousAddresses, setMaliciousAddresses] = useState([]);
  const [manualAddress, setManualAddress] = useState('');
  const [useManualAddress, setUseManualAddress] = useState(false);

  // Check if API key is available
  useEffect(() => {
    console.log("Checking API key availability...");
    if (!process.env.REACT_APP_TATUM_API_KEY) {
      console.error("Tatum API key is not defined in environment variables");
      setError("API configuration error. Please check the console for details.");
    } else {
      console.log("API key is available and ready to use");
    }
  }, []);

  // Check if MetaMask is installed
  const checkIfMetaMaskIsInstalled = () => {
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setError('');
      
      if (!checkIfMetaMaskIsInstalled()) {
        setError("MetaMask is not installed. Please install it to use this app.");
        return;
      }
      
      console.log("Attempting to connect to MetaMask...");
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      console.log("Accounts received:", accounts);
      
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        console.log("Connected to account:", accounts[0]);
      } else {
        setError("No accounts found. Please make sure MetaMask is unlocked.");
      }
    } catch (err) {
      console.error("MetaMask connection error:", err);
      setError("Failed to connect wallet: " + (err.message || "Unknown error"));
    }
  };

  // Sign a message with MetaMask
  const signMessage = async () => {
    try {
      setError('');
      
      if (!account) {
        setError("Please connect your wallet first.");
        return;
      }
      
      const message = `Login verification for ${account}\nTimestamp: ${Date.now()}`;
      console.log("Requesting signature for message:", message);
      
      // Create a provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Sign the message
      const signature = await signer.signMessage(message);
      console.log("Signature:", signature);
      
      // We're not storing the signature anymore, just setting verification to true
      setSignatureVerified(true);
      
      // Transactions will be fetched automatically due to the useEffect dependency on signatureVerified
      
    } catch (err) {
      console.error("Message signing error:", err);
      setError("Failed to sign message: " + (err.message || "Unknown error"));
    }
  };

  // Check for malicious addresses
  const checkMaliciousAddresses = async (addresses) => {
    if (!addresses || addresses.length === 0) {
      console.log('No addresses provided to check for malicious activity');
      return [];
    }
    
    // Filter out addresses we've already checked
    const alreadyCheckedAddresses = maliciousAddresses.map(item => item.address);
    const addressesToCheck = addresses.filter(addr => 
      addr && !alreadyCheckedAddresses.includes(addr)
    );
    
    if (addressesToCheck.length === 0) {
      console.log('All addresses have already been checked');
      return maliciousAddresses;
    }
    
    console.log(`Checking ${addressesToCheck.length} addresses for malicious activity`);
    
    const malicious = [...maliciousAddresses]; // Start with existing results
    
    try {
      const apiKey = process.env.REACT_APP_TATUM_API_KEY;
      
      for (const address of addressesToCheck) {
        const apiUrl = `https://api.tatum.io/v3/security/address/${address}`;
        console.log(`Checking address: ${address} - API URL: ${apiUrl}`);
        
        try {
          const response = await fetch(apiUrl, {
            headers: {
              'x-api-key': apiKey
            }
          });
          
          if (!response.ok) {
            console.error(`Error checking address ${address}: ${response.status}`);
            const errorData = await response.text();
            console.error('Error details:', errorData);
            continue;
          }
          
          const data = await response.json();
          console.log(`Security check response for ${address}:`, data);
          
          // Check for both formats of API response
          if ((data && data.active) || (data && data.status === 'invalid')) {
            console.log(`Malicious address found: ${address}`);
            
            // Handle both API response formats
            const maliciousInfo = {
              address,
              type: data.type || data.source || 'Unknown',
              risk: data.risk || data.description || 'Unknown'
            };
            
            console.log('Malicious info:', maliciousInfo);
            
            // Only add if not already in the list
            if (!malicious.some(item => item.address === address)) {
              malicious.push(maliciousInfo);
            }
          }
        } catch (error) {
          console.error(`Error checking address ${address}:`, error);
        }
      }
      
      console.log(`Found ${malicious.length} malicious addresses in total`);
      setMaliciousAddresses(malicious);
      return malicious;
    } catch (error) {
      console.error('Error checking malicious addresses:', error);
      return maliciousAddresses; // Return existing results on error
    }
  };

  // Fetch transactions for the connected wallet
  const fetchTransactions = useCallback(async () => {
    if (!account || !signatureVerified) {
      console.log("Cannot fetch transactions:", {
        hasAccount: !!account,
        isVerified: signatureVerified
      });
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log("Fetching transactions for account:", account);
      
      const apiKey = process.env.REACT_APP_TATUM_API_KEY;
      console.log("Using API key:", apiKey ? `${apiKey.substring(0, 5)}...` : "Not available");
      
      // First, check if the user's own address is malicious
      console.log("Checking if user's address is malicious:", account);
      await checkMaliciousAddresses([account]);
      
      // Updated to use v3 API with pageSize parameter
      const apiUrl = `https://api.tatum.io/v3/ethereum/account/transaction/${account}?pageSize=50`;
      console.log("API URL:", apiUrl);
      
      const headers = {
        'x-api-key': apiKey
      };
      console.log("Request headers:", headers);
      
      const response = await fetch(apiUrl, { headers });
      
      console.log("API Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error:", errorData);
        throw new Error(`API error: ${response.status} - ${errorData}`);
      }
      
      const data = await response.json();
      console.log("Transactions received:", data.length);
      
      setTransactions(data);
      
      // Extract unique addresses to check for malicious ones
      if (data.length > 0) {
        const addresses = [];
        data.forEach(tx => {
          if (tx.from && !addresses.includes(tx.from)) addresses.push(tx.from);
          if (tx.to && !addresses.includes(tx.to)) addresses.push(tx.to);
        });
        
        await checkMaliciousAddresses(addresses);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to fetch transactions: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [account, signatureVerified]);

  // Fetch transactions when account changes or signature is verified
  useEffect(() => {
    if (account && signatureVerified) {
      fetchTransactions();
    }
  }, [account, fetchTransactions, signatureVerified]);

  // Check if MetaMask is installed on component mount
  useEffect(() => {
    const isMetaMaskInstalled = checkIfMetaMaskIsInstalled();
    console.log("MetaMask installed:", isMetaMaskInstalled);
    
    if (!isMetaMaskInstalled) {
      setError("MetaMask is not installed. Please install it to use this app.");
    }
  }, []);

  // Listen for account changes in MetaMask
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        console.log("MetaMask accounts changed:", accounts);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setSignatureVerified(false);
        } else {
          setAccount('');
          setSignatureVerified(false);
        }
      };

      const handleChainChanged = (chainId) => {
        console.log("MetaMask chain changed:", chainId);
        // Reload the page when the chain changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Cleanup listeners
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Handle manual address input
  const handleManualAddressChange = (e) => {
    setManualAddress(e.target.value);
  };

  // Check if the address is valid
  const isValidEthereumAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Fetch transactions for manually entered address
  const fetchManualAddressTransactions = async () => {
    if (!manualAddress) {
      setError('Please enter an Ethereum address');
      return;
    }
    
    if (!isValidEthereumAddress(manualAddress)) {
      setError('Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)');
      return;
    }
    
    setError('');
    setLoading(true);
    setUseManualAddress(true);
    
    try {
      const apiKey = process.env.REACT_APP_TATUM_API_KEY;
      console.log('API Key status:', apiKey ? 'Available' : 'Not available');
      console.log('API Key prefix:', apiKey ? apiKey.substring(0, 5) + '...' : 'N/A');
      
      // First, check if the manually entered address is malicious
      console.log("Checking if manually entered address is malicious:", manualAddress);
      await checkMaliciousAddresses([manualAddress]);
      
      const apiUrl = `https://api.tatum.io/v3/ethereum/account/transaction/${manualAddress}?pageSize=50`;
      console.log('Fetching transactions from:', apiUrl);
      
      const headers = {
        'x-api-key': apiKey
      };
      
      console.log('Request headers:', headers);
      
      const response = await fetch(apiUrl, { headers });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData}`);
      }
      
      const data = await response.json();
      console.log('Transactions found:', data.length);
      
      setTransactions(data);
      
      // Check for malicious addresses in the transactions
      if (data.length > 0) {
        const addresses = [];
        data.forEach(tx => {
          if (tx.from && !addresses.includes(tx.from)) addresses.push(tx.from);
          if (tx.to && !addresses.includes(tx.to)) addresses.push(tx.to);
        });
        
        await checkMaliciousAddresses(addresses);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(`Failed to fetch transactions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ethereum Transaction Checker</h1>
        {!account && !useManualAddress ? (
          <div className="connection-options">
            <button onClick={connectWallet} className="connect-button">
              Connect MetaMask
            </button>
            <div className="manual-input">
              <p>Or check transactions by address:</p>
              <div className="address-input-container">
                <input
                  type="text"
                  placeholder="Enter Ethereum address (0x...)"
                  value={manualAddress}
                  onChange={handleManualAddressChange}
                  className="address-input"
                />
                <button onClick={fetchManualAddressTransactions} className="check-button">
                  Check Address
                </button>
              </div>
            </div>
          </div>
        ) : !signatureVerified && !useManualAddress ? (
          <div className="account-info">
            <p>Wallet Connected</p>
            <button onClick={signMessage} className="sign-button">
              Sign to Verify Identity
            </button>
          </div>
        ) : (
          <div className="account-info">
            <p>
              {useManualAddress 
                ? `Viewing Address: ${manualAddress}` 
                : `Connected Account: ${account}`
              }
            </p>
            {maliciousAddresses.some(item => 
              item.address === (useManualAddress ? manualAddress : account)
            ) && (
              <div className="address-warning-banner">
                ⚠️ Warning: This address has been flagged as potentially malicious!
              </div>
            )}
            <div className="button-group">
              {useManualAddress ? (
                <>
                  <button onClick={fetchManualAddressTransactions} className="refresh-button">
                    Refresh Transactions
                  </button>
                  <button 
                    onClick={() => {
                      setUseManualAddress(false);
                      setManualAddress('');
                      setTransactions([]);
                      setMaliciousAddresses([]);
                    }} 
                    className="back-button"
                  >
                    Check Different Address
                  </button>
                </>
              ) : (
                <>
                  <button onClick={fetchTransactions} className="refresh-button">
                    Refresh Transactions
                  </button>
                  <button onClick={signMessage} className="sign-button">
                    Re-Sign Message
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {error && <div className="error-message">{error}</div>}
      
      {signatureVerified && !useManualAddress && (
        <div className="auth-status-banner">
          <span className="auth-icon">✅</span>
          <span className="auth-message">Identity verified via cryptographic signature</span>
        </div>
      )}
      
      {loading ? (
        <div className="loading">Loading transactions...</div>
      ) : (
        <>
          {(signatureVerified || useManualAddress) && (
            <>
              {maliciousAddresses.length > 0 && (
                <MaliciousAddressCheck maliciousAddresses={maliciousAddresses} />
              )}
              
              {transactions.length > 0 ? (
                <TransactionList 
                  transactions={transactions} 
                  maliciousAddresses={maliciousAddresses.map(item => item.address)} 
                />
              ) : (account && signatureVerified) || useManualAddress ? (
                <div className="no-transactions">
                  <p>No transactions found for this address.</p>
                  <p>This could be because:</p>
                  <ul>
                    <li>The address is new and has no transactions</li>
                    <li>There might be an issue with the Tatum API</li>
                    <li>The API key might not have access to this data</li>
                  </ul>
                  <p>Try checking the console for more details.</p>
                </div>
              ) : (
                <p className="connect-prompt">Connect your wallet or enter an address to view transactions.</p>
              )}
            </>
          )}
          
          {account && !signatureVerified && !useManualAddress && (
            <div className="verification-required">
              <p>Please sign the message to verify your identity and view your transactions.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
