import { useTranslation } from 'react-i18next'

// Sin backend de pedidos en esta spec (Requisito 15): solo el estado vacío.
function PedidosPanel() {
  const { t } = useTranslation()

  return <p className="texto-tema">{t('miCuenta.pedidos.empty')}</p>
}

export default PedidosPanel
