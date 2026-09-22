import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ordersApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import {
  formatCurrency, formatDate,
  orderStatusLabel, orderStatusBadge,
  mantineBadgeColor
} from '../lib/utils'
import { IconPackage, IconChevronRight } from '@tabler/icons-react'
import {
  Box, Group, Title, Text, Card, Badge, Table, ScrollArea, ActionIcon, Flex
} from '@mantine/core'

export function OrdersListPage() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list({ limit: 50 }),
  })

  const orders = data?.data ?? []

  return (
    <Box>
      <Group justify="space-between" align="center" mb="xl">
        <Box>
          <Title order={2} size="h3" fw={700}>
            {user?.role === 'SUPPLIER' ? 'Pedidos ganhos' : 'Meus pedidos'}
          </Title>
          <Text c="dimmed" size="sm">Acompanhe o status e a entrega dos seus pedidos</Text>
        </Box>
      </Group>

      <Card withBorder radius="md" p={0}>
        {isLoading ? (
          <Flex justify="center" py={40} c="dimmed">
            <Text>Carregando...</Text>
          </Flex>
        ) : orders.length === 0 ? (
          <Flex direction="column" align="center" py={60} c="dimmed">
            <IconPackage size={48} />
            <Title order={4} mt="md" mb="xs">Nenhum pedido ainda</Title>
            <Text size="sm">
              {user?.role === 'BUYER'
                ? 'Aceite uma proposta para criar seu primeiro pedido'
                : 'Pedidos aparecerão aqui quando suas propostas forem aceitas'}
            </Text>
          </Flex>
        ) : (
          <ScrollArea>
            <Table verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Produto</Table.Th>
                  <Table.Th>{user?.role === 'BUYER' ? 'Fornecedor' : 'Comprador'}</Table.Th>
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
                      <Text fw={600} size="sm">{order.buyerRequest?.product?.name}</Text>
                      <Text size="xs" c="dimmed">{order.buyerRequest?.quantity} un.</Text>
                    </Table.Td>
                    <Table.Td>
                      {user?.role === 'BUYER'
                        ? order.supplierCompany?.name
                        : order.buyerCompany?.name}
                    </Table.Td>
                    <Table.Td fw={700}>
                      {formatCurrency(order.totalPrice)}
                    </Table.Td>
                    <Table.Td>{formatDate(order.createdAt)}</Table.Td>
                    <Table.Td>
                      <Badge color={mantineBadgeColor(orderStatusBadge(order.status))} variant="light">
                        {orderStatusLabel(order.status)}
                      </Badge>
                    </Table.Td>
                    <Table.Td align="right">
                      <ActionIcon component={Link} to={`/orders/${order.id}`} variant="subtle" color="gray">
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
