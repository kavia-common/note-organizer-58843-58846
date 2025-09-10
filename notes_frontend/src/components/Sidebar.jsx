import React, { useCallback, useMemo, useState } from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * Sidebar shows brand, actions, search, folders, and tags.
 */
const Sidebar = () => {
  const { state, actions } = useNotes();
  const [newFolder, setNewFolder] = useState('');

  const countsByFolder = useMemo(() => {
    const map = new Map();
    map.set('all', state.notes.length);
    map.set('uncategorized', state.notes.filter(n => !n.folderId).length);
    state.folders.forEach(f => {
      map.set(f.id, state.notes.filter(n => n.folderId === f.id).length);
    });
    return map;
  }, [state.notes, state.folders]);

  const onCreateFolder = useCallback(() => {
    const name = newFolder.trim();
    if (!name) return;
    actions.addFolder(name);
    setNewFolder('');
  }, [newFolder, actions]);

  const tagCounts = useMemo(() => {
    const m = new Map();
    state.notes.forEach(n => {
      (n.tags || []).forEach(t => m.set(t, (m.get(t) || 0) + 1));
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [state.notes]);

  return (
    <>
      <div className="brand" aria-label="Brand">
        <div className="brand-logo" aria-hidden="true" />
        <div className="brand-text">Note Organizer</div>
      </div>

      <div className="action-buttons">
        <button className="btn" onClick={actions.createNote} aria-label="Create new note">+ New</button>
        <button
          className="btn secondary"
          onClick={actions.deleteActive}
          disabled={!state.activeNoteId}
          aria-label="Delete active note"
        >
          🗑 Delete
        </button>
      </div>

      <div className="search-box">
        <span className="search-icon">🔎</span>
        <input
          type="search"
          placeholder="Search notes..."
          value={state.query}
          onChange={(e) => actions.setQuery(e.target.value)}
          aria-label="Search notes"
        />
      </div>

      <div>
        <div className="section-title">Folders</div>
        <div className="folder-list" role="list">
          <div
            role="listitem"
            className={`folder-item ${state.activeFolder === 'all' ? 'active' : ''}`}
            onClick={() => actions.setActiveFolder('all')}
          >
            <span>📁 All</span>
            <span className="folder-count">{countsByFolder.get('all') || 0}</span>
          </div>
          <div
            role="listitem"
            className={`folder-item ${state.activeFolder === 'uncategorized' ? 'active' : ''}`}
            onClick={() => actions.setActiveFolder('uncategorized')}
          >
            <span>📂 Uncategorized</span>
            <span className="folder-count">{countsByFolder.get('uncategorized') || 0}</span>
          </div>
          {state.folders.map(f => (
            <div
              key={f.id}
              role="listitem"
              className={`folder-item ${state.activeFolder === f.id ? 'active' : ''}`}
              onClick={() => actions.setActiveFolder(f.id)}
              title={f.name}
            >
              <span>🗂 {f.name}</span>
              <span className="folder-count">{countsByFolder.get(f.id) || 0}</span>
            </div>
          ))}
        </div>

        <div className="chip-input" style={{ marginTop: 8 }}>
          <input
            type="text"
            placeholder="New folder name"
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            aria-label="New folder name"
          />
          <button className="btn secondary" onClick={onCreateFolder} aria-label="Add folder">Add</button>
        </div>
      </div>

      <div>
        <div className="section-title">Tags</div>
        <div className="tag-list" role="list">
          {tagCounts.length === 0 && <div className="muted">No tags yet</div>}
          {tagCounts.map(([tag, count]) => (
            <div
              key={tag}
              role="listitem"
              className={`tag-item ${state.activeTag === tag ? 'active' : ''}`}
              onClick={() => actions.setActiveTag(state.activeTag === tag ? null : tag)}
            >
              <span>🏷 {tag}</span>
              <span className="folder-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
