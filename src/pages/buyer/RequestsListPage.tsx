import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { buyerRequestsApi } from '../../api'
import { formatDate, requestStatusLabel, requestStatusBadge, mantineBadgeColor } from '../../lib/utils'
import { IconShoppingCart, IconPlus, IconChevronRight } from '@tabler/icons-react'
import {
  Box, Group, Title, Text, Button, Card, Badge, Table,
  ScrollArea, ActionIcon, Flex
} from '@mantine/core'

export function RequestsListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['buyer-requests'],
    queryFn: () => buyerRequestsApi.list({ limit: 50 }),
  })

  const requests = data?.data ?? []

  return (
    <Box>
      <Group justify="space-between" align="center" mb="xl">
        <Box>
          <Title order={2} size="h3" fw={700}>Minhas solicitações</Title>
          <Text c="dimmed" size="sm">Gerencie suas solicitações de compra de GLP</Text>
        </Box>
        <Button component={Link} to="/requests/new" leftSection={<IconPlus size={16} />} color="gasbidOrange">
          Nova solicitação
        </Button>
      </Group>

      <Card withBorder radius="md" p={0}>
        {isLoading ? (
          <Flex justify="center" py={40} c="dimmed">
            <Text>Carregando...</Text>
          </Flex>
        ) : requests.length === 0 ? (
          <Flex direction="column" align="center" py={60} c="dimmed">
            <IconShoppingCart size={48} />
            <Title order={4} mt="md" mb="xs">Nenhuma solicitação criada</Title>
            <Text size="sm" mb="md">Crie uma solicitação para receber propostas de revendedores</Text>
            <Button component={Link} to="/requests/new" color="gasbidOrange" leftSection={<IconPlus size={14} />}>
              Criar primeira solicitação
            </Button>
          </Flex>
        ) : (
          <ScrollArea>
            <Table verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Produto</Table.Th>
                  <Table.Th>Quantidade</Table.Th>
                  <Table.Th>Endereço</Table.Th>
                  <Table.Th>Prazo</Table.Th>
                  <Table.Th>Propostas</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {requests.map((r: any) => (
                  <Table.Tr key={r.id}>
                    <Table.Td fw={600}>
                      {r.items?.[0]?.product?.name ?? 'Solicitação'} {r.items && r.items.length > 1 ? `(+${r.items.length - 1})` : ''}
                    </Table.Td>
                    <Table.Td>{r.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) ?? 0} un.</Table.Td>
                    <Table.Td>{r.address?.city}/{r.address?.state}</Table.Td>
                    <Table.Td>{formatDate(r.deadline)}</Table.Td>
                    <Table.Td>
                      <Text fw={600} c={r._count?.proposals ? 'var(--mantine-color-gasbidOrange-6)' : 'dimmed'}>
                        {r._count?.proposals ?? 0}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={mantineBadgeColor(requestStatusBadge(r.status))} variant="light">
                        {requestStatusLabel(r.status)}
                      </Badge>
                    </Table.Td>
                    <Table.Td align="right">
                      <ActionIcon component={Link} to={`/requests/${r.id}`} variant="subtle" color="gray">
                        <IconChevronRight size={18} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Card>
    </Box>
  )
}
