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
} from '@mantine/core'
import { IconUsers } from '@tabler/icons-react'
import { adminApi } from '../../api'
import { formatDate } from '../../lib/utils'
import { AdminSupplierCatalogModal } from './AdminSupplierCatalogModal'
import { useState } from 'react'
import { Button } from '@mantine/core'

const ROLE_COLOR: Record<string, string> = {
  BUYER: 'blue',
  SUPPLIER: 'orange',
  ADMIN: 'red',
}
const ROLE_LABEL: Record<string, string> = {
  BUYER: 'Comprador',
  SUPPLIER: 'Fornecedor',
  ADMIN: 'Admin',
}

export function AdminUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.users({ limit: 100 }),
  })

  const users = data?.data ?? []
  
  const [catalogSupplierId, setCatalogSupplierId] = useState<string | null>(null)
  const [catalogSupplierName, setCatalogSupplierName] = useState<string>('')

  const openCatalog = (supplierCompanyId: string, supplierName: string) => {
    setCatalogSupplierId(supplierCompanyId)
    setCatalogSupplierName(supplierName)
  }

  return (
    <Stack gap="xl">
      {/* Page Header */}
      <Group justify="space-between" align="flex-start">
        <Box>
          <Title order={2} fw={700} style={{ letterSpacing: '-0.02em' }}>
            Usuários
          </Title>
          <Text size="sm" c="dimmed" mt={2}>
            Todos os usuários cadastrados na plataforma
          </Text>
        </Box>
        <Badge color="gray" variant="light" radius="xl" size="lg" leftSection={<IconUsers size={13} />}>
          {data?.total ?? 0} usuários
        </Badge>
      </Group>

      {/* Table */}
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <Center py={80}>
            <Stack align="center" gap="sm">
              <Loader color="gasbidOrange" size="sm" />
              <Text size="sm" c="dimmed">Carregando usuários...</Text>
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
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Perfil</Table.Th>
                  <Table.Th>Empresa</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Cadastro</Table.Th>
                  <Table.Th>Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" c="dimmed" size="sm" py="xl">
                        Nenhum usuário encontrado
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  users.map((u: any) => (
                    <Table.Tr key={u.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{u.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{u.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={ROLE_COLOR[u.role] ?? 'gray'} size="sm">
                          {ROLE_LABEL[u.role] ?? u.role}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{u.company?.name ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={u.company?.active !== false ? 'green' : 'red'}
                          size="sm"
                        >
                          {u.company?.active !== false ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{formatDate(u.createdAt)}</Text>
                      </Table.Td>
                      <Table.Td>
                        {u.role === 'SUPPLIER' && u.company?.id && (
                          <Button 
                            variant="light" 
                            size="xs" 
                            color="gasbidOrange"
                            onClick={() => openCatalog(u.company.id, u.company.name)}
                          >
                            Catálogo
                          </Button>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Paper>

      <AdminSupplierCatalogModal
        opened={!!catalogSupplierId}
        onClose={() => setCatalogSupplierId(null)}
        supplierId={catalogSupplierId}
        supplierName={catalogSupplierName}
      />
    </Stack>
  )
}
