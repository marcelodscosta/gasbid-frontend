import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { proposalsApi } from '../../api'
import {
  formatCurrency, formatDate,
  proposalStatusLabel, proposalStatusBadge,
  mantineBadgeColor
} from '../../lib/utils'
import { IconMessageCircle, IconChevronRight, IconAlertCircle, IconClock } from '@tabler/icons-react'
import {
  Box, Group, Title, Text, Button, Card, Badge, Table,
  ScrollArea, Flex
} from '@mantine/core'

export function MyProposalsPage() {
  const { data: proposals = [], isLoading, error } = useQuery({
    queryKey: ['my-proposals'],
    queryFn: () => proposalsApi.listMyProposals(),
  })

  return (
    <Box maw={1000} mx="auto">
      <Group justify="space-between" align="center" mb="xl">
        <Box>
          <Title order={2} size="h3" fw={700}>Minhas Propostas</Title>
          <Text c="dimmed" size="sm">Acompanhe o status de todas as suas ofertas e negociações</Text>
        </Box>
      </Group>

      <Card withBorder radius="md" p={0}>
        {isLoading ? (
          <Flex justify="center" py={40} c="dimmed">
            <Text>Carregando propostas...</Text>
          </Flex>
        ) : error ? (
          <Flex justify="center" py={40} c="red">
            <Text>Erro ao carregar propostas: {(error as any).message}</Text>
          </Flex>
        ) : proposals.length === 0 ? (
          <Flex direction="column" align="center" py={60} c="dimmed">
            <IconMessageCircle size={48} />
            <Title order={4} mt="md" mb="xs">Você ainda não enviou nenhuma proposta</Title>
            <Text size="sm" mb="md">Explore as oportunidades disponíveis para começar a vender.</Text>
            <Button component={Link} to="/opportunities" color="gasbidOrange">
              Ver Oportunidades
            </Button>
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
                  <Table.Th>Enviada em</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {proposals.map((p: any) => {
                  const request = p.buyerRequest
                  const itemsTotal = p.items.reduce((acc: number, pItem: any) => {
                    const rItem = request?.items.find((i: any) => i.id === pItem.buyerRequestItemId)
                    return acc + (pItem.unitPrice * (rItem?.quantity || 0))
                  }, 0)
                  const total = itemsTotal + p.freightPrice
                  
                  const firstItem = request?.items[0]
                  const itemsSummary = request && request.items.length > 1 ? `${firstItem?.product?.name} +${request.items.length - 1}` : firstItem?.product?.name

                  return (
                    <Table.Tr key={p.id}>
                      <Table.Td fw={600}>#{p.buyerRequestId.slice(-6).toUpperCase()}</Table.Td>
                      <Table.Td>
                        <Text size="sm">{itemsSummary}</Text>
                        <Text size="xs" c="dimmed">{request?.address?.city}/{request?.address?.state}</Text>
                      </Table.Td>
                      <Table.Td>{request?.buyerCompany?.name}</Table.Td>
                      <Table.Td fw={700} c="gasbidOrange">{formatCurrency(total)}</Table.Td>
                      <Table.Td>
                        <Badge color={mantineBadgeColor(proposalStatusBadge(p.status))} variant="light">
                          {proposalStatusLabel(p.status)}
                        </Badge>
                        {p.status === 'COUNTER_OFFER' && (
                          <Group gap={4} mt={4} c="yellow.6">
                            <IconAlertCircle size={12} />
                            <Text size="xs">Resposta solicitada</Text>
                          </Group>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(p.createdAt)}</Text>
                        <Group gap={4} c="dimmed">
                          <IconClock size={12} />
                          <Text size="xs">{new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </Group>
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
      </Card>
    </Box>
  )
}
