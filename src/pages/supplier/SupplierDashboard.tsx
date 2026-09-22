import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { opportunitiesApi, ordersApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate, proposalStatusLabel, proposalStatusBadge, mantineBadgeColor } from '../../lib/utils'
import {
  IconFlame, IconChevronRight, IconTrendingUp, IconClock, IconPackage,
  IconAlertCircle, IconStarFilled, IconMessageCircle, IconSend
} from '@tabler/icons-react'
import {
  Box, Group, Title, Text, Button, SimpleGrid, Card, ThemeIcon,
  Badge, Stack, Table, Flex, Divider, Select, ActionIcon, ScrollArea, TextInput
} from '@mantine/core'

function SupplierLiveChatWidget() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState('')

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['supplier-active-orders-chat'],
    queryFn: async () => {
      const res = await ordersApi.list({ limit: 20 })
      return (res?.data || []).filter((o: any) => ['CREATED', 'CONFIRMED', 'IN_DELIVERY'].includes(o.status))
    },
    refetchInterval: 5000,
  })

  const activeOrders = ordersData || []
  const currentOrderId = selectedOrderId || activeOrders[0]?.id

  const { data: messages = [] } = useQuery({
    queryKey: ['order-messages', currentOrderId],
    queryFn: () => ordersApi.getMessages(currentOrderId!),
    enabled: !!currentOrderId,
    refetchInterval: 3000,
  })

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => ordersApi.sendMessage(currentOrderId!, content),
    onSuccess: () => {
      setChatMessage('')
      queryClient.invalidateQueries({ queryKey: ['order-messages', currentOrderId] })
    },
  })

  if (isLoadingOrders) {
    return (
      <Card withBorder radius="md" p="md">
        <Text size="sm" c="dimmed">Carregando chats ativos...</Text>
      </Card>
    )
  }

  if (activeOrders.length === 0) {
    return (
      <Card withBorder radius="md" p="md" style={{ borderTop: '4px solid var(--mantine-color-gasbidOrange-6)' }}>
        <Group gap="xs" mb="xs">
          <IconMessageCircle size={20} color="var(--mantine-color-gasbidOrange-6)" />
          <Title order={4} size="h5">Chat ao Vivo com Compradores</Title>
        </Group>
        <Text size="sm" c="dimmed">
          Nenhum pedido em andamento no momento. Quando suas propostas forem aceitas, a caixa de mensagens ao vivo com o comprador aparecerá aqui!
        </Text>
      </Card>
    )
  }

  const currentOrder = activeOrders.find((o: any) => o.id === currentOrderId) || activeOrders[0]

  return (
    <Card withBorder radius="md" p={0} style={{ borderTop: '4px solid var(--mantine-color-gasbidOrange-6)', display: 'flex', flexDirection: 'column', height: 400 }}>
      <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Group justify="space-between" align="center" mb={6}>
          <Group gap="xs">
            <IconMessageCircle size={20} color="var(--mantine-color-gasbidOrange-6)" />
            <Title order={4} size="h5">Chat do Pedido Ativo</Title>
          </Group>
          <Badge color="gasbidOrange" variant="light">
            {activeOrders.length} em andamento
          </Badge>
        </Group>

        {activeOrders.length > 1 ? (
          <Select
            size="xs"
            value={currentOrderId}
            onChange={(val) => setSelectedOrderId(val)}
            data={activeOrders.map((o: any) => ({
              value: o.id,
              label: `#${o.id.slice(-6).toUpperCase()} · ${o.buyerCompany?.name || 'Comprador'}`
            }))}
          />
        ) : (
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed" fw={500}>
              Cliente: <Text span fw={700} c="var(--mantine-color-text)">{currentOrder?.buyerCompany?.name || 'Comprador'}</Text>
            </Text>
            <Button component={Link} to={`/orders/${currentOrder?.id}`} size="xs" variant="subtle" color="gasbidOrange" rightSection={<IconChevronRight size={12} />}>
              Detalhes
            </Button>
          </Group>
        )}
      </Box>

      <ScrollArea style={{ flex: 1 }} p="md">
        <Stack gap="sm">
          {messages.length === 0 ? (
            <Text size="xs" c="dimmed" ta="center" mt="xl">Nenhuma mensagem trocada ainda neste pedido.</Text>
          ) : (
            messages.map((msg: any) => {
              const isMe = msg.senderId === user?.id
              return (
                <Box key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  {!isMe && (
                    <Text size="xs" c="dimmed" mb={2} ml={4}>{msg.sender?.name}</Text>
                  )}
                  <Box 
                    px="sm" py="xs" 
                    bg={isMe ? 'gasbidOrange' : 'var(--mantine-color-default-hover)'}
                    c={isMe ? 'white' : 'var(--mantine-color-text)'}
                    style={{ 
                      borderRadius: 12, 
                      borderBottomRightRadius: isMe ? 2 : 12,
                      borderBottomLeftRadius: !isMe ? 2 : 12,
                    }}
                  >
                    <Text size="sm">{msg.content}</Text>
                  </Box>
                  <Text size="xs" c="dimmed" mt={2} ta={isMe ? 'right' : 'left'}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Box>
              )
            })
          )}
        </Stack>
      </ScrollArea>

      <Box p="sm" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <form onSubmit={(e) => {
          e.preventDefault()
          if (chatMessage.trim()) {
            sendMessageMutation.mutate(chatMessage)
          }
        }}>
          <Group gap="xs">
            <TextInput
              placeholder="Digite para responder ao cliente..."
              size="xs"
              style={{ flex: 1 }}
              value={chatMessage}
              onChange={(e) => setChatMessage(e.currentTarget.value)}
            />
            <ActionIcon type="submit" color="gasbidOrange" size="lg" loading={sendMessageMutation.isPending} disabled={!chatMessage.trim()}>
              <IconSend size={16} />
            </ActionIcon>
          </Group>
        </form>
      </Box>
    </Card>
  )
}

