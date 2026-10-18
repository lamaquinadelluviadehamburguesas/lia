import { useState } from 'react'
import { incrementarContador } from '../database/contadorModelo.js'

function useContador() {
  const [contador, setContador] = useState(0)

  function incrementar() {
    setContador((valorActual) => incrementarContador(valorActual))
  }

  return { contador, incrementar }
}

export default useContador
