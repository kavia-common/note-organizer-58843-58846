import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { uuid } from '../utils/uuid';
import { filterAndSortNotes } from '../utils/filters';

/**
 * Types:
 * Note = { id, title, content, tags: string[], folderId: string|null, pinned: boolean, createdAt: number, updatedAt: number }
 * Folder = { id, name }
 */

const NotesContext = createContext(null);

// PUBLIC_INTERFACE
export const useNotes = () => {
  /** Access global notes state and actions. */
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
};

const defaultState = {
  notes: [],
  folders: [],
  activeNoteId: null,
  activeFolder: 'all', // 'all' | 'uncategorized' | folderId
  activeTag: null,
  query: '',
  filteredNotes: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT': {
      const { notes, folders } = action.payload;
      return recompute({ ...state, notes, folders });
    }
    case 'SET_QUERY':
      return recompute({ ...state, query: action.payload });
    case 'SET_ACTIVE_FOLDER':
      return recompute({ ...state, activeFolder: action.payload, activeTag: null });
    case 'SET_ACTIVE_TAG':
      return recompute({ ...state, activeTag: action.payload, activeFolder: 'all' });
    case 'SET_ACTIVE_NOTE':
      return { ...state, activeNoteId: action.payload };
    case 'ADD_FOLDER': {
      const folders = [...state.folders, { id: action.id, name: action.name }];
      return recompute({ ...state, folders });
    }
    case 'ADD_NOTE': {
      const notes = [action.note, ...state.notes];
      return recompute({ ...state, notes, activeNoteId: action.note.id });
    }
    case 'UPDATE_NOTE': {
      const notes = state.notes.map(n => n.id === action.id ? { ...n, ...action.patch, updatedAt: Date.now() } : n);
      return recompute({ ...state, notes });
    }
    case 'DELETE_NOTE': {
      const notes = state.notes.filter(n => n.id !== action.id);
      const activeNoteId = state.activeNoteId === action.id ? null : state.activeNoteId;
      return recompute({ ...state, notes, activeNoteId });
    }
    case 'IMPORT_DATA': {
      const { notes, folders } = action.payload;
      return recompute({ ...state, notes, folders, activeNoteId: null, activeFolder: 'all', activeTag: null, query: '' });
    }
    default:
      return state;
  }
}

function recompute(state) {
  const filtered = filterAndSortNotes({
    notes: state.notes,
    query: state.query,
    folder: state.activeFolder,
    tag: state.activeTag,
  });
  return { ...state, filteredNotes: filtered };
}

// PUBLIC_INTERFACE
export const NotesProvider = ({ children }) => {
  /** Global provider persisting data to localStorage. */
  const [persisted, setPersisted] = useLocalStorage('notes_state', { notes: [], folders: [] });
  const [state, dispatch] = useReducer(reducer, { ...defaultState });

  // initialize from storage
  useEffect(() => {
    dispatch({ type: 'INIT', payload: persisted });
  }, []); // eslint-disable-line

  // persist on state changes that affect data
  useEffect(() => {
    setPersisted({ notes: state.notes, folders: state.folders });
  }, [state.notes, state.folders, setPersisted]);

  const actions = useMemo(() => {
    return {
      // PUBLIC_INTERFACE
      createNote: () => {
        const now = Date.now();
        const note = {
          id: uuid(),
          title: 'New note',
          content: '',
          tags: [],
          folderId: state.activeFolder !== 'all' && state.activeFolder !== 'uncategorized' ? state.activeFolder : null,
          pinned: false,
          createdAt: now,
          updatedAt: now
        };
        dispatch({ type: 'ADD_NOTE', note });
      },
      // PUBLIC_INTERFACE
      updateNote: (id, patch) => dispatch({ type: 'UPDATE_NOTE', id, patch }),
      // PUBLIC_INTERFACE
      deleteActive: () => state.activeNoteId && dispatch({ type: 'DELETE_NOTE', id: state.activeNoteId }),
      // PUBLIC_INTERFACE
      setActiveNote: (id) => dispatch({ type: 'SET_ACTIVE_NOTE', payload: id }),
      // PUBLIC_INTERFACE
      setQuery: (q) => dispatch({ type: 'SET_QUERY', payload: q }),
      // PUBLIC_INTERFACE
      setActiveFolder: (folder) => dispatch({ type: 'SET_ACTIVE_FOLDER', payload: folder }),
      // PUBLIC_INTERFACE
      setActiveTag: (tag) => dispatch({ type: 'SET_ACTIVE_TAG', payload: tag }),
      // PUBLIC_INTERFACE
      addFolder: (name) => dispatch({ type: 'ADD_FOLDER', id: uuid(), name }),
      // PUBLIC_INTERFACE
      exportData: () => {
        const dataStr = JSON.stringify({ notes: state.notes, folders: state.folders }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes_export_${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
      // PUBLIC_INTERFACE
      importData: (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result);
            if (!Array.isArray(parsed.notes) || !Array.isArray(parsed.folders)) {
              alert('Invalid file format.');
              return;
            }
            dispatch({ type: 'IMPORT_DATA', payload: { notes: parsed.notes, folders: parsed.folders } });
          } catch {
            alert('Failed to parse file.');
          }
        };
        reader.readAsText(file);
      }
    };
  }, [state.activeFolder, state.activeNoteId, state.notes, state.folders]);

  return (
    <NotesContext.Provider value={{ state, actions }}>
      {children}
    </NotesContext.Provider>
  );
};
