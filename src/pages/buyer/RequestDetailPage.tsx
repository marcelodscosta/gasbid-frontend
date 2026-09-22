import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { buyerRequestsApi, proposalsApi } from '../../api'
import {
  formatCurrency, formatDate, formatDateTime,
  requestStatusLabel, requestStatusBadge,
  proposalStatusLabel, proposalStatusBadge,
  mantineBadgeColor
} from '../../lib/utils'
import {
  IconArrowLeft, IconCheck, IconAlertCircle, IconStarFilled,
  IconX, IconMessageCircle, IconClock, IconMapPin, IconCalendarEvent
} from '@tabler/icons-react'
import {
  Box, Group, Title, Text, Button, Card, Badge, Alert,
  Table, Stack, Flex, Divider
} from '@mantine/core'

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')

  const { data: request, isLoading } = useQuery({
    queryKey: ['buyer-request', id],
    queryFn: () => buyerRequestsApi.get(id!),
  })

  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ['proposals', id],
    queryFn: () => proposalsApi.list(id!),
    enabled: !!id,
  })

  const acceptMutation = useMutation({
    mutationFn: (proposalId: string) => proposalsApi.accept(proposalId),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['buyer-request', id] })
      queryClient.invalidateQueries({ queryKey: ['proposals', id] })
      navigate(`/orders/${order.id}`)
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Erro ao aceitar proposta'),
  })

  const rejectMutation = useMutation({
    mutationFn: (proposalId: string) => proposalsApi.reject(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', id] })
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Erro ao rejeitar proposta'),
  })

  const counterMutation = useMutation({
    mutationFn: ({ proposalId, notes }: { proposalId: string, notes: string }) => 
      proposalsApi.counterOffer(proposalId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', id] })
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Erro ao enviar contraproposta'),
  })

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: string) => buyerRequestsApi.cancel(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-request', id] })
      queryClient.invalidateQueries({ queryKey: ['buyer-requests'] })
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Erro ao cancelar solicitação'),
  })

  if (isLoading) {
    return (
      <Flex justify="center" py={60} c="dimmed">
        <Text>Carregando...</Text>
      </Flex>
    )
  }

  if (!request) {
    return (
      <Flex justify="center" py={60}>
        <Title order={3}>Solicitação não encontrada</Title>
      </Flex>
    )
  }

  const canAccept = request.status === 'OPEN'
  const activeProposals = proposals.filter((p: any) => p.status !== 'WITHDRAWN' && p.status !== 'REJECTED')

  const handleCounterOffer = (proposalId: string) => {
    const notes = prompt('Descreva sua contraproposta ou solicitação de melhoria de preço:')
    if (notes) {
      setProcessing(proposalId)
      counterMutation.mutate({ proposalId, notes }, { onSettled: () => setProcessing(null) })
    }
  }

  return (
    <Box mx="auto" maw={800}>
      <Group justify="space-between" align="flex-start" mb="xl">
        <Box>
          <Button variant="subtle" size="xs" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} mb="sm" px={0}>
            Voltar
          </Button>
          <Title order={2} size="h3" fw={700}>Solicitação #{request.id.slice(-6).toUpperCase()}</Title>
          <Text c="dimmed" size="sm">Criada em {formatDateTime(request.createdAt)}</Text>
        </Box>
        <Group gap="sm">
          <Badge color={mantineBadgeColor(requestStatusBadge(request.status))} variant="light" size="lg">
            {requestStatusLabel(request.status)}
          </Badge>
          {request.status === 'OPEN' && (
            <Button
              variant="light" color="red" size="xs"
              leftSection={<IconX size={14} />}
              loading={cancelRequestMutation.isPending}
              onClick={() => {
                if (window.confirm('Tem certeza que deseja cancelar esta solicitação? Ela não ficará mais visível para fornecedores.')) {
                  cancelRequestMutation.mutate(request.id)
                }
              }}
            >
              Cancelar Solicitação
            </Button>
          )}
        </Group>
      </Group>

      {request.status !== 'OPEN' && (
        <Alert icon={<IconAlertCircle size={16} />} title="Aviso" color="blue" mb="md" variant="light">
          Esta solicitação já foi finalizada ou expirou.
        </Alert>
      )}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red" mb="md" variant="light">
          {error}
        </Alert>
      )}

      {/* Items Section */}
      <Card withBorder radius="md" p="xl" mb="xl">
        <Title order={4} size="h5" mb="md">Produtos solicitados</Title>
        <Table striped highlightOnHover withTableBorder mb="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Produto</Table.Th>
              <Table.Th ta="center">Quantidade</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {request.items.map((item: any) => (
              <Table.Tr key={item.id}>
                <Table.Td>{item.product?.name} ({item.product?.weightKg}kg)</Table.Td>
                <Table.Td ta="center">{item.quantity} un.</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Divider my="md" />

        <Group grow align="flex-start">
          <Box>
            <Group gap={6} c="dimmed" mb={4}>
              <IconCalendarEvent size={16} />
              <Text size="xs">Prazo de entrega</Text>
            </Group>
            <Text fw={500} size="sm">{formatDate(request.deadline)}</Text>
          </Box>
          <Box>
            <Group gap={6} c="dimmed" mb={4}>
              <IconClock size={16} />
              <Text size="xs">Expiração</Text>
            </Group>
            <Text fw={500} size="sm">{formatDate(request.expiresAt)}</Text>
          </Box>
          <Box>
            <Group gap={6} c="dimmed" mb={4}>
              <IconMapPin size={16} />
              <Text size="xs">Endereço</Text>
            </Group>
            <Text fw={500} size="sm">{request.address?.city}/{request.address?.state}</Text>
          </Box>
        </Group>
      </Card>

      {/* Proposals Section */}
      <Card withBorder radius="md" p="xl">
        <Title order={4} size="h5" mb="xl">Propostas recebidas ({activeProposals.length})</Title>

        {loadingProposals ? (
          <Flex justify="center" py={40} c="dimmed">
            <Text>Carregando propostas...</Text>
          </Flex>
        ) : activeProposals.length === 0 ? (
          <Flex direction="column" align="center" py={40} c="dimmed">
            <IconAlertCircle size={36} />
            <Title order={5} mt="md" mb="xs">Nenhuma proposta ainda</Title>
            <Text size="sm">Aguarde revendedores da sua região enviarem propostas</Text>
          </Flex>
        ) : (
          <Stack gap="md">
            {activeProposals.map((proposal: any, idx: number) => {
              const itemsTotal = proposal.items.reduce((acc: number, pItem: any) => {
                const rItem = request.items.find((i: any) => i.id === pItem.buyerRequestItemId)
                return acc + (pItem.unitPrice * (rItem?.quantity || 0))
              }, 0)
              const total = itemsTotal + proposal.freightPrice
              const isBest = idx === 0
              
              return (
                <Card key={proposal.id} withBorder radius="md" p="md" style={{ borderColor: isBest ? 'var(--mantine-color-gasbidOrange-6)' : undefined }}>
                  <Flex gap="md" align="center" direction={{ base: 'column', sm: 'row' }}>
                    <Box style={{ flex: 1, width: '100%' }}>
                      <Group gap="xs" mb="sm">
                        <Text fw={600} size="lg">{proposal.supplierCompany?.name}</Text>
                        {isBest && (
                          <Badge color="gasbidOrange" variant="filled" size="sm" leftSection={<IconStarFilled size={10} />}>
                            Melhor preço
                          </Badge>
                        )}
                        <Badge color={mantineBadgeColor(proposalStatusBadge(proposal.status))} variant="light" size="sm">
                          {proposalStatusLabel(proposal.status)}
                        </Badge>
                      </Group>

                      <Stack gap={4} mb="md">
                        {proposal.items.map((pItem: any) => {
                          const rItem = request.items.find((i: any) => i.id === pItem.buyerRequestItemId)
                          return (
                            <Group justify="space-between" key={pItem.id}>
                              <Text size="sm">{rItem?.product?.name} ({rItem?.quantity}x)</Text>
                              <Text size="sm" fw={600}>{formatCurrency(pItem.unitPrice)}/un</Text>
                            </Group>
                          )
                        })}
                      </Stack>

                      <Divider my="sm" />

                      <Group grow align="center">
                        <Box>
                          <Text size="xs" c="dimmed">Frete</Text>
                          <Text fw={500} size="sm">{proposal.freightPrice === 0 ? 'Grátis' : formatCurrency(proposal.freightPrice)}</Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="dimmed">Previsão</Text>
                          <Text fw={500} size="sm">{formatDateTime(proposal.deliveryDeadline)}</Text>
                        </Box>
                        {proposal.paymentTerms && (
                          <Box>
                            <Text size="xs" c="dimmed">Condições Pagto.</Text>
                            <Text fw={500} size="sm">{proposal.paymentTerms}</Text>
                          </Box>
                        )}
                        <Box ta="right">
                          <Text size="xs" c="dimmed">Valor Total</Text>
                          <Text fw={800} size="xl" c="gasbidOrange">{formatCurrency(total)}</Text>
                        </Box>
                      </Group>
                    </Box>
                    
                    {canAccept && proposal.status !== 'ACCEPTED' && (
                      <Stack gap="xs" w={{ base: '100%', sm: 160 }}>
                        <Button
                          color="gasbidOrange" size="sm"
                          leftSection={<IconCheck size={16} />}
                          loading={processing === proposal.id}
                          onClick={() => {
                            setProcessing(proposal.id)
                            setError('')
                            acceptMutation.mutate(proposal.id, { onSettled: () => setProcessing(null) })
                          }}
                        >
                          Aceitar
                        </Button>
                        <Button
                          variant="light" color="yellow" size="sm"
                          leftSection={<IconMessageCircle size={16} />}
                          disabled={processing === proposal.id}
                          onClick={() => handleCounterOffer(proposal.id)}
                        >
                          Contraproposta
                        </Button>
                        <Button
                          variant="subtle" color="red" size="sm"
                          leftSection={<IconX size={16} />}
                          disabled={processing === proposal.id}
                          onClick={() => {
                            if (confirm('Deseja realmente recusar esta proposta?')) {
                              setProcessing(proposal.id)
                              rejectMutation.mutate(proposal.id, { onSettled: () => setProcessing(null) })
                            }
                          }}
                        >
                          Recusar
                        </Button>
                      </Stack>
                    )}
                  </Flex>
                </Card>
              )
            })}
          </Stack>
        )}
      </Card>
    </Box>
  )
}
