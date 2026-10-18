import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../../lib/axios'
import { IconAlertCircle, IconCheck, IconSun, IconMoon } from '@tabler/icons-react'
import {
  Box, Title, Text, Button, Paper, TextInput, PasswordInput, Select,
  Alert, Stack, Group, Anchor, ActionIcon, useMantineColorScheme, useComputedColorScheme, Divider, Grid
} from '@mantine/core'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['BUYER', 'SUPPLIER']),
  company: z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos'),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
  }),
})
type Form = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'BUYER' },
  })

  // Theme toggle
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const toggleTheme = () => setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')

  async function onSubmit(data: Form) {
    setError('')
    try {
      await api.post('/auth/register', data)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao cadastrar')
    }
  }

  if (success) {
    return (
      <Box 
        style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'var(--mantine-color-body)'
        }}
      >
        <Paper withBorder shadow="md" p="xl" radius="md" w="100%" maw={420} bg="var(--mantine-color-default)" ta="center">
          <IconCheck size={56} color="var(--mantine-color-teal-6)" style={{ margin: '0 auto 16px' }} />
          <Title order={2}>Conta criada!</Title>
          <Text mt="xs" c="dimmed">Redirecionando para o login...</Text>
        </Paper>
      </Box>
    )
  }

  return (
    <Box 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px 20px',
        backgroundColor: 'var(--mantine-color-body)'
      }}
    >
      <Box pos="absolute" top={20} right={20}>
        <ActionIcon variant="subtle" color="gray" size="xl" radius="md" onClick={toggleTheme} aria-label="Alternar tema">
          {computedColorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>
      </Box>

      <Paper withBorder shadow="md" p="xl" radius="md" w="100%" maw={520} bg="var(--mantine-color-default)">
        <Group justify="center" mb="md">
          <img src="/logo.png" alt="GasBid" width={42} height={42} style={{ borderRadius: 10, display: 'block' }} />
        </Group>
        
        <Box ta="center" mb="xl">
          <Title order={2} size="h3" fw={800} style={{ letterSpacing: '-0.03em' }}>
            Gas<Text component="span" c="gasbidOrange">Bid</Text>
          </Title>
        </Box>

        <Title order={3} size="h5" ta="center" mb={4}>Criar conta</Title>
        <Text c="dimmed" size="sm" ta="center" mb="xl">Comece a usar a plataforma GasBid</Text>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red" variant="light" mb="md">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <Select
              label="Tipo de conta"
              name={register('role').name}
              onBlur={register('role').onBlur}
              ref={register('role').ref}
              onChange={(val) => register('role').onChange({ target: { name: 'role', value: val } })}
              data={[
                { value: 'BUYER', label: 'Comprador (restaurante, bar, comércio…)' },
                { value: 'SUPPLIER', label: 'Revendedor / Distribuidor' },
              ]}
              defaultValue="BUYER"
              allowDeselect={false}
            />

            <Divider my="xs" />
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts="0.06em">Dados pessoais</Text>

            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Nome"
                  placeholder="Seu nome"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </Grid.Col>
            </Grid>

            <PasswordInput
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              {...register('password')}
              error={errors.password?.message}
            />

            <Divider my="xs" />
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts="0.06em">Empresa</Text>

            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Razão social"
                  placeholder="Nome da empresa"
                  {...register('company.name')}
                  error={errors.company?.name?.message}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="CNPJ (14 dígitos)"
                  placeholder="00000000000000"
                  maxLength={14}
                  {...register('company.cnpj')}
                  error={errors.company?.cnpj?.message}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Telefone"
                  placeholder="(11) 99999-0000"
                  {...register('company.phone')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Email empresa"
                  type="email"
                  placeholder="contato@empresa.com"
                  {...register('company.email')}
                />
              </Grid.Col>
            </Grid>

            <Button type="submit" color="gasbidOrange" fullWidth mt="md" loading={isSubmitting}>
              Criar conta
            </Button>
          </Stack>
        </form>

        <Divider my="lg" />
        
        <Text ta="center" size="sm">
          Já tem conta? <Anchor component={Link} to="/login" c="gasbidOrange" fw={600}>Entrar</Anchor>
        </Text>
      </Paper>
    </Box>
  )
}
