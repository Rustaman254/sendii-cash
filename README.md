# SendiiCash

A modern onramp/offramp platform for buying and selling cryptocurrencies with M-Pesa settlement.

## Features

- 🔄 **Buy Crypto**: Convert KES to stablecoins (USDC, USDT, DAI) via M-Pesa
- 💸 **Sell Crypto**: Convert stablecoins to KES and receive via M-Pesa
- 📱 **M-Pesa Integration**: Validated Kenyan phone number input
- 📊 **Transaction History**: Track all buy/sell transactions with status
- 🌙 **Dark Mode**: Full dark mode support
- 🔗 **Wallet Connection**: RainbowKit integration for Web3 wallets

## Tech Stack

- **Framework**: Next.js 15.2.5
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Wallet**: RainbowKit + Wagmi
- **Blockchain**: Base (with multi-chain support)
- **Phone Validation**: libphonenumber-js
- **Notifications**: react-hot-toast

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Rustaman254/sendii-cash.git
cd sendii-cash

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
├── app/
│   ├── page.tsx                    # Main page with tab navigation
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   └── WagmiProviderWrapper.tsx    # Wallet provider config
├── components/
│   ├── onramp-offramp.tsx         # Buy/Sell interface
│   ├── transaction-history.tsx     # Transaction list
│   ├── header.tsx                  # App header with wallet connect
│   └── ui/                         # Reusable UI components
└── public/                         # Static assets
```

## Usage

### Buying Crypto (Onramp)

1. Click the **"Buy Crypto"** tab
2. Enter the amount in KES
3. Select your desired token (USDC, USDT, or DAI)
4. Enter your M-Pesa phone number (+254...)
5. Click **"Buy with M-Pesa"**
6. Complete the M-Pesa payment on your phone

### Selling Crypto (Offramp)

1. Click the **"Sell Crypto"** tab
2. Enter the amount of crypto to sell
3. Select the token you want to sell
4. Enter your M-Pesa phone number to receive KES
5. Click **"Sell for M-Pesa"**
6. Receive KES in your M-Pesa account

### Viewing Transaction History

1. Click the **"History"** tab
2. View all your past transactions
3. Check transaction status (Completed, Pending, Failed)

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: Add your own RPC URLs
NEXT_PUBLIC_BASE_RPC_URL=
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=
```

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Rustaman254/sendii-cash)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables
4. Deploy

### Build for Production

```bash
pnpm build
pnpm start
```

## Supported Networks

- Base Mainnet (Chain ID: 8453)
- Base Sepolia Testnet (Chain ID: 84532)
- Avalanche (Chain ID: 43114)
- Avalanche Fuji Testnet (Chain ID: 43113)

## Mock Features (Frontend Only)

Currently, the following features are mocked for frontend demonstration:

- ✅ M-Pesa payment processing
- ✅ Transaction status updates
- ✅ Exchange rate (fixed at 1 USD = 150 KES)
- ✅ Transaction history

### Backend Integration Needed

To make this production-ready, you'll need to integrate:

1. **M-Pesa Daraja API**
   - STK Push for deposits
   - B2C for withdrawals
   - Callback handling

2. **Real-time Pricing**
   - Exchange rate API (KES/USD)
   - Crypto price feeds

3. **Transaction Management**
   - Database for transaction storage
   - Status tracking
   - Receipt generation

4. **Blockchain Integration**
   - Token transfers
   - Transaction verification
   - Gas estimation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Support

For support, email support@sendiicash.com or open an issue on GitHub.

---

Built with ❤️ by the SendiiCash team
