import { useEffect, useRef, useState } from 'react'
import marcaImagen from '../assets/f2.jpeg'
import './Inicio.css'

const dateFormatter = new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
})

function Inicio() {
  const [images, setImages] = useState([])
  const [theme, setTheme] = useState('claro')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authMode, setAuthMode] = useState('signin')
  const [authBusy, setAuthBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    let unsubscribe = () => {}

    import('../database/autenticacionModelo.js')
      .then(({ subscribeToAuth }) => {
        if (!isMounted) {
          return
        }

        unsubscribe = subscribeToAuth(
          (currentUser) => {
            setUser(currentUser)
            setAuthLoading(false)
            setLoading(Boolean(currentUser))

            if (!currentUser) {
              setImages([])
            }
          },
          (authListenerError) => {
            setAuthError(`No se pudo verificar la sesión. ${authListenerError.message}`)
            setAuthLoading(false)
          },
        )
      })
      .catch((authInitializationError) => {
        if (isMounted) {
          setAuthError(`No se pudo conectar con Firebase Authentication. ${authInitializationError.message}`)
          setAuthLoading(false)
        }
      })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (authLoading) {
      return undefined
    }

    if (!user) {
      return undefined
    }

    let isMounted = true
    let unsubscribe = () => {}

    import('../database/galeriaModelo.js')
      .then(({ subscribeToGallery }) => {
        if (!isMounted) {
          return
        }

        unsubscribe = subscribeToGallery(
          (galleryImages) => {
            setImages(galleryImages)
            setLoading(false)
          },
          (firebaseError) => {
            setError(`No se pudo cargar la galería. ${firebaseError.message}`)
            setLoading(false)
          },
        )
      })
      .catch((firebaseError) => {
        if (isMounted) {
          setError(`No se pudo conectar con Firestore. ${firebaseError.message}`)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [authLoading, user])

  async function handleAuthentication(event) {
    event.preventDefault()
    setAuthBusy(true)
    setAuthError('')
    setAuthNotice('')

    try {
      const authModel = await import('../database/autenticacionModelo.js')

      if (authMode === 'signup') {
        await authModel.createAccount(email, password)
        setAuthNotice('Cuenta creada. Ya puedes usar la galería.')
      } else {
        await authModel.signIn(email, password)
        setAuthNotice('Sesión iniciada.')
      }

      setPassword('')
    } catch (authenticationError) {
      const messages = {
        'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Inicia sesión.',
        'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
        'auth/invalid-email': 'Escribe un correo electrónico válido.',
        'auth/operation-not-allowed': 'Activa el acceso por correo y contraseña en Firebase Console.',
        'auth/too-many-requests': 'Hubo demasiados intentos. Espera un momento y vuelve a probar.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      }

      setAuthError(
        messages[authenticationError.code] ||
        `No se pudo completar el acceso. ${authenticationError.message}`,
      )
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSignOut() {
    setAuthError('')
    setAuthNotice('')

    try {
      const { signOutUser } = await import('../database/autenticacionModelo.js')
      await signOutUser()
    } catch (signOutError) {
      setAuthError(`No se pudo cerrar la sesión. ${signOutError.message}`)
    }
  }

  function handleFileChange(event) {
    setSelectedFile(event.target.files?.[0] ?? null)
    setError('')
    setNotice('')
  }

  async function handleUpload(event) {
    event.preventDefault()

    if (!selectedFile) {
      setError('Selecciona una imagen antes de subirla.')
      return
    }

    setUploading(true)
    setError('')
    setNotice('')

    try {
      const { saveImageToGallery } = await import('../database/galeriaModelo.js')
      await saveImageToGallery(selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setNotice('La imagen se guardó correctamente.')
    } catch (uploadError) {
      setError(`No se pudo guardar la imagen. ${uploadError.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="inicio">
      <div className={`galeria galeria--${theme}`}>
        <header className="galeria__encabezado">
          <img className="galeria__marca" src={marcaImagen} alt="Lia" />
          <div>
            <p className="galeria__sobretitulo">LOS MOMENTOS MAS HUMILDES DE LA LIA</p>
            <h1>Galería</h1>
            <p className="galeria__descripcion">
              Guarda y comparte aquí tus recuerdos en imágenes.
            </p>
          </div>
          <span className="galeria__contador">
            {user ? `${images.length} ${images.length === 1 ? 'foto' : 'fotos'}` : 'Acceso protegido'}
          </span>
        </header>

        {authLoading ? (
          <p className="estado-vacio" role="status">Verificando tu sesión…</p>
        ) : !user ? (
          <section className="acceso" aria-labelledby="acceso-titulo">
            <div className="acceso__encabezado">
              <p className="galeria__sobretitulo">GALERÍA PRIVADA</p>
              <h2 id="acceso-titulo">
                {authMode === 'signup' ? 'Crea tu cuenta' : 'Inicia sesión'}
              </h2>
              <p>Inicia sesión o crea una cuenta para ver y compartir recuerdos.</p>
            </div>
            <form className="acceso__formulario" onSubmit={handleAuthentication}>
              <label className="acceso__campo">
                Correo electrónico
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  maxLength={254}
                  disabled={authBusy}
                />
              </label>
              <label className="acceso__campo">
                Contraseña
                <input
                  type="password"
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  maxLength={128}
                  disabled={authBusy}
                />
              </label>
              <button className="boton boton--principal" type="submit" disabled={authBusy}>
                {authBusy
                  ? 'Un momento…'
                  : authMode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </form>
            <p className="acceso__alternativa">
              {authMode === 'signup' ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}
              {' '}
              <button
                className="acceso__cambiar"
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signup' ? 'signin' : 'signup')
                  setAuthError('')
                  setAuthNotice('')
                }}
              >
                {authMode === 'signup' ? 'Inicia sesión' : 'Crear una cuenta'}
              </button>
            </p>
            {authError && <p className="mensaje mensaje--error" role="alert">{authError}</p>}
            {authNotice && <p className="mensaje mensaje--exito" role="status">{authNotice}</p>}
          </section>
        ) : (
          <>
            <div className="sesion">
              <p>Sesión iniciada como <strong>{user.email}</strong></p>
              <button className="boton boton--secundario" type="button" onClick={handleSignOut}>
                Cerrar sesión
              </button>
            </div>

        <div className="tema">
          <span className="tema__etiqueta">Apariencia</span>
          <div className="tema__opciones" role="group" aria-label="Tema de la galería">
            <button
              className="tema__boton"
              type="button"
              aria-pressed={theme === 'claro'}
              onClick={() => setTheme('claro')}
            >
              Claro
            </button>
            <button
              className="tema__boton"
              type="button"
              aria-pressed={theme === 'oscuro'}
              onClick={() => setTheme('oscuro')}
            >
              Oscuro
            </button>
            <button
              className="tema__boton"
              type="button"
              aria-pressed={theme === 'transparente'}
              onClick={() => setTheme('transparente')}
            >
              Transparente
            </button>
          </div>
        </div>

        <form className="subida" onSubmit={handleUpload}>
          <div className="subida__texto">
            <span className="subida__icono" aria-hidden="true">＋</span>
            <div>
              <h2>Agrega un recuerdo</h2>
              <p>JPG, PNG o WebP · máximo 20 MB por imagen</p>
            </div>
          </div>
          <div className="subida__acciones">
            <input
              ref={fileInputRef}
              className="subida__input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              aria-label="Seleccionar una imagen"
              disabled={uploading}
            />
            <button
              className="boton boton--secundario"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Elegir imagen
            </button>
            <button
              className="boton boton--principal"
              type="submit"
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Subiendo…' : 'Subir foto'}
            </button>
          </div>
          {selectedFile && (
            <p className="subida__seleccionada" aria-live="polite">
              Seleccionada: {selectedFile.name}
            </p>
          )}
        </form>

        {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}
        {notice && <p className="mensaje mensaje--exito" role="status">{notice}</p>}

        <section className="coleccion" aria-labelledby="coleccion-titulo">
          <div className="coleccion__encabezado">
            <div>
              <p className="galeria__sobretitulo">COLECCIÓN</p>
              <h2 id="coleccion-titulo">Todas las imágenes</h2>
            </div>
            <span className="coleccion__cantidad">
              {loading ? 'Cargando…' : `${images.length} elementos`}
            </span>
          </div>

          {loading ? (
            <p className="estado-vacio" role="status">Cargando tus imágenes…</p>
          ) : images.length === 0 ? (
            <div className="estado-vacio">
              <span className="estado-vacio__icono" aria-hidden="true">▧</span>
              <h3>Tu galería empieza aquí</h3>
              <p>Elige una imagen para guardar tu primer recuerdo.</p>
            </div>
          ) : (
            <div className="fotos">
              {images.map((image) => (
                <article className="foto" key={image.id}>
                  <img
                    className="foto__imagen"
                    src={image.imageData}
                    alt={image.name || 'Imagen de la galería'}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="foto__pie">
                    <h3 title={image.name}>{image.name}</h3>
                    <time>
                      {image.createdAt?.toDate
                        ? dateFormatter.format(image.createdAt.toDate())
                        : 'Recién agregada'}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
          </>
        )}
      </div>
    </main>
  )
}

export default Inicio
