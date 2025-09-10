# Notes Frontend

A lightweight React-based notes application with local persistence.

Features
- Create, edit, pin, organize (folders, tags), search, and delete notes
- Light/Dark theme toggle with persistence
- Client-side export/import of data (JSON)
- Responsive layout, accessible controls

Data Model
- Note: { id, title, content, tags: string[], folderId: string|null, pinned: boolean, createdAt: number, updatedAt: number }
- Folder: { id, name }

Persistence
- LocalStorage under keys:
  - notes_state: { notes: Note[], folders: Folder[] }
  - app_theme: 'light' | 'dark'

Development
- npm start
- npm test
- npm run build
