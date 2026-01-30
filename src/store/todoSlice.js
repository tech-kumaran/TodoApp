import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'react-hot-toast'

const API_BASE = 'https://dummyjson.com/todos'

export const fetchTodos = createAsyncThunk('todos/fetchTodos', async (query = '') => {
  const url = query ? `${API_BASE}/search?q=${query}` : `${API_BASE}?limit=15`
  const response = await fetch(url)
  const data = await response.json()
  return data.todos
})

export const addTodo = createAsyncThunk('todos/addTodo', async (text) => {
  const response = await fetch(`${API_BASE}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      todo: text,
      completed: false,
      userId: 5,
    })
  })
  const data = await response.json()
  return { ...data, id: Date.now() }
})

export const updateTodo = createAsyncThunk('todos/updateTodo', async ({ id, todo }) => {
  if (id <= 150) {
    await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo })
    })
  }
  return { id, todo }
})

export const deleteTodoAsync = createAsyncThunk('todos/deleteTodo', async (id) => {
  if (id <= 150) {
    await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
  }
  return id
})

export const toggleTodoAsync = createAsyncThunk('todos/toggleTodo', async (todo) => {
  if (todo.id <= 150) {
    await fetch(`${API_BASE}/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed })
    })
  }
  return { id: todo.id, completed: !todo.completed }
})

const todoSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [],
    loading: false,
    isActionLoading: false,
    syncingIds: [],
    filter: 'all',
    searchQuery: '',
  },
  reducers: {
    setFilter: (state, action) => {
      state.filter = action.payload
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    },
    toggleTodo: (state, action) => {
      const item = state.items.find(t => t.id === action.payload)
      if (item) item.completed = !item.completed
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(addTodo.pending, (state) => {
        state.isActionLoading = true
      })
      .addCase(addTodo.fulfilled, (state, action) => {
        state.isActionLoading = false
        state.items.unshift(action.payload)
      })
      .addCase(addTodo.rejected, (state) => {
        state.isActionLoading = false
      })
      .addCase(updateTodo.pending, (state) => {
        state.isActionLoading = true
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        state.isActionLoading = false
        const index = state.items.findIndex(t => t.id === action.payload.id)
        if (index !== -1) state.items[index].todo = action.payload.todo
      })
      .addCase(updateTodo.rejected, (state) => {
        state.isActionLoading = false
      })
      .addCase(deleteTodoAsync.pending, (state) => {
        state.isActionLoading = true
      })
      .addCase(deleteTodoAsync.fulfilled, (state, action) => {
        state.isActionLoading = false
        state.items = state.items.filter(t => t.id !== action.payload)
      })
      .addCase(deleteTodoAsync.rejected, (state) => {
        state.isActionLoading = false
      })
      .addCase(toggleTodoAsync.pending, (state, action) => {
        state.syncingIds.push(action.meta.arg.id)
      })
      .addCase(toggleTodoAsync.fulfilled, (state, action) => {
        state.syncingIds = state.syncingIds.filter(id => id !== action.payload.id)
      })
      .addCase(toggleTodoAsync.rejected, (state, action) => {
        state.syncingIds = state.syncingIds.filter(id => id !== action.meta.arg.id)
        // Revert optimistic update on failure
        const item = state.items.find(t => t.id === action.meta.arg.id)
        if (item) item.completed = !item.completed
        toast.error('Sync failed')
      })
  },
})

export const { setFilter, setSearchQuery, toggleTodo } = todoSlice.actions
export default todoSlice.reducer
