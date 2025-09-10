import React, { useCallback, useMemo, useState } from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * Editor for the active note: title, content, tags, folder, pin, save.
 */
const Editor = () => {
  const { state, actions } = useNotes();
  const note = useMemo(() => state.notes.find(n => n.id === state.activeNoteId) || null,
    [state.notes, state.activeNoteId]);

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tagsInput, setTagsInput] = useState('');

  React.useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
  }, [note?.id]); // reset when switching notes

  const onSave = useCallback(() => {
    if (!note) return;
    actions.updateNote(note.id, {
      title: title.trim(),
      content,
    });
  }, [note, title, content, actions]);

  const addTag = useCallback(() => {
    const t = (tagsInput || '').trim();
    if (!t || !note) return;
    const existing = new Set(note.tags || []);
    existing.add(t);
    actions.updateNote(note.id, { tags: Array.from(existing) });
    setTagsInput('');
  }, [tagsInput, note, actions]);

  const removeTag = useCallback((t) => {
    if (!note) return;
    const list = (note.tags || []).filter(x => x !== t);
    actions.updateNote(note.id, { tags: list });
  }, [note, actions]);

  const onMoveFolder = useCallback((folderId) => {
    if (!note) return;
    actions.updateNote(note.id, { folderId: folderId || null });
  }, [note, actions]);

  const togglePin = useCallback(() => {
    if (!note) return;
    actions.updateNote(note.id, { pinned: !note.pinned });
  }, [note, actions]);

  if (!note) {
    return <div className="editor"><div className="empty-state">Select a note to start editing.</div></div>;
  }

  return (
    <div className="editor" aria-label="Editor">
      <input
        className="title-input"
        placeholder="Note title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={onSave}
        aria-label="Note title"
      />
      <div className="meta-row">
        <span className="muted">Created {new Date(note.createdAt).toLocaleString()}</span>
        <span className="muted">•</span>
        <span className="muted">Updated {new Date(note.updatedAt).toLocaleString()}</span>
        <span className="right" />
        <button className="btn secondary" onClick={togglePin} aria-label="Toggle pin">{note.pinned ? 'Unpin' : 'Pin'}</button>
      </div>
      <textarea
        className="content-input"
        placeholder="Start writing..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={onSave}
        aria-label="Note content"
      />
      <div className="chips">
        {(note.tags || []).map(t => (
          <span key={t} className="tag">#{t} <button className="btn secondary" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>x</button></span>
        ))}
      </div>
      <div className="chip-input" style={{ marginTop: 10 }}>
        <input
          type="text"
          placeholder="Add tag"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          aria-label="New tag"
        />
        <button className="btn secondary" onClick={addTag} aria-label="Add tag">Add tag</button>

        <span className="right" />
        <label className="muted" htmlFor="folder-select" style={{ marginRight: 6 }}>Folder</label>
        <select
          id="folder-select"
          value={note.folderId || ''}
          onChange={(e) => onMoveFolder(e.target.value || null)}
          aria-label="Select folder"
        >
          <option value="">Uncategorized</option>
          {state.folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <button className="btn" onClick={onSave} style={{ marginLeft: 10 }} aria-label="Save note">Save</button>
      </div>
    </div>
  );
};

export default Editor;
