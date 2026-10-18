function BotonContador({ contador, alIncrementar }) {
  return (
    <button type="button" className="counter" onClick={alIncrementar}>
      Count is {contador}
    </button>
  )
}

export default BotonContador
