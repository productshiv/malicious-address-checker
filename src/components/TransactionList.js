import React from 'react';

const TransactionList = ({ transactions, maliciousAddresses }) => {
  // Remove duplicate transactions based on hash
  const uniqueTransactions = transactions.filter(
    (tx, index, self) => index === self.findIndex((t) => t.hash === tx.hash)
  );

  // Function to determine the counter address based on transaction format
  const getCounterAddress = (tx) => {
    // If tx has counterAddress property (from Tatum v4 API)
    if (tx.counterAddress) {
      return tx.counterAddress;
    }
    
    // If tx has from/to properties (from Tatum v3 API)
    if (tx.from && tx.to) {
      // Return the 'to' address as the counter
      return tx.to;
    }
    
    // If we have a hash but no addresses, return a more descriptive message
    if (tx.hash) {
      return 'Contract Interaction';
    }
    
    // Last fallback
    return 'Internal Transaction';
  };

  // Check if an address is malicious
  const isAddressMalicious = (address) => {
    return maliciousAddresses.includes(address);
  };

  return (
    <div className="transaction-list">
      <h2>Transactions</h2>
      <table>
        <colgroup>
          <col style={{ width: '60%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Counter Address</th>
            <th>TX Hash</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {uniqueTransactions.map((tx, index) => {
            const counterAddress = getCounterAddress(tx);
            const isMalicious = isAddressMalicious(counterAddress);
            const isContractInteraction = counterAddress === 'Contract Interaction';
            const isInternalTransaction = counterAddress === 'Internal Transaction';
            
            return (
              <tr key={index} className={isMalicious ? 'malicious' : ''}>
                <td className="address-cell">
                  {isContractInteraction || isInternalTransaction ? (
                    <a 
                      href={`https://etherscan.io/tx/${tx.hash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="View transaction details"
                    >
                      {counterAddress}
                    </a>
                  ) : (
                    <a 
                      href={`https://etherscan.io/address/${counterAddress}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={isMalicious ? 'malicious-address' : ''}
                      title={counterAddress}
                    >
                      {counterAddress.substring(0, 10)}...{counterAddress.substring(counterAddress.length - 8)}
                    </a>
                  )}
                </td>
                <td>
                  <a 
                    href={`https://etherscan.io/tx/${tx.hash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title={tx.hash}
                  >
                    {tx.hash.substring(0, 10)}...
                  </a>
                </td>
                <td className="status-cell">
                  <span className={isMalicious ? 'unsafe-badge' : 'safe-badge'}>
                    {isMalicious ? '❌ UNSAFE' : '✅ SAFE'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList; 