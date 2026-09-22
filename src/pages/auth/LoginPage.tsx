import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import { IconAlertCircle, IconSun, IconMoon } from '@tabler/icons-react'
import {
  Box, Title, Text, Button, Paper, TextInput, PasswordInput,
  Alert, Stack, Group, Anchor, ActionIcon, useMantineColorScheme, useComputedColorScheme, Divider
} from '@mantine/core'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Theme toggle
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const toggleTheme = () => setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')

  async function onSubmit(data: LoginForm) {
    setError('')
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao fazer login')
    }
  }

  return (
    <Box 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'var(--mantine-color-body)'
      }}
    >
      <Box pos="absolute" top={20} right={20}>
        <ActionIcon variant="subtle" color="gray" size="xl" radius="md" onClick={toggleTheme} aria-label="Alternar tema">
          {computedColorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>
      </Box>

      <Paper withBorder shadow="md" p="xl" radius="md" w="100%" maw={420} bg="var(--mantine-color-default)">
        <Group justify="center" mb="md">
          <Box style={{ width: 42, height: 42, background: '#f97316', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 0 16px rgba(249,115,22,0.3)' }}>
            🔥
          </Box>
        </Group>
        
        <Box ta="center" mb="xl">
          <Title order={2} size="h3" fw={800} style={{ letterSpacing: '-0.03em' }}>
            Gas<Text component="span" c="gasbidOrange">Bid</Text>
          </Title>
          <Text c="dimmed" size="sm" mt={4}>Plataforma B2B de GLP</Text>
        </Box>

        <Title order={3} size="h5" ta="center" mb={4}>Entrar na plataforma</Title>
        <Text c="dimmed" size="sm" ta="center" mb="xl">Acesse sua conta para continuar</Text>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red" variant="light" mb="md">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="seu@email.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <PasswordInput
              label="Senha"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />

            <Button type="submit" color="gasbidOrange" fullWidth mt="md" loading={isSubmitting}>
              Entrar
            </Button>
          </Stack>
        </form>

        <Divider my="lg" />
        
        <Text ta="center" size="sm">
          Não tem conta?{' '}
          <Anchor component={Link} to="/register" c="gasbidOrange" fw={600}>
            Cadastre-se
          </Anchor>
        </Text>

        <Box mt="xl" p="sm" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }}>
          <Text fw={600} size="xs" mb={4}>Demo credentials</Text>
          <Text size="xs" c="dimmed">Comprador: comprador@saborecia.com.br / buyer123</Text>
          <Text size="xs" c="dimmed">Fornecedor: vendas@gasmax.com.br / supplier123</Text>
          <Text size="xs" c="dimmed">Admin: admin@gasbid.com.br / admin123</Text>
        </Box>
      </Paper>
    </Box>
  )
}
