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
