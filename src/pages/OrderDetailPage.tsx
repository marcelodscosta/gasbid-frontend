import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { ordersApi } from '../api'
import {
  formatCurrency, formatDateTime, paymentLabel,
  orderStatusLabel, orderStatusBadge,
  mantineBadgeColor
} from '../lib/utils'
import { IconArrowLeft, IconCheck, IconX, IconTruck, IconPackage, IconAlertCircle, IconSend } from '@tabler/icons-react'
import type { OrderStatus } from '../types'
import { LiveTracking } from '../components/order/LiveTracking'
import { OrderRating } from '../components/order/OrderRating'
import {
  Box, Group, Title, Text, Button, Card, Badge, Table, Alert,
  Grid, Stack, ThemeIcon, Flex, Timeline, ScrollArea, TextInput, ActionIcon,
} from '@mantine/core'

const STATUS_STEPS: OrderStatus[] = ['PENDING_CONFIRMATION', 'CONFIRMED', 'IN_DELIVERY', 'DELIVERED']

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING_CONFIRMATION: <IconAlertCircle size={14} />,
  CREATED: <IconPackage size={14} />,
  CONFIRMED: <IconCheck size={14} />,
  IN_DELIVERY: <IconTruck size={14} />,
  DELIVERED: <IconCheck size={14} />,
  CANCELLED: <IconX size={14} />,
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [error, setError] = useState('')
  const [chatMessage, setChatMessage] = useState('')

  const { data: messages = [] } = useQuery({
    queryKey: ['order-messages', id],
    queryFn: () => ordersApi.getMessages(id!),
    refetchInterval: 3000,
  })

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => ordersApi.sendMessage(id!, content),
    onSuccess: () => {
      setChatMessage('')
      queryClient.invalidateQueries({ queryKey: ['order-messages', id] })
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Erro ao enviar mensagem'),
  })

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id!),
  })

  const mutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      ordersApi.updateStatus(id!, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Erro ao atualizar status'),
  })

  if (isLoading) {
    return (
      <Flex justify="center" py={60} c="dimmed">
        <Text>Carregando...</Text>
      </Flex>
    )
  }

  if (!order) {
    return (
      <Flex justify="center" py={60}>
        <Title order={3}>Pedido não encontrado</Title>
      </Flex>
    )
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status as OrderStatus)
  const isCancelled = order.status === 'CANCELLED'

  function nextAction() {
    if (order!.status === 'PENDING_CONFIRMATION' && user?.role === 'SUPPLIER') {
      return { label: 'Aceitar Pedido (5 min)', next: 'CONFIRMED', icon: <IconCheck size={16} /> }
    }
    if (order!.status === 'CONFIRMED' && user?.role === 'SUPPLIER') {
      return { label: 'Marcar em entrega', next: 'IN_DELIVERY', icon: <IconTruck size={16} /> }
    }
    if (order!.status === 'IN_DELIVERY' && user?.role === 'BUYER') {
      return { label: 'Confirmar recebimento', next: 'DELIVERED', icon: <IconCheck size={16} /> }
    }
    return null
  }

  const action = nextAction()
  const canAct = !isCancelled && order.status !== 'DELIVERED'

  return (
    <Box maw={800} mx="auto">
      <Group justify="space-between" align="flex-start" mb="xl">
        <Box>
          <Button variant="subtle" size="xs" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} mb="sm" px={0}>
            Voltar
          </Button>
          <Title order={2} size="h3" fw={700}>Pedido #{id?.slice(-6).toUpperCase()}</Title>
          <Text c="dimmed" size="sm">Criado em {formatDateTime(order.createdAt)}</Text>
        </Box>
        <Badge color={mantineBadgeColor(orderStatusBadge(order.status))} variant="filled" size="lg" leftSection={STATUS_ICONS[order.status]}>
          {orderStatusLabel(order.status)}
        </Badge>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red" variant="light" mb="md">
          {error}
        </Alert>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="xl">
            {/* Rastreamento ao vivo (comprador, durante a entrega) */}
            {order.status === 'IN_DELIVERY' && user?.role !== 'SUPPLIER' && <LiveTracking orderId={order.id} />}

            {/* Items Card */}
            <Card withBorder radius="md" p="md">
              <Title order={4} size="h5" mb="md">Produtos do pedido</Title>
              
              <Table verticalSpacing="sm" striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Produto</Table.Th>
                    <Table.Th ta="center">Qtd</Table.Th>
                    <Table.Th ta="right">V. Unit</Table.Th>
                    <Table.Th ta="right">Subtotal</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {order.buyerRequest?.items.map((rItem: any) => {
                    const pItem = order.proposal?.items.find((pi: any) => pi.buyerRequestItemId === rItem.id)
                    const unitPrice = pItem?.unitPrice || 0
                    const subtotal = unitPrice * rItem.quantity
                    return (
                      <Table.Tr key={rItem.id}>
                        <Table.Td>{rItem.product?.name} ({rItem.product?.weightKg}kg)</Table.Td>
                        <Table.Td ta="center">{rItem.quantity}</Table.Td>
                        <Table.Td ta="right">{formatCurrency(unitPrice)}</Table.Td>
                        <Table.Td ta="right">{formatCurrency(subtotal)}</Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
                <Table.Tfoot>
                  <Table.Tr>
                    <Table.Td colSpan={3} ta="right" fw={600}>Frete:</Table.Td>
                    <Table.Td ta="right" fw={600}>{formatCurrency(order.proposal?.freightPrice || 0)}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td colSpan={3} ta="right" fw={800} c="gasbidOrange" fz="lg">Total do Pedido:</Table.Td>
                    <Table.Td ta="right" fw={800} c="gasbidOrange" fz="lg">{formatCurrency(order.totalPrice)}</Table.Td>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>

              <Box mt="xl">
                <Text size="sm" c="dimmed" mb={4}><Text component="span" fw={600} c="var(--mantine-color-text)">Endereço de entrega:</Text> {order.buyerRequest?.address?.street}, {order.buyerRequest?.address?.number} — {order.buyerRequest?.address?.city}/{order.buyerRequest?.address?.state}</Text>
                <Text size="sm" c="dimmed" mb={4}><Text component="span" fw={600} c="var(--mantine-color-text)">Previsão de entrega:</Text> {order.proposal?.deliveryDeadline ? formatDateTime(order.proposal.deliveryDeadline) : 'N/A'}</Text>
                {order.buyerRequest?.paymentMethod && (
                  <Text size="sm" c="dimmed" mb={4}><Text component="span" fw={600} c="var(--mantine-color-text)">Forma de pagamento:</Text> {paymentLabel(order.buyerRequest.paymentMethod)}</Text>
                )}
                {order.proposal?.paymentTerms && (
                  <Text size="sm" c="dimmed"><Text component="span" fw={600} c="var(--mantine-color-text)">Condições de Pagamento:</Text> {order.proposal.paymentTerms}</Text>
                )}
              </Box>
            </Card>

            {/* Parties */}
            <Card withBorder radius="md" p="md">
              <Title order={4} size="h5" mb="md">Partes envolvidas</Title>
              <Grid>
                <Grid.Col span={6}>
                  <Box p="sm" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Comprador</Text>
                    <Text fw={600}>{order.buyerCompany?.name}</Text>
                  </Box>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Box p="sm" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Fornecedor</Text>
                    <Text fw={600}>{order.supplierCompany?.name}</Text>
                  </Box>
                </Grid.Col>
              </Grid>
            </Card>

            {/* Timeline */}
            <Card withBorder radius="md" p="md">
              <Title order={4} size="h5" mb="xl">Histórico do pedido</Title>
              <Timeline active={(order?.timeline?.length || 1) - 1} bulletSize={28} lineWidth={2} color="gasbidOrange">
                {(order?.timeline ?? []).map((item: any, idx: number) => {
                  const isLast = idx === (order?.timeline?.length ?? 0) - 1
                  return (
                    <Timeline.Item 
                      key={item.id} 
                      title={<Text fw={600} size="sm">{orderStatusLabel(item.status)}</Text>}
                      bullet={STATUS_ICONS[item.status]}
                      color={isLast && !isCancelled ? 'gasbidOrange' : 'teal'}
                    >
                      <Text c="dimmed" size="xs" mt={4}>{formatDateTime(item.createdAt)}</Text>
                      {item.notes && (
                        <Text size="sm" mt={4} c="dimmed">{item.notes}</Text>
                      )}
                    </Timeline.Item>
                  )
                })}
              </Timeline>
            </Card>
          </Stack>
        </Grid.Col>

        {/* Sidebar actions */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="xl">
            {/* Progress */}
            {!isCancelled && (
              <Card withBorder radius="md" p="md">
                <Title order={4} size="h5" mb="md">Progresso</Title>
                <Stack gap="sm">
                  {STATUS_STEPS.map((step, idx) => {
                    const done = currentStepIdx >= idx
                    const current = currentStepIdx === idx
                    return (
                      <Group key={step} gap="sm" wrap="nowrap">
                        <ThemeIcon 
                          size={28} 
                          radius="xl" 
                          variant={done ? (current ? 'light' : 'filled') : 'default'}
                          color={done ? (current ? 'gasbidOrange' : 'teal') : 'gray'}
                        >
                          {STATUS_ICONS[step]}
                        </ThemeIcon>
                        <Text size="sm" fw={current ? 600 : 400} c={done ? 'var(--mantine-color-text)' : 'dimmed'}>
                          {orderStatusLabel(step)}
                        </Text>
                      </Group>
                    )
                  })}
                </Stack>
              </Card>
            )}

            {/* Avaliação */}
            {order.status === 'DELIVERED' && user?.role === 'BUYER' && (
              <OrderRating orderId={order.id} supplierName={order.supplierCompany?.name} rating={order.rating} />
            )}
            {order.status === 'DELIVERED' && user?.role === 'SUPPLIER' && order.rating && (
              <Card withBorder radius="md" p="md">
                <Title order={4} size="h5" mb="xs">Avaliação do cliente</Title>
                <Text fw={700} size="xl">{'★'.repeat(order.rating.stars)}<Text component="span" c="dimmed">{'★'.repeat(5 - order.rating.stars)}</Text></Text>
                {order.rating.comment && <Text size="sm" c="dimmed" mt="xs">“{order.rating.comment}”</Text>}
              </Card>
            )}

            {/* Actions */}
            {(canAct && (action || (user?.role === 'BUYER' && (order.status === 'PENDING_CONFIRMATION' || order.status === 'CONFIRMED')))) && (
              <Card withBorder radius="md" p="md">
                <Title order={4} size="h5" mb="md">Ações</Title>
                {action && (
                  <Button
                    fullWidth
                    color="gasbidOrange"
                    mb="sm"
                    loading={mutation.isPending}
                    onClick={() => mutation.mutate({ status: action.next })}
                    leftSection={action.icon}
                  >
                    {action.label}
                  </Button>
                )}
                {(order.status === 'PENDING_CONFIRMATION' || order.status === 'CONFIRMED') && user?.role === 'BUYER' && (
                  <Button
                    fullWidth
                    color="red"
                    loading={mutation.isPending}
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
                        mutation.mutate({ status: 'CANCELLED', notes: 'Cancelado pelo comprador' })
                      }
                    }}
                    leftSection={<IconX size={16} />}
                  >
                    Cancelar pedido
                  </Button>
                )}
                {order.status === 'PENDING_CONFIRMATION' && user?.role === 'SUPPLIER' && (
                  <Button
                    fullWidth
                    variant="light"
                    color="red"
                    loading={mutation.isPending}
                    onClick={() => {
                      if (window.confirm('Deseja recusar este pedido?')) {
                        mutation.mutate({ status: 'CANCELLED', notes: 'Recusado pelo fornecedor' })
                      }
                    }}
                    leftSection={<IconX size={16} />}
                  >
                    Recusar pedido
                  </Button>
                )}
              </Card>
            )}

            {/* Chat Box */}
            <Card withBorder radius="md" p={0} style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
              <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <Title order={4} size="h5">Chat do Pedido</Title>
              </Box>
              
              <ScrollArea style={{ flex: 1 }} p="md">
                <Stack gap="sm">
                  {messages.length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center" mt="xl">Nenhuma mensagem ainda. Inicie a conversa!</Text>
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
                  <TextInput
                    placeholder="Digite uma mensagem..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.currentTarget.value)}
                    rightSection={
                      <ActionIcon 
                        variant="filled" 
                        color="gasbidOrange" 
                        type="submit"
                        loading={sendMessageMutation.isPending}
                        disabled={!chatMessage.trim()}
                      >
                        <IconSend size={16} />
                      </ActionIcon>
                    }
                  />
                </form>
              </Box>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  )
}
