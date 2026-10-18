import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { app } from './firebase.js'

const auth = getAuth(app)

export function subscribeToAuth(callback, onError) {
  return onAuthStateChanged(auth, callback, onError)
}

export function createAccount(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function signOutUser() {
  return signOut(auth)
}
