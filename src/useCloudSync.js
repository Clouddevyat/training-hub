import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, getDeviceId, getDeviceIdAsync, setSyncCode, getCurrentDeviceId } from './supabaseClient';

// Keys that should sync to cloud
const SYNC_KEYS = [
  'trainingHub_athleteProfile',
  'trainingHub_readiness',
  'trainingHub_benchmarkResults',
  'trainingHub_customPrograms',
  'trainingHub_programTemplates',
  'trainingHub_programState',
  'trainingHub_workoutLogs',
  'trainingHub_exerciseSwaps',
  'trainingHub_darkMode'
];

// Sync status for UI feedback
export const useSyncStatus = () => {
  const [status, setStatus] = useState({ syncing: false, lastSync: null, error: null });
  return [status, setStatus];
};

// Hook for synced storage - works like useLocalStorage but syncs to Supabase
export const useSyncedStorage = (key, initialValue, syncStatus, setSyncStatus) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const syncTimeoutRef = useRef(null);
  const shouldSync = SYNC_KEYS.includes(key);

  // Debounced cloud sync
  const syncToCloud = useCallback(async (value) => {
    if (!shouldSync) return;

    const deviceId = getDeviceId();

    try {
      setSyncStatus?.(prev => ({ ...prev, syncing: true, error: null }));

      const { error } = await supabase
        .from('user_data')
        .upsert({
          device_id: deviceId,
          data_key: key,
          data_value: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'device_id,data_key'
        });

      if (error) throw error;

      setSyncStatus?.(prev => ({
        ...prev,
        syncing: false,
        lastSync: new Date().toISOString(),
        error: null
      }));
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus?.(prev => ({
        ...prev,
        syncing: false,
        error: error.message
      }));
    }
  }, [key, shouldSync, setSyncStatus]);

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));

      // Debounce cloud sync (500ms delay to batch rapid changes)
      if (shouldSync) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          syncToCloud(valueToStore);
        }, 500);
      }
    } catch (error) {
      console.error('Storage error:', error);
    }
  }, [key, storedValue, shouldSync, syncToCloud]);

  return [storedValue, setValue];
};

// Initialize device ID from all storage sources (call on app startup)
export const initializeDeviceId = async () => {
  return await getDeviceIdAsync();
};

// Load all data from cloud on app start
export const loadFromCloud = async () => {
  // First, ensure we have the most persistent device ID
  const deviceId = await getDeviceIdAsync();

  // Check if we already loaded this session to prevent infinite reload loops
  const loadedFlag = sessionStorage.getItem('cloudDataLoaded');
  if (loadedFlag === 'true') {
    return { success: true, loaded: 0, total: 0, skipped: true };
  }

  try {
    console.log('Loading from cloud with device ID:', deviceId);

    const { data, error } = await supabase
      .from('user_data')
      .select('data_key, data_value, updated_at')
      .eq('device_id', deviceId);

    if (error) throw error;

    if (data && data.length > 0) {
      let loadedCount = 0;

      for (const row of data) {
        const localItem = window.localStorage.getItem(row.data_key);
        const localData = localItem ? JSON.parse(localItem) : null;

        // Always prefer cloud data if local is empty/missing
        // Or if cloud is newer
        const localTimestamp = localStorage.getItem(`${row.data_key}_timestamp`);
        const cloudTimestamp = row.updated_at;

        const shouldUseCloud = !localData ||
          !localItem ||
          (cloudTimestamp && (!localTimestamp || new Date(cloudTimestamp) > new Date(localTimestamp)));

        if (shouldUseCloud) {
          window.localStorage.setItem(row.data_key, JSON.stringify(row.data_value));
          window.localStorage.setItem(`${row.data_key}_timestamp`, cloudTimestamp);
          loadedCount++;
          console.log(`Cloud sync: loaded ${row.data_key} from cloud`);
        }
      }

      // Mark that we've loaded cloud data this session
      sessionStorage.setItem('cloudDataLoaded', 'true');

      return { success: true, loaded: loadedCount, total: data.length };
    }

    sessionStorage.setItem('cloudDataLoaded', 'true');
    return { success: true, loaded: 0, total: 0 };
  } catch (error) {
    console.error('Load from cloud error:', error);
    return { success: false, error: error.message };
  }
};

// Force sync all local data to cloud
export const syncAllToCloud = async (setSyncStatus) => {
  const deviceId = getDeviceId();
  setSyncStatus?.({ syncing: true, lastSync: null, error: null });

  // Clear the loaded flag so next reload will check cloud again
  sessionStorage.removeItem('cloudDataLoaded');

  try {
    const upserts = SYNC_KEYS.map(key => {
      const item = window.localStorage.getItem(key);
      if (!item) return null;

      return {
        device_id: deviceId,
        data_key: key,
        data_value: JSON.parse(item),
        updated_at: new Date().toISOString()
      };
    }).filter(Boolean);

    if (upserts.length > 0) {
      const { error } = await supabase
        .from('user_data')
        .upsert(upserts, { onConflict: 'device_id,data_key' });

      if (error) throw error;
    }

    setSyncStatus?.({
      syncing: false,
      lastSync: new Date().toISOString(),
      error: null
    });

    return { success: true, synced: upserts.length };
  } catch (error) {
    console.error('Sync all error:', error);
    setSyncStatus?.({ syncing: false, lastSync: null, error: error.message });
    return { success: false, error: error.message };
  }
};

// Load data using a specific sync code (for recovery)
export const loadWithSyncCode = async (code) => {
  const deviceId = 'sync_' + code.toLowerCase().trim();

  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('data_key, data_value, updated_at')
      .eq('device_id', deviceId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: false, error: 'No data found for this sync code' };
    }

    // Found data! Set this as the new device ID and load the data
    await setSyncCode(code);

    let loadedCount = 0;
    for (const row of data) {
      window.localStorage.setItem(row.data_key, JSON.stringify(row.data_value));
      window.localStorage.setItem(`${row.data_key}_timestamp`, row.updated_at);
      loadedCount++;
    }

    // Clear loaded flag so app will recognize the new data
    sessionStorage.removeItem('cloudDataLoaded');

    return { success: true, loaded: loadedCount, total: data.length };
  } catch (error) {
    console.error('Load with sync code error:', error);
    return { success: false, error: error.message };
  }
};

// Export helper to get current device ID for display
export { getCurrentDeviceId, setSyncCode };
