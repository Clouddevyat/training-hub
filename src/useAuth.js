import { useState, useEffect, useCallback } from 'react';
import { setSyncCode, getCurrentDeviceId } from './supabaseClient';

// Profile storage key
const PROFILE_KEY = 'trainingHub_profile';
const PROFILES_KEY = 'trainingHub_profiles'; // For multiple profiles on same device

// Check if WebAuthn (Face ID/Touch ID) is available
export const isBiometricAvailable = async () => {
  if (!window.PublicKeyCredential) {
    return false;
  }

  try {
    // Check if platform authenticator (Face ID, Touch ID, Windows Hello) is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (e) {
    console.warn('Biometric check failed:', e);
    return false;
  }
};

// Generate a random challenge for WebAuthn
const generateChallenge = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return array;
};

// Convert ArrayBuffer to base64 string
const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert base64 string to ArrayBuffer
const base64ToBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Register biometric credential (Face ID/Touch ID)
export const registerBiometric = async (userName) => {
  try {
    const userId = crypto.randomUUID();
    const challenge = generateChallenge();

    const publicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "Training Hub",
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },   // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Use built-in authenticator (Face ID, Touch ID)
        userVerification: "required",
        residentKey: "required",
      },
      timeout: 60000,
      attestation: "none",
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    // Store credential info for later authentication
    const credentialData = {
      id: credential.id,
      rawId: bufferToBase64(credential.rawId),
      type: credential.type,
    };

    return {
      success: true,
      credentialId: credential.id,
      credentialData,
      userId,
    };
  } catch (error) {
    console.error('Biometric registration failed:', error);
    return {
      success: false,
      error: error.message || 'Biometric registration failed',
    };
  }
};

// Authenticate with biometric (Face ID/Touch ID)
export const authenticateWithBiometric = async (credentialId) => {
  try {
    const challenge = generateChallenge();

    const publicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: "required",
      rpId: window.location.hostname,
    };

    // If we have a specific credential ID, use it
    if (credentialId) {
      publicKeyCredentialRequestOptions.allowCredentials = [{
        id: base64ToBuffer(credentialId),
        type: 'public-key',
        transports: ['internal'],
      }];
    }

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (!assertion) {
      throw new Error('Authentication failed');
    }

    return {
      success: true,
      credentialId: assertion.id,
    };
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed',
    };
  }
};

// Get saved profile
export const getSavedProfile = () => {
  try {
    const profile = localStorage.getItem(PROFILE_KEY);
    return profile ? JSON.parse(profile) : null;
  } catch (e) {
    return null;
  }
};

// Save profile
export const saveProfile = (profile) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    // Also save to profiles list
    const profiles = getSavedProfiles();
    const existingIndex = profiles.findIndex(p => p.id === profile.id);
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    return true;
  } catch (e) {
    console.error('Failed to save profile:', e);
    return false;
  }
};

// Get all saved profiles (for profile switching)
export const getSavedProfiles = () => {
  try {
    const profiles = localStorage.getItem(PROFILES_KEY);
    return profiles ? JSON.parse(profiles) : [];
  } catch (e) {
    return [];
  }
};

// Clear current profile (logout)
export const clearProfile = () => {
  localStorage.removeItem(PROFILE_KEY);
};

// Create a sync code from profile data
export const createSyncCodeFromProfile = (profile) => {
  // Use the credential ID or a hash of the profile for sync
  // This ensures each biometric identity has unique cloud data
  if (profile.credentialId) {
    return `bio_${profile.credentialId.substring(0, 32)}`;
  }
  // Fallback to name-based sync code
  return `user_${profile.name.toLowerCase().replace(/\s+/g, '_')}_${profile.id.substring(0, 8)}`;
};

// Hook for authentication state
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Check for existing profile on mount - but DON'T auto-login
  // User must tap to continue (more secure, shows welcome screen)
  useEffect(() => {
    const checkAuth = async () => {
      const bioAvailable = await isBiometricAvailable();
      setBiometricAvailable(bioAvailable);
      // Don't auto-authenticate - let user tap to login
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login with biometric (or just continue if no biometric set up)
  const loginWithBiometric = useCallback(async () => {
    const savedProfile = getSavedProfile();
    if (!savedProfile) {
      return { success: false, error: 'No saved profile' };
    }

    // If profile has biometric, require it
    if (savedProfile.hasBiometric && savedProfile.credentialRawId) {
      const result = await authenticateWithBiometric(savedProfile.credentialRawId);
      if (result.success) {
        setProfile(savedProfile);
        setIsAuthenticated(true);

        // Set the sync code for this profile
        const syncCode = createSyncCodeFromProfile(savedProfile);
        await setSyncCode(syncCode);
      }
      return result;
    }

    // No biometric - just log them in
    setProfile(savedProfile);
    setIsAuthenticated(true);

    // Set the sync code for this profile
    const syncCode = createSyncCodeFromProfile(savedProfile);
    await setSyncCode(syncCode);

    return { success: true };
  }, []);

  // Create new profile with biometric
  const createProfile = useCallback(async (name, useBiometric = true) => {
    const profileId = crypto.randomUUID();
    let credentialData = null;
    let credentialRawId = null;

    if (useBiometric && biometricAvailable) {
      const bioResult = await registerBiometric(name);
      if (bioResult.success) {
        credentialData = bioResult.credentialData;
        credentialRawId = bioResult.credentialData.rawId;
      } else {
        // Biometric failed, continue without it
        console.warn('Biometric registration failed, continuing without:', bioResult.error);
      }
    }

    const newProfile = {
      id: profileId,
      name,
      createdAt: new Date().toISOString(),
      credentialId: credentialData?.id || null,
      credentialRawId,
      hasBiometric: !!credentialData,
    };

    saveProfile(newProfile);
    setProfile(newProfile);
    setIsAuthenticated(true);

    // Set the sync code for this profile
    const syncCode = createSyncCodeFromProfile(newProfile);
    await setSyncCode(syncCode);

    return { success: true, profile: newProfile };
  }, [biometricAvailable]);

  // Login without biometric (name only - for devices without biometric)
  const loginWithName = useCallback(async (name) => {
    // Check if profile with this name exists
    const profiles = getSavedProfiles();
    let existingProfile = profiles.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (existingProfile) {
      saveProfile(existingProfile); // Set as current profile
      setProfile(existingProfile);
      setIsAuthenticated(true);

      const syncCode = createSyncCodeFromProfile(existingProfile);
      await setSyncCode(syncCode);

      return { success: true, profile: existingProfile, isExisting: true };
    }

    // Create new profile without biometric
    return createProfile(name, false);
  }, [createProfile]);

  // Link to existing account using sync code
  const linkAccount = useCallback(async (code) => {
    try {
      // Set the sync code to link this device
      const deviceId = await setSyncCode(code);

      // Create a profile for this device linked to the sync code
      const linkedProfile = {
        id: crypto.randomUUID(),
        name: code.split('_').pop() || 'Linked User', // Try to extract name from code
        createdAt: new Date().toISOString(),
        credentialId: null,
        credentialRawId: null,
        hasBiometric: false,
        linkedSyncCode: code,
      };

      saveProfile(linkedProfile);
      setProfile(linkedProfile);
      setIsAuthenticated(true);

      return { success: true, profile: linkedProfile, deviceId };
    } catch (error) {
      console.error('Link account failed:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    clearProfile();
    setProfile(null);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    profile,
    biometricAvailable,
    loginWithBiometric,
    createProfile,
    loginWithName,
    linkAccount,
    logout,
  };
};
