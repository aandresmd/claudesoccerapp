import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

// Public web-app config for the team's Firebase project. These values identify
// the project but grant no access by themselves — security comes from the
// Firestore rules plus the unguessable team code.
const firebaseConfig = {
  apiKey: 'AIzaSyAFvtwKqFWvAJ1AJbm71iQFCRrYHFbhR_Y',
  authDomain: 'u12-coach-cfc.firebaseapp.com',
  projectId: 'u12-coach-cfc',
  storageBucket: 'u12-coach-cfc.firebasestorage.app',
  messagingSenderId: '176613975618',
  appId: '1:176613975618:web:af109a40fce8c9456c2fdb',
}

export const firebaseApp = initializeApp(firebaseConfig)

// Persistent local cache keeps the app fully usable offline at the field;
// queued writes sync when the connection returns.
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
