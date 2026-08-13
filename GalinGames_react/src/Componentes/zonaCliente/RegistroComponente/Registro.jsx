
import { useState } from 'react'
import InputBox from '/src/Componentes/compGlobales/InputBoxComponente/InputBox'
import './Registro.css'


function Registro() {
  const [formulario, setFormulario] = useState({})
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false)

  const OnChangeHandler = (e) => {
    setFormulario((valorAnterior) => ({ ...valorAnterior, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!aceptaTerminos || !aceptaPrivacidad) {
      alert('Debes aceptar los términos y la política de privacidad.');
      return;
    }
    // Aquí puedes enviar formulario a backend o hacer lo que necesites
    console.log({ ...formulario, aceptaTerminos, aceptaPrivacidad });
    alert('¡Registro enviado!');
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative' }}>
      <div className="fondo-gaming" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh' }} />
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
  <div className="contenido-registro form-box">
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mb-3 color-fondo marginForm rounded">
              <h1 className='videojuego-title'>Datos de la cuenta</h1>
              {/*Forma anterior con cada input por separado*/}
              {/* <label htmlFor="username" className="form-label videojuego-text">Nombre de Usuario</label>
              <input type="text" className="form-control" id="username" placeholder='Introduce tu nombre de usuario...' />
              <label htmlFor="nombre" className="form-label videojuego-text">Nombre</label>
              <input type="text" className="form-control" id="nombre" placeholder='Introduce tu nombre...'/>
              <label htmlFor="apellidos" className="form-label videojuego-text">Apellidos</label>
              <input type="text" className="form-control" id="apellidos" placeholder='Introduce tus apellidos...'/>
              <label htmlFor="email" className="form-label videojuego-text">Email</label>
              <input type="email" className="form-control" id="email" placeholder='Introduce tu email...'/>
              <label htmlFor="password" className="form-label videojuego-text">Contraseña</label>
              <input type="password" className="form-control" id="password" placeholder='Introduce tu contraseña...'/>
              <label htmlFor="Repetirpassword" className="form-label videojuego-text">Repetir Contraseña</label>
              <input type="password" className="form-control" id="Repetirpassword" placeholder='Introduce nuevamente tu contraseña...'/> */}
              {/*Nueva forma con componente InputBox y un map*/}
              {['username', 'nombre', 'apellidos', 'email', 'password', 'Repetirpassword'].map((campo,pos) => (
                <InputBox
                  key={pos}
                  nameInput={campo}
                  labelInput={campo === 'password' ? 'Contraseña' : campo === 'Repetirpassword' ? 'Repetir Contraseña' : campo.charAt(0).toUpperCase() + campo.slice(1)}
                  typeInput={campo === 'email' ? 'email' : campo.toLowerCase().includes('password') ? 'password' : 'text'}
                  placeholderInput={campo === 'password' ? 'Introduce tu contraseña...' : campo === 'Repetirpassword' ? 'Introduce nuevamente tu contraseña...' : `Introduce tu ${campo}...`}
                  eventoOnChange={OnChangeHandler}
                />
              ))}
                <div className="d-flex align-items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="comprobarTerminos"
                    checked={aceptaTerminos}
                    onChange={e => setAceptaTerminos(e.target.checked)}
                  />
                  <label className="form-check-label videojuego-conditions" htmlFor="terminosCheck">Acepto los términos y condiciones</label>
                </div>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="comprobarPolitica"
                    checked={aceptaPrivacidad}
                    onChange={e => setAceptaPrivacidad(e.target.checked)}
                  />
                  <label className="m-2 form-check-label videojuego-conditions" htmlFor="comprobarPolitica">
                    He leído y acepto la{' '}
                    <a href="#" className="text-primary text-decoration-underline">Política de privacidad</a>
                  </label>
                </div>
                <div className="mt-3 w-100 d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary botonRegistro">Registrarse</button>
                </div>
                <div>
                  <a href="#" className="videojuego-conditions text-decoration-underline">¿Ya tienes cuenta? Inicia sesión</a>
                </div>
                <div className="invalid-feedback">Debes aceptar los términos y condiciones.</div>
                <div className="invalid-feedback">Debes aceptar la política de privacidad.</div>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  )
}

export default Registro
