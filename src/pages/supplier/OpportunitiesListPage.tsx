import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { opportunitiesApi } from '../../api'
import { formatDate } from '../../lib/utils'
import { IconFlame, IconChevronRight, IconClock } from '@tabler/icons-react'
import {
  Box, Group, Title, Text, Button, Card, Badge, Table, ScrollArea, Flex
} from '@mantine/core'

export function OpportunitiesListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => opportunitiesApi.list({ limit: 50 }),
  })

  const opportunities = data?.data ?? []

  return (
    <Box>
      <Group justify="space-between" align="center" mb="xl">
        <Box>
          <Title order={2} size="h3" fw={700}>Oportunidades</Title>
          <Text c="dimmed" size="sm">Solicitações abertas na sua área de atuação</Text>
        </Box>
        <Badge color="gasbidOrange" variant="filled" size="lg" leftSection={<IconFlame size={14} />}>
          {data?.total ?? 0} disponíveis
        </Badge>
      </Group>

      <Card withBorder radius="md" p={0}>
        {isLoading ? (
          <Flex justify="center" py={40} c="dimmed">
            <Text>Carregando...</Text>
          </Flex>
        ) : opportunities.length === 0 ? (
          <Flex direction="column" align="center" py={60} c="dimmed">
            <IconFlame size={48} />
            <Title order={4} mt="md" mb="xs">Nenhuma oportunidade no momento</Title>
            <Text size="sm">Verifique suas áreas de cobertura ou aguarde novas solicitações na sua região</Text>
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
                  <Table.Th>Distância</Table.Th>
                  <Table.Th>Prazo entrega</Table.Th>
                  <Table.Th>Expira em</Table.Th>
                  <Table.Th>Concorrentes</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {opportunities.map((opp: any) => {
                  const expiresAt = new Date(opp.expiresAt)
                  const hoursLeft = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 3600000))
                  const isUrgent = hoursLeft < 12

                  // Multi-item handling
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
                        {opp.distanceKm !== undefined && opp.distanceKm !== null ? (
                          <Text fw={600} c="gasbidOrange">
                            {opp.distanceKm} km
                          </Text>
                        ) : (
                          <Text c="dimmed">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td>{formatDate(opp.deadline)}</Table.Td>
                      <Table.Td>
                        <Group gap={4} c={isUrgent ? 'yellow' : 'inherit'}>
                          {isUrgent && <IconClock size={14} />}
                          <Text size="sm">{hoursLeft < 24 ? `${hoursLeft}h restantes` : formatDate(opp.expiresAt)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} c={opp._count?.proposals ? 'dimmed' : 'teal'}>
                          {opp._count?.proposals ?? 0}
                        </Text>
                      </Table.Td>
                      <Table.Td align="right">
                        <Button component={Link} to={`/opportunities/${opp.id}`} size="xs" color="gasbidOrange" rightSection={<IconChevronRight size={14} />}>
                          Propor
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
