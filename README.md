# PayHive - Expense Splitting App

PayHive is a seamless expense-splitting application that allows friends to share costs and settle up using PayPal USD (PYUSD). Built with Dynamic SDK for secure wallet management and blockchain integration.

## 🌟 Features

- **🔐 Easy Authentication**: Sign in with social logins (Google, Apple) via Dynamic SDK
- **👥 Group Management**: Create groups for trips, dinners, or any shared expenses
- **💰 Expense Tracking**: Add and split expenses equally among group members
- **✅ Approval System**: Democratic approval process (50%+ group approval required)
- **📊 Smart Ledger**: Automatically calculates who owes what to whom
- **💳 PYUSD Settlement**: Simulated blockchain payments using PayPal USD
- **📱 Mobile-First**: Responsive design optimized for mobile use

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Dynamic Labs account (free at [dynamic.xyz](https://dynamic.xyz))

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Dynamic SDK:**
   - Sign up at [dynamic.xyz](https://app.dynamic.xyz/dashboard/developer)
   - Create a new project
   - Copy your Environment ID
   - Update `.env.local`:
     ```
     NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_environment_id_here
     ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 How to Use

### Getting Started
1. **Sign In**: Use the login widget to sign in with your preferred method
2. **Create a Group**: Click "Create Group" and add member emails
3. **Add Expenses**: Within a group, add shared expenses with descriptions and amounts
4. **Approve Expenses**: Group members approve expenses democratically
5. **View Ledger**: Check the "Ledger" tab to see who owes what
6. **Settle Up**: Use the "Settle Up" button to simulate PYUSD payments

### Key Concepts
- **Groups**: Containers for shared expenses (e.g., "Weekend Trip", "Dinner Out")
- **Expenses**: Individual costs that are split among participants
- **Approval**: Expenses need 50%+ group approval to be authorized
- **Ledger**: Smart calculation of net balances and optimal settlements
- **PYUSD**: Dollar-pegged stablecoin for secure blockchain settlements

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Dynamic SDK with embedded wallets
- **Blockchain**: Ethereum/Solana support via Dynamic
- **Settlement**: PYUSD (PayPal USD) integration
- **Storage**: LocalStorage (MVP), easily extensible to databases

### Key Components
- `AuthProvider`: Dynamic SDK wrapper for authentication
- `AppContext`: Global state management for groups and expenses
- `GroupDetail`: Main group interface with expense management
- `GroupLedger`: Balance calculation and settlement interface
- `ExpenseList`: Expense display with approval system

## 🔧 Development

### Project Structure
```
app/
├── components/          # React components
├── context/            # Global state management
├── types.ts           # TypeScript type definitions
├── globals.css        # Global styles
├── layout.tsx         # App layout
└── page.tsx          # Main app entry point
```

### Key Features Implementation

#### Authentication (Dynamic SDK)
- Social login integration
- Embedded wallet creation
- User management

#### Group & Expense Management
- Create/join groups
- Add expenses with smart splitting
- Democratic approval system

#### Settlement Logic
- Net balance calculation
- Optimal settlement path finding
- PYUSD payment simulation

## 🚀 Deployment

### Environment Variables
Ensure these are set in production:
```
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_production_environment_id
```

### Build & Deploy
```bash
npm run build
npm run start
```

## 🛣️ Roadmap

### Current (MVP)
- ✅ Social authentication
- ✅ Group management
- ✅ Expense splitting
- ✅ Approval system
- ✅ Balance calculation
- ✅ Simulated settlements

### Future Enhancements
- [ ] Real PYUSD blockchain transactions
- [ ] Advanced splitting (percentage, custom amounts)
- [ ] Push notifications
- [ ] Receipt photo uploads
- [ ] Multi-currency support
- [ ] Recurring expenses
- [ ] Export functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for seamless expense splitting using blockchain technology.