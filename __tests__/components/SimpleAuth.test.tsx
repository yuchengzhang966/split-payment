import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SimpleAuth } from '../../app/components/SimpleAuth'
import { render } from '../utils/test-utils'

// Mock the useApp hook
const mockSetUser = jest.fn()
const mockSeedDemoData = jest.fn()
const mockUseApp = {
  user: null,
  groups: [],
  currentGroup: null,
  setUser: mockSetUser,
  setCurrentGroup: jest.fn(),
  addGroup: jest.fn(),
  addExpense: jest.fn(),
  approveExpense: jest.fn(),
  updateExpenseAuthorization: jest.fn(),
  seedDemoData: mockSeedDemoData,
}

jest.mock('../../app/context/AppContext', () => ({
  ...jest.requireActual('../../app/context/AppContext'),
  useApp: () => mockUseApp,
}))

describe('SimpleAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render welcome message and demo buttons', () => {
    render(<SimpleAuth />)

    expect(screen.getByText('Welcome to PayHive')).toBeInTheDocument()
    expect(screen.getByText('🚀 Quick Demo as Alice (with sample data)')).toBeInTheDocument()
    expect(screen.getByText('🎯 Quick Demo as Bob (with sample data)')).toBeInTheDocument()
    expect(screen.getByText('Split expenses seamlessly with friends using blockchain technology.')).toBeInTheDocument()
  })

  it('should render custom login form', () => {
    render(<SimpleAuth />)

    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Name \(Optional\)/)).toBeInTheDocument()
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('should show demo features information', () => {
    render(<SimpleAuth />)

    expect(screen.getByText('Demo Features:')).toBeInTheDocument()
    expect(screen.getByText('🔐 Mock wallet creation')).toBeInTheDocument()
    expect(screen.getByText('💰 Simulated PYUSD settlements')).toBeInTheDocument()
    expect(screen.getByText('📱 Full expense management')).toBeInTheDocument()
  })

  it('should handle Alice demo login', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<SimpleAuth />)

    const aliceButton = screen.getByText('🚀 Quick Demo as Alice (with sample data)')
    await user.click(aliceButton)

    // Fast-forward through the timeout
    jest.advanceTimersByTime(1100)

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith({
        id: expect.any(String),
        email: 'alice@example.com',
        name: 'Alice Johnson',
        walletAddress: expect.stringMatching(/^0x[a-f0-9]{40}$/),
      })
      expect(mockSeedDemoData).toHaveBeenCalledWith(
        expect.any(String),
        'alice@example.com',
        'Alice Johnson'
      )
    })
  })

  it('should handle Bob demo login', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<SimpleAuth />)

    const bobButton = screen.getByText('🎯 Quick Demo as Bob (with sample data)')
    await user.click(bobButton)

    jest.advanceTimersByTime(1100)

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith({
        id: expect.any(String),
        email: 'bob@example.com',
        name: 'Bob Smith',
        walletAddress: expect.stringMatching(/^0x[a-f0-9]{40}$/),
      })
      expect(mockSeedDemoData).toHaveBeenCalledWith(
        expect.any(String),
        'bob@example.com',
        'Bob Smith'
      )
    })
  })

  it('should handle custom email login', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<SimpleAuth />)

    await user.type(screen.getByLabelText(/Email Address/), 'test@example.com')
    await user.type(screen.getByLabelText(/Name \(Optional\)/), 'Test User')

    const continueButton = screen.getByText('Continue')
    await user.click(continueButton)

    expect(screen.getByText('Creating Account...')).toBeInTheDocument()
    expect(continueButton).toBeDisabled()

    jest.advanceTimersByTime(1100)

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith({
        id: expect.any(String),
        email: 'test@example.com',
        name: 'Test User',
        walletAddress: expect.stringMatching(/^0x[a-f0-9]{40}$/),
      })
      expect(mockSeedDemoData).not.toHaveBeenCalled()
    })
  })

  it('should use email prefix as name when no name provided', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<SimpleAuth />)

    await user.type(screen.getByLabelText(/Email Address/), 'johndoe@example.com')

    await user.click(screen.getByText('Continue'))

    jest.advanceTimersByTime(1100)

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith({
        id: expect.any(String),
        email: 'johndoe@example.com',
        name: 'johndoe',
        walletAddress: expect.any(String),
      })
    })
  })

  it('should require email for custom login', async () => {
    const user = userEvent.setup()
    render(<SimpleAuth />)

    const continueButton = screen.getByText('Continue')
    expect(continueButton).toBeDisabled()

    await user.type(screen.getByLabelText(/Name \(Optional\)/), 'Test User')
    expect(continueButton).toBeDisabled() // Still disabled without email

    await user.type(screen.getByLabelText(/Email Address/), 'test@example.com')
    expect(continueButton).not.toBeDisabled()
  })

  it('should disable demo buttons during login', async () => {
    const user = userEvent.setup()
    render(<SimpleAuth />)

    const aliceButton = screen.getByText('🚀 Quick Demo as Alice (with sample data)')
    const bobButton = screen.getByText('🎯 Quick Demo as Bob (with sample data)')

    await user.click(aliceButton)

    expect(aliceButton).toBeDisabled()
    expect(bobButton).toBeDisabled()
  })

  it('should generate unique user IDs and wallet addresses', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<SimpleAuth />)

    // First login
    await user.type(screen.getByLabelText(/Email Address/), 'user1@example.com')
    await user.click(screen.getByText('Continue'))
    jest.advanceTimersByTime(1100)

    const firstCall = mockSetUser.mock.calls[0][0]

    // Clear and try second login
    mockSetUser.mockClear()
    
    await user.clear(screen.getByLabelText(/Email Address/))
    await user.type(screen.getByLabelText(/Email Address/), 'user2@example.com')
    await user.click(screen.getByText('Continue'))
    jest.advanceTimersByTime(1100)

    await waitFor(() => {
      const secondCall = mockSetUser.mock.calls[0][0]
      expect(firstCall.id).not.toBe(secondCall.id)
      expect(firstCall.walletAddress).not.toBe(secondCall.walletAddress)
    })
  })
})