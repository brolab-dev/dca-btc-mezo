# DCA Protocol - Automated Dollar Cost Averaging on Mezo

A comprehensive DCA (Dollar Cost Averaging) platform on Mezo testnet featuring smart contracts, automated keeper bots, Telegram notifications, and a futuristic web interface for seamless automated BTC accumulation.

## 🌟 Features

### Smart Contract
- **Automated DCA Plans**: Create plans to swap mUSD for BTC at regular intervals
- **Flexible Time Cycles**: Support for 1 hour and 1 day execution cycles
- **Plan Management**: Users can create, stop, and monitor their DCA plans
- **Batch Execution**: Execute multiple plans in a single transaction
- **Safety Features**: Built-in slippage protection and access controls
- **Event-Driven Architecture**: Comprehensive event logging for all operations

### Keeper Bot System
- **Automated Execution**: Continuously monitors and executes eligible DCA plans
- **Manual Execution**: CLI script for one-time plan execution
- **Configurable Intervals**: Customizable check intervals (default: 60 seconds)
- **Gas Optimization**: Batch execution support for multiple plans
- **Telegram Integration**: Automatic notifications on plan execution

### Telegram Bot
- **Instant Notifications**: Get notified when your DCA plans execute
- **Wallet Linking**: Secure wallet-to-Telegram account linking via deep links
- **Bot Commands**:
  - `/start WALLET` - Link your wallet address
  - `/wallet` - View your linked wallet and balance
  - `/plans` - View all your active DCA plans
  - `/history` - View execution history
  - `/help` - Show available commands
- **Execution Details**: Receive swap amounts, prices, and transaction links

