import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Avatar, Badge, Box, Card, Divider, Grid, Group, Rating, SegmentedControl, Stack, Switch, Text, Title,
  useComputedColorScheme, useMantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconBuilding, IconMapPin, IconMoon, IconSun, IconTruckDelivery } from '@tabler/icons-react'
import { authApi, trackingApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import type { User } from '../types'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>{label}</Text>
      <Text fw={500}>{value || '—'}</Text>
    </Box>
  )
}

export function ProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { setColorScheme } = useMantineColorScheme()
  const scheme = useComputedColorScheme('light')

  const { data: me } = useQuery<User>({ queryKey: ['me'], queryFn: authApi.me })
  const company = me?.company ?? user?.company
  const address = company?.addresses?.[0]
  const isSupplier = user?.role === 'SUPPLIER'

  const tracking = useMutation({
    mutationFn: (enabled: boolean) => trackingApi.setEnabled(enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
    onError: () => notifications.show({ color: 'red', title: 'Erro', message: 'Não foi possível alterar o rastreamento.' }),
  })

  const roleLabel = user?.role === 'SUPPLIER' ? 'Revendedor' : user?.role === 'ADMIN' ? 'Administrador' : 'Comprador'
  const initials = (user?.name ?? '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <Box maw={900} mx="auto">
      <Box mb="xl">
        <Title order={2} size="h3" fw={700}>Meu perfil</Title>
        <Text c="dimmed" size="sm">Dados da conta, preferências e configurações da empresa</Text>
      </Box>

      <Card withBorder radius="md" p="xl" mb="lg">
        <Group wrap="nowrap" gap="lg">
          <Avatar size={72} radius="xl" color="gasbidOrange" fw={800} fz={26}>{initials}</Avatar>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Title order={3} size="h4" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</Title>
            <Text c="dimmed" size="sm" truncate>{user?.email}</Text>
            <Group gap="xs" mt={8}>
              <Badge color="gasbidOrange">{roleLabel}</Badge>
              {isSupplier && (
                <Group gap={6}>
                  <Rating value={company?.ratingAvg ?? 0} fractions={2} readOnly size="sm" />
                  <Text size="xs" c="dimmed">
                    {company?.ratingAvg ? `${company.ratingAvg.toFixed(1)} (${company.ratingCount ?? 0})` : 'Sem avaliações'}
                  </Text>
                </Group>
              )}
            </Group>
          </Box>
        </Group>
      </Card>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="lg">
            <Card withBorder radius="md" p="xl">
              <Group gap="xs" mb="md"><IconBuilding size={18} /><Title order={4} size="h5">Empresa</Title></Group>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}><Field label="Razão social" value={company?.name} /></Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}><Field label="CNPJ" value={company?.cnpj} /></Grid.Col>
              </Grid>
              <Divider my="md" />
              <Group gap="xs" mb="xs"><IconMapPin size={16} /><Text size="sm" fw={600}>Endereço principal</Text></Group>
              <Text size="sm" c="dimmed">
                {address
                  ? `${address.street}, ${address.number} — ${address.neighborhood}, ${address.city}/${address.state}`
                  : 'Nenhum endereço principal cadastrado.'}
              </Text>
            </Card>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="lg">
            <Card withBorder radius="md" p="xl">
              <Title order={4} size="h5" mb="md">Aparência</Title>
              <SegmentedControl
                fullWidth
                value={scheme}
                onChange={v => setColorScheme(v as 'light' | 'dark')}
                data={[
                  { value: 'light', label: <Group gap={6} justify="center"><IconSun size={14} />Claro</Group> },
                  { value: 'dark', label: <Group gap={6} justify="center"><IconMoon size={14} />Escuro</Group> },
                ]}
              />
            </Card>

            {isSupplier && (
              <Card withBorder radius="md" p="xl">
                <Group gap="xs" mb="xs"><IconTruckDelivery size={18} /><Title order={4} size="h5">Rastreamento</Title></Group>
                <Text size="sm" c="dimmed" mb="md">
                  Permite que seus clientes vejam sua posição no mapa durante a entrega. O compartilhamento acontece pelo aplicativo do motorista.
                </Text>
                <Switch
                  size="md"
                  label="Permitir rastreamento ao vivo"
                  checked={!!company?.trackingEnabled}
                  disabled={tracking.isPending}
                  onChange={e => tracking.mutate(e.currentTarget.checked)}
                />
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  )
}
