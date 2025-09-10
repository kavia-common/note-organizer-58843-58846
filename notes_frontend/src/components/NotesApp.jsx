import React, { useMemo } from 'react';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import NoteList from './NoteList';
import Editor from './Editor';
import { useNotes } from '../context/NotesContext';

/**
 * NotesApp provides the main layout and ties together sidebar, toolbar, list, and editor.
 */
const NotesApp = () => {
  const { state } = useNotes();

  const currentFolderName = useMemo(() => {
    if (state.activeFolder === 'all') return 'All Notes';
    if (state.activeFolder === 'uncategorized') return 'Uncategorized';
    const folder = state.folders.find(f => f.id === state.activeFolder);
    return folder ? folder.name : 'All Notes';
  }, [state.activeFolder, state.folders]);

  return (
    <div className="notes-layout" role="application" aria-label="Notes application">
      <aside className="sidebar" aria-label="Sidebar">
        <Sidebar />
      </aside>
      <main className="main" aria-label="Main content">
        <Toolbar title={currentFolderName} />
        <section className="content">
          <NoteList />
          <Editor />
        </section>
      </main>
    </div>
  );
};

export default NotesApp;
