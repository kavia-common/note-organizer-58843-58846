import React from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * Toolbar for context actions and info.
 */
const Toolbar = ({ title }) => {
  const { state, actions } = useNotes();

  return (
    <div className="toolbar" role="toolbar">
      <div className="title">{title}</div>
      <div className="muted">Notes: {state.filteredNotes.length}</div>
      <div className="right" />
      <button className="btn secondary" onClick={actions.exportData} aria-label="Export notes data">Export</button>
      <label className="btn secondary" htmlFor="import-file" aria-label="Import notes data" style={{ cursor: 'pointer' }}>
        Import
        <input
          id="import-file"
          type="file"
          accept="application/json"
          onChange={(e) => actions.importData(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
};

export default Toolbar;