### Web Interface (Futuristic Minimalism Design)
- **Cyber-Chic UI**: Dark mode with violet (#6C5CE7) and cyan (#00D4FF) accents
- **Glassmorphism Effects**: Semi-transparent cards with blur and depth
- **Wallet Integration**: RainbowKit with multi-wallet support
- **Real-time Dashboard**: View balances, active plans, and statistics
- **Plan Creation**: Intuitive modal for creating new DCA plans
- **Execution History**: Complete transaction history with statistics
- **Telegram Integration**: One-click wallet linking to Telegram bot
- **Responsive Design**: Mobile-friendly interface with geometric precision

## 📍 Contract Addresses

### Deployed DCA Contract
- **DCA Contract**: `0x29C17CD908EF3087812760C099735AA7f1cDacA4`
- **Deployed on**: October 23, 2025
- **Transaction Hash**: `0xbf2e76a9876b37719e9d6552bd94b6bb096685f71f45dda1541f2fd9f2d666fb`
- **Block Number**: 8,186,959
- **Explorer Link**: [View on Mezo Explorer](https://explorer.test.mezo.org/address/0x29C17CD908EF3087812760C099735AA7f1cDacA4)

### Token Addresses
- **mUSD Token**: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`
- **BTC Token**: `0x7b7C000000000000000000000000000000000000`
- **Swap Router**: `0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9`

## 🌐 Mezo Testnet Details

- **RPC Endpoint**: `https://rpc.test.mezo.org`
- **WebSocket**: `wss://rpc-ws.test.mezo.org`
- **Chain ID**: `31611`
- **Block Explorer**: https://explorer.test.mezo.org/

## 🤖 Telegram Bot

- **Bot Username**: `@dca_mezo_bot`
- **Bot Link**: https://t.me/dca_mezo_bot
- **Features**: Instant execution notifications, wallet management, plan monitoring
- **Setup Guide**: See [TELEGRAM_BOT.md](./TELEGRAM_BOT.md) for detailed setup instructions
- **Quick Start**: See [TELEGRAM_QUICK_START.md](./TELEGRAM_QUICK_START.md) for 5-minute setup

## 🌐 Web Application

- **Technology Stack**: React + Vite + TypeScript
- **Styling**: Tailwind CSS with custom futuristic design system
- **Wallet Integration**: RainbowKit + wagmi + viem
- **UI Components**: Radix UI + shadcn/ui
- **Local Development**: `http://localhost:8081`
- **Design System**: Cyber-Chic with glassmorphism, violet/cyan accents, geometric precision

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd dca_mezo
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add:
```bash
# Required
PRIVATE_KEY=your_private_key_without_0x_prefix
DCA_CONTRACT_ADDRESS=0x29C17CD908EF3087812760C099735AA7f1cDacA4

# Optional - Keeper Bot
KEEPER_CHECK_INTERVAL=60

# Optional - Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_BOT_ENABLED=true
```

### 3. Start the Web Interface

```bash
cd front-end
npm install
npm run dev
```

Visit `http://localhost:8081` to access the DCA Protocol web interface.

### 4. (Optional) Start Keeper Bot

```bash
npm run keeper
```

### 5. (Optional) Start Telegram Bot

```bash
npm run telegram
```

See [TELEGRAM_QUICK_START.md](./TELEGRAM_QUICK_START.md) for Telegram bot setup.

## 📦 Smart Contract Deployment

### Quick Deploy

1. Compile the contract:
```bash
npm run compile
```

2. Deploy to Mezo testnet:
```bash
npm run deploy
```

### Manual Deployment Steps

1. Set up environment variables in `.env`:
```bash
PRIVATE_KEY=your_private_key_without_0x_prefix
```

2. Ensure you have testnet ETH in your wallet for gas fees

3. Run deployment script:
```bash
npx hardhat run scripts/deploy.js --network mezo-testnet
```

### Deployment Verification

After deployment, verify the contract addresses match:
- mUSD Token: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`
- BTC Token: `0x7b7C000000000000000000000000000000000000`
- Swap Router: `0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9`

## 💻 Usage

### Web Interface (Recommended)

1. **Connect Wallet**: Click "Connect Wallet" and select your wallet
2. **Approve mUSD**: Approve the DCA contract to spend your mUSD tokens
3. **Create Plan**: Click "Create Plan" and configure:
   - Amount per execution (e.g., 100 mUSD)
   - Time interval (1 hour or 1 day)
   - Maximum executions (optional, 0 for unlimited)
4. **Monitor**: View your active plans, balances, and execution history
5. **Link Telegram** (Optional): Get instant notifications when plans execute

### CLI Scripts

#### Execute Plans Manually
```bash
npm run execute
```

#### Run Keeper Bot (Automated Execution)
```bash
npm run keeper
```

#### View Execution History
```bash
npm run history
```

#### Start Telegram Bot
```bash
npm run telegram
```

### Programmatic Usage

#### Creating a DCA Plan

```javascript
// Create a plan to swap 100 mUSD every day, maximum 30 executions
await dcaContract.createPlan(
    ethers.parseEther("100"), // 100 mUSD per execution
    86400, // 1 day (in seconds)
    30, // maximum 30 executions (0 for unlimited)
    { value: ethers.parseEther("0.001") } // execution fee
);
```

#### Approving mUSD

Before creating a plan, users must approve the DCA contract to spend their mUSD:

```javascript
const musdContract = new ethers.Contract(
    "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
    ERC20_ABI,
    signer
);
await musdContract.approve(
    "0x29C17CD908EF3087812760C099735AA7f1cDacA4",
    ethers.MaxUint256
);
```

#### Executing a Plan

Plans can be executed by anyone once the time cycle has passed:

```javascript
await dcaContract.executePlan(planId);
```

#### Stopping a Plan

Only the plan owner can stop their plan:

```javascript
await dcaContract.stopPlan(planId);
```

#### Batch Operations

Execute multiple plans in one transaction:

```javascript
const executablePlans = await dcaContract.getExecutablePlans();
await dcaContract.batchExecutePlans(executablePlans);
```

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm run deploy` | Deploy DCA contract to Mezo testnet |
| `npm test` | Run smart contract tests |
| `npm run execute` | Manually execute eligible DCA plans |
| `npm run keeper` | Start automated keeper bot |
| `npm run history` | View execution history from CLI |
| `npm run telegram` | Start Telegram bot |

### Front-end Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 8081) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 📋 Contract Functions

### User Functions

- `createPlan(amountPerExecution, timeCycle, maxExecutions)`: Create a new DCA plan
- `stopPlan(planId)`: Stop an active DCA plan
- `executePlan(planId)`: Execute a DCA plan (callable by anyone)
- `batchExecutePlans(planIds[])`: Execute multiple plans at once

### View Functions

- `getPlan(planId)`: Get plan details
- `getUserPlans(user)`: Get all plan IDs for a user
- `canExecutePlan(planId)`: Check if a plan can be executed
- `getNextExecutionTime(planId)`: Get next execution timestamp
- `getExecutablePlans()`: Get all executable plan IDs
- `hasUserApprovedSufficientMUSD(user)`: Check user's mUSD approval status

### Admin Functions (Owner Only)

- `updateExecutionFee(newFee)`: Update the execution fee
- `withdrawFees()`: Withdraw collected fees
- `emergencyWithdraw(token, amount)`: Emergency token recovery

## 📊 Plan Structure

```solidity
struct DCAplan {
    address user;              // Plan owner
    uint256 amountPerExecution; // mUSD amount per swap
    uint256 timeCycle;         // Time between executions (seconds)
    uint256 lastExecution;     // Timestamp of last execution
    uint256 totalExecutions;   // Number of completed executions
    uint256 maxExecutions;     // Maximum executions (0 = unlimited)
    bool isActive;             // Plan status
    uint256 createdAt;         // Creation timestamp
}
```

## ⏱️ Time Cycles

- **1 Hour**: `3600` seconds
- **1 Day**: `86400` seconds

## 🔒 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Access Control**: Only plan owners can stop their plans
- **Slippage Protection**: 5% slippage tolerance on swaps
- **Balance Checks**: Verifies sufficient mUSD balance before execution
- **Approval Checks**: Ensures proper token approvals
- **Event Logging**: Comprehensive event emissions for transparency

## 🧪 Testing

Run the test suite:

```bash
npm test
```

## ⚡ Gas Optimization

The contract includes several gas optimization features:
- Batch execution for multiple plans
- Efficient storage layout
- Minimal external calls during execution
- Optimized event emissions

## 📡 Events

- `PlanCreated(planId, user, amountPerExecution, timeCycle, maxExecutions)`
- `PlanExecuted(planId, user, amountIn, amountOut, executionNumber)`
- `PlanStopped(planId, user)`
- `ExecutionFeeUpdated(newFee)`

## 🎨 Design System

The web interface uses a **Futuristic Minimalism (Cyber-Chic)** design system:

### Color Palette
- **Background**: Deep charcoal gradient (#0B0B0E to #11111A)
- **Primary Accent**: Violet (#6C5CE7)
- **Secondary Accent**: Cyan (#00D4FF)
- **Text**: High contrast white with subtle opacity variations

### Visual Effects
- **Glassmorphism**: Semi-transparent cards with backdrop blur (24px-32px)
- **Glow Effects**: Soft violet and cyan glows on interactive elements
- **Animations**: Smooth transitions and subtle pulse effects
- **Typography**: Minimal sans-serif with spacious letter-spacing

### Design Principles
- Clean grid layouts with geometric precision
- High contrast for readability
- Controlled light and depth
- Premium feel for fintech/blockchain platforms
- No harsh borders or busy textures

## 📖 Documentation

- **[TELEGRAM_BOT.md](./TELEGRAM_BOT.md)**: Complete Telegram bot setup and usage guide
- **[TELEGRAM_QUICK_START.md](./TELEGRAM_QUICK_START.md)**: 5-minute Telegram bot setup
- **[.env.example](./.env.example)**: Environment variables template

## 🛠️ Technology Stack

### Smart Contracts
- Solidity 0.8.24
- Hardhat development environment
- OpenZeppelin contracts (Ownable, ReentrancyGuard, SafeERC20)
- ethers.js v6

### Front-end
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS + custom design system
- RainbowKit + wagmi + viem for Web3
- Radix UI + shadcn/ui components
- date-fns for date formatting
- Lucide React for icons

### Backend/Automation
- Node.js keeper bot
- Telegram Bot API (node-telegram-bot-api)
- JSON file-based storage for Telegram users

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 🔗 Links

- **DCA Contract**: [0x29C17CD908EF3087812760C099735AA7f1cDacA4](https://explorer.test.mezo.org/address/0x29C17CD908EF3087812760C099735AA7f1cDacA4)
- **Telegram Bot**: [@dca_mezo_bot](https://t.me/dca_mezo_bot)
- **Mezo Explorer**: https://explorer.test.mezo.org/
- **Mezo Testnet RPC**: https://rpc.test.mezo.org

---

**Built with ❤️ for the Mezo ecosystem**
