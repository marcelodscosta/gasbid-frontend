import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Card, Group, Rating, Stack, Text, Textarea, Title, Button } from '@mantine/core'
import { IconAlertCircle, IconStarFilled } from '@tabler/icons-react'
import { ordersApi } from '../../api'

interface Props {
  orderId: string
  supplierName?: string
  rating?: { stars: number; comment?: string | null } | null
}

/** Avaliação do fornecedor pelo comprador após a entrega. */
export function OrderRating({ orderId, supplierName, rating }: Props) {
  const queryClient = useQueryClient()
  const [stars, setStars] = useState(rating?.stars ?? 0)
  const [comment, setComment] = useState(rating?.comment ?? '')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(!rating)

  const mutation = useMutation({
    mutationFn: () => ordersApi.rate(orderId, stars, comment.trim() || undefined),
    onSuccess: () => {
      setEditing(false)
      setError('')
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Erro ao enviar avaliação'),
  })

  if (!editing && rating) {
    return (
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="xs">
          <Title order={4} size="h5">Sua avaliação</Title>
          <Button variant="subtle" size="xs" onClick={() => setEditing(true)}>Editar</Button>
        </Group>
        <Rating value={rating.stars} readOnly />
        {rating.comment && <Text size="sm" c="dimmed" mt="xs">“{rating.comment}”</Text>}
      </Card>
    )
  }

  return (
    <Card withBorder radius="md" p="md">
      <Group gap="xs" mb="xs">
        <IconStarFilled size={18} color="var(--mantine-color-yellow-5)" />
        <Title order={4} size="h5">Avalie {supplierName ?? 'o fornecedor'}</Title>
      </Group>
      <Text size="sm" c="dimmed" mb="sm">Sua nota ajuda outros compradores a escolher melhor.</Text>
      <Stack gap="sm">
        {error && <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>{error}</Alert>}
        <Rating value={stars} onChange={setStars} size="xl" />
        <Textarea
          placeholder="Conte como foi a entrega (opcional)"
          minRows={2}
          maxLength={300}
          value={comment}
          onChange={e => setComment(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          {rating && <Button variant="default" onClick={() => setEditing(false)}>Cancelar</Button>}
          <Button loading={mutation.isPending} disabled={stars < 1} onClick={() => mutation.mutate()}>
            Enviar avaliação
          </Button>
        </Group>
      </Stack>
    </Card>
  )
}
