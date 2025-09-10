import React from 'react';
import { formatDistanceToNow } from '../utils/time';
import { useNotes } from '../context/NotesContext';

/**
 * NoteList displays the list of notes based on current filters/search.
 */
const NoteList = () => {
  const { state, actions } = useNotes();

  if (state.filteredNotes.length === 0) {
    return (
      <div className="note-list">
        <div className="empty-state">No notes found. Create a new one!</div>
      </div>
    );
  }

  return (
    <div className="note-list" role="list" aria-label="Notes list">
      {state.filteredNotes.map(n => (
        <div
          key={n.id}
          role="listitem"
          className={`note-card ${state.activeNoteId === n.id ? 'active' : ''}`}
          onClick={() => actions.setActiveNote(n.id)}
          title={n.title || 'Untitled'}
        >
          <div>
            <div className="note-title">{n.title || 'Untitled'}</div>
            <div className="note-preview">{n.content?.slice(0, 160) || 'No content'}</div>
            <div className="note-meta">
              <span>Updated {formatDistanceToNow(n.updatedAt)}</span>
            </div>
            {n.tags?.length ? (
              <div className="note-tags">
                {n.tags.map(t => <span key={t} className="tag">#{t}</span>)}
              </div>
            ) : null}
          </div>
          <div className="muted">{n.pinned ? '📌' : ''}</div>
        </div>
      ))}
    </div>
  );
};

export default NoteList;
