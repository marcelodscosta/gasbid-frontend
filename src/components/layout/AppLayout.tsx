import { useState } from 'react'
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom'
import {
  AppShell, Burger, Group, NavLink, Avatar, Text, ScrollArea, ActionIcon,
  Indicator, Popover, Stack, Box, Divider, UnstyledButton, Tooltip, rem,
  useMantineColorScheme, useComputedColorScheme
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconLayoutDashboard, IconShoppingCart, IconTrendingUp,
  IconBell, IconUser, IconLogout, IconSun, IconMoon, IconCircleFilled
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '../../contexts/AuthContext'
import { useWebSocket } from '../../hooks/useWebSocket'
import { soundManager } from '../../lib/sound'
import { opportunitiesApi, proposalsApi, buyerRequestsApi, ordersApi } from '../../api'

const buyerNav = [
  { to: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  { to: '/requests', label: 'Compras', icon: IconShoppingCart, end: false },
  { to: '/profile', label: 'Perfil', icon: IconUser, end: false },
]

const supplierNav = [
  { to: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  { to: '/sales', label: 'Vendas', icon: IconTrendingUp, end: false },
  { to: '/catalog', label: 'Catálogo', icon: IconShoppingCart, end: false },
  { to: '/profile', label: 'Perfil', icon: IconUser, end: false },
]

interface AlertPayload {
  type?: 'ORDER' | 'OPPORTUNITY' | 'PROPOSAL_RECEIVED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED'
  orderId?: string
  requestId?: string
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false)
  const [notifOpened, { toggle: toggleNotif, close: closeNotif }] = useDisclosure(false)
  
  const [newOrderAlert, setNewOrderAlert] = useState<AlertPayload | null>(null)

  // Color scheme toggle
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const toggleTheme = () => setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')

  // WebSocket
  useWebSocket((event, payload) => {
    if (user?.role === 'SUPPLIER') {
      if (event === 'ORDER_CREATED') {
        soundManager.startContinuousBeep()
        setNewOrderAlert({ type: 'ORDER', orderId: payload?.orderId })
      } else if (event === 'NEW_OPPORTUNITY') {
        soundManager.startContinuousBeep()
        setNewOrderAlert({ type: 'OPPORTUNITY', requestId: payload?.requestId })
      }
    } else if (user?.role === 'BUYER') {
      if (event === 'PROPOSAL_RECEIVED' || event === 'COUNTER_OFFER_RECEIVED') {
        soundManager.startContinuousBeep()
        setNewOrderAlert({ type: 'PROPOSAL_RECEIVED', requestId: payload?.buyerRequestId })
      } else if (event === 'ORDER_UPDATED') {
        soundManager.startContinuousBeep()
        if (payload?.status === 'IN_DELIVERY') {
          setNewOrderAlert({ type: 'ORDER_SHIPPED', orderId: payload?.orderId })
        } else if (payload?.status === 'DELIVERED') {
          setNewOrderAlert({ type: 'ORDER_DELIVERED', orderId: payload?.orderId })
        }
      }
    }
  })

  const dismissOrderAlert = () => {
    soundManager.stopBeep()
    const alertData = newOrderAlert
    setNewOrderAlert(null)
    
    if (alertData?.type === 'OPPORTUNITY') {
      const requestId = alertData.requestId
      if (requestId) navigate(`/opportunities/${requestId}`)
      else navigate('/sales?tab=opportunities')
    } else if (alertData?.type === 'PROPOSAL_RECEIVED') {
      const requestId = alertData.requestId
      if (requestId) navigate(`/requests/${requestId}`)
      else navigate('/requests')
    } else {
      const orderId = alertData?.orderId
      if (orderId) navigate(`/orders/${orderId}`)
      else navigate(user?.role === 'SUPPLIER' ? '/sales?tab=orders' : '/orders')
    }
  }

  // --- Queries for Notifications ---
  const { data: metrics } = useQuery({
    queryKey: ['supplier-metrics'],
    queryFn: () => opportunitiesApi.metrics(),
    enabled: user?.role === 'SUPPLIER',
    staleTime: 10_000,
  })

  const { data: proposals = [] } = useQuery({
    queryKey: ['my-proposals'],
    queryFn: () => proposalsApi.listMyProposals(),
    enabled: user?.role === 'SUPPLIER',
    staleTime: 10_000,
  })

  const { data: buyerRequestsResponse } = useQuery({
    queryKey: ['buyer-requests-topbar'],
    queryFn: () => buyerRequestsApi.list({ limit: 50 }),
    enabled: user?.role === 'BUYER',
    staleTime: 10_000,
  })

  const { data: buyerOrdersResponse } = useQuery({
    queryKey: ['buyer-orders-topbar'],
    queryFn: () => ordersApi.list({ limit: 50 }),
    enabled: user?.role === 'BUYER',
    staleTime: 10_000,
  })

  // --- Calc Counts ---
  const savedIgnored = localStorage.getItem('ignored_opportunities')
  const ignoredCount = savedIgnored ? JSON.parse(savedIgnored).length : 0

  const pendingProposalsCount = proposals.filter(p => ['SUBMITTED', 'UPDATED', 'COUNTER_OFFER'].includes(p.status)).length
  const counterOfferCount = proposals.filter(p => p.status === 'COUNTER_OFFER').length
  const openOpportunitiesCount = Math.max(0, (metrics?.openOpportunities ?? 0) - ignoredCount)
  const pendingOrdersCount = metrics?.pendingDeliveries ?? 0

  const buyerNewProposals = buyerRequestsResponse?.data?.filter(r => r.status === 'OPEN' && (r._count?.proposals ?? 0) > 0).length ?? 0
  const buyerPendingOrders = buyerOrdersResponse?.data?.filter(o => o.status === 'CONFIRMED' || o.status === 'IN_DELIVERY').length ?? 0

  const totalNotifications = user?.role === 'SUPPLIER'
    ? (openOpportunitiesCount + pendingProposalsCount + pendingOrdersCount)
    : (buyerNewProposals + buyerPendingOrders)

  const handleNotificationClick = (tab: string) => {
    closeNotif()
    const basePath = user?.role === 'SUPPLIER' ? '/sales' : '/requests'
    navigate(`${basePath}?tab=${tab}`)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navItems = user?.role === 'SUPPLIER' ? supplierNav : buyerNav
  const roleLabel = user?.role === 'SUPPLIER' ? 'Revendedor' : 'Comprador'

  const initials = user?.name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() ?? 'U'

  return (
    <>
      <AppShell
        layout="default"
        header={{ height: 64 }}
        navbar={{
          width: 240,
          breakpoint: 'sm',
          collapsed: { mobile: !mobileOpened },
        }}
        padding={0}
      >
        <AppShell.Header>
          <Group h="100%" px="lg" justify="space-between">
            <Group gap="sm">
              <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
              <Group gap={10} visibleFrom="sm">
                <img src="/logo.png" alt="GasBid" width={34} height={34} style={{ borderRadius: 8, display: 'block' }} />
                <Text fw={800} size="lg" style={{ letterSpacing: '-0.03em' }}>
                  Gas<Text component="span" c="gasbidOrange">Bid</Text>
                </Text>
              </Group>
            </Group>

            <Group gap="xs">
              <Tooltip label={computedColorScheme === 'dark' ? 'Modo claro' : 'Modo escuro'} position="bottom" withArrow>
                <ActionIcon variant="subtle" color="gray" size="lg" radius="md" onClick={toggleTheme}>
                  {computedColorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
                </ActionIcon>
              </Tooltip>

              <Popover opened={notifOpened} onClose={closeNotif} position="bottom-end" shadow="xl" width={320} withinPortal>
                <Popover.Target>
                  <Indicator color="red" size={16} label={totalNotifications} disabled={totalNotifications === 0} offset={4}>
                    <ActionIcon variant="subtle" color="gray" size="lg" radius="md" onClick={toggleNotif}>
                      <IconBell size={18} />
                    </ActionIcon>
                  </Indicator>
                </Popover.Target>
                <Popover.Dropdown p={0}>
                  <Box p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                    <Text size="sm" fw={600}>Notificações</Text>
                  </Box>
                  <ScrollArea style={{ maxHeight: 300 }}>
                    {totalNotifications === 0 ? (
                      <Box p="xl" ta="center">
                        <Text size="sm" c="dimmed">Nenhuma notificação pendente</Text>
                      </Box>
                    ) : (
                      <Stack gap={0}>
                        {openOpportunitiesCount > 0 && (
                          <UnstyledButton p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }} onClick={() => handleNotificationClick('opportunities')}>
                            <Group align="flex-start" wrap="nowrap">
                              <Box mt={4}><IconCircleFilled size={10} color="#f97316" /></Box>
                              <Box>
                                <Text size="sm" fw={600}>Novas Oportunidades</Text>
                                <Text size="xs" c="dimmed">{openOpportunitiesCount} solicitações aguardando cotação</Text>
                              </Box>
                            </Group>
                          </UnstyledButton>
                        )}
                        {pendingProposalsCount > 0 && (
                          <UnstyledButton p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }} onClick={() => handleNotificationClick('proposals')}>
                            <Group align="flex-start" wrap="nowrap">
                              <Box mt={4}><IconCircleFilled size={10} color={counterOfferCount > 0 ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-blue-6)'} /></Box>
                              <Box>
                                <Text size="sm" fw={600}>Propostas Ativas</Text>
                                <Text size="xs" c="dimmed">{pendingProposalsCount} em análise {counterOfferCount > 0 && `· ${counterOfferCount} contrapropostas`}</Text>
                              </Box>
                            </Group>
                          </UnstyledButton>
                        )}
                        {pendingOrdersCount > 0 && user?.role === 'SUPPLIER' && (
                          <UnstyledButton p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }} onClick={() => handleNotificationClick('orders')}>
                            <Group align="flex-start" wrap="nowrap">
                              <Box mt={4}><IconCircleFilled size={10} color="var(--mantine-color-teal-6)" /></Box>
                              <Box>
                                <Text size="sm" fw={600}>Entregas Pendentes</Text>
                                <Text size="xs" c="dimmed">{pendingOrdersCount} pedidos aguardando logística</Text>
                              </Box>
                            </Group>
                          </UnstyledButton>
                        )}
                        {buyerNewProposals > 0 && user?.role === 'BUYER' && (
                          <UnstyledButton p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }} onClick={() => handleNotificationClick('requests')}>
                            <Group align="flex-start" wrap="nowrap">
                              <Box mt={4}><IconCircleFilled size={10} color="#f97316" /></Box>
                              <Box>
                                <Text size="sm" fw={600}>Novas Propostas</Text>
                                <Text size="xs" c="dimmed">{buyerNewProposals} solicitações receberam novos lances</Text>
                              </Box>
                            </Group>
                          </UnstyledButton>
                        )}
                        {buyerPendingOrders > 0 && user?.role === 'BUYER' && (
                          <UnstyledButton p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }} onClick={() => handleNotificationClick('orders')}>
                            <Group align="flex-start" wrap="nowrap">
                              <Box mt={4}><IconCircleFilled size={10} color="var(--mantine-color-teal-6)" /></Box>
                              <Box>
                                <Text size="sm" fw={600}>Pedidos em Andamento</Text>
                                <Text size="xs" c="dimmed">{buyerPendingOrders} pedidos sendo processados ou entregues</Text>
                              </Box>
                            </Group>
                          </UnstyledButton>
                        )}
                      </Stack>
                    )}
                  </ScrollArea>
                  <Box p="xs" ta="center" style={{ background: 'var(--mantine-color-default)' }}>
                    <Text size="xs" fw={600} c="gasbidOrange" style={{ cursor: 'pointer' }} onClick={() => handleNotificationClick(user?.role === 'SUPPLIER' ? 'opportunities' : 'requests')}>
                      Ver tudo em {user?.role === 'SUPPLIER' ? 'Vendas' : 'Suprimentos'}
                    </Text>
                  </Box>
                </Popover.Dropdown>
              </Popover>

              <Avatar radius="xl" size="sm" color="gasbidOrange" style={{ cursor: 'default', fontWeight: 700, fontSize: 13 }}>
                {initials}
              </Avatar>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="xs">
          <AppShell.Section>
            <Group px="xs" py="sm" hiddenFrom="sm" mb="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
              <img src="/logo.png" alt="GasBid" width={30} height={30} style={{ borderRadius: 7, display: 'block' }} />
              <Text fw={800} size="md" style={{ letterSpacing: '-0.03em' }}>Gas<Text component="span" c="gasbidOrange">Bid</Text></Text>
            </Group>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" px="xs" py={6} style={{ letterSpacing: '0.08em', fontSize: rem(10) }}>Principal</Text>
          </AppShell.Section>

          <AppShell.Section grow component={ScrollArea}>
            <Stack gap={2}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  component={RouterNavLink}
                  to={item.to}
                  end={item.end}
                  label={item.label}
                  leftSection={<item.icon size={17} stroke={1.6} />}
                  onClick={closeMobile}
                  style={({ isActive }: { isActive: boolean }) => ({
                    borderRadius: 6,
                    color: isActive ? '#f97316' : 'var(--mantine-color-dimmed)',
                    background: isActive ? 'rgba(249,115,22,0.12)' : 'transparent',
                    fontWeight: 500, fontSize: '0.875rem'
                  })}
                />
              ))}
            </Stack>
          </AppShell.Section>

          <AppShell.Section>
            <Divider my="xs" />
            <Box px="xs" pb="xs">
              <Box p="xs" mb="xs" style={{ background: 'var(--mantine-color-default)', borderRadius: 8 }}>
                <Text size="xs" fw={600} truncate>{user?.name}</Text>
                <Text size="xs" c="dimmed">{roleLabel} · {user?.company?.name ?? 'Empresa'}</Text>
              </Box>
              <NavLink
                label="Sair"
                leftSection={<IconLogout size={16} stroke={1.6} />}
                onClick={handleLogout}
                style={{ borderRadius: 6, color: '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}
              />
            </Box>
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main>
          <Box p="xl" style={{ minHeight: 'calc(100vh - 64px)' }}>
            {children}
          </Box>
        </AppShell.Main>
      </AppShell>

      {newOrderAlert && (
        <Box style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <Box style={{
            background: 'var(--mantine-color-default)',
            border: `2px solid ${newOrderAlert.type === 'OPPORTUNITY' || newOrderAlert.type === 'PROPOSAL_RECEIVED' ? '#f97316' : '#22c55e'}`,
            borderRadius: 16, maxWidth: 460, width: '100%', textAlign: 'center', padding: 32,
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <Box style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
              background: newOrderAlert.type === 'OPPORTUNITY' || newOrderAlert.type === 'PROPOSAL_RECEIVED' ? 'rgba(249,115,22,0.1)' : 'rgba(34,197,94,0.1)',
              color: newOrderAlert.type === 'OPPORTUNITY' || newOrderAlert.type === 'PROPOSAL_RECEIVED' ? '#f97316' : '#22c55e',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36
            }}>
              {newOrderAlert.type === 'OPPORTUNITY' && '🔥'}
              {newOrderAlert.type === 'ORDER' && '🎉'}
              {newOrderAlert.type === 'PROPOSAL_RECEIVED' && '🏷️'}
              {newOrderAlert.type === 'ORDER_SHIPPED' && '🚚'}
              {newOrderAlert.type === 'ORDER_DELIVERED' && '✅'}
            </Box>
            
            <Text fw={800} size="xl" mb="sm" c="var(--mantine-color-text)">
              {newOrderAlert.type === 'OPPORTUNITY' && 'NOVA OPORTUNIDADE DE VENDA!'}
              {newOrderAlert.type === 'ORDER' && 'SUA PROPOSTA FOI ACEITA!'}
              {newOrderAlert.type === 'PROPOSAL_RECEIVED' && 'NOVA PROPOSTA RECEBIDA!'}
              {newOrderAlert.type === 'ORDER_SHIPPED' && 'SEU PEDIDO SAIU PARA ENTREGA!'}
              {newOrderAlert.type === 'ORDER_DELIVERED' && 'PEDIDO CONCLUÍDO COM SUCESSO!'}
            </Text>
            
            <Text c="dimmed" size="sm" mb="xl">
              {newOrderAlert.type === 'OPPORTUNITY' && 'Um comprador na sua região acabou de publicar uma nova cotação.'}
              {newOrderAlert.type === 'ORDER' && 'O comprador aceitou sua oferta. Um novo pedido foi gerado e aguarda despacho.'}
              {newOrderAlert.type === 'PROPOSAL_RECEIVED' && 'Uma distribuidora parceira acabou de enviar um lance/proposta para a sua solicitação.'}
              {newOrderAlert.type === 'ORDER_SHIPPED' && 'A revenda despachou seu gás e o entregador já está a caminho da sua empresa.'}
              {newOrderAlert.type === 'ORDER_DELIVERED' && 'O pedido foi marcado como entregue. Não se esqueça de avaliar a distribuidora!'}
            </Text>
            
            <UnstyledButton
              onClick={dismissOrderAlert}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: 8,
                background: newOrderAlert.type === 'OPPORTUNITY' || newOrderAlert.type === 'PROPOSAL_RECEIVED' ? '#f97316' : '#22c55e',
                color: '#fff', fontWeight: 700, fontSize: '1rem'
              }}
            >
              {newOrderAlert.type === 'OPPORTUNITY' && 'ENVIAR PROPOSTA AGORA'}
              {newOrderAlert.type === 'ORDER' && 'VER E GERENCIAR PEDIDO'}
              {newOrderAlert.type === 'PROPOSAL_RECEIVED' && 'ANALISAR PROPOSTA'}
              {newOrderAlert.type === 'ORDER_SHIPPED' && 'ACOMPANHAR ENTREGA'}
              {newOrderAlert.type === 'ORDER_DELIVERED' && 'VER PEDIDO E AVALIAR'}
            </UnstyledButton>
          </Box>
        </Box>
      )}
    </>
  )
}
