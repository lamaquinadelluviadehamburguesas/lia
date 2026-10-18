import { getApp, getApps, initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: 'AIzaSyB5Yves9vTBX00n4hnzTKQeLmGAyulvjks',
  authDomain: 'caffe-gatos.firebaseapp.com',
  projectId: 'caffe-gatos',
  storageBucket: 'caffe-gatos.firebasestorage.app',
  messagingSenderId: '350019266905',
  appId: '1:350019266905:web:370d62c85f385dccfec448',
  measurementId: 'G-N4PEP1K2QF',
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
