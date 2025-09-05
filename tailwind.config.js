/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Colors - Regimark Red
        'primary': '#DC2626',
        'primary-foreground': '#FFFFFF',
        
        // Secondary Colors
        'secondary': '#1F2937',
        'secondary-foreground': '#FFFFFF',
        
        // Accent Colors
        'accent': '#DC2626',
        'accent-foreground': '#FFFFFF',
        
        // Background Colors
        'background': '#F9FAFB',
        'surface': '#FFFFFF',
        
        // Text Colors
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        
        // Status Colors
        'success': '#10B981',
        'success-foreground': '#FFFFFF',
        
        'warning': '#F59E0B',
        'warning-foreground': '#FFFFFF',
        
        'error': '#EF4444',
        'error-foreground': '#FFFFFF',
        
        // Border Colors
        'border': '#E5E7EB',
        'border-dark': 'rgba(75, 85, 99, 0.3)',
        
        // Regimark brand colors
        'regimark-red': '#DC2626',
        'regimark-black': '#111827',
        'regimark-gray': '#6B7280',
      },
      fontFamily: {
        'heading': ['Inter', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'caption': ['Inter', 'sans-serif'],
        'data': ['JetBrains Mono', 'monospace'],
      },
      fontWeight: {
        'heading-normal': '400',
        'heading-medium': '500',
        'heading-semibold': '600',
        'body-normal': '400',
        'body-medium': '500',
        'caption-normal': '400',
        'data-normal': '400',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'modal': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'elegant': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'dramatic': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'epic': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 0 3px rgba(220, 38, 38, 0.1)',
        'glow-lg': '0 0 0 5px rgba(220, 38, 38, 0.15)',
      },
      transitionTimingFunction: {
        'workshop': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      animation: {
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      spacing: {
        'nav': '64px',
      },
      zIndex: {
        'nav': '1000',
        'dropdown': '1100',
        'modal': '1200',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}