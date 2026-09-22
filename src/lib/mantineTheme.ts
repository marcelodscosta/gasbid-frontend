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
  defaultRadius: 'md',
  cursorType: 'pointer',

  components: {
    Button: {
      defaultProps: { color: 'gasbidOrange' },
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
