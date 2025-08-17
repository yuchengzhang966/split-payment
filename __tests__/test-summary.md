# PayHive Test Suite

## Test Coverage

### 🧪 Unit Tests
- **AppContext**: State management, user actions, expense lifecycle
- **ExpenseList**: Display logic, approval workflow, sorting
- **GroupLedger**: Settlement calculations, debt management
- **AddExpenseModal**: Form validation, expense creation
- **CreateGroupModal**: Group creation, member management
- **SimpleAuth**: Authentication flows, demo data seeding

### 🔧 Integration Tests
- **Expense Flow**: Complete lifecycle from creation to settlement
- **Authorization Logic**: Multi-user approval workflow
- **Settlement Calculations**: Complex debt resolution scenarios

### 📊 Key Test Scenarios
1. **Expense Authorization**: Tests the "≥50% approval" requirement
2. **Settlement Logic**: Verifies complex multi-person debt calculations
3. **User Interactions**: Form submissions, button clicks, state changes
4. **Demo Data**: Validates sample data generation for presentations
5. **Error Handling**: Form validation and edge cases

### 🚀 Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test ExpenseList

# Watch mode
npm run test:watch
```

### 📈 Test Structure
- **Mocks**: Dynamic SDK, localStorage, timers
- **Test Utils**: Factory functions for creating mock data
- **Assertions**: Comprehensive coverage of UI states and business logic
- **User Events**: Realistic user interaction simulations