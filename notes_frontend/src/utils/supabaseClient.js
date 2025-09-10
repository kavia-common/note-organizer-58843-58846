import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client initialization.
 * Reads configuration from environment variables at build time.
 * Required envs:
 *  - REACT_APP_SUPABASE_URL
 *  - REACT_APP_SUPABASE_ANON_KEY
 */
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Detect common misconfiguration where REACT_APP_SUPABASE_KEY is set instead of REACT_APP_SUPABASE_ANON_KEY
const SUPABASE_KEY_MISCONFIG = process.env.REACT_APP_SUPABASE_KEY && !SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** Returns a Supabase client if configured, otherwise throws an error. */
  if (!isSupabaseConfigured) {
    // eslint-disable-next-line no-console
    if (SUPABASE_KEY_MISCONFIG) {
      console.warn(
        '[Supabase] Detected REACT_APP_SUPABASE_KEY but missing REACT_APP_SUPABASE_ANON_KEY. ' +
          'Please rename your env var to REACT_APP_SUPABASE_ANON_KEY as documented in assets/supabase.md.'
      );
    }
    const missing = [];
    if (!SUPABASE_URL) missing.push('REACT_APP_SUPABASE_URL');
    if (!SUPABASE_ANON_KEY) missing.push('REACT_APP_SUPABASE_ANON_KEY');
    throw new Error(
      `Supabase is not configured. Missing ${missing.join(
        ', '
      )}. Set them in notes_frontend/.env.`
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * PUBLIC_INTERFACE
 * Expose current Supabase config for diagnostics (safe: no secrets beyond anon key presence).
 * Use only for logging/debug UI.
 */
export function getSupabaseConfig() {
  return {
    hasUrl: Boolean(SUPABASE_URL),
    hasAnonKey: Boolean(SUPABASE_ANON_KEY),
    urlHost: (() => {
      try {
        return SUPABASE_URL ? new URL(SUPABASE_URL).host : null;
      } catch {
        return null;
      }
    })(),
    // Include hint when a common misconfiguration is present
    hint: SUPABASE_KEY_MISCONFIG
      ? 'REACT_APP_SUPABASE_KEY is set but REACT_APP_SUPABASE_ANON_KEY is missing. Rename your env variable.'
      : null,
  };
}

/**
 * PUBLIC_INTERFACE
 * Fetch all notes for a user from Supabase.
 * @param {string} userId - The user identifier. In a real app, use Supabase Auth. Here we support a string from localStorage or a static one.
 * @returns {Promise<Array>}
 */
export async function sbFetchNotes(userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  // Normalize to frontend schema
  return (data || []).map(row => ({
    id: row.id,
    title: row.title || '',
    content: row.content || '',
    tags: row.tags || [],
    folderId: row.folder_id || null,
    pinned: !!row.pinned,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  }));
}

/**
 * PUBLIC_INTERFACE
 * Upsert a note in Supabase.
 * @param {string} userId
 * @param {object} note - Note object in frontend schema
 */
export async function sbUpsertNote(userId, note) {
  const supabase = getSupabaseClient();
  const payload = {
    id: note.id,
    user_id: userId,
    title: note.title || '',
    content: note.content || '',
    tags: note.tags || [],
    folder_id: note.folderId || null,
    pinned: !!note.pinned,
    created_at: new Date(note.createdAt || Date.now()).toISOString(),
    updated_at: new Date(note.updatedAt || Date.now()).toISOString(),
  };

  const { error } = await supabase.from('notes').upsert(payload).select().single();
  if (error) throw error;
}

/**
 * PUBLIC_INTERFACE
 * Delete a note in Supabase by id for a user.
 * @param {string} userId
 * @param {string} id
 */
export async function sbDeleteNote(userId, id) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('notes').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}
