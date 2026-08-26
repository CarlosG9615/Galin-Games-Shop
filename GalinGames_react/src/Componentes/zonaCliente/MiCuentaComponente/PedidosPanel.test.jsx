import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PedidosPanel from './PedidosPanel'

describe('PedidosPanel', () => {
  it('muestra el mensaje de estado vacío', () => {
    render(<PedidosPanel />)
    expect(screen.getByText('Aún no tienes ningún pedido registrado')).toBeInTheDocument()
  })
})
