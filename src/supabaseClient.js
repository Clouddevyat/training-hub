import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vfqthwlusouhrokxvoio.supabase.co';
const supabaseAnonKey = 'sb_publishable_A7O6dk7tBKk30Ra155lD5g_dSPspeq4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cookie helper functions for more persistent storage
const setCookie = (name, value, days = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
};

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

// IndexedDB helper for most persistent storage
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TrainingHubDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
    };
  });
};

const getFromIndexedDB = async (key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('config', 'readonly');
      const store = tx.objectStore('config');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('IndexedDB read failed:', e);
    return null;
  }
};

const setToIndexedDB = async (key, value) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('config', 'readwrite');
      const store = tx.objectStore('config');
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('IndexedDB write failed:', e);
  }
};

// Get or create a device ID with multiple fallback storage mechanisms
// Priority: localStorage -> cookie -> indexedDB -> create new
export const getDeviceId = () => {
  // Check localStorage first (fastest)
  let deviceId = localStorage.getItem('trainingHub_deviceId');

  // Check cookie as backup
  if (!deviceId) {
    deviceId = getCookie('trainingHub_deviceId');
    if (deviceId) {
      // Restore to localStorage
      localStorage.setItem('trainingHub_deviceId', deviceId);
      console.log('Restored device ID from cookie');
    }
  }

  // If still no ID, create a new one
  if (!deviceId) {
    deviceId = 'device_' + crypto.randomUUID();
    console.log('Created new device ID:', deviceId);
  }

  // Store in ALL locations for redundancy
  localStorage.setItem('trainingHub_deviceId', deviceId);
  setCookie('trainingHub_deviceId', deviceId);

  // Also store in IndexedDB (async, but most persistent)
  setToIndexedDB('deviceId', deviceId);

  return deviceId;
};

// Async version that also checks IndexedDB (call on app startup)
export const getDeviceIdAsync = async () => {
  // Check localStorage first
  let deviceId = localStorage.getItem('trainingHub_deviceId');

  // Check cookie
  if (!deviceId) {
    deviceId = getCookie('trainingHub_deviceId');
  }

  // Check IndexedDB (most persistent)
  if (!deviceId) {
    deviceId = await getFromIndexedDB('deviceId');
    if (deviceId) {
      console.log('Restored device ID from IndexedDB');
    }
  }

  // If still no ID, create new
  if (!deviceId) {
    deviceId = 'device_' + crypto.randomUUID();
    console.log('Created new device ID:', deviceId);
  }

  // Store everywhere
  localStorage.setItem('trainingHub_deviceId', deviceId);
  setCookie('trainingHub_deviceId', deviceId);
  await setToIndexedDB('deviceId', deviceId);

  return deviceId;
};

// Allow user to set a custom sync code (for recovery/multi-device)
export const setSyncCode = async (code) => {
  const deviceId = 'sync_' + code.toLowerCase().trim();
  localStorage.setItem('trainingHub_deviceId', deviceId);
  setCookie('trainingHub_deviceId', deviceId);
  await setToIndexedDB('deviceId', deviceId);
  return deviceId;
};

// Get the current device ID for display (so user can write it down)
export const getCurrentDeviceId = () => {
  return localStorage.getItem('trainingHub_deviceId') || getCookie('trainingHub_deviceId');
};

// ============== ADMIN APPROVAL SYSTEM ==============

// Request access (called when new user tries to register)
export const requestAccess = async (name, email, reason = '') => {
  try {
    const { data, error } = await supabase
      .from('access_requests')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        reason,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === '23505') {
        return { success: false, error: 'An access request with this email already exists' };
      }
      throw error;
    }

    return { success: true, request: data };
  } catch (e) {
    console.error('Access request failed:', e);
    return { success: false, error: e.message };
  }
};

// Check if email is approved
export const checkEmailApproval = async (email) => {
  try {
    const { data, error } = await supabase
      .from('approved_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return {
      success: true,
      approved: !!data,
      user: data
    };
  } catch (e) {
    console.error('Check approval failed:', e);
    return { success: false, error: e.message };
  }
};

// Get pending access requests (admin only)
export const getPendingRequests = async () => {
  try {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, requests: data || [] };
  } catch (e) {
    console.error('Get pending requests failed:', e);
    return { success: false, error: e.message };
  }
};

// Approve access request (admin only)
export const approveRequest = async (requestId, email, name) => {
  try {
    // Add to approved users
    const { error: approveError } = await supabase
      .from('approved_users')
      .insert({
        email: email.toLowerCase().trim(),
        name,
        approved_at: new Date().toISOString()
      });

    if (approveError) throw approveError;

    // Update request status
    const { error: updateError } = await supabase
      .from('access_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (e) {
    console.error('Approve request failed:', e);
    return { success: false, error: e.message };
  }
};

// Deny access request (admin only)
export const denyRequest = async (requestId) => {
  try {
    const { error } = await supabase
      .from('access_requests')
      .update({ status: 'denied', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error('Deny request failed:', e);
    return { success: false, error: e.message };
  }
};

// Check if user is an admin
export const checkIsAdmin = async (email) => {
  try {
    const { data, error } = await supabase
      .from('approved_users')
      .select('is_admin')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return {
      success: true,
      isAdmin: data?.is_admin || false
    };
  } catch (e) {
    console.error('Check admin failed:', e);
    return { success: false, error: e.message };
  }
};
