import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  SimpleGrid,
  Paper,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Card,
  Badge,
  Button,
  NumberInput,
  Alert,
  Box,
  Anchor,
  Divider,
  UnstyledButton,
} from '@mantine/core'
import {
  IconUsers,
  IconShoppingCart,
  IconPackage,
  IconTrendingUp,
  IconCurrencyDollar,
  IconFlame,
  IconChevronRight,
  IconClock,
  IconAlertCircle,
  IconCircleCheck,
} from '@tabler/icons-react'
import { adminApi } from '../../api'
import {
  formatCurrency,
  requestStatusBadge,
  requestStatusLabel,
  orderStatusBadge,
  orderStatusLabel,
} from '../../lib/utils'

const badgeColorMap: Record<string, string> = {
  'badge-green': 'green',
  'badge-yellow': 'yellow',
  'badge-red': 'red',
  'badge-blue': 'blue',
  'badge-orange': 'orange',
  'badge-gray': 'gray',
}

function mantineBadgeColor(cls: string): string {
  return badgeColorMap[cls] ?? 'gray'
}

export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: adminApi.metrics,
  })

  const kpis = data?.kpis

  const kpiItems = [
    { icon: IconUsers, value: kpis?.totalUsers ?? 0, label: 'Usuários cadastrados', color: 'gasbidOrange' },
    { icon: IconPackage, value: kpis?.totalCompanies ?? 0, label: 'Empresas', color: 'blue' },
    { icon: IconShoppingCart, value: kpis?.totalRequests ?? 0, label: 'Solicitações', color: 'yellow' },
    { icon: IconFlame, value: kpis?.openRequests ?? 0, label: 'Solicitações abertas', color: 'orange' },
    { icon: IconTrendingUp, value: kpis?.totalOrders ?? 0, label: 'Pedidos gerados', color: 'green' },
    { icon: IconCurrencyDollar, value: formatCurrency(kpis?.totalRevenue ?? 0), label: 'Volume entregue', color: 'green' },
  ]

  return (
    <Stack gap="xl">
      {/* Page Header */}
      <Box>
        <Title order={2} fw={700} style={{ letterSpacing: '-0.02em' }}>
          Painel administrativo
        </Title>
        <Text size="sm" c="dimmed" mt={2}>
          Visão geral da plataforma GasBid
        </Text>
      </Box>

      {/* KPI Grid */}
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
        {kpiItems.map((kpi, i) => (
          <Paper key={i} p="lg" radius="md" withBorder style={{ position: 'relative', overflow: 'hidden' }}>
            <Stack gap={12}>
              <ThemeIcon
                size={36}
                radius="md"
                color={kpi.color === 'gasbidOrange' ? 'gasbidOrange' : kpi.color}
                variant="light"
              >
                <kpi.icon size={18} stroke={1.8} />
              </ThemeIcon>
              <Box>
                <Text
                  fw={800}
                  size={typeof kpi.value === 'string' ? 'lg' : 'xl'}
                  style={{ letterSpacing: '-0.03em', lineHeight: 1 }}
                  lh={1}
                >
                  {isLoading ? '—' : kpi.value}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>{kpi.label}</Text>
              </Box>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Recent Requests + Recent Orders */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Recent Requests */}
        <Card radius="md" p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={600} size="sm">Solicitações recentes</Text>
            <Anchor component={Link} to="/admin/requests" size="xs" c="gasbidOrange">
              Ver todas
            </Anchor>
          </Group>
          <Stack gap={6}>
            {(data?.recentRequests ?? []).length === 0 && !isLoading && (
              <Text size="sm" c="dimmed" ta="center" py="md">Nenhuma solicitação recente</Text>
            )}
            {(data?.recentRequests ?? []).map((r: any) => (
              <Group
                key={r.id}
                justify="space-between"
                p="xs"
                style={{ borderRadius: 7, background: 'var(--mantine-color-body)' }}
              >
                <Box>
                  <Text size="sm" fw={500} lineClamp={1}>
                    {r.items?.[0]?.product?.name ?? 'Solicitação'}
                    {r.items && r.items.length > 1 ? ` (+${r.items.length - 1} itens)` : ''}
                    {' · '}
                    {r.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) ?? 0} un.
                  </Text>
                  <Text size="xs" c="dimmed">
                    {r.buyerCompany?.name} · {r._count?.proposals ?? 0} propostas
                  </Text>
                </Box>
                <Badge color={mantineBadgeColor(requestStatusBadge(r.status))} size="sm">
                  {requestStatusLabel(r.status)}
                </Badge>
              </Group>
            ))}
          </Stack>
        </Card>

        {/* Recent Orders */}
        <Card radius="md" p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={600} size="sm">Pedidos recentes</Text>
            <Anchor component={Link} to="/admin/requests" size="xs" c="gasbidOrange">
              Ver todos
            </Anchor>
          </Group>
          <Stack gap={6}>
            {(data?.recentOrders ?? []).length === 0 && !isLoading && (
              <Text size="sm" c="dimmed" ta="center" py="md">Nenhum pedido recente</Text>
            )}
            {(data?.recentOrders ?? []).map((o: any) => (
              <Group
                key={o.id}
                justify="space-between"
                p="xs"
                style={{ borderRadius: 7, background: 'var(--mantine-color-body)' }}
              >
                <Box>
                  <Text size="sm" fw={500} lineClamp={1}>
                    {o.buyerRequest?.items?.[0]?.product?.name ?? 'Pedido'}
                    {o.buyerRequest?.items && o.buyerRequest.items.length > 1
                      ? ` (+${o.buyerRequest.items.length - 1} itens)`
                      : ''}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {o.buyerCompany?.name} → {o.supplierCompany?.name} · {formatCurrency(o.totalPrice)}
                  </Text>
                </Box>
                <Badge color={mantineBadgeColor(orderStatusBadge(o.status))} size="sm">
                  {orderStatusLabel(o.status)}
                </Badge>
              </Group>
            ))}
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Settings Section */}
      <AdminSettingsSection />

      {/* Quick Links */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {[
          { to: '/admin/users', label: 'Gerenciar usuários', sub: 'Ver e moderar contas', icon: IconUsers },
          { to: '/admin/requests', label: 'Moderar solicitações', sub: 'Todas as solicitações', icon: IconShoppingCart },
          { to: '/admin/requests', label: 'Todos os pedidos', sub: 'Acompanhamento geral', icon: IconPackage },
        ].map((item) => (
          <UnstyledButton key={item.to + item.label} component={Link} to={item.to}>
            <Card
              radius="md"
              p="md"
              withBorder
              style={{ cursor: 'pointer', transition: 'border-color 0.18s ease' }}
            >
              <Group align="center" gap={14}>
                <ThemeIcon size={44} radius={10} color="gasbidOrange" variant="light">
                  <item.icon size={22} stroke={1.6} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={600} size="sm">{item.label}</Text>
                  <Text size="xs" c="dimmed">{item.sub}</Text>
                </Box>
                <IconChevronRight size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
              </Group>
            </Card>
          </UnstyledButton>
        ))}
      </SimpleGrid>
    </Stack>
  )
}

