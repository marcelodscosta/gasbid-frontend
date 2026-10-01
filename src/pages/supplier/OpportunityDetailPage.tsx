import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { proposalsApi, buyerRequestsApi } from '../../api'
import { formatCurrency, formatDateTime, maskCurrency, parseCurrency } from '../../lib/utils'
import {
  IconArrowLeft, IconAlertCircle, IconCheck, IconMessageCircle, IconClock, IconCalendar
} from '@tabler/icons-react'
import {
  Box, Group, Title, Text, Button, Card, Badge, Alert,
  Grid, Stack, Flex, TextInput, Textarea
} from '@mantine/core'

const schema = z.object({
  items: z.array(z.object({
    buyerRequestItemId: z.string(),
    unitPrice: z.coerce.number().positive('Preço deve ser maior que zero'),
  })),
  freightPrice: z.coerce.number().min(0),
  deliveryDate: z.string().min(1, 'Informe a data de entrega'),
  deliveryTime: z.string().min(1, 'Informe o horário'),
  paymentTerms: z.string().optional(),
  observations: z.string().optional(),
})

type Form = z.infer<typeof schema>

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const { data: request, isLoading, refetch } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => buyerRequestsApi.get(id!),
    refetchInterval: 3000,
  })

  const myProposal = request?.proposals?.[0]
  const isCounterOffer = myProposal?.status === 'COUNTER_OFFER'

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      items: [],
      freightPrice: 0,
      deliveryTime: '08:00',
      paymentTerms: '',
    }
  })

  const { fields } = useFieldArray({
    control,
    name: "items"
  })

  useEffect(() => {
    if (request && !myProposal) {
      const deadlineDate = new Date(request.deadline)
      reset({
        items: request.items.map((item: any) => ({
          buyerRequestItemId: item.id,
          unitPrice: 0,
        })),
        freightPrice: 0,
        deliveryDate: deadlineDate.toISOString().split('T')[0],
        deliveryTime: deadlineDate.toTimeString().slice(0, 5),
      })
    } else if (myProposal) {
      const deadlineDate = new Date(myProposal.deliveryDeadline)
      reset({
        items: myProposal.items.map((item: any) => ({
          buyerRequestItemId: item.buyerRequestItemId,
          unitPrice: item.unitPrice,
        })),
        freightPrice: myProposal.freightPrice,
        deliveryDate: deadlineDate.toISOString().split('T')[0],
        deliveryTime: deadlineDate.toTimeString().slice(0, 5),
        paymentTerms: myProposal.paymentTerms || '',
        observations: myProposal.observations,
      })
    }
  }, [request, myProposal, reset])

  const watchedItems = watch('items')
  const watchedFreight = watch('freightPrice')

  const total = (watchedItems?.reduce((acc: number, item: any) => {
    const rItem = request?.items.find((i: any) => i.id === item.buyerRequestItemId)
    return acc + (item.unitPrice || 0) * (rItem?.quantity || 0)
  }, 0) || 0) + (watchedFreight || 0)

  const mySavedProposalTotal = myProposal ? (
    (myProposal.items?.reduce((acc: number, item: any) => {
      const rItem = request?.items.find((i: any) => i.id === item.buyerRequestItemId)
      return acc + (item.unitPrice || 0) * (rItem?.quantity || 0)
    }, 0) || 0) + (myProposal.freightPrice || 0)
  ) : 0

  const mutation = useMutation({
    mutationFn: (data: Form) => {
      setError('')
      const deliveryDeadline = new Date(`${data.deliveryDate}T${data.deliveryTime}`).toISOString()

      const buyerDeadline = new Date(request!.deadline)
      if (new Date(deliveryDeadline) > buyerDeadline && !isCounterOffer) {
        throw new Error(`Prazo excedido. O comprador exige entrega até ${formatDateTime(request!.deadline)}.`)
      }

      return proposalsApi.create(id!, {
        items: data.items,
        freightPrice: data.freightPrice,
        deliveryDeadline,
        paymentTerms: data.paymentTerms,
        observations: data.observations,
      })
    },
    onSuccess: async () => {
      await refetch()
      setSuccess(true)
    },
    onError: (err: any) => setError(err?.message || err?.response?.data?.message || 'Erro ao enviar proposta'),
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
        <Title order={3}>Oportunidade não encontrada</Title>
      </Flex>
    )
  }

  if (success) {
    return (
      <Flex direction="column" align="center" justify="center" py={80} maw={520} mx="auto">
        <IconCheck size={56} color="var(--mantine-color-teal-6)" style={{ marginBottom: 20 }} />
        <Title order={2} size="h3">{myProposal ? 'Proposta atualizada!' : 'Proposta enviada!'}</Title>
        <Text c="dimmed" mt="xs">Sua nova oferta foi enviada ao comprador com sucesso.</Text>
        <Group mt="xl">
          <Button onClick={() => setSuccess(false)} color="gasbidOrange">Acompanhar Leilão Ao Vivo</Button>
          <Button variant="subtle" color="gray" onClick={() => navigate('/opportunities')}>Ver Oportunidades</Button>
        </Group>
      </Flex>
    )
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <Box maw={800} mx="auto">
      <Group justify="space-between" align="flex-start" mb="xl">
        <Box>
          <Button variant="subtle" size="xs" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} mb="sm" px={0}>
            Voltar
          </Button>
          <Title order={2} size="h3" fw={700}>{myProposal ? 'Atualizar proposta' : 'Enviar proposta'}</Title>
          <Text c="dimmed" size="sm">Solicitação de {request.items.length} produtos</Text>
        </Box>
      </Group>

      {isCounterOffer && (
        <Alert icon={<IconMessageCircle size={16} />} title="Contraproposta Recebida!" color="yellow" variant="light" mb="xl">
          <Text fs="italic">"{myProposal.observations}"</Text>
        </Alert>
      )}

      {/* Request Summary */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="md" h="100%">
            <Title order={4} size="h5" c="gasbidOrange" mb="md">Resumo da solicitação</Title>
            <Stack gap="sm">
              <Box>
                <Text size="xs" c="dimmed">Local de entrega</Text>
                {myProposal?.status === 'ACCEPTED' ? (
                  <>
                    <Text fw={600} size="sm">{request.address?.city}/{request.address?.state}</Text>
                    <Text size="xs" c="dimmed">{request.address?.street}, {request.address?.number} - {request.address?.neighborhood}</Text>
                  </>
                ) : (
                  <>
                    <Text fw={600} size="sm">{request.address?.neighborhood}</Text>
                    <Text size="xs" c="dimmed">{request.address?.city}, {request.address?.state}</Text>
                    <Text size="xs" c="yellow.6" fs="italic" mt={4}>Endereço exato liberado após fechamento</Text>
                  </>
                )}
              </Box>
              
              {request.distanceKm !== undefined && request.distanceKm !== null && (
                <Box>
                  <Text size="xs" c="dimmed">Distância estimada</Text>
                  <Text fw={700} c="gasbidOrange" size="sm">📍 {request.distanceKm} km</Text>
                </Box>
              )}
              
              {request.observations && (
                <Box>
                  <Text size="xs" c="dimmed">Forma de pagamento e observações</Text>
                  <Box p="xs" mt={4} bg="var(--mantine-color-default-hover)" style={{ borderRadius: 6, borderLeft: '3px solid var(--mantine-color-gasbidOrange-6)' }}>
                    <Text size="sm" fw={600}>💳 {request.observations}</Text>
                  </Box>
                </Box>
              )}
              
              <Box>
                <Text size="xs" c="dimmed">Expectativa do comprador</Text>
                <Text fw={600} c="yellow.6" size="sm">{formatDateTime(request.deadline)}</Text>
              </Box>
              
              <Box>
                <Text size="xs" c="dimmed">Expiração da solicitação</Text>
                <Text fw={600} size="sm">{formatDateTime(request.expiresAt)}</Text>
              </Box>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Map Card */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p={0} h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
            <Box p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
              <Group justify="space-between">
                <Text fw={600} size="sm">Localização da Entrega</Text>
                {myProposal?.status === 'ACCEPTED' && (
                  <Text component="a" href={`https://www.google.com/maps/search/?api=1&query=${request.address?.latitude},${request.address?.longitude}`} target="_blank" rel="noreferrer" size="xs" c="gasbidOrange" fw={600}>
                    Ver no Google Maps
                  </Text>
                )}
              </Group>
            </Box>
            <Box style={{ flex: 1, minHeight: 180, background: 'var(--mantine-color-default)' }}>
              {request.address?.latitude != null && request.address?.longitude != null ? (
                <iframe
                  width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0}
                  src={myProposal?.status === 'ACCEPTED'
                    ? `https://www.openstreetmap.org/export/embed.html?bbox=${request.address.longitude - 0.005},${request.address.latitude - 0.005},${request.address.longitude + 0.005},${request.address.latitude + 0.005}&layer=mapnik&marker=${request.address.latitude},${request.address.longitude}`
                    : `https://www.openstreetmap.org/export/embed.html?bbox=${request.address.longitude - 0.015},${request.address.latitude - 0.015},${request.address.longitude + 0.015},${request.address.latitude + 0.015}&layer=mapnik`
                  }
                  style={{ border: 0 }}
                />
              ) : (
                <Flex align="center" justify="center" h="100%" c="dimmed" fz="sm">
                  Mapa indisponível para este endereço
                </Flex>
              )}
            </Box>
          </Card>
        </Grid.Col>
      </Grid>

      {request.status === 'OPEN' && (
        <CountdownBanner expiresAt={request.expiresAt} />
      )}

      {request.status === 'OPEN' && request.lowestMarketSummary && (
        <Card withBorder radius="md" p="md" mb="xl" style={{ borderLeft: '4px solid var(--mantine-color-gasbidOrange-6)' }} bg="var(--mantine-color-default-hover)">
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <Text fw={700} c="gasbidOrange">🏆 Menor Oferta Atual na Plataforma</Text>
            </Group>
            <Badge color={request.lowestMarketSummary.isMyProposal ? 'teal' : 'orange'} variant="filled">
              {request.lowestMarketSummary.isMyProposal ? 'SUA OFERTA É A MENOR!' : 'OUTRA REVENDA LIDERANDO'}
            </Badge>
          </Group>

          <Box p="sm" bg="var(--mantine-color-default)" style={{ borderRadius: 8 }} mb="md">
            <Text size="xs" c="dimmed" fw={600} mb="sm">Discriminação de valores por item da menor oferta:</Text>
            {request.lowestMarketSummary.items?.map((it: any, idx: number) => (
              <Group justify="space-between" key={idx} py={4} style={{ borderBottom: '1px dashed var(--mantine-color-default-border)' }}>
                <Text size="sm">{it.productName} ({it.quantity} un.)</Text>
                <Text size="sm" fw={700}>{formatCurrency(it.unitPrice)} /un <Text component="span" c="dimmed" fw={400}>(Subtotal: {formatCurrency(it.subtotal)})</Text></Text>
              </Group>
            ))}
            <Group justify="space-between" mt="sm">
              <Text size="sm">Frete:</Text>
              <Text size="sm" fw={700}>{request.lowestMarketSummary.freightPrice ? formatCurrency(request.lowestMarketSummary.freightPrice) : 'Grátis'}</Text>
            </Group>
          </Box>

          <Group justify="space-between" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
            <Text size="sm" fw={600}>VALOR TOTAL ESTIMADO DA MENOR OFERTA:</Text>
            <Text size="xl" fw={900} c="gasbidOrange">{formatCurrency(request.lowestMarketSummary.totalPrice)}</Text>
          </Group>
        </Card>
      )}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red" mb="md" variant="light">
          {error}
        </Alert>
      )}

      {(request.status !== 'OPEN' || (myProposal && ['ACCEPTED', 'REJECTED'].includes(myProposal.status))) && (
        <Card withBorder radius="md" p="xl" ta="center">
          {myProposal?.status === 'ACCEPTED' ? (
            <Flex direction="column" align="center">
              <IconCheck size={48} color="var(--mantine-color-teal-6)" style={{ marginBottom: 16 }} />
              <Title order={3}>Sua proposta foi ACEITA!</Title>
              <Text mt="xs">O comprador aceitou sua oferta.</Text>
              <Button mt="xl" color="gasbidOrange" onClick={() => navigate('/orders')}>Ver Pedidos Ganhos</Button>
            </Flex>
          ) : (
            <Flex direction="column" align="center">
              <IconAlertCircle size={48} color="var(--mantine-color-yellow-6)" style={{ marginBottom: 16 }} />
              <Title order={3}>Esta solicitação não está mais aberta</Title>
              <Button mt="xl" variant="subtle" color="gray" onClick={() => navigate('/opportunities')}>Voltar para Oportunidades</Button>
            </Flex>
          )}
        </Card>
      )}

      {/* Proposal Form or Frozen State */}
      {request.status === 'OPEN' && (!myProposal || !['ACCEPTED', 'REJECTED'].includes(myProposal.status)) && (
        <Card withBorder radius="md" p="xl">
          <Group justify="space-between" mb="xl">
            <Title order={3} size="h4">{myProposal ? 'Sua proposta' : 'Nova proposta'}</Title>
            {myProposal && (
              <Badge color={myProposal.status === 'COUNTER_OFFER' ? 'red' : 'blue'} variant="filled">
                {myProposal.status === 'COUNTER_OFFER' ? 'CONTRAPROPOSTA RECEBIDA' : 'AGUARDANDO ANÁLISE'}
              </Badge>
            )}
          </Group>

          {/* Frozen View */}
          {myProposal && (myProposal.status === 'SUBMITTED' || myProposal.status === 'UPDATED') && request.lowestMarketSummary?.isMyProposal ? (
            <Stack gap="xl">
              <Alert icon={<IconClock size={16} />} color="blue" variant="light" title="🏆 Sua proposta é a Menor Oferta da Plataforma!">
                <Text size="sm">Sua oferta lidera a cotação. Aguarde a decisão final do comprador.</Text>
              </Alert>

              <Grid>
                <Grid.Col span={6}>
                  <Box p="md" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total da Oferta</Text>
                    <Text size="xl" fw={800} c="gasbidOrange">{formatCurrency(total)}</Text>
                  </Box>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Box p="md" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Previsão de Entrega</Text>
                    <Text size="md" fw={600}>{formatDateTime(myProposal.deliveryDeadline)}</Text>
                  </Box>
                </Grid.Col>
              </Grid>

              <Box>
                <Title order={4} size="h6" mb="sm">Itens Ofertados</Title>
                <Stack gap="sm">
                  {myProposal.items.map((item: any) => {
                    const requestItem = request.items.find((i: any) => i.id === item.buyerRequestItemId)
                    return (
                      <Group justify="space-between" key={item.id} py={8} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                        <Text size="sm">{requestItem?.product?.name} ({requestItem?.quantity} un.)</Text>
                        <Text fw={600}>{formatCurrency(item.unitPrice)}/un</Text>
                      </Group>
                    )
                  })}
                  <Group justify="space-between" py={8} fw={600}>
                    <Text size="sm">Frete</Text>
                    <Text>{formatCurrency(myProposal.freightPrice)}</Text>
                  </Group>
                </Stack>
              </Box>

              {myProposal.observations && (
                <Box p="md" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }}>
                  <Text size="xs" c="dimmed" mb={4}>Observações enviadas</Text>
                  <Text size="sm" fs="italic">"{myProposal.observations}"</Text>
                </Box>
              )}
              {myProposal.paymentTerms && (
                <Box p="md" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }}>
                  <Text size="xs" c="dimmed" mb={4}>Condições de Pagamento</Text>
                  <Text size="sm" fw={600}>{myProposal.paymentTerms}</Text>
                </Box>
              )}
            </Stack>
          ) : (
            <form onSubmit={handleSubmit((d) => mutation.mutate(d as Form))}>
              {myProposal && request.lowestMarketSummary && !request.lowestMarketSummary.isMyProposal && (
                <Alert icon={<IconClock size={16} />} title="⚡️ Cobertura de Oferta Liberada!" color="yellow" variant="light" mb="xl">
                  <Text size="sm">
                    Sua oferta anterior enviada ({formatCurrency(mySavedProposalTotal)}) está acima do líder do leilão ({formatCurrency(request.lowestMarketSummary.totalPrice)}).
                    Para cobrir o líder e assumir o 1º lugar, seu novo total precisa ser de no máximo <Text component="span" fw={700}>{formatCurrency(request.lowestMarketSummary.totalPrice - 2)}</Text> (diferença mínima de R$ 2,00).
                  </Text>
                </Alert>
              )}

              <Box mb="xl">
                <Text size="sm" fw={500} mb="xs">Preço por item e Subtotais</Text>
                
                <Box p="xs" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }} mb="xs">
                  <Grid align="center">
                    <Grid.Col span={5}><Text size="xs" fw={700} c="dimmed" tt="uppercase">Produto</Text></Grid.Col>
                    <Grid.Col span={2} ta="center"><Text size="xs" fw={700} c="dimmed" tt="uppercase">Qtd</Text></Grid.Col>
                    <Grid.Col span={3}><Text size="xs" fw={700} c="dimmed" tt="uppercase">Preço Unitário</Text></Grid.Col>
                    <Grid.Col span={2} ta="right"><Text size="xs" fw={700} c="dimmed" tt="uppercase">Total Item</Text></Grid.Col>
                  </Grid>
                </Box>

                <Stack gap="xs">
                  {fields.map((field, index) => {
                    const requestItem = request.items.find((i: any) => i.id === field.buyerRequestItemId)
                    const qty = requestItem?.quantity || 0
                    const currentUnitPrice = watch(`items.${index}.unitPrice`) || 0
                    const itemSubtotal = qty * currentUnitPrice

                    return (
                      <Box key={field.id} p="sm" bg="var(--mantine-color-default)" style={{ borderRadius: 8, border: '1px solid var(--mantine-color-default-border)' }}>
                        <Grid align="center">
                          <Grid.Col span={5}><Text fw={600} size="sm">{requestItem?.product?.name}</Text></Grid.Col>
                          <Grid.Col span={2} ta="center">
                            <Badge color="gasbidOrange" variant="light">{qty} un.</Badge>
                          </Grid.Col>
                          <Grid.Col span={3}>
                            <Controller
                              name={`items.${index}.unitPrice`}
                              control={control}
                              render={({ field }) => (
                                <TextInput
                                  placeholder="R$ 0,00"
                                  fw={600}
                                  value={maskCurrency(field.value || 0)}
                                  onChange={(e) => field.onChange(parseCurrency(e.target.value))}
                                  styles={{ input: { textAlign: 'right' } }}
                                />
                              )}
                            />
                          </Grid.Col>
                          <Grid.Col span={2} ta="right">
                            <Text fw={700} size="sm" c={itemSubtotal > 0 ? 'var(--mantine-color-text)' : 'dimmed'}>{formatCurrency(itemSubtotal)}</Text>
                          </Grid.Col>
                        </Grid>
                      </Box>
                    )
                  })}
                </Stack>
              </Box>

              <Box mb="md">
                <Text size="sm" fw={500} mb="xs">Sua previsão de entrega <Text component="span" c="red">*</Text></Text>
                <Grid>
                  <Grid.Col span={8}>
                    <TextInput
                      type="date"
                      min={todayStr}
                      leftSection={<IconCalendar size={16} />}
                      {...register('deliveryDate')}
                      error={errors.deliveryDate?.message}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput
                      type="time"
                      leftSection={<IconClock size={16} />}
                      {...register('deliveryTime')}
                      error={errors.deliveryTime?.message}
                    />
                  </Grid.Col>
                </Grid>
                <Text size="xs" c="red" mt={4} fw={500}>
                  Limite exigido: {formatDateTime(request.deadline)}
                </Text>
              </Box>

              <Grid mb="xl">
                <Grid.Col span={6}>
                  <Controller
                    name="freightPrice"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        label="Frete Total (R$)"
                        placeholder="R$ 0,00"
                        value={maskCurrency(field.value || 0)}
                        onChange={(e) => field.onChange(parseCurrency(e.target.value))}
                      />
                    )}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Condições de Pagamento"
                    placeholder="Ex: PIX, Boleto 30 dias..."
                    {...register('paymentTerms')}
                  />
                </Grid.Col>
              </Grid>

              <Group justify="space-between" align="center" bg="var(--mantine-color-default-hover)" p="md" mb="xl" style={{ borderRadius: 8 }}>
                <Text size="sm" c="dimmed">Total estimado da proposta</Text>
                <Text size="xl" fw={800} c="gasbidOrange">{formatCurrency(total)}</Text>
              </Group>

              <Textarea
                label="Observações"
                placeholder="Ex: Pagamento à vista, entrega via transportadora própria..."
                minRows={3}
                mb="xl"
                {...register('observations')}
              />

              <Group justify="flex-end" gap="sm">
                <Button variant="subtle" color="gray" onClick={() => navigate(-1)}>Cancelar</Button>
                <Button type="submit" color="gasbidOrange" loading={mutation.isPending}>
                  {myProposal ? 'Atualizar proposta' : 'Enviar proposta'}
                </Button>
              </Group>
            </form>
          )}
        </Card>
      )}
    </Box>
  )
}

