import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { uuid } from '../utils/uuid';
import { filterAndSortNotes } from '../utils/filters';
import { isSupabaseConfigured, sbDeleteNote, sbFetchNotes, sbUpsertNote } from '../utils/supabaseClient';

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
    case 'SET_NOTES': {
      const notes = action.notes || [];
      return recompute({ ...state, notes });
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
  /**
   * Global provider that persists data to localStorage and, if configured, syncs with Supabase.
   * A simple "user id" is used for associating notes. In a production app use Supabase Auth.
   */
  const [persisted, setPersisted] = useLocalStorage('notes_state', { notes: [], folders: [] });
  const [state, dispatch] = useReducer(reducer, { ...defaultState });
  // Use a pseudo user id for scoping notes if no auth is present.
  const [userId] = useLocalStorage('notes_user_id', 'local-user');

  // initialize from storage immediately for quick UI
  useEffect(() => {
    dispatch({ type: 'INIT', payload: persisted });
  }, []); // eslint-disable-line

  // If Supabase is configured, fetch remote notes and replace local state on mount
  useEffect(() => {
    let cancelled = false;
    async function loadRemote() {
      if (!isSupabaseConfigured) return;
      try {
        const remoteNotes = await sbFetchNotes(userId);
        if (!cancelled) {
          dispatch({ type: 'SET_NOTES', notes: remoteNotes });
          // cache them locally as well for offline-ish behavior
          setPersisted({ notes: remoteNotes, folders: persisted.folders || [] });
        }
      } catch (e) {
        // Non-fatal: fallback to local cached state
        // eslint-disable-next-line no-console
        console.warn('Failed to fetch notes from Supabase:', e?.message || e);
      }
    }
    loadRemote();
    return () => { cancelled = true; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // persist on state changes that affect data (local cache)
  useEffect(() => {
    setPersisted({ notes: state.notes, folders: state.folders });
  }, [state.notes, state.folders, setPersisted]);

  // Helper to sync a note create/update to Supabase if configured
  const syncNote = useCallback(async (note) => {
    if (!isSupabaseConfigured) return;
    try {
      await sbUpsertNote(userId, note);
    } catch (e) {
      console.warn('Failed to sync note to Supabase:', e?.message || e);
    }
  }, [userId]);

  // Helper to sync deletion
  const syncDelete = useCallback(async (id) => {
    if (!isSupabaseConfigured) return;
    try {
      await sbDeleteNote(userId, id);
    } catch (e) {
      console.warn('Failed to delete note from Supabase:', e?.message || e);
    }
  }, [userId]);

  const actions = useMemo(() => {
    return {
      // PUBLIC_INTERFACE
      createNote: async () => {
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
        // Optimistic local update
        dispatch({ type: 'ADD_NOTE', note });
        // Sync to Supabase
        syncNote(note);
      },
      // PUBLIC_INTERFACE
      updateNote: (id, patch) => {
        dispatch({ type: 'UPDATE_NOTE', id, patch });
        const updated = { ...(state.notes.find(n => n.id === id) || {}), ...patch, updatedAt: Date.now(), id };
        syncNote({
          id: updated.id,
          title: updated.title || '',
          content: updated.content || '',
          tags: updated.tags || [],
          folderId: updated.folderId || null,
          pinned: !!updated.pinned,
          createdAt: updated.createdAt || Date.now(),
          updatedAt: updated.updatedAt || Date.now(),
        });
      },
      // PUBLIC_INTERFACE
      deleteActive: () => {
        if (!state.activeNoteId) return;
        const id = state.activeNoteId;
        dispatch({ type: 'DELETE_NOTE', id });
        syncDelete(id);
      },
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
  }, [state.activeFolder, state.activeNoteId, state.notes, state.folders, syncNote, syncDelete]);

  return (
    <NotesContext.Provider value={{ state, actions }}>
      {children}
    </NotesContext.Provider>
  );
};
