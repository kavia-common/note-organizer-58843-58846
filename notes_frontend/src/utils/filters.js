function normalize(s) {
  return (s || '').toLowerCase();
}

function matchesQuery(note, query) {
  if (!query) return true;
  const q = normalize(query);
  return (
    normalize(note.title).includes(q) ||
    normalize(note.content).includes(q) ||
    (note.tags || []).some(t => normalize(t).includes(q))
  );
}

function matchesFolder(note, folder) {
  if (!folder || folder === 'all') return true;
  if (folder === 'uncategorized') return !note.folderId;
  return note.folderId === folder;
}

function matchesTag(note, tag) {
  if (!tag) return true;
  return (note.tags || []).includes(tag);
}

/**
 * Filter and sort notes by pinned and updatedAt desc.
 */
export function filterAndSortNotes({ notes, query, folder, tag }) {
  const filtered = notes.filter(n => matchesQuery(n, query) && matchesFolder(n, folder) && matchesTag(n, tag));
  filtered.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
  return filtered;
}
