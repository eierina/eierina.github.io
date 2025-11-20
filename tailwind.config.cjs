function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", "[data-theme='dark']"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    // Remove the following screen breakpoint or add other breakpoints
    // if one breakpoint is not enough for you
    screens: {
      sm: "640px",
    },
    extend: {
      textColor: {
        skin: {
          base: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
          inverted: withOpacity("--color-fill"),
          muted: withOpacity("--color-text-muted"),
        },
      },
      backgroundColor: {
        skin: {
          fill: withOpacity("--color-fill"),
          accent: withOpacity("--color-accent"),
          inverted: withOpacity("--color-text-base"),
          card: withOpacity("--color-card"),
          "card-muted": withOpacity("--color-card-muted"),
        },
      },
      outlineColor: {
        skin: {
          fill: withOpacity("--color-accent"),
        },
      },
      borderColor: {
        skin: {
          line: withOpacity("--color-border"),
          fill: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
        },
      },
      fill: {
        skin: {
          base: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
        },
        transparent: "transparent",
      },
      stroke: {
        skin: {
          accent: withOpacity("--color-accent")
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      typography: {
        DEFAULT: {
          css: {
            fontSize: '1.125rem', // 18px
            lineHeight: '1.8',
            maxWidth: '720px',
            color: 'rgb(var(--color-text-base))',
            '[class~="lead"]': {
              color: 'rgb(var(--color-text-muted))',
            },
            a: {
              color: 'rgb(var(--color-accent))',
              textDecoration: 'none',
              '&:hover': {
                color: 'rgb(var(--color-accent))',
                textDecoration: 'underline',
              },
            },
            strong: {
              color: 'rgb(var(--color-text-base))',
              fontWeight: '600',
            },
            'ol > li::marker': {
              color: 'rgb(var(--color-text-muted))',
            },
            'ul > li::marker': {
              color: 'rgb(var(--color-text-muted))',
            },
            hr: {
              borderColor: 'rgb(var(--color-border))',
            },
            blockquote: {
              color: 'rgb(var(--color-text-muted))',
              borderLeftColor: 'rgb(var(--color-accent))',
            },
            h1: {
              color: 'rgb(var(--color-text-base))',
              fontSize: '3rem', // 48px
              fontWeight: '800',
              lineHeight: '1.1',
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem', // 20px
            },
            h2: {
              color: 'rgb(var(--color-text-base))',
              fontSize: '2rem', // 32px
              fontWeight: '700',
              lineHeight: '1.2',
              letterSpacing: '-0.02em',
              marginTop: '3.5rem', // 56px
              marginBottom: '1.25rem', // 20px
            },
            h3: {
              color: 'rgb(var(--color-text-base))',
              fontSize: '1.5rem', // 24px
              fontWeight: '600',
              lineHeight: '1.3',
              marginTop: '2.5rem', // 40px
              marginBottom: '1rem', // 16px
            },
            h4: {
              color: 'rgb(var(--color-text-base))',
            },
            'figure figcaption': {
              color: 'rgb(var(--color-text-muted))',
            },
            code: {
              color: 'rgb(var(--color-text-base))',
              fontFamily: 'JetBrains Mono, monospace',
            },
            'a code': {
              color: 'rgb(var(--color-text-base))',
            },
            pre: {
              color: 'rgb(var(--color-text-base))',
              backgroundColor: 'rgb(var(--color-code-bg))',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
            },
            'pre code': {
              backgroundColor: 'transparent',
              borderWidth: '0',
              borderRadius: '0',
              padding: '0',
              fontWeight: '400',
              color: 'inherit',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'inherit',
            },
            p: {
                marginTop: '0',
                marginBottom: '1.5rem', // 24px
            },
            '--tw-prose-body': 'rgb(var(--color-text-base))',
            '--tw-prose-headings': 'rgb(var(--color-text-base))',
            '--tw-prose-links': 'rgb(var(--color-accent))',
            '--tw-prose-code': 'rgb(var(--color-text-base))',
            '--tw-prose-pre-code': 'rgb(var(--color-text-base))',
            '--tw-prose-pre-bg': 'rgb(var(--color-code-bg))',
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};