import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Paper,
  Title,
  Text,
  Stack,
  Group,
  SegmentedControl,
  NumberInput,
  Button,
  Divider,
  Loader,
  Center,
} from '@mantine/core'
import { supplierProductsApi } from '../../api'
import { IconDeviceFloppy } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'

export function CatalogPage() {
  const queryClient = useQueryClient()
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['supplier-products'],
    queryFn: () => supplierProductsApi.listMyProducts(),
  })

  if (isLoading) {
    return (
      <Center py={100}>
        <Loader color="gasbidOrange" />
      </Center>
    )
  }

  if (products.length === 0) {
    return (
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" py="xl">
          <Text c="dimmed">Seu catálogo está vazio. O administrador precisa liberar produtos para você.</Text>
        </Stack>
      </Paper>
    )
  }

  return (
    <Stack gap="xl">
      <Box>
        <Title order={2} fw={700} style={{ letterSpacing: '-0.02em' }}>
          Meu Catálogo
        </Title>
        <Text size="sm" c="dimmed" mt={2}>
          Configure o modo de operação e os preços por distância para seus produtos.
        </Text>
      </Box>

      {products.filter((p: any) => p.active).map((p: any) => (
        <ProductConfigCard key={p.id} product={p} queryClient={queryClient} />
      ))}
    </Stack>
  )
}

function Box({ children }: any) {
  return <div>{children}</div>
}

function ProductConfigCard({ product, queryClient }: any) {
  const [biddingMode, setBiddingMode] = useState(product.biddingMode)
  const [defaultPrice, setDefaultPrice] = useState<number | ''>(product.defaultPrice || '')

  const mutation = useMutation({
    mutationFn: (data: any) => supplierProductsApi.updateProduct(product.id, data),
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'Configurações de produto salvas.',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] })
    },
    onError: () => {
      notifications.show({
        title: 'Erro',
        message: 'Falha ao salvar o produto.',
        color: 'red',
      })
    }
  })

  const handleSave = () => {
    mutation.mutate({
      biddingMode,
      defaultPrice: defaultPrice === '' ? null : Number(defaultPrice),
    })
  }

  return (
    <Paper p="xl" radius="md" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={4}>{product.product?.name}</Title>
          <Button 
            leftSection={<IconDeviceFloppy size={16} />} 
            color="gasbidOrange" 
            onClick={handleSave}
            loading={mutation.isPending}
          >
            Salvar
          </Button>
        </Group>
        
        <Divider />

        <Stack gap="xs">
          <Text fw={500} size="sm">Modo de Operação</Text>
          <SegmentedControl
            value={biddingMode}
            onChange={setBiddingMode}
            data={[
              { label: 'Apenas Manual (Lances em tempo real)', value: 'MANUAL_ONLY' },
              { label: 'Automático (Valores pré-fixados)', value: 'AUTO_ONLY' },
              { label: 'Ambos (Auto e Tempo Real)', value: 'BOTH' },
            ]}
          />
        </Stack>

        {(biddingMode === 'AUTO_ONLY' || biddingMode === 'BOTH') && (
          <Stack gap="md" mt="md">
            <Text fw={500} size="sm">Preço Padrão (Auto-lance)</Text>
            
            <Group grow align="flex-end">
              <NumberInput label="Preço (R$)" value={defaultPrice} onChange={setDefaultPrice} prefix="R$ " decimalScale={2} />
            </Group>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
