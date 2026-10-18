import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { buyerRequestsApi, ordersApi } from '../../api'
import { api } from '../../lib/axios'
import {
  formatCurrency, formatDate, requestStatusLabel, requestStatusBadge,
  orderStatusLabel, orderStatusBadge, mantineBadgeColor
} from '../../lib/utils'
import {
  IconShoppingCart, IconPackage, IconClock, IconPlus, IconArrowRight,
  IconWallet, IconTarget, IconChartBar, IconMapPin
} from '@tabler/icons-react'
import {
  Box, Group, Title, Text, Button, SimpleGrid, Card, ThemeIcon,
  Badge, Stack, Flex, Divider, UnstyledButton
} from '@mantine/core'

export function BuyerDashboard() {
  const { user } = useAuth()

  const { data: requestsData } = useQuery({
    queryKey: ['buyer-requests'],
    queryFn: () => buyerRequestsApi.list({ limit: 10 }),
  })

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list({ limit: 100 }), // Pegamos mais para estatísticas
  })

  const requests = requestsData?.data ?? []
  const orders = ordersData?.data ?? []

  // Stats
  const openRequests = requests.filter(r => r.status === 'OPEN').length
  const totalSpent = orders.reduce((acc, o) => acc + o.totalPrice, 0)

  // Real Price Intelligence Calculation
  const productsWithPrices = orders.reduce((acc: any, order) => {
    order.proposal?.items?.forEach((proposalItem: any) => {
      const brItem = order.buyerRequest?.items?.find((i: any) => i.id === proposalItem.buyerRequestItemId)
      const productName = brItem?.product?.name || 'Produto'
      const unitPrice = proposalItem.unitPrice

      if (!acc[productName]) acc[productName] = []
      acc[productName].push(unitPrice)
    })
    return acc
  }, {})

  const priceStats = Object.keys(productsWithPrices).map(name => {
    const prices = productsWithPrices[name]
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length
    const range = max - min
    const relativePercentage = range === 0 ? 0.5 : (avg - min) / range
    const percentage = 10 + (relativePercentage * 80)

    return { product: name, min, max, avg, percentage, count: prices.length }
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['nearby-suppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers/nearby')
      return res.data || []
    }
  })

  const activeOrder = orders.find(o => ['PENDING_CONFIRMATION', 'CONFIRMED', 'IN_DELIVERY'].includes(o.status))

  return (
    <Box>
      <Group justify="space-between" align="center" mb="xl">
        <Box>
          <Title order={2} size="h3" fw={700}>Olá, {user?.name?.split(' ')[0]} 👋</Title>
          <Text c="dimmed" size="sm">Bem-vindo ao painel de compras · {user?.company?.name}</Text>
        </Box>
        <Button component={Link} to="/requests/new" leftSection={<IconPlus size={16} />} color="gasbidOrange">
          Nova Solicitação
        </Button>
      </Group>

      {/* Geolocation Map Section */}
      <Card withBorder p={0} radius="md" mb="xl">
        <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
          <Group justify="space-between">
            <Box>
              <Group gap="xs">
                <IconMapPin size={18} color="var(--mantine-color-gasbidOrange-6)" />
                <Text fw={600} size="sm">Revendas Locais na Sua Região</Text>
              </Group>
              <Text size="xs" c="dimmed" mt={2}>
                {activeOrder ? '🟢 Pedido em andamento com ' + activeOrder.supplierCompany?.name : 'Revendas disponíveis sinalizadas no mapa'}
              </Text>
            </Box>
            <Badge color="gasbidOrange" variant="light">
              {suppliers.length} Distribuidoras Ativas
            </Badge>
          </Group>
        </Box>
        <Box h={260} pos="relative" bg="var(--mantine-color-default)">
          {suppliers.length > 0 ? (
            <iframe
              width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=-40.5500,-9.4200,-40.4500,-9.3500&layer=mapnik&marker=${suppliers[0]?.addresses?.[0]?.latitude ?? -9.3890},${suppliers[0]?.addresses?.[0]?.longitude ?? -40.5020}`}
              style={{ border: 0 }}
            />
          ) : (
            <Flex align="center" justify="center" h="100%" c="dimmed">
              <Text>Carregando mapa regional...</Text>
            </Flex>
          )}
        </Box>
      </Card>

      {/* Main KPIs */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Solicitações Criadas</Text>
            <ThemeIcon color="gray" variant="light" size="lg" radius="md">
              <IconShoppingCart size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl">{requestsData?.total ?? 0}</Text>
        </Card>
        
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Aguardando Propostas</Text>
            <ThemeIcon color="yellow" variant="light" size="lg" radius="md">
              <IconClock size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl">{openRequests}</Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total Gasto</Text>
            <ThemeIcon color="teal" variant="light" size="lg" radius="md">
              <IconWallet size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl">{formatCurrency(totalSpent)}</Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Economia Estimada</Text>
            <ThemeIcon color="blue" variant="light" size="lg" radius="md">
              <IconTarget size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl">{orders.length > 0 ? '8.5%' : '--'}</Text>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
        
        {/* Price Insights Section */}
        <Card withBorder radius="md" p="md" style={{ display: 'flex', flexDirection: 'column' }}>
          <Group justify="space-between" align="flex-start" mb="xl">
            <Box>
              <Text fw={600} size="lg">Inteligência de Preços</Text>
              <Text size="xs" c="dimmed">Baseado no seu histórico real de compras</Text>
            </Box>
            <ThemeIcon color="gasbidOrange" variant="light" size="lg" radius="md">
              <IconChartBar size={20} />
            </ThemeIcon>
          </Group>

          <Stack style={{ flex: 1 }} gap="lg">
            {priceStats.length === 0 ? (
              <Flex direction="column" align="center" justify="center" style={{ flex: 1, opacity: 0.6 }} py="xl">
                <IconChartBar size={32} style={{ marginBottom: 12 }} />
                <Text size="sm">Aguardando o primeiro pedido para calcular estatísticas de preço.</Text>
              </Flex>
            ) : (
              priceStats.map(stat => (
                <Box key={stat.product}>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600} size="sm">{stat.product}</Text>
                    <Text size="xs" c="dimmed">{stat.count} pedido(s)</Text>
                  </Group>
                  
                  {/* Visual Price Range Bar */}
                  <Box pos="relative" h={8} bg="var(--mantine-color-default-hover)" style={{ borderRadius: 4, marginBottom: 20 }}>
                    <Box pos="absolute" left="10%" right="10%" top={0} bottom={0} bg="rgba(249,115,22,0.2)" style={{ borderRadius: 4, border: '1px solid var(--mantine-color-gasbidOrange-6)' }} />
                    <Text pos="absolute" left="10%" top={12} size="xs" c="dimmed">{formatCurrency(stat.min)}</Text>
                    <Text pos="absolute" right="10%" top={12} size="xs" c="dimmed">{formatCurrency(stat.max)}</Text>
                    <Box pos="absolute" left={`${stat.percentage}%`} top={-4} w={2} h={16} bg="gasbidOrange" style={{ boxShadow: '0 0 8px var(--mantine-color-gasbidOrange-6)' }} />
                    <Text pos="absolute" left={`${stat.percentage}%`} top={-22} size="xs" fw={700} c="gasbidOrange" style={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                      {formatCurrency(stat.avg)}
                    </Text>
                  </Box>
                </Box>
              ))
            )}
          </Stack>
          
          <Divider mt="auto" mb="sm" pt="md" />
          <UnstyledButton component={Link} to="/requests" style={{ display: 'flex', justifyContent: 'center' }}>
            <Group gap={4}>
              <Text size="sm" fw={600} c="gasbidOrange">Analisar histórico completo</Text>
              <IconArrowRight size={14} color="var(--mantine-color-gasbidOrange-6)" />
            </Group>
          </UnstyledButton>
        </Card>

        <Stack gap="xl">
          {/* Recent Activity (Requests) */}
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="md">
              <Text fw={600} size="lg">Solicitações Recentes</Text>
              <Button component={Link} to="/requests" variant="subtle" size="xs" color="gray">Ver todas</Button>
            </Group>

            {requests.length === 0 ? (
              <Flex direction="column" align="center" py="xl" c="dimmed">
                <IconShoppingCart size={32} />
                <Text mt="md" fw={500}>Nenhuma solicitação</Text>
                <Button component={Link} to="/requests/new" size="xs" mt="sm" color="gasbidOrange">Criar primeira</Button>
              </Flex>
            ) : (
              <Stack gap="sm">
                {requests.slice(0, 4).map((r: any) => (
                  <UnstyledButton component={Link} to={`/requests/${r.id}`} key={r.id}
                    p="sm"
                    style={{ borderRadius: 8, transition: 'background 0.2s' }}
                    className="hover-bg-subtle"
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Box>
                        <Text fw={600} size="sm" c="var(--mantine-color-text)">
                          {r.items?.[0]?.product?.name || 'Solicitação'} · {r.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0} un.
                        </Text>
                        <Text size="xs" c="dimmed" mt={2}>
                          {formatDate(r.createdAt)} · {r._count?.proposals ?? 0} propostas recebidas
                        </Text>
                      </Box>
                      <Badge color={mantineBadgeColor(requestStatusBadge(r.status))} variant="light" size="sm">
                        {requestStatusLabel(r.status)}
                      </Badge>
                    </Group>
                  </UnstyledButton>
                ))}
              </Stack>
            )}
          </Card>

          {/* Recent Orders */}
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="md">
              <Text fw={600} size="lg">Pedidos Recentes</Text>
              <Button component={Link} to="/orders" variant="subtle" size="xs" color="gray">Ver todos</Button>
            </Group>

            {orders.length === 0 ? (
              <Flex direction="column" align="center" py="xl" c="dimmed">
                <IconPackage size={32} />
                <Text mt="md" fw={500}>Nenhum pedido ainda</Text>
                <Text size="xs">Aceite uma proposta para gerar um pedido</Text>
              </Flex>
            ) : (
              <Stack gap="sm">
                {orders.slice(0, 4).map((o: any) => (
                  <UnstyledButton component={Link} to={`/orders/${o.id}`} key={o.id}
                    p="sm"
                    style={{ borderRadius: 8, transition: 'background 0.2s' }}
                    className="hover-bg-subtle"
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Box>
                        <Text fw={600} size="sm" c="var(--mantine-color-text)">
                          {o.buyerRequest?.items?.[0]?.product?.name || 'Pedido'}
                        </Text>
                        <Text size="xs" c="dimmed" mt={2}>
                          {formatCurrency(o.totalPrice)} · {o.supplierCompany?.name}
                        </Text>
                      </Box>
                      <Badge color={mantineBadgeColor(orderStatusBadge(o.status))} variant="light" size="sm">
                        {orderStatusLabel(o.status)}
                      </Badge>
                    </Group>
                  </UnstyledButton>
                ))}
              </Stack>
            )}
          </Card>
        </Stack>

      </SimpleGrid>
      
      {/* Helper CSS para Hover (Pode ir pro index.css dps, mas pra garantir o style inline no Mantine) */}
      <style>{`
        .hover-bg-subtle:hover {
          background: var(--mantine-color-default-hover);
        }
      `}</style>
    </Box>
  )
}
