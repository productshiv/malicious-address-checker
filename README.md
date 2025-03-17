# Ethereum Transaction Checker

This React application allows users to connect their Metamask wallet, view their Ethereum transactions, and check if they have interacted with any malicious addresses.

## Features

- Connect to Metamask wallet
- Fetch all transactions for the connected wallet using Tatum API
- Display transaction details in a table format
- Check for malicious addresses in transaction history
- Display warnings for any detected malicious addresses
- Link to Etherscan for more details on transactions and addresses

## Prerequisites

- Node.js and npm installed
- Metamask browser extension installed

## Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

## Environment Variables

This application uses environment variables to store sensitive information like API keys. Before running the application, you need to set up these variables:

1. Create a `.env` file in the root directory of the project
2. Add the following variables to the file:

```
REACT_APP_TATUM_API_KEY=your_tatum_api_key
```

Note: In a production environment, you should:
- Never commit the `.env` file to version control
- Use a backend service to handle API requests instead of exposing API keys in client-side code
- Implement proper API key rotation and security measures

## Usage

1. Start the development server:

```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`
3. Click the "Connect Metamask" button to connect your wallet
4. View your transactions and any malicious address warnings

## API Keys

This application uses the Tatum API to fetch transaction data and check for malicious addresses. The API key is included in the code for demonstration purposes. In a production environment, you should:

1. Store API keys in environment variables
2. Implement a backend service to handle API requests
3. Never expose API keys in client-side code

## Technologies Used

- React.js
- ethers.js for Ethereum interactions
- axios for API requests
- Tatum API for transaction data and security checks

## License

MIT
