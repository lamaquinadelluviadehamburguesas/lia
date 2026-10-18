import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { app } from './firebase.js'

const MAX_FILE_BYTES = 20 * 1024 * 1024
const MAX_BASE64_LENGTH = 900_000
const MAX_IMAGE_DIMENSION = 1600
const GALLERY_COLLECTION = 'galeria'
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const database = getFirestore(app)

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('El navegador no devolvió los datos de la imagen.'))
        return
      }

      resolve(reader.result)
    }
    reader.readAsDataURL(blob)
  })
}

async function compressImage(file) {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Elige una imagen JPG, PNG o WebP.')
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error('La imagen original no puede superar los 20 MB.')
  }

  let bitmap

  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('No se pudo abrir la imagen. Prueba con otro archivo.')
  }

  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
    )
    let width = Math.max(1, Math.round(bitmap.width * scale))
    let height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('El navegador no pudo preparar la imagen.')
    }

    for (let resizeAttempt = 0; resizeAttempt < 7; resizeAttempt += 1) {
      canvas.width = width
      canvas.height = height
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
      context.drawImage(bitmap, 0, 0, width, height)

      for (const quality of [0.82, 0.7, 0.58]) {
        const blob = await new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', quality)
        })

        if (!blob) {
          throw new Error('No se pudo comprimir la imagen.')
        }

        const imageData = await readBlobAsDataUrl(blob)

        if (imageData.length <= MAX_BASE64_LENGTH) {
          return imageData
        }
      }

      width = Math.max(1, Math.round(width * 0.8))
      height = Math.max(1, Math.round(height * 0.8))
    }
  } finally {
    bitmap.close()
  }

  throw new Error('La imagen es demasiado grande para guardarla en la galería.')
}

export function subscribeToGallery(onImages, onError) {
  const imagesQuery = query(
    collection(database, GALLERY_COLLECTION),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(
    imagesQuery,
    (snapshot) => {
      onImages(snapshot.docs.map((imageDocument) => ({
        id: imageDocument.id,
        ...imageDocument.data(),
      })))
    },
    onError,
  )
}

export async function saveImageToGallery(file) {
  const imageData = await compressImage(file)

  await addDoc(collection(database, GALLERY_COLLECTION), {
    imageData,
    name: file.name.slice(0, 120),
    createdAt: serverTimestamp(),
  })
}
