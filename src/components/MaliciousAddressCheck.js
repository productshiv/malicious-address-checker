import React from 'react';

const MaliciousAddressCheck = ({ maliciousAddresses }) => {
  return (
    <div className="malicious-warning">
      <h2>⚠️ Warning: Malicious Addresses Detected ⚠️</h2>
      <p>The following addresses in your transaction history have been flagged as malicious:</p>
      <ul>
        {maliciousAddresses.map((item, index) => (
          <li key={index}>
            <a 
              href={`https://etherscan.io/address/${item.address}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="malicious-address"
            >
              {item.address}
            </a>
            <span className="malicious-details">
              {item.type && <span>Source: {item.type}</span>}
              {item.risk && <span>{item.type ? ', ' : ''}Description: {item.risk}</span>}
            </span>
          </li>
        ))}
      </ul>
      <p className="warning-note">
        Be cautious when interacting with these addresses. They may be associated with scams, 
        phishing attempts, or other malicious activities.
      </p>
    </div>
  );
};

export default MaliciousAddressCheck; 