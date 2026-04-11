# StellarMarketPay

A payment solution for small market traders and freelancers in West Africa using Stellar blockchain for low-cost, instant payments.

## Features

- 💰 **Near-zero transaction fees** - Accept payments with minimal costs
- ⚡ **Instant payments** - Receive money in 3-5 seconds  
- 📱 **QR code payments** - Generate scannable payment requests
- 🔗 **Payment links** - Shareable payment URLs
- 📊 **Business dashboard** - Track sales and expenses
- 🌍 **International transfers** - Send money abroad affordably

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: TailwindCSS
- **Blockchain**: Stellar Network (@stellar/stellar-sdk)
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
├── lib/                # Utility functions and services
├── types/              # TypeScript type definitions
```

## Stellar Integration

The app uses Stellar testnet for development. To switch to mainnet:

1. Change the Horizon server URL in `src/lib/stellar.ts`
2. Update the network configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
