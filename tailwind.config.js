import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Noto Sans Bengali', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                linkedin: '#0A66C2',
                facebook: '#1877F2',
                youtube: '#FF0000',
            },
            boxShadow: {
                soft: '0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px -8px rgb(15 23 42 / 0.08)',
            },
            keyframes: {
                'slide-in': {
                    '0%': { opacity: 0, transform: 'translateY(-8px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
            },
            animation: { 'slide-in': 'slide-in .25s ease-out' },
        },
    },

    plugins: [forms],
};