function AdminSettingsSection() {
  const [minutes, setMinutes] = useState<number>(5)
  const [isSaving, setIsSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await adminApi.getSettings()
      setMinutes(res.proposalWindowMinutes)
      return res
    },
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await adminApi.updateSettings(minutes)
      setMsg('Janela de ofertas atualizada com sucesso!')
      setTimeout(() => setMsg(''), 3000)
    } catch {
      setMsg('Erro ao salvar configuração.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card
      radius="md"
      p="lg"
      withBorder
      style={{ borderLeft: '4px solid #f97316' }}
    >
      <Group justify="space-between" mb="md">
        <Group gap={8}>
          <ThemeIcon size={28} radius="md" color="gasbidOrange" variant="light">
            <IconClock size={15} stroke={1.8} />
          </ThemeIcon>
          <Text fw={600} size="sm">Janela de Ofertas em Tempo Real</Text>
        </Group>
        <Badge color="orange" size="sm">Configuração Global</Badge>
      </Group>

      <Divider mb="md" />

      <form onSubmit={handleSave}>
        <Group align="flex-end" gap="md">
          <Box style={{ flex: 1, maxWidth: 340 }}>
            <Text size="xs" fw={600} c="dimmed" mb={6}>
              Duração da Janela para Recebimento de Propostas (em minutos):
            </Text>
            <NumberInput
              min={1}
              max={120}
              value={minutes}
              onChange={(val) => setMinutes(Number(val))}
            />
            <Text size="xs" c="dimmed" mt={4}>
              Tempo estipulado para que os revendedores enviem lances após a criação de um pedido (Padrão: 5 minutos).
            </Text>
          </Box>
          <Button type="submit" loading={isSaving} radius="md">
            Salvar Alteração
          </Button>
        </Group>
      </form>

      {msg && (
        <Alert
          mt="md"
          color={msg.startsWith('Erro') ? 'red' : 'green'}
          variant="light"
          radius="md"
          icon={msg.startsWith('Erro') ? <IconAlertCircle size={16} /> : <IconCircleCheck size={16} />}
        >
          {msg}
        </Alert>
      )}
    </Card>
  )
}
