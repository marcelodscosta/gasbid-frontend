import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Alert, Badge, Box, Card, Group, Loader, Text, Title } from '@mantine/core'
import { IconMapPin, IconTruckDelivery } from '@tabler/icons-react'
import { ordersApi } from '../../api'
import { formatDateTime } from '../../lib/utils'

const truckIcon = L.divIcon({
  className: '',
  html: '<img src="/logo-mark.png" width="38" height="38" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,.45))" />',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

interface Props {
  orderId: string
}

/** Posição do revendedor em tempo real (WebSocket invalida a query; polling de 10 s como fallback). */
export function LiveTracking({ orderId }: Props) {
  const queryClient = useQueryClient()
  const mapEl = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: () => ordersApi.tracking(orderId),
    refetchInterval: 10_000,
  })

  // Atualiza instantaneamente quando o hook global de WS recebe SUPPLIER_LOCATION
  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ['order-tracking', orderId] })
    window.addEventListener('gasbid:supplier-location', handler)
    return () => window.removeEventListener('gasbid:supplier-location', handler)
  }, [orderId, queryClient])

  const loc = data?.location
  const online = !!data?.online

  useEffect(() => {
    if (!mapEl.current || map.current) return
    map.current = L.map(mapEl.current, { zoomControl: true, attributionControl: true }).setView([-14.235, -51.925], 4)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map.current)
    return () => {
      map.current?.remove()
      map.current = null
      marker.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current || !loc) return
    const pos: L.LatLngExpression = [loc.latitude, loc.longitude]
    if (!marker.current) {
      marker.current = L.marker(pos, { icon: truckIcon }).addTo(map.current)
      map.current.setView(pos, 15)
    } else {
      marker.current.setLatLng(pos)
      map.current.panTo(pos)
    }
  }, [loc?.latitude, loc?.longitude])

  return (
    <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
      <Group justify="space-between" p="md" pb="sm">
        <Group gap="xs">
          <IconTruckDelivery size={20} color="var(--mantine-color-gasbidOrange-5)" />
          <Title order={4} size="h5">Acompanhe a entrega</Title>
        </Group>
        {isLoading ? <Loader size="xs" /> : (
          <Badge color={online ? 'green' : 'gray'} variant="light">
            {online ? 'Ao vivo' : 'Sem sinal'}
          </Badge>
        )}
      </Group>

      {!isLoading && !online && (
        <Box px="md" pb="sm">
          <Alert color="gray" variant="light" icon={<IconMapPin size={16} />}>
            {data?.trackingEnabled
              ? 'O revendedor ainda não está compartilhando a localização. Assim que ele iniciar, o mapa atualiza sozinho.'
              : 'Este revendedor não habilitou o rastreamento em tempo real.'}
          </Alert>
        </Box>
      )}

      <Box ref={mapEl} h={320} style={{ background: 'var(--mantine-color-default-hover)' }} />

      {loc && (
        <Text size="xs" c="dimmed" p="sm" ta="center">
          Última atualização: {formatDateTime(loc.updatedAt)}
          {typeof loc.speed === 'number' && loc.speed > 0 ? ` · ${(loc.speed * 3.6).toFixed(0)} km/h` : ''}
        </Text>
      )}
    </Card>
  )
}
