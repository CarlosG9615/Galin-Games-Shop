import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Registro from './Componentes/zonaCliente/RegistroComponente/Registro.jsx';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Registro />
  </StrictMode>,
)
