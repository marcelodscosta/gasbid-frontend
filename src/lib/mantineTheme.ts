import { createTheme, type MantineColorsTuple } from '@mantine/core'

// GasBid orange: #f97316 — 10-shade tuple
const gasbidOrange: MantineColorsTuple = [
  '#fff3ea',
  '#ffe5ce',
  '#ffc89a',
  '#ffa962',
  '#f98e32',
  '#f97316', // [5] — primary
  '#ea6c0a',
  '#d45c00',
  '#b84f00',
  '#9a4100',
]

export const mantineTheme = createTheme({
  primaryColor: 'gasbidOrange',
  primaryShade: 5,
  colors: { gasbidOrange },

  fontFamily: 'Inter, -apple-system, sans-serif',
  headings: { fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: '700' },
  defaultRadius: 'md',
  cursorType: 'pointer',
  shadows: {
    xs: '0 1px 2px rgba(16, 24, 40, 0.05)',
    sm: '0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)',
    md: '0 4px 12px rgba(16, 24, 40, 0.08)',
    lg: '0 12px 28px rgba(16, 24, 40, 0.12)',
  },

  components: {
    Card: {
      defaultProps: { shadow: 'xs', radius: 'lg' },
      styles: { root: { transition: 'box-shadow .18s ease, transform .18s ease, border-color .18s ease' } },
    },
    Paper: { defaultProps: { radius: 'lg' } },
    TextInput: { defaultProps: { radius: 'md' } },
    Select: { defaultProps: { radius: 'md' } },
    Textarea: { defaultProps: { radius: 'md' } },
    NumberInput: { defaultProps: { radius: 'md' } },
    Modal: { defaultProps: { radius: 'lg', centered: true, overlayProps: { blur: 3, backgroundOpacity: 0.45 } } },
    Tabs: { styles: { tab: { fontWeight: 600 } } },
    Button: {
      defaultProps: { color: 'gasbidOrange', radius: 'md' },
      styles: { root: { fontWeight: 600, transition: 'transform .12s ease, box-shadow .18s ease' } },
    },
    Badge: {
      defaultProps: { variant: 'light', radius: 'xl' },
    },
    Table: {
      defaultProps: {
        highlightOnHover: true,
        withTableBorder: false,
        withColumnBorders: false,
        horizontalSpacing: 'lg',
        verticalSpacing: 'sm',
      },
    },
  },
})
