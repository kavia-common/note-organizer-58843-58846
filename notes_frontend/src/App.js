import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import NotesApp from './components/NotesApp';
import { NotesProvider } from './context/NotesContext';
import { useLocalTheme } from './hooks/useLocalTheme';

/**
 * Root App component setting theme and providing global Notes context.
 */
// PUBLIC_INTERFACE
function App() {
  const { theme, toggleTheme } = useLocalTheme('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const appHeaderClass = useMemo(() => 'app-root', []);

  return (
    <NotesProvider>
      <div className="App">
        <header className={appHeaderClass}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <NotesApp />
        </header>
      </div>
    </NotesProvider>
  );
}

export default App;
