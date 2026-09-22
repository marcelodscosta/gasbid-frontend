import React, { useState } from 'react'
import { Modal, Stack, Title, Text, Group, Select, Button, Table, Badge, ActionIcon, NumberInput, Switch } from '@mantine/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { IconTrash } from '@tabler/icons-react'

export function AdminSupplierCatalogModal({
  opened,
  onClose,
  supplierId,
  supplierName,
}: {
  opened: boolean
  onClose: () => void
  supplierId: string | null
  supplierName: string
}) {
  const queryClient = useQueryClient()
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const { data: globalProducts = [] } = useQuery({
    queryKey: ['admin-global-products'],
    queryFn: () => adminApi.listGlobalProducts(),
  })

  const { data: supplierProducts = [], isLoading } = useQuery({
    queryKey: ['admin-supplier-products', supplierId],
    queryFn: () => adminApi.listSupplierProducts(supplierId!),
    enabled: !!supplierId,
  })

  const addMutation = useMutation({
    mutationFn: (productId: string) => adminApi.addSupplierProduct(supplierId!, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-supplier-products', supplierId] })
      setSelectedProductId(null)
    },
  })

  const removeMutation = useMutation({
    mutationFn: (spId: string) => adminApi.removeSupplierProduct(spId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-supplier-products', supplierId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ spId, data }: { spId: string; data: any }) => adminApi.updateSupplierProduct(spId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-supplier-products', supplierId] }),
  })

  // Filter out already added products
  const availableProducts = globalProducts.filter(gp => !supplierProducts.some((sp: any) => sp.productId === gp.id))

  return (
    <Modal opened={opened} onClose={onClose} title="Catálogo do Revendedor" size="xl">
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          Gerencie quais produtos estão disponíveis para o revendedor <strong>{supplierName}</strong>.
        </Text>

        <Group align="flex-end">
          <Select
            label="Adicionar Produto"
            placeholder="Selecione um produto..."
            data={availableProducts.map(p => ({ value: p.id, label: p.name }))}
            value={selectedProductId}
            onChange={setSelectedProductId}
            style={{ flex: 1 }}
            searchable
          />
          <Button
            onClick={() => selectedProductId && addMutation.mutate(selectedProductId)}
            loading={addMutation.isPending}
            disabled={!selectedProductId}
            color="gasbidOrange"
          >
            Adicionar
          </Button>
        </Group>

        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Produto</Table.Th>
              <Table.Th>Modo</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {supplierProducts.map((sp: any) => (
              <Table.Tr key={sp.id}>
                <Table.Td>
                  <Text fw={500} size="sm">{sp.product?.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge size="sm" color="blue">
                    {sp.biddingMode === 'AUTO_ONLY' ? 'Automático' : sp.biddingMode === 'MANUAL_ONLY' ? 'Manual' : 'Ambos'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Switch
                    checked={sp.active}
                    onChange={(e) => updateMutation.mutate({ spId: sp.id, data: { active: e.currentTarget.checked } })}
                    label={sp.active ? 'Ativo' : 'Inativo'}
                    size="xs"
                  />
                </Table.Td>
                <Table.Td align="right">
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => removeMutation.mutate(sp.id)}
                    loading={removeMutation.isPending}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
            {supplierProducts.length === 0 && !isLoading && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text ta="center" c="dimmed" size="sm" py="md">Nenhum produto cadastrado para este revendedor.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Stack>
    </Modal>
  )
}
