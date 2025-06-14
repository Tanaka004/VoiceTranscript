import { Recording } from '../types/Recording';

const STORAGE_KEY = 'voice-recordings';

export const saveRecording = async (recording: Recording): Promise<void> => {
  try {
    const recordings = getStoredRecordings();
    recordings.push({
      ...recording,
      audioBlob: undefined, // Don't store blob in localStorage
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
    
    // Store audio blob separately in IndexedDB for better performance
    await storeAudioBlob(recording.id, recording.audioBlob);
  } catch (error) {
    console.error('Failed to save recording:', error);
    throw new Error('Failed to save recording');
  }
};

export const getStoredRecordings = (): Omit<Recording, 'audioBlob'>[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load recordings:', error);
    return [];
  }
};

export const deleteRecording = async (id: string): Promise<void> => {
  try {
    const recordings = getStoredRecordings().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
    await deleteAudioBlob(id);
  } catch (error) {
    console.error('Failed to delete recording:', error);
    throw new Error('Failed to delete recording');
  }
};

export const getRecordingWithAudio = async (id: string): Promise<Recording | null> => {
  try {
    const recordings = getStoredRecordings();
    const recording = recordings.find(r => r.id === id);
    if (!recording) return null;

    const audioBlob = await getAudioBlob(id);
    if (!audioBlob) return null;

    return {
      ...recording,
      audioBlob,
      createdAt: new Date(recording.createdAt),
    };
  } catch (error) {
    console.error('Failed to load recording with audio:', error);
    return null;
  }
};

// IndexedDB utilities for audio blob storage
const DB_NAME = 'VoiceRecordings';
const DB_VERSION = 1;
const STORE_NAME = 'audioBlobs';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const storeAudioBlob = async (id: string, audioBlob: Blob): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.put(audioBlob, id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

const getAudioBlob = async (id: string): Promise<Blob | null> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

const deleteAudioBlob = async (id: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};