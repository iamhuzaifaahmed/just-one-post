<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Techlo Post') }}</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">

        {{-- Set the theme before first paint so there is no light/dark flash. Saved choice, else the system setting. --}}
        <script>
            (function () {
                try {
                    var saved = localStorage.getItem('theme');
                    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.toggle('dark', dark);
                } catch (e) {}
            })();
        </script>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700|hind-siliguri:400,500,600,700|jetbrains-mono:500&display=swap" rel="stylesheet" />

        <!-- Scripts (all pages are bundled into app.jsx, so moving between pages never downloads anything) -->
        @routes
        @viteReactRefresh
        @vite('resources/js/app.jsx')
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
