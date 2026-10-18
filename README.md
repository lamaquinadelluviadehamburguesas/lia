# Mi aplicación

Aplicación React creada con Vite y organizada con una arquitectura MVC:

- `src/database/`: modelo y operaciones de datos.
- `src/componetes/`: componentes reutilizables y el hook `useContador`, que conecta el estado con el modelo.
- `src/vista/`: pantallas de la aplicación.

`src/App.jsx` carga la galería principal. `src/database/galeriaModelo.js`
comprime las imágenes y las guarda como Base64 en la colección `galeria` de
Cloud Firestore. La imagen de fondo es `ff1.jpg`.

## Configuración de Firebase

La configuración del cliente de Firebase está en `src/database/firebase.js`.
Antes de usar la galería, crea o habilita Cloud Firestore para el proyecto
`caffe-gatos` desde Firebase Console. Las fotos se guardan como Base64 en
documentos de Firestore; no se usa Firebase Storage. El cliente limita el tamaño
de cada imagen codificada para que quepa en un documento de Firestore.

La galería requiere cuentas de Firebase Authentication con correo y contraseña.
Activa ese proveedor en Firebase Console → Authentication → Sign-in method.
El formulario permite crear cuentas, así que el registro es público; si solo
deben entrar personas autorizadas, desactiva el registro abierto y usa un
proceso de invitación o aprobación antes de compartir la aplicación.
`firestore.rule` permite leer la galería y crear imágenes solo a usuarios con
sesión; valida el esquema, el Base64 JPEG y la fecha, y bloquea actualizaciones,
borrados y cualquier otra colección. Revisa las reglas antes de publicarlas:
el registro público permite que cualquiera cree una cuenta, por lo que para
restringir quién puede entrar se necesita un proceso de invitación o aprobación.

Para publicar las reglas, revisa los cambios y ejecuta
`firebase deploy --only firestore:rules`. La configuración del cliente no
sustituye las reglas de seguridad. Si Firestore rechaza una lectura o escritura,
la galería muestra el error recibido.

## Comandos

- `pnpm dev`: inicia el servidor de desarrollo.
- `pnpm build`: genera la versión de producción.
- `pnpm lint`: ejecuta Oxlint.
