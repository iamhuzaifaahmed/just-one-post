import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Techlo Post';

// Every page is bundled into the main file (eager), so going from one page to another never has to
// download a JavaScript chunk. Together with link prefetching this makes navigation feel instant.
const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const page = pages[`./Pages/${name}.jsx`];
        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }
        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    // No top loading bar: pages swap in place.
    progress: false,
});

// Prefetched pages are served from memory. After anything is changed (a POST/PUT/PATCH/DELETE)
// forget them, so a list never shows stale data.
let lastMethod = 'get';
router.on('start', (event) => {
    lastMethod = event.detail.visit.method;
});
router.on('success', () => {
    if (lastMethod !== 'get') {
        router.flushAll();
    }
});
