import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { opportunitiesApi, proposalsApi, ordersApi } from '../../api'
import { 
  formatDate, formatCurrency, 
  proposalStatusLabel, proposalStatusBadge,
  orderStatusLabel, orderStatusBadge,
  mantineBadgeColor
} from '../../lib/utils'
import { 
  IconFlame, IconMessageCircle, IconPackage, 
  IconChevronRight, IconClock, IconAlertCircle, IconX
} from '@tabler/icons-react'
import {
  Box, Group, Title, Text, Button, Tabs, Card, Badge, Table,
  ScrollArea, ActionIcon, Flex
} from '@mantine/core'

export function SalesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'opportunities'
  const [ignoredIds, setIgnoredIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ignored_opportunities')
    return saved ? JSON.parse(saved) : []
  })

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab })
  }

  const handleIgnore = (id: string) => {
    const newIgnored = [...ignoredIds, id]
    setIgnoredIds(newIgnored)
    localStorage.setItem('ignored_opportunities', JSON.stringify(newIgnored))
  }

  // --- Queries ---
  const { data: metrics } = useQuery({
    queryKey: ['supplier-metrics'],
    queryFn: () => opportunitiesApi.metrics(),
  })

  const { data: opportunitiesData, isLoading: isLoadingOpps } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => opportunitiesApi.list({ limit: 100 }),
    enabled: activeTab === 'opportunities',
  })

  const { data: proposals = [], isLoading: isLoadingProposals } = useQuery({
    queryKey: ['my-proposals'],
    queryFn: () => proposalsApi.listMyProposals(),
    enabled: activeTab === 'proposals',
  })

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders-supplier'],
    queryFn: () => ordersApi.list({ limit: 50 }),
    enabled: activeTab === 'orders',
  })

  const allOpportunities = opportunitiesData?.data ?? []
  const opportunities = allOpportunities.filter((o: any) => !ignoredIds.includes(o.id))
  
  const orders = ordersData?.data ?? []

  // Badge counts
  const oppCount = Math.max(0, (metrics?.openOpportunities ?? 0) - ignoredIds.length)
  const pendingProposals = proposals.filter((p: any) => ['SUBMITTED', 'UPDATED', 'COUNTER_OFFER'].includes(p.status))
  const counterOfferCount = pendingProposals.filter((p: any) => p.status === 'COUNTER_OFFER').length
  const pendingOrdersCount = metrics?.pendingDeliveries ?? 0

  return (
    <Box>
      <Group justify="space-between" align="center" mb="xl">
        <Box>
          <Title order={2} size="h3" fw={700}>Vendas & Oportunidades</Title>
          <Text c="dimmed" size="sm">Gerencie seu funil de vendas, desde a cotação até a entrega</Text>
        </Box>
      </Group>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(val) => setActiveTab(val as string)} mb="md" color="gasbidOrange">
        <Tabs.List>
          <Tabs.Tab value="opportunities" leftSection={<IconFlame size={16} />}>
            Oportunidades
            {oppCount > 0 && (
              <Badge color="gasbidOrange" size="sm" variant="filled" ml={8}>{oppCount}</Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value="proposals" leftSection={<IconMessageCircle size={16} />}>
            Propostas
            {pendingProposals.length > 0 && (
              <Badge color={counterOfferCount > 0 ? "red" : "blue"} size="sm" variant="filled" ml={8}>{pendingProposals.length}</Badge>
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
        {/* --- Opportunities Tab --- */}
        {activeTab === 'opportunities' && (
          <>
            {isLoadingOpps ? (
              <Flex justify="center" py={40} c="dimmed">
                <Text>Carregando oportunidades...</Text>
              </Flex>
            ) : opportunities.length === 0 ? (
              <Flex direction="column" align="center" py={60} c="dimmed">
                <IconFlame size={48} />
                <Title order={4} mt="md" mb="xs">Nenhuma oportunidade no momento</Title>
                <Text size="sm">Aguarde novas solicitações na sua região.</Text>
              </Flex>
            ) : (
              <ScrollArea>
                <Table verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Produto</Table.Th>
                      <Table.Th>Quantidade</Table.Th>
                      <Table.Th>Comprador</Table.Th>
                      <Table.Th>Cidade</Table.Th>
                      <Table.Th>Expira em</Table.Th>
                      <Table.Th>Concorrentes</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {opportunities.map((opp: any) => {
                      const expiresAt = new Date(opp.expiresAt)
                      const isUrgent = expiresAt.getTime() - Date.now() < 6 * 3600000 && expiresAt.getTime() - Date.now() > 0
                      
                      const firstItem = opp.items?.[0]
                      const itemsCount = opp.items?.length ?? 0
                      const productName = itemsCount > 1 
                        ? `${firstItem?.product?.name} (+${itemsCount - 1})`
                        : firstItem?.product?.name || 'N/A'
                      const totalQty = opp.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0

                      return (
                        <Table.Tr key={opp.id}>
                          <Table.Td fw={600}>{productName}</Table.Td>
                          <Table.Td>{totalQty} un.</Table.Td>
                          <Table.Td>{opp.buyerCompany?.name}</Table.Td>
                          <Table.Td>{opp.address?.city}/{opp.address?.state}</Table.Td>
                          <Table.Td>
                            <Group gap={4} c={isUrgent ? 'red' : expiresAt < new Date(Date.now() + 86400000) ? 'yellow' : 'inherit'}>
                              {isUrgent && <IconClock size={14} />}
                              <Text size="sm" fw={isUrgent ? 700 : 400}>{formatDate(opp.expiresAt)}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>{opp._count?.proposals ?? 0}</Table.Td>
                          <Table.Td align="right">
                            <Group gap={8} justify="flex-end" wrap="nowrap">
                              <ActionIcon variant="subtle" color="gray" title="Ignorar" onClick={() => handleIgnore(opp.id)}>
                                <IconX size={16} />
                              </ActionIcon>
                              <Button component={Link} to={`/opportunities/${opp.id}`} size="xs" color="gasbidOrange" rightSection={<IconChevronRight size={14} />}>
                                Propor
                              </Button>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </>
        )}

        {/* --- Proposals Tab --- */}
        {activeTab === 'proposals' && (
          <>
            {isLoadingProposals ? (
              <Flex justify="center" py={40} c="dimmed">
                <Text>Carregando propostas...</Text>
              </Flex>
            ) : proposals.length === 0 ? (
              <Flex direction="column" align="center" py={60} c="dimmed">
                <IconMessageCircle size={48} />
                <Title order={4} mt="md" mb="xs">Nenhuma proposta enviada</Title>
                <Text size="sm">Explore as oportunidades para começar a vender.</Text>
              </Flex>
            ) : (
              <ScrollArea>
                <Table verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Solicitação</Table.Th>
                      <Table.Th>Produtos</Table.Th>
                      <Table.Th>Comprador</Table.Th>
                      <Table.Th>Valor Total</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {proposals.map((p: any) => {
                      const firstItem = p.buyerRequest?.items?.[0]
                      const itemsSummary = p.buyerRequest && p.buyerRequest.items.length > 1 ? `${firstItem?.product?.name} +${p.buyerRequest.items.length - 1}` : firstItem?.product?.name
                      
                      const total = p.items.reduce((acc: number, pItem: any) => {
                        const rItem = p.buyerRequest?.items.find((i: any) => i.id === pItem.buyerRequestItemId)
                        return acc + (pItem.unitPrice * (rItem?.quantity || 0))
                      }, 0) + p.freightPrice

                      return (
                        <Table.Tr key={p.id}>
                          <Table.Td fw={600}>#{p.buyerRequestId.slice(-6).toUpperCase()}</Table.Td>
                          <Table.Td>
                            <Text size="sm">{itemsSummary}</Text>
                            <Text size="xs" c="dimmed">{p.buyerRequest?.address?.city}</Text>
                          </Table.Td>
                          <Table.Td>{p.buyerRequest?.buyerCompany?.name}</Table.Td>
                          <Table.Td fw={700} c="gasbidOrange">{formatCurrency(total)}</Table.Td>
                          <Table.Td>
                            {p.buyerRequest?.status === 'CANCELLED' ? (
                              <Badge color="red" variant="filled">CANCELADO</Badge>
                            ) : p.status === 'COUNTER_OFFER' ? (
                              <Box>
                                <Badge color="red" variant="filled" style={{ letterSpacing: '0.05em' }}>RESPONDER</Badge>
                                <Group gap={4} mt={4} c="red">
                                  <IconAlertCircle size={12} />
                                  <Text size="xs">Contraproposta</Text>
                                </Group>
                              </Box>
                            ) : (
                              <Badge color={p.status === 'SUBMITTED' || p.status === 'UPDATED' ? 'blue' : mantineBadgeColor(proposalStatusBadge(p.status))} variant="light">
                                {p.status === 'SUBMITTED' || p.status === 'UPDATED' ? 'EM ANÁLISE' : proposalStatusLabel(p.status)}
                              </Badge>
                            )}
                          </Table.Td>
                          <Table.Td align="right">
                            <Button component={Link} to={`/opportunities/${p.buyerRequestId}`} variant="subtle" size="xs" color="gray" rightSection={<IconChevronRight size={14} />}>
                              Detalhes
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </>
        )}

        {/* --- Orders Tab --- */}
        {activeTab === 'orders' && (
          <>
            {isLoadingOrders ? (
              <Flex justify="center" py={40} c="dimmed">
                <Text>Carregando pedidos...</Text>
              </Flex>
            ) : orders.length === 0 ? (
              <Flex direction="column" align="center" py={60} c="dimmed">
                <IconPackage size={48} />
                <Title order={4} mt="md" mb="xs">Nenhum pedido ganho</Title>
                <Text size="sm">Seus pedidos aparecerão aqui quando suas propostas forem aceitas.</Text>
              </Flex>
            ) : (
              <ScrollArea>
                <Table verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Pedido</Table.Th>
                      <Table.Th>Comprador</Table.Th>
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
                        <Table.Td>{order.buyerCompany?.name}</Table.Td>
                        <Table.Td fw={700}>{formatCurrency(order.totalPrice)}</Table.Td>
                        <Table.Td>{formatDate(order.createdAt)}</Table.Td>
                        <Table.Td>
                          <Badge color={mantineBadgeColor(orderStatusBadge(order.status))} variant="light">
                            {orderStatusLabel(order.status)}
                          </Badge>
                        </Table.Td>
                        <Table.Td align="right">
                          <Group gap="xs" justify="flex-end">
                            <Button component={Link} to={`/orders/${order.id}`} variant="light" size="xs" color="gasbidOrange" leftSection={<IconMessageCircle size={14} />}>
                              Chat
                            </Button>
                            <ActionIcon component={Link} to={`/orders/${order.id}`} variant="subtle" color="gray">
                              <IconChevronRight size={18} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </>
        )}
      </Card>
    </Box>
  )
}
