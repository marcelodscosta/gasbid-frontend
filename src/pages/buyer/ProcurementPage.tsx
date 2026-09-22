import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerRequestsApi, ordersApi } from '../../api'
import {
  formatDate, formatCurrency,
  requestStatusLabel, requestStatusBadge,
  orderStatusLabel, orderStatusBadge,
  mantineBadgeColor
} from '../../lib/utils'
import {
  IconShoppingCart, IconPackage,
  IconChevronRight, IconPlus, IconMessage
} from '@tabler/icons-react'
import {
  Box, Group, Title, Text, Button, Tabs, Card, Badge, Table,
  ScrollArea, Flex
} from '@mantine/core'

export function ProcurementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'requests'

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab })
  }

  // --- Queries ---
  const { data: requestsResponse, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['buyer-requests'],
    queryFn: () => buyerRequestsApi.list({ limit: 50 }),
  })

  const { data: ordersResponse, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['buyer-orders'],
    queryFn: () => ordersApi.list({ limit: 50 }),
  })

  const requests = requestsResponse?.data ?? []
  const orders = ordersResponse?.data ?? []

  // Count Badges
  const openRequestsCount = requests.filter(r => r.status === 'OPEN' || r.status === 'UNDER_REVIEW').length
  const pendingOrdersCount = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'IN_DELIVERY').length

  return (
    <Box>
      <Group justify="space-between" align="center" mb="xl">
        <Box>
          <Title order={2} size="h3" fw={700}>Compras & Suprimentos</Title>
          <Text c="dimmed" size="sm">Acompanhe suas cotações e gerencie seus pedidos</Text>
        </Box>
        <Button component={Link} to="/requests/new" leftSection={<IconPlus size={16} />} color="gasbidOrange">
          Nova Solicitação
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={(val) => setActiveTab(val as string)} mb="md" color="gasbidOrange">
        <Tabs.List>
          <Tabs.Tab value="requests" leftSection={<IconShoppingCart size={16} />}>
            Solicitações
            {openRequestsCount > 0 && (
              <Badge color="orange" size="sm" variant="filled" ml={8}>{openRequestsCount}</Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value="orders" leftSection={<IconPackage size={16} />}>
            Pedidos
            {pendingOrdersCount > 0 && (
              <Badge color="teal" size="sm" variant="filled" ml={8}>{pendingOrdersCount}</Badge>
            )}
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Card withBorder radius="md" p={0}>
        {activeTab === 'requests' && (
          <>
            {isLoadingRequests ? (
              <Flex direction="column" align="center" py={40} c="dimmed">
                <Text>Carregando solicitações...</Text>
              </Flex>
            ) : requests.length === 0 ? (
              <Flex direction="column" align="center" py={60} c="dimmed">
                <IconShoppingCart size={48} />
                <Title order={3} size="h4" mt="md">Nenhuma solicitação encontrada</Title>
                <Text size="sm" mb="lg">Crie uma nova solicitação para começar a receber lances.</Text>
                <Button component={Link} to="/requests/new" color="gasbidOrange">
                  Criar Solicitação
                </Button>
              </Flex>
            ) : (
              <>
                <ScrollArea>
                  <Table verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Produto</Table.Th>
                        <Table.Th>Quantidade</Table.Th>
                        <Table.Th>Prazo</Table.Th>
                        <Table.Th>Lances</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {requests.map((r: any) => (
                        <Table.Tr key={r.id}>
                          <Table.Td fw={600}>{r.items?.[0]?.product?.name || 'Vários itens'}</Table.Td>
                          <Table.Td>{r.items?.reduce((acc: number, i: any) => acc + i.quantity, 0)} un.</Table.Td>
                          <Table.Td>{formatDate(r.deadline)}</Table.Td>
                          <Table.Td>
                            <Group gap={6}>
                              <IconMessage size={16} color={r._count?.proposals ? 'var(--mantine-color-gasbidOrange-6)' : 'var(--mantine-color-dimmed)'} />
                              <Text fw={600} size="sm">{r._count?.proposals ?? 0}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={mantineBadgeColor(requestStatusBadge(r.status))} variant="light">
                              {requestStatusLabel(r.status)}
                            </Badge>
                          </Table.Td>
                          <Table.Td align="right">
                            <Button component={Link} to={`/requests/${r.id}`} variant="subtle" size="xs" color="gray" rightSection={<IconChevronRight size={14} />}>
                              Detalhes
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <>
            {isLoadingOrders ? (
              <Flex direction="column" align="center" py={40} c="dimmed">
                <Text>Carregando pedidos...</Text>
              </Flex>
            ) : orders.length === 0 ? (
              <Flex direction="column" align="center" py={60} c="dimmed">
                <IconPackage size={48} />
                <Title order={3} size="h4" mt="md">Nenhum pedido ainda</Title>
                <Text size="sm">Assim que você aprovar uma proposta, o pedido aparecerá aqui.</Text>
              </Flex>
            ) : (
              <>
                <ScrollArea>
                  <Table verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Pedido</Table.Th>
                        <Table.Th>Fornecedor</Table.Th>
                        <Table.Th>Total</Table.Th>
                        <Table.Th>Data</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {orders.map((order: any) => (
                        <Table.Tr key={order.id}>
                          <Table.Td>
                            <Text fw={600}>#{order.id.slice(-6).toUpperCase()}</Text>
                            <Text size="xs" c="dimmed">{order.buyerRequest?.items?.[0]?.product?.name}</Text>
                          </Table.Td>
                          <Table.Td>{order.supplierCompany?.name}</Table.Td>
                          <Table.Td fw={700}>{formatCurrency(order.totalPrice)}</Table.Td>
                          <Table.Td>{formatDate(order.createdAt)}</Table.Td>
                          <Table.Td>
                            <Badge color={mantineBadgeColor(orderStatusBadge(order.status))} variant="light">
                              {orderStatusLabel(order.status)}
                            </Badge>
                          </Table.Td>
                          <Table.Td align="right">
                            <Button component={Link} to={`/orders/${order.id}`} variant="subtle" size="xs" color="gray" rightSection={<IconChevronRight size={14} />}>
                              Acompanhar
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </>
            )}
          </>
        )}
      </Card>
    </Box>
  )
}