export function SupplierDashboard() {
  const { user } = useAuth()
  
  const { data: oppData, isLoading: isLoadingOpps } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => opportunitiesApi.list({ limit: 10, showApplied: true }),
  })

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['supplier-metrics'],
    queryFn: () => opportunitiesApi.metrics(),
  })

  const opportunities = oppData?.data ?? []

  return (
    <Box>
      <Group justify="space-between" align="center" mb="xl">
        <Box>
          <Title order={2} size="h3" fw={700}>Olá, {user?.name?.split(' ')[0]} 👋</Title>
          <Text c="dimmed" size="sm">Painel do revendedor · {user?.company?.name}</Text>
        </Box>
        <Button component={Link} to="/opportunities" leftSection={<IconFlame size={16} />} color="gasbidOrange">
          Ver oportunidades
        </Button>
      </Group>

      {/* Main KPIs */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} mb="xl">
        <Card component={Link} to="/sales?tab=opportunities" withBorder radius="md" p="md" className="hover-card">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Disponíveis</Text>
            <ThemeIcon color="gasbidOrange" variant="light" size="lg" radius="md">
              <IconFlame size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl">{isLoadingMetrics ? '...' : metrics?.openOpportunities ?? 0}</Text>
        </Card>

        <Card component={Link} to="/sales?tab=proposals" withBorder radius="md" p="md" className="hover-card">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Propostas</Text>
            <ThemeIcon color="blue" variant="light" size="lg" radius="md">
              <IconTrendingUp size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl">{isLoadingMetrics ? '...' : metrics?.competingOpportunities ?? 0}</Text>
        </Card>

        <Card component={Link} to="/sales?tab=orders" withBorder radius="md" p="md" className="hover-card">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Ganhos</Text>
            <ThemeIcon color="teal" variant="light" size="lg" radius="md">
              <IconPackage size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl">{isLoadingMetrics ? '...' : metrics?.ordersWon ?? 0}</Text>
        </Card>

        <Card component={Link} to="/sales?tab=orders" withBorder radius="md" p="md" className="hover-card">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Pendentes</Text>
            <ThemeIcon color="yellow" variant="light" size="lg" radius="md">
              <IconClock size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl">{isLoadingMetrics ? '...' : metrics?.pendingDeliveries ?? 0}</Text>
        </Card>

        {/* Reputation Card */}
        <Card withBorder radius="md" p="md" style={{ borderTop: '4px solid var(--mantine-color-yellow-5)' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Reputação ({metrics?.reputation?.ratingCount ?? 0})</Text>
            <ThemeIcon color="yellow" variant="light" size="lg" radius="md">
              <IconStarFilled size={16} />
            </ThemeIcon>
          </Group>
          <Group gap={6}>
            <Text fw={700} size="xl">{isLoadingMetrics ? '...' : metrics?.reputation?.averageStars ? metrics.reputation.averageStars : '--'}</Text>
            {metrics?.reputation?.averageStars && <IconStarFilled size={18} color="var(--mantine-color-yellow-5)" />}
          </Group>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl">
        
        {/* Left Column: Opportunities & Activity (takes 2 columns) */}
        <Box style={{ gridColumn: 'span 2' }}>
          <Stack gap="xl">
            {/* Opportunities */}
            <Card withBorder radius="md" p="md">
              <Group justify="space-between" mb="md">
                <Text fw={600} size="lg">Oportunidades recentes na sua região</Text>
                <Button component={Link} to="/opportunities" variant="subtle" size="xs" color="gray">Ver todas</Button>
              </Group>

              {isLoadingOpps ? (
                <Flex justify="center" py={40} c="dimmed">
                  <Text>Carregando...</Text>
                </Flex>
              ) : opportunities.length === 0 ? (
                <Flex direction="column" align="center" py={40} c="dimmed">
                  <IconFlame size={40} />
                  <Text mt="md" fw={500}>Nenhuma oportunidade no momento</Text>
                  <Text size="xs">Verifique suas áreas de cobertura ou aguarde novas solicitações</Text>
                </Flex>
              ) : (
                <Stack gap="sm">
                  {opportunities.map((opp: any) => {
                    const myProposal = opp.proposals?.[0]
                    const totalItems = opp.items.length
                    const firstItem = opp.items[0]
                    const itemsSummary = totalItems > 1 ? `${firstItem?.product?.name} +${totalItems - 1}` : firstItem?.product?.name

                    const expiresAt = new Date(opp.expiresAt)
                    const isUrgent = expiresAt.getTime() - Date.now() < 6 * 3600000 && expiresAt.getTime() - Date.now() > 0

                    return (
                      <Card key={opp.id} withBorder radius="md" p="sm" bg="var(--mantine-color-default)">
                        <Group justify="space-between" wrap="nowrap" align="flex-start">
                          <Box style={{ flex: 1 }}>
                            <Group gap="xs" mb={4}>
                              <Text fw={600} size="sm">#{opp.id.slice(-6).toUpperCase()}</Text>
                              {myProposal && (
                                <Badge color={mantineBadgeColor(proposalStatusBadge(myProposal.status))} variant="light" size="xs">
                                  {proposalStatusLabel(myProposal.status)}
                                </Badge>
                              )}
                            </Group>
                            
                            <Text size="sm" mb={4}>{itemsSummary}</Text>
                            <Group gap="md" fz="xs" c="dimmed">
                              <Text>{opp.items.reduce((sum: number, i: any) => sum + i.quantity, 0)} unidades</Text>
                              <Text>·</Text>
                              <Text>{opp.address?.city}/{opp.address?.state}</Text>
                              <Text>·</Text>
                              <Text c="var(--mantine-color-gasbidOrange-6)">{opp.distanceKm !== undefined ? `${opp.distanceKm} km` : '-'}</Text>
                            </Group>

                            {myProposal?.status === 'COUNTER_OFFER' && (
                              <Group gap={4} mt={8} c="red">
                                <IconAlertCircle size={14} />
                                <Text size="xs" fw={500}>Resposta solicitada</Text>
                              </Group>
                            )}
                          </Box>
                          
                          <Stack align="flex-end" gap="xs">
                            <Group gap={4} c={isUrgent ? 'red' : expiresAt < new Date(Date.now() + 86400000) ? 'yellow' : 'dimmed'}>
                              {isUrgent && <IconClock size={14} />}
                              <Text size="xs" fw={isUrgent ? 700 : 400}>{formatDate(opp.expiresAt)}</Text>
                            </Group>
                            <Text size="xs" c="dimmed">{opp._count?.proposals ?? 0} propostas</Text>
                            <Button component={Link} to={`/opportunities/${opp.id}`} size="xs" color="gasbidOrange" variant={myProposal ? "light" : "filled"}>
                              {myProposal ? 'Ver proposta' : 'Propor'} <IconChevronRight size={14} />
                            </Button>
                          </Stack>
                        </Group>
                      </Card>
                    )
                  })}
                </Stack>
              )}
            </Card>

            {/* Recent Activity (Won/Lost) */}
            <Card withBorder radius="md" p="md">
              <Title order={4} size="h5" mb="md">Atividade Recente (Últimas 24h)</Title>
              {isLoadingMetrics ? (
                <Text c="dimmed">Carregando...</Text>
              ) : metrics?.recentActivity?.length === 0 ? (
                <Text c="dimmed" size="sm">Nenhuma oportunidade finalizada recentemente na sua região.</Text>
              ) : (
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Oportunidade</Table.Th>
                      <Table.Th>Resultado</Table.Th>
                      <Table.Th>Data</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {metrics?.recentActivity.map((act: any) => (
                      <Table.Tr key={act.id}>
                        <Table.Td>
                          <Text fw={600} size="sm">{act.productName}</Text>
                          <Text size="xs" c="dimmed">{act.city} · {act.quantity} un.</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={act.result === 'WON' ? 'teal' : act.result === 'LOST' ? 'red' : 'yellow'} variant="light">
                            {act.result === 'WON' ? 'GANHA' : act.result === 'LOST' ? 'PERDIDA' : 'CANCELADA'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(act.updatedAt)}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          </Stack>
        </Box>

        {/* Right Column: Live Chat, Reputation & Insights */}
        <Stack gap="xl">
          <SupplierLiveChatWidget />

          <Card withBorder radius="md" p="md" style={{ borderTop: '4px solid var(--mantine-color-yellow-5)' }}>
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <IconStarFilled size={20} color="var(--mantine-color-yellow-5)" />
                <Title order={4} size="h5">Reputação</Title>
              </Group>
              <Badge color="yellow" variant="light" size="lg">
                {metrics?.reputation?.averageStars ? `${metrics.reputation.averageStars} ★` : '★ Novo'}
              </Badge>
            </Group>
            
            <Text size="sm" c="dimmed" mb="lg">
              Sua nota é calculada com base na avaliação dos compradores ao receberem as entregas.
            </Text>

            <Group gap="xs" mb="sm">
              <IconMessageCircle size={16} />
              <Text fw={600} size="sm">Comentários dos Clientes:</Text>
            </Group>

            {isLoadingMetrics ? (
              <Text c="dimmed" size="sm">Carregando...</Text>
            ) : !metrics?.reputation?.ratings?.filter((r: any) => r.comment && r.comment.trim() !== '').length ? (
              <Box p="sm" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }}>
                <Text size="xs" c="dimmed" fs="italic">Nenhum comentário por escrito recebido ainda.</Text>
              </Box>
            ) : (
              <Stack gap="sm">
                {metrics.reputation.ratings
                  .filter((r: any) => r.comment && r.comment.trim() !== '')
                  .map((r: any, idx: number) => (
                    <Box key={idx} p="sm" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8, borderLeft: '3px solid var(--mantine-color-yellow-5)' }}>
                      <Group justify="space-between" mb={4}>
                        <Text fw={700} size="xs" c="yellow.6">{'★'.repeat(r.stars)}</Text>
                        <Text size="xs" c="dimmed">{formatDate(r.createdAt)}</Text>
                      </Group>
                      <Text size="sm">"{r.comment}"</Text>
                    </Box>
                  ))}
              </Stack>
            )}
          </Card>

          <Card withBorder radius="md" p="md" style={{ borderLeft: '4px solid var(--mantine-color-gasbidOrange-6)' }}>
            <Group gap="xs" mb="sm">
              <IconAlertCircle size={20} color="var(--mantine-color-gasbidOrange-6)" />
              <Title order={4} size="h5">Dica B2B</Title>
            </Group>
            <Text size="sm" c="dimmed" lh={1.5} mb="md">
              Agora você pode enviar propostas para solicitações com múltiplos produtos. Certifique-se de preencher o preço unitário de cada item solicitado para que o comprador possa avaliar seu lance total.
            </Text>
            <Divider my="sm" />
            <Text size="xs" fw={600} mb={4}>Dica de Venda:</Text>
            <Text size="xs" c="dimmed">Propostas com frete detalhado e prazo de entrega menor que 24h têm 30% mais chance de fechamento.</Text>
          </Card>
        </Stack>

      </SimpleGrid>

      <style>{`
        .hover-card { transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; color: inherit; }
        .hover-card:hover { transform: translateY(-2px); box-shadow: var(--mantine-shadow-md); }
      `}</style>
    </Box>
  )
}
