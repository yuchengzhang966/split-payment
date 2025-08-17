import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateGroupModal } from '../../app/components/CreateGroupModal'
import { render, createMockUser } from '../utils/test-utils'

// Mock the useApp hook
const mockAddGroup = jest.fn()
const mockUseApp = {
  user: createMockUser({ id: 'user1', name: 'User 1', email: 'user1@test.com' }),
  addGroup: mockAddGroup,
}

jest.mock('../../app/context/AppContext', () => ({
  ...jest.requireActual('../../app/context/AppContext'),
  useApp: () => mockUseApp,
}))

describe('CreateGroupModal', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render form with all required fields', () => {
    render(<CreateGroupModal onClose={mockOnClose} />)

    expect(screen.getByText('Create New Group')).toBeInTheDocument()
    expect(screen.getByLabelText(/Group Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Member Emails/)).toBeInTheDocument()
  })

  it('should close modal when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<CreateGroupModal onClose={mockOnClose} />)

    await user.click(screen.getByText('✕'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<CreateGroupModal onClose={mockOnClose} />)

    await user.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should disable submit button when group name is empty', () => {
    render(<CreateGroupModal onClose={mockOnClose} />)
    
    expect(screen.getByText('Create Group')).toBeDisabled()
  })

  it('should enable submit button when group name is provided', async () => {
    const user = userEvent.setup()
    render(<CreateGroupModal onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Group Name/), 'Test Group')
    
    expect(screen.getByText('Create Group')).not.toBeDisabled()
  })

  it('should create group with only creator when no member emails provided', async () => {
    const user = userEvent.setup()
    render(<CreateGroupModal onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Group Name/), 'Solo Group')
    await user.type(screen.getByLabelText(/Description/), 'Just for me')
    
    await user.click(screen.getByText('Create Group'))

    await waitFor(() => {
      expect(mockAddGroup).toHaveBeenCalledWith({
        id: expect.any(String),
        name: 'Solo Group',
        description: 'Just for me',
        members: [{
          userId: 'user1',
          email: 'user1@test.com',
          name: 'User 1',
          joinedAt: expect.any(Date),
        }],
        expenses: [],
        createdAt: expect.any(Date),
        createdBy: 'user1',
      })
    })

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should create group with multiple members', async () => {
    const user = userEvent.setup()
    render(<CreateGroupModal onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Group Name/), 'Team Group')
    await user.type(screen.getByLabelText(/Description/), 'Work expenses')
    await user.type(screen.getByLabelText(/Member Emails/), 'alice@work.com, bob@work.com')
    
    await user.click(screen.getByText('Create Group'))

    await waitFor(() => {
      expect(mockAddGroup).toHaveBeenCalledWith({
        id: expect.any(String),
        name: 'Team Group',
        description: 'Work expenses',
        members: [
          {
            userId: 'user1',
            email: 'user1@test.com',
            name: 'User 1',
            joinedAt: expect.any(Date),
          },
          {
            userId: expect.any(String),
            email: 'alice@work.com',
            name: 'alice',
            joinedAt: expect.any(Date),
          },
          {
            userId: expect.any(String),
            email: 'bob@work.com',
            name: 'bob',
            joinedAt: expect.any(Date),
          }
        ],
        expenses: [],
        createdAt: expect.any(Date),
        createdBy: 'user1',
      })
    })
  })

  it('should handle duplicate email addresses', async () => {
    const user = userEvent.setup()
    render(<CreateGroupModal onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Group Name/), 'Test Group')
    // Include creator's email in member list
    await user.type(screen.getByLabelText(/Member Emails/), 'user1@test.com, alice@test.com')
    
    await user.click(screen.getByText('Create Group'))

    await waitFor(() => {
      const call = mockAddGroup.mock.calls[0][0]
      // Should not duplicate creator's email
      expect(call.members).toHaveLength(2)
      expect(call.members.some((m: any) => m.email === 'alice@test.com')).toBe(true)
      // Creator should only appear once
      expect(call.members.filter((m: any) => m.email === 'user1@test.com')).toHaveLength(1)
    })
  })

  it('should trim whitespace from email addresses', async () => {
    const user = userEvent.setup()
    render(<CreateGroupModal onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Group Name/), 'Test Group')
    await user.type(screen.getByLabelText(/Member Emails/), ' alice@test.com , bob@test.com ')
    
    await user.click(screen.getByText('Create Group'))

    await waitFor(() => {
      const call = mockAddGroup.mock.calls[0][0]
      expect(call.members.some((m: any) => m.email === 'alice@test.com')).toBe(true)
      expect(call.members.some((m: any) => m.email === 'bob@test.com')).toBe(true)
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    render(<CreateGroupModal onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Group Name/), 'Test Group')
    
    await user.click(screen.getByText('Create Group'))

    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(screen.getByText('Creating...')).toBeDisabled()
  })

  it('should generate mock user IDs for added members', async () => {
    const user = userEvent.setup()
    render(<CreateGroupModal onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Group Name/), 'Test Group')
    await user.type(screen.getByLabelText(/Member Emails/), 'newuser@test.com')
    
    await user.click(screen.getByText('Create Group'))

    await waitFor(() => {
      const call = mockAddGroup.mock.calls[0][0]
      const newMember = call.members.find((m: any) => m.email === 'newuser@test.com')
      expect(newMember.userId).toMatch(/^user_\w+$/)
      expect(newMember.name).toBe('newuser')
    })
  })

  it('should filter out empty email addresses', async () => {
    const user = userEvent.setup()
    render(<CreateGroupModal onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Group Name/), 'Test Group')
    await user.type(screen.getByLabelText(/Member Emails/), 'alice@test.com, , bob@test.com, ')
    
    await user.click(screen.getByText('Create Group'))

    await waitFor(() => {
      const call = mockAddGroup.mock.calls[0][0]
      // Should have creator + 2 valid emails
      expect(call.members).toHaveLength(3)
    })
  })
})