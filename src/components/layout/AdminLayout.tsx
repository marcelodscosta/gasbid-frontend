import { useState } from 'react'
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom'
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Avatar,
  Text,
  ScrollArea,
  ActionIcon,
  Indicator,
  Popover,
  Stack,
  Box,
  Divider,
  UnstyledButton,
  Tooltip,
  rem,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconLayoutDashboard,
  IconUsers,
  IconBriefcase,
  IconBell,
  IconLogout,
  IconCircleFilled,
  IconSun,
  IconMoon,
} from '@tabler/icons-react'
import { useAuth } from '../../contexts/AuthContext'
import { useWebSocket } from '../../hooks/useWebSocket'
import { soundManager } from '../../lib/sound'

const adminNav = [
  { to: '/admin', label: 'Métricas', icon: IconLayoutDashboard, end: true },
  { to: '/admin/users', label: 'Usuários', icon: IconUsers, end: false },
  { to: '/admin/requests', label: 'Solicitações', icon: IconBriefcase, end: false },
]

interface AlertPayload {
  type?: 'ORDER' | 'OPPORTUNITY' | 'PROPOSAL_RECEIVED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED'
  orderId?: string
  requestId?: string
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false)
  const [notifOpened, { toggle: toggleNotif, close: closeNotif }] = useDisclosure(false)
  const [newAlert, setNewAlert] = useState<AlertPayload | null>(null)

  // ── Color scheme toggle ──────────────────────────────────────────────────
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const toggleTheme = () =>
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')

  useWebSocket((event, payload) => {
    if (event === 'ORDER_CREATED' || event === 'NEW_OPPORTUNITY') {
      soundManager.startContinuousBeep()
      setNewAlert({
        type: event === 'ORDER_CREATED' ? 'ORDER' : 'OPPORTUNITY',
        orderId: payload?.orderId,
        requestId: payload?.requestId,
      })
    }
  })

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials =
    user?.name
      ?.split(' ')
      .slice(0, 2)
      .map((n: string) => n[0])
      .join('')
      .toUpperCase() ?? 'A'

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
        {/* ── Header ───────────────────────────────────────────────────── */}
        <AppShell.Header>
          <Group h="100%" px="lg" justify="space-between">
            {/* Left: burger + logo */}
            <Group gap="sm">
              <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="sm"
                size="sm"
              />
              <Group gap={10} visibleFrom="sm">
                <Box
                  style={{
                    width: 34, height: 34,
                    background: '#f97316',
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                    boxShadow: '0 0 16px rgba(249,115,22,0.3)',
                  }}
                >
                  🔥
                </Box>
                <Text fw={800} size="lg" style={{ letterSpacing: '-0.03em' }}>
                  Gas<Text component="span" c="gasbidOrange">Bid</Text>
                </Text>
              </Group>
            </Group>

            {/* Right: theme toggle + bell + avatar */}
            <Group gap="xs">
              {/* ── Theme toggle ── */}
              <Tooltip
                label={computedColorScheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                position="bottom"
                withArrow
              >
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  radius="md"
                  onClick={toggleTheme}
                  aria-label="Alternar tema"
                >
                  {computedColorScheme === 'dark'
                    ? <IconSun size={18} />
                    : <IconMoon size={18} />}
                </ActionIcon>
              </Tooltip>

              {/* ── Notifications bell ── */}
              <Popover
                opened={notifOpened}
                onClose={closeNotif}
                position="bottom-end"
                shadow="xl"
                width={300}
                withinPortal
              >
                <Popover.Target>
                  <Indicator color="red" size={8} disabled={!newAlert} processing>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="lg"
                      radius="md"
                      onClick={toggleNotif}
                      aria-label="Notificações"
                    >
                      <IconBell size={18} />
                    </ActionIcon>
                  </Indicator>
                </Popover.Target>
                <Popover.Dropdown p={0}>
                  <Box
                    p="sm"
                    style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
                  >
                    <Text size="sm" fw={600}>Notificações</Text>
                  </Box>
                  <Box p="md">
                    {newAlert ? (
                      <UnstyledButton
                        onClick={() => {
                          soundManager.stopBeep()
                          setNewAlert(null)
                          closeNotif()
                        }}
                        style={{ width: '100%' }}
                      >
                        <Group>
                          <IconCircleFilled size={8} color="#f97316" />
                          <Text size="sm">Novo evento recebido</Text>
                        </Group>
                      </UnstyledButton>
                    ) : (
                      <Text size="sm" c="dimmed" ta="center">
                        Nenhuma notificação pendente
                      </Text>
                    )}
                  </Box>
                </Popover.Dropdown>
              </Popover>

              {/* ── User avatar ── */}
              <Avatar
                radius="xl"
                size="sm"
                color="gasbidOrange"
                style={{ cursor: 'default', fontWeight: 700, fontSize: 13 }}
              >
                {initials}
              </Avatar>
            </Group>
          </Group>
        </AppShell.Header>

        {/* ── Navbar ───────────────────────────────────────────────────── */}
        <AppShell.Navbar p="xs">
          <AppShell.Section>
            {/* Mobile logo */}
            <Group
              px="xs" py="sm"
              hiddenFrom="sm"
              mb="xs"
              style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
            >
              <Box
                style={{
                  width: 30, height: 30,
                  background: '#f97316',
                  borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                🔥
              </Box>
              <Text fw={800} size="md" style={{ letterSpacing: '-0.03em' }}>
                Gas<Text component="span" c="gasbidOrange">Bid</Text>
              </Text>
            </Group>

            <Text
              size="xs"
              fw={600}
              tt="uppercase"
              c="dimmed"
              px="xs"
              py={6}
              style={{ letterSpacing: '0.08em', fontSize: rem(10) }}
            >
              Administração
            </Text>
          </AppShell.Section>

          <AppShell.Section grow component={ScrollArea}>
            <Stack gap={2}>
              {adminNav.map((item) => (
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
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  })}
                />
              ))}
            </Stack>
          </AppShell.Section>

          <AppShell.Section>
            <Divider my="xs" />
            <Box px="xs" pb="xs">
              <Box
                p="xs"
                mb="xs"
                style={{
                  background: 'var(--mantine-color-default)',
                  borderRadius: 8,
                }}
              >
                <Text size="xs" fw={600} truncate>{user?.name}</Text>
                <Text size="xs" c="dimmed">
                  Admin · {user?.company?.name ?? 'GasBid'}
                </Text>
              </Box>
              <NavLink
                label="Sair"
                leftSection={<IconLogout size={16} stroke={1.6} />}
                onClick={handleLogout}
                style={{
                  borderRadius: 6,
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
            </Box>
          </AppShell.Section>
        </AppShell.Navbar>

        {/* ── Main ─────────────────────────────────────────────────────── */}
        <AppShell.Main>
          <Box p="xl" style={{ minHeight: 'calc(100vh - 64px)' }}>
            {children}
          </Box>
        </AppShell.Main>
      </AppShell>

      {/* ── Full-screen Alert Modal ──────────────────────────────────── */}
      {newAlert && (
        <Box
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <Box
            style={{
              background: 'var(--mantine-color-default)',
              border: '2px solid #f97316',
              borderRadius: 16,
              maxWidth: 460, width: '100%',
              textAlign: 'center', padding: 32,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            }}
          >
            <Text size="xl" mb="md">🔥</Text>
            <Text fw={800} size="xl" mb="xs">NOVO EVENTO!</Text>
            <Text c="dimmed" size="sm" mb="xl">Um evento foi recebido na plataforma.</Text>
            <UnstyledButton
              onClick={() => { soundManager.stopBeep(); setNewAlert(null) }}
              style={{
                width: '100%', padding: '14px 20px',
                background: '#f97316', borderRadius: 8,
                color: '#fff', fontWeight: 700, fontSize: '1rem',
              }}
            >
              OK, ENTENDI
            </UnstyledButton>
          </Box>
        </Box>
      )}
    </>
  )
}