function CountdownBanner({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Tempo Esgotado')
        setIsExpired(true)
      } else {
        const mins = Math.floor(diff / 60000)
        const secs = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  return (
    <Card mb="xl" radius="md" p="md" style={{ 
      background: isExpired ? 'var(--mantine-color-default-hover)' : 'linear-gradient(135deg, #FF5722, #E64A19)',
      borderLeft: '4px solid #FF5722',
      color: isExpired ? 'inherit' : '#fff'
    }}>
      <Group justify="space-between" align="center">
        <Box>
          <Text size="xs" fw={600} tt="uppercase" c={isExpired ? 'dimmed' : 'rgba(255,255,255,0.8)'}>
            ⏱️ Janela de Ofertas em Tempo Real:
          </Text>
          <Text size="sm" mt={4} c={isExpired ? 'dimmed' : 'rgba(255,255,255,0.9)'}>
            {isExpired ? 'O tempo de recebimento de ofertas foi encerrado pelo sistema.' : 'Tempo restante para envio e ajuste de propostas nesta rodada:'}
          </Text>
        </Box>
        <Box px="md" py={6} bg="var(--mantine-color-default)" style={{ borderRadius: 8, border: '1px solid var(--mantine-color-default-border)' }}>
          <Text ff="monospace" fw={900} size="xl" c={isExpired ? 'red' : 'gasbidOrange'}>
            {timeLeft}
          </Text>
        </Box>
      </Group>
    </Card>
  )
}
