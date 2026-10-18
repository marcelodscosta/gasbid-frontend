import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { productsApi, addressesApi, buyerRequestsApi, settingsApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { PAYMENT_OPTIONS } from '../../lib/utils'
import {
  IconAlertCircle, IconArrowLeft, IconPlus, IconTrash,
  IconShoppingCart, IconCalendar, IconClock
} from '@tabler/icons-react'
import {
  Box, Group, Title, Text, Button, Card, Select, TextInput,
  Textarea, NumberInput, Table, ActionIcon, Grid, Alert,
  Stack, Divider
} from '@mantine/core'

const schema = z.object({
  addressId: z.string().min(1, 'Selecione um endereço'),
  deadlineDate: z.string().min(1, 'Informe a data de entrega'),
  deadlineTime: z.string().min(1, 'Informe o horário'),
  paymentMethod: z.enum(['PIX', 'CASH', 'CREDIT', 'DEBIT', 'BOLETO']),
  observations: z.string().optional(),
})
type Form = z.infer<typeof schema>

interface Item {
  productId: string
  quantity: number
  productName: string
}

export function NewRequestPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [items, setItems] = useState<Item[]>([])
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState<number | string>(1)

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.list,
  })

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses', user?.companyId],
    queryFn: () => addressesApi.list(user!.companyId!),
    enabled: !!user?.companyId,
  })

  const { data: settings } = useQuery({
    queryKey: ['proposal-window'],
    queryFn: () => settingsApi.proposalWindow().catch(() => ({ proposalWindowMinutes: 5 })),
    staleTime: 5 * 60_000,
  })
  const windowMinutes = settings?.proposalWindowMinutes ?? 5

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      deadlineTime: '08:00',
      paymentMethod: 'PIX',
    }
  })

  const mutation = useMutation({
    mutationFn: (data: Form) => {
      const deadline = new Date(`${data.deadlineDate}T${data.deadlineTime}`).toISOString()
      return buyerRequestsApi.create({
        addressId: data.addressId,
        observations: data.observations,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: data.paymentMethod,
        deadline,
      })
    },
    onSuccess: (result) => navigate(`/requests/${result.id}`),
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Erro ao criar solicitação'),
  })

  function addItem() {
    if (!selectedProductId) return
    const product = products.find(p => p.id === selectedProductId)
    if (!product) return

    setItems([...items, { 
      productId: selectedProductId, 
      quantity: Number(selectedQuantity),
      productName: product.name
    }])
    setSelectedProductId(null)
    setSelectedQuantity(1)
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <Box mx="auto" maw={800}>
      <Group mb="sm">
        <Button variant="subtle" size="xs" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </Group>

      <Box mb="xl">
        <Title order={2} size="h3" fw={700}>Nova solicitação de compra</Title>
        <Text c="dimmed" size="sm">Crie uma solicitação com um ou mais produtos</Text>
      </Box>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red" mb="xl">
          {error}
        </Alert>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="xl">
            {/* Main Form */}
            <Card withBorder radius="md" p="xl">
              <form id="request-form" onSubmit={handleSubmit((data) => {
                if (items.length === 0) {
                  setError('Adicione pelo menos um produto à solicitação')
                  return
                }
                mutation.mutate(data as Form)
              })}>
                <Stack>
                  <Select
                    label="Endereço de entrega"
                    withAsterisk
                    placeholder="Selecione o endereço..."
                    data={addresses.map(a => ({
                      value: a.id,
                      label: `${a.street}, ${a.number} — ${a.neighborhood}, ${a.city}/${a.state}`
                    }))}
                    {...register('addressId')}
                    error={errors.addressId?.message}
                    onChange={(val) => register('addressId').onChange({ target: { name: 'addressId', value: val } })}
                  />

                  <Box>
                    <Text size="sm" fw={500} mb={4}>Prazo máximo para entrega <Text component="span" c="red">*</Text></Text>
                    <Grid>
                      <Grid.Col span={8}>
                        <TextInput
                          type="date"
                          min={todayStr}
                          leftSection={<IconCalendar size={16} />}
                          {...register('deadlineDate')}
                          error={errors.deadlineDate?.message}
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <TextInput
                          type="time"
                          leftSection={<IconClock size={16} />}
                          {...register('deadlineTime')}
                          error={errors.deadlineTime?.message}
                        />
                      </Grid.Col>
                    </Grid>
                  </Box>

                  <Select
                    label="Forma de pagamento"
                    withAsterisk
                    data={PAYMENT_OPTIONS}
                    defaultValue="PIX"
                    allowDeselect={false}
                    error={errors.paymentMethod?.message}
                    onChange={(val) => register('paymentMethod').onChange({ target: { name: 'paymentMethod', value: val } })}
                  />

                  <Alert color="blue" variant="light" icon={<IconClock size={16} />}>
                    Os revendedores terão {windowMinutes} minutos para enviar propostas depois que você publicar. Você acompanha tudo em tempo real.
                  </Alert>


                  <Textarea
                    label="Observações"
                    placeholder="Horário de entrega, acesso, requisitos especiais..."
                    minRows={3}
                    {...register('observations')}
                  />
                </Stack>
              </form>
            </Card>

            {/* Add Items Section */}
            <Card withBorder radius="md" p="xl" mt="xl">
              <Title order={4} size="h5" mb="md">Produtos da solicitação</Title>
              
              <Group mb="xl" align="flex-end">
                <Select
                  label="Produto"
                  placeholder="Selecione um produto..."
                  data={products.map(p => ({ value: p.id, label: `${p.name} (${p.weightKg}kg)` }))}
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                  style={{ flex: 1 }}
                />
                <NumberInput
                  label="Quantidade"
                  min={1}
                  value={selectedQuantity}
                  onChange={setSelectedQuantity}
                  w={100}
                />
                <Button color="gasbidOrange" leftSection={<IconPlus size={16} />} onClick={addItem}>
                  Adicionar
                </Button>
              </Group>

              {items.length === 0 ? (
                <Box p="xl" ta="center" style={{ border: '2px dashed var(--mantine-color-default-border)', borderRadius: 12 }} c="dimmed">
                  Nenhum produto adicionado ainda. Adicione pelo menos um produto acima.
                </Box>
              ) : (
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Produto</Table.Th>
                      <Table.Th ta="center" w={80}>Qtd</Table.Th>
                      <Table.Th w={40} />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {items.map((item, index) => (
                      <Table.Tr key={index}>
                        <Table.Td fw={500}>{item.productName}</Table.Td>
                        <Table.Td ta="center">{item.quantity}</Table.Td>
                        <Table.Td ta="right">
                          <ActionIcon color="red" variant="subtle" onClick={() => removeItem(index)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          </Stack>
        </Grid.Col>

        {/* Sidebar Summary */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" p="xl" style={{ position: 'sticky', top: 20 }}>
            <Group mb="md">
              <IconShoppingCart size={20} />
              <Title order={4} size="h5">Resumo</Title>
            </Group>
            
            <Stack>
              <Group justify="space-between">
                <Text c="dimmed" size="sm">Total de itens:</Text>
                <Text fw={700} size="lg">{items.length}</Text>
              </Group>
              
              <Divider />
              
              <Button 
                type="submit" 
                form="request-form" 
                color="gasbidOrange" 
                size="lg"
                fullWidth
                loading={isSubmitting || mutation.isPending}
                disabled={items.length === 0}
              >
                Publicar solicitação
              </Button>
              <Text size="xs" c="dimmed" ta="center">
                Ao publicar, sua solicitação ficará visível para todos os revendedores da sua região.
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Box>
  )
}
