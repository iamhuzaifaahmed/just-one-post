import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

// Semantic colours come from CSS variables (see resources/css/app.css), so the light and the
// dark theme only differ in the variable values. "<alpha-value>" keeps bg-brand/10 etc. working.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',

    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', '"Hind Siliguri"', ...defaultTheme.fontFamily.sans],
                mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                canvas: token('canvas'),
                soft: token('soft'),
                panel: token('panel'),
                fg: token('fg'),
                muted: token('muted'),
                line: token('line'),
                brand: token('brand'),
                'brand-fg': token('brand-fg'),
                accent: token('accent'),
                linkedin: '#0A66C2',
                facebook: '#1877F2',
                youtube: '#FF0000',
            },
            boxShadow: {
                soft: '0 1px 2px rgb(11 18 32 / 0.04), 0 10px 30px -12px rgb(11 18 32 / 0.12)',
            },
            keyframes: {
                'slide-in': {
                    '0%': { opacity: 0, transform: 'translateY(-8px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
            },
            animation: {
                'slide-in': 'slide-in .25s ease-out',
                marquee: 'marquee 40s linear infinite',
            },
        },
    },

    plugins: [forms],
};
