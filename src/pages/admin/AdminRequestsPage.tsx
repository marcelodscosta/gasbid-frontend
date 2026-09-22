import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  Badge,
  Box,
  Text,
  Title,
  Stack,
  Group,
  Loader,
  Center,
  ScrollArea,
  Paper,
  TextInput,
} from '@mantine/core'
import { IconBriefcase, IconSearch } from '@tabler/icons-react'
import { adminApi } from '../../api'
import { formatDate, requestStatusBadge, requestStatusLabel } from '../../lib/utils'

const badgeColorMap: Record<string, string> = {
  'badge-green': 'green',
  'badge-yellow': 'yellow',
  'badge-red': 'red',
  'badge-blue': 'blue',
  'badge-orange': 'orange',
  'badge-gray': 'gray',
}

export function AdminRequestsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: () => adminApi.requests({ limit: 100 }),
  })

  const allRequests = data?.data ?? []

  const requests = search.trim()
    ? allRequests.filter((r: any) =>
        r.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.buyerCompany?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : allRequests

  return (
    <Stack gap="xl">
      {/* Page Header */}
      <Group justify="space-between" align="flex-start">
        <Box>
          <Title order={2} fw={700} style={{ letterSpacing: '-0.02em' }}>
            Solicitações — Moderação
          </Title>
          <Text size="sm" c="dimmed" mt={2}>
            Todas as solicitações de compra da plataforma
          </Text>
        </Box>
        <Badge color="gray" variant="light" radius="xl" size="lg" leftSection={<IconBriefcase size={13} />}>
          {data?.total ?? 0} solicitações
        </Badge>
      </Group>

      {/* Search */}
      <TextInput
        placeholder="Buscar por produto ou empresa..."
        leftSection={<IconSearch size={15} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        radius="md"
      />

      {/* Table */}
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <Center py={80}>
            <Stack align="center" gap="sm">
              <Loader color="gasbidOrange" size="sm" />
              <Text size="sm" c="dimmed">Carregando solicitações...</Text>
            </Stack>
          </Center>
        ) : (
          <ScrollArea>
            <Table
              highlightOnHover
              withTableBorder={false}
              withColumnBorders={false}
              horizontalSpacing="lg"
              verticalSpacing="sm"
              styles={{
                thead: { background: 'var(--mantine-color-default-hover)' },
                th: {
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--mantine-color-dimmed)',
                  borderBottom: '1px solid var(--mantine-color-default-border)',
                  whiteSpace: 'nowrap',
                },
                td: {
                  fontSize: '0.875rem',
                  borderBottom: '1px solid var(--mantine-color-default-border)',
                },
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Produto</Table.Th>
                  <Table.Th>Comprador</Table.Th>
                  <Table.Th>Qtd</Table.Th>
                  <Table.Th>Prazo</Table.Th>
                  <Table.Th>Expiração</Table.Th>
                  <Table.Th>Propostas</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {requests.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" c="dimmed" size="sm" py="xl">
                        {search
                          ? 'Nenhuma solicitação encontrada para esta busca'
                          : 'Nenhuma solicitação'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  requests.map((r: any) => (
                    <Table.Tr key={r.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{r.product?.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{r.buyerCompany?.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{r.quantity} un.</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{formatDate(r.deadline)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{formatDate(r.expiresAt)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          size="sm"
                          fw={600}
                          c={r._count?.proposals ? 'gasbidOrange' : 'dimmed'}
                        >
                          {r._count?.proposals ?? 0}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={badgeColorMap[requestStatusBadge(r.status)] ?? 'gray'}
                          size="sm"
                        >
                          {requestStatusLabel(r.status)}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Paper>
    </Stack>
  )
}
