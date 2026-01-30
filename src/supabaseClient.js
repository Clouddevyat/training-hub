import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vfqthwlusouhrokxvoio.supabase.co';
const supabaseAnonKey = 'sb_publishable_A7O6dk7tBKk30Ra155lD5g_dSPspeq4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get or create a device ID for anonymous sync
export const getDeviceId = () => {
  let deviceId = localStorage.getItem('trainingHub_deviceId');
  if (!deviceId) {
    deviceId = 'device_' + crypto.randomUUID();
    localStorage.setItem('trainingHub_deviceId', deviceId);
  }
  return deviceId;
};
