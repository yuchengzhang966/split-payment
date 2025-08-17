import { renderHook, act } from '@testing-library/react'
import { AppProvider, useApp } from '../../app/context/AppContext'
import { createMockUser, createMockGroup, createMockExpense } from '../utils/test-utils'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('AppContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should provide initial state', () => {
    const { result } = renderHook(() => useApp(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.groups).toEqual([])
    expect(result.current.currentGroup).toBeNull()
  })

  it('should set and get user', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    const mockUser = createMockUser()

    act(() => {
      result.current.setUser(mockUser)
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('should add a group', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    const mockGroup = createMockGroup()

    act(() => {
      result.current.addGroup(mockGroup)
    })

    expect(result.current.groups).toContain(mockGroup)
  })

  it('should set current group', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    const mockGroup = createMockGroup()

    act(() => {
      result.current.setCurrentGroup(mockGroup)
    })

    expect(result.current.currentGroup).toEqual(mockGroup)
  })

  it('should add expense to correct group', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    const mockGroup = createMockGroup({ expenses: [] })
    const mockExpense = createMockExpense({ groupId: mockGroup.id })

    act(() => {
      result.current.addGroup(mockGroup)
      result.current.addExpense(mockExpense)
    })

    expect(result.current.groups[0].expenses).toContain(mockExpense)
  })

  it('should approve expense correctly', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    const mockGroup = createMockGroup({
      members: [
        { userId: 'user1', email: 'user1@test.com', name: 'User 1', joinedAt: new Date() },
        { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
      ],
    })
    const mockExpense = createMockExpense({
      groupId: mockGroup.id,
      approvals: ['user1'],
      isAuthorized: false,
    })
    mockGroup.expenses = [mockExpense]

    act(() => {
      result.current.addGroup(mockGroup)
    })

    act(() => {
      result.current.approveExpense(mockGroup.id, mockExpense.id, 'user2')
    })

    const updatedGroup = result.current.groups.find(g => g.id === mockGroup.id)
    const updatedExpense = updatedGroup?.expenses.find(e => e.id === mockExpense.id)

    expect(updatedExpense?.approvals).toContain('user2')
    expect(updatedExpense?.isAuthorized).toBe(true) // Should be authorized with 2/2 approvals
  })

  it('should seed demo data correctly', () => {
    const { result } = renderHook(() => useApp(), { wrapper })

    act(() => {
      result.current.seedDemoData('test-user', 'test@example.com', 'Test User')
    })

    expect(result.current.groups).toHaveLength(1)
    expect(result.current.groups[0].name).toBe('Ski Trip to Colorado')
    expect(result.current.groups[0].members).toHaveLength(4)
    expect(result.current.groups[0].expenses).toHaveLength(3)
  })

  it('should load data from localStorage on mount', () => {
    const mockData = [createMockGroup()]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData))

    const { result } = renderHook(() => useApp(), { wrapper })

    // Wait for useEffect to run
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('payhive-groups')
  })

  it('should calculate expense authorization correctly', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    
    // Create group with 4 members (requires ceil(4/2) = 2 approvals for authorization)
    const mockGroup = createMockGroup({
      members: [
        { userId: 'user1', email: 'user1@test.com', name: 'User 1', joinedAt: new Date() },
        { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
        { userId: 'user3', email: 'user3@test.com', name: 'User 3', joinedAt: new Date() },
        { userId: 'user4', email: 'user4@test.com', name: 'User 4', joinedAt: new Date() },
      ],
      expenses: []
    })

    const mockExpense = createMockExpense({
      groupId: mockGroup.id,
      approvals: ['user1'], // Only 1 approval, should not be authorized (needs 2)
      isAuthorized: false,
    })

    act(() => {
      result.current.addGroup(mockGroup)
      result.current.addExpense(mockExpense)
    })

    let updatedGroup = result.current.groups.find(g => g.id === mockGroup.id)
    let updatedExpense = updatedGroup?.expenses.find(e => e.id === mockExpense.id)
    expect(updatedExpense?.isAuthorized).toBe(false)

    // Add second approval - should become authorized (2/4 >= 2)
    act(() => {
      result.current.approveExpense(mockGroup.id, mockExpense.id, 'user2')
      // Manually trigger authorization check since our mock doesn't automatically do it
      result.current.updateExpenseAuthorization(mockGroup.id, mockExpense.id)
    })

    updatedGroup = result.current.groups.find(g => g.id === mockGroup.id)
    updatedExpense = updatedGroup?.expenses.find(e => e.id === mockExpense.id)
    expect(updatedExpense?.isAuthorized).toBe(true)
  })
})