import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NacionalidadSelect from './NacionalidadSelect'

const OPCIONES = [
  { code: 'ES', nombre: 'España' },
  { code: 'MX', nombre: 'México' },
  { code: 'US', nombre: 'Estados Unidos de América' },
]

function setup(props = {}) {
  const onChange = vi.fn()
  render(
    <NacionalidadSelect
      id="nacionalidad"
      value=""
      onChange={onChange}
      options={OPCIONES}
      disabled={false}
      placeholder="Selecciona un país"
      {...props}
    />,
  )
  return { onChange }
}

describe('NacionalidadSelect', () => {
  it('muestra el placeholder cuando no hay valor seleccionado', () => {
    setup()
    expect(screen.getByRole('combobox')).toHaveTextContent('Selecciona un país')
  })

  it('muestra el nombre del país cuando ya hay un valor', () => {
    setup({ value: 'ES' })
    expect(screen.getByRole('combobox')).toHaveTextContent('España')
  })

  it('al hacer clic abre la lista con las opciones', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'México' })).toBeInTheDocument()
  })

  it('al elegir una opción, llama a onChange con el código y cierra la lista', async () => {
    const user = userEvent.setup()
    const { onChange } = setup()

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'México' }))

    expect(onChange).toHaveBeenCalledWith('MX')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('navega con flechas y selecciona con Enter', async () => {
    const user = userEvent.setup()
    const { onChange } = setup()

    const boton = screen.getByRole('combobox')
    boton.focus()
    await user.keyboard('{ArrowDown}') // abre y activa la 1ª opción (España)
    await user.keyboard('{ArrowDown}') // activa México
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith('MX')
  })

  it('Escape cierra la lista sin seleccionar', async () => {
    const user = userEvent.setup()
    const { onChange } = setup()

    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('al hacer clic fuera, cierra la lista', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <NacionalidadSelect
          id="nacionalidad"
          value=""
          onChange={vi.fn()}
          options={OPCIONES}
          disabled={false}
          placeholder="Selecciona un país"
        />
        <button type="button">fuera</button>
      </div>,
    )

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'fuera' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('deshabilitado no abre la lista al hacer clic', async () => {
    const user = userEvent.setup()
    setup({ disabled: true })

    expect(screen.getByRole('combobox')).toBeDisabled()
    await user.click(screen.getByRole('combobox'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
