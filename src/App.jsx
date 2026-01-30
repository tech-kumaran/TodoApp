import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchTodos,
  addTodo,
  updateTodo,
  deleteTodoAsync,
  toggleTodoAsync,
  toggleTodo,
  setFilter,
  setSearchQuery,
} from "./store/todoSlice";
import "./App.css";

function App() {
  const dispatch = useDispatch();
  const {
    items: todos,
    loading,
    isActionLoading,
    filter,
    searchQuery,
  } = useSelector((state) => state.todos);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [todoToDelete, setTodoToDelete] = useState(null);
  const [newTodoText, setNewTodoText] = useState("");

  useEffect(() => {
    // Prevent double fetch on initial mount by only using this effect
    const timer = setTimeout(() => {
      dispatch(fetchTodos(searchQuery));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, dispatch]);

  const handleCreateOrUpdate = async () => {
    if (!newTodoText.trim()) return;

    const promise = editingTodo
      ? dispatch(updateTodo({ id: editingTodo.id, todo: newTodoText }))
      : dispatch(addTodo(newTodoText));

    toast.promise(promise, {
      loading: editingTodo ? "Updating task..." : "Creating task...",
      success: editingTodo ? "Task updated" : "Task created",
      error: "Action failed",
    });

    const result = await promise;
    if (!result.error) {
      setNewTodoText("");
      setIsModalOpen(false);
      setEditingTodo(null);
    }
  };

  const handleDelete = async () => {
    if (!todoToDelete) return;
    const promise = dispatch(deleteTodoAsync(todoToDelete.id));

    toast.promise(promise, {
      loading: "Deleting task...",
      success: "Task deleted",
      error: "Delete failed",
    });

    const result = await promise;
    if (!result.error) {
      setIsDeleteModalOpen(false);
      setTodoToDelete(null);
    }
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  return (
    <div className="app-container">
      <div className="todo-layout">
        <header className="fixed-header">
          <div className="header-top">
            <h1 className="text-gradient">FlowTask</h1>
            <button
              className="add-btn-primary"
              onClick={() => {
                setEditingTodo(null);
                setNewTodoText("");
                setIsModalOpen(true);
              }}
            >
              <Plus size={20} />
              <span>New Task</span>
            </button>
          </div>

          <div className="controls-row">
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              />
            </div>
          </div>

          <div className="filter-tabs">
            {["all", "active", "completed"].map((f) => (
              <button
                key={f}
                className={`tab-btn ${filter === f ? "active" : ""}`}
                onClick={() => dispatch(setFilter(f))}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="tab-count">
                  {f === "all"
                    ? todos.length
                    : f === "active"
                      ? todos.filter((t) => !t.completed).length
                      : todos.filter((t) => t.completed).length}
                </span>
              </button>
            ))}
          </div>
        </header>

        <main className="scrollable-content">
          <div className="list-wrapper">
            {loading
              ? Array(10)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="loading-skeleton"></div>
                  ))
              : filteredTodos.map((todo) => (
                  <div key={todo.id} className="todo-card">
                    <label className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        // disabled={syncingIds.includes(todo.id)}
                        onChange={() => {
                          dispatch(toggleTodo(todo.id));
                          dispatch(toggleTodoAsync(todo));
                        }}
                      />
                      <div
                        className={`check-box ${todo.completed ? "checked" : ""} `}
                      >
                        {todo.completed && <Check size={14} />}
                      </div>
                    </label>

                    <span
                      className={`todo-label ${todo.completed ? "done" : ""}`}
                    >
                      {todo.todo}
                    </span>

                    <div className="item-actions">
                      <button
                        className="icon-btn edit"
                        onClick={() => {
                          setEditingTodo(todo);
                          setNewTodoText(todo.todo);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="icon-btn-danger"
                        onClick={() => {
                          setTodoToDelete(todo);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

            {!loading && filteredTodos.length === 0 && (
              <div className="empty-state">
                No tasks found in this category.
              </div>
            )}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h2>{editingTodo ? "Edit Task" : "New Task"}</h2>
              <button className="close-x" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="input-field">
              <label>Task Description</label>
              <input
                autoFocus
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                disabled={isActionLoading}
                placeholder="What needs to be done?"
                onKeyDown={(e) => e.key === "Enter" && handleCreateOrUpdate()}
              />
            </div>
            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={handleCreateOrUpdate}
                disabled={isActionLoading || !newTodoText.trim()}
              >
                {isActionLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : editingTodo ? (
                  "Save"
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div
            className="modal glass delete-confirm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="warning-icon">
              <AlertCircle size={40} color="#ef4444" />
            </div>
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete this task?</p>
            <div className="preview-box">"{todoToDelete?.todo}"</div>
            <div className="modal-footer stacked">
              <button
                className="danger-btn"
                onClick={handleDelete}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Delete Task"
                )}
              </button>
              <button
                className="secondary-btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
