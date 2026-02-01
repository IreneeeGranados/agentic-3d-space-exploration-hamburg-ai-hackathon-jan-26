import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    base: '/agentic-3d-space-exploration-hamburg-ai-hackathon-jan-26/',
    define: {
        // Provide fallback values for environment variables
        'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE'),
        'import.meta.env.VITE_ELEVENLABS_API_KEY': JSON.stringify(process.env.VITE_ELEVENLABS_API_KEY || 'YOUR_ELEVENLABS_API_KEY_HERE'),
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    // Copy only cluster files under 25MB (Cloudflare Pages limit)
                    // Excluded: far_quad1 (42MB), veryfar_quad1 (50MB), medium_quad1 (22MB), no_position (21MB)
                    src: [
                        'nasa_data/clusters/cluster_index.json',
                        'nasa_data/clusters/solar_system.json',
                        'nasa_data/clusters/nearby_quad*.json',
                        'nasa_data/clusters/medium_quad2.json',
                        'nasa_data/clusters/medium_quad3.json',
                        'nasa_data/clusters/medium_quad4.json',
                        'nasa_data/clusters/far_quad2.json',
                        'nasa_data/clusters/far_quad3.json',
                        'nasa_data/clusters/far_quad4.json',
                        'nasa_data/clusters/veryfar_quad2.json',
                        'nasa_data/clusters/veryfar_quad3.json',
                        'nasa_data/clusters/veryfar_quad4.json',
                    ],
                    dest: 'nasa_data/clusters'
                },
                {
                    src: 'assets',
                    dest: '.'
                }
            ]
        })
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            // Mark Node.js-only dependencies as external
            // They will not be bundled, and dynamic imports will fail gracefully
            external: ['openai', 'dotenv', 'socket.io-client', 'socket.io', 'express']
        }
    },
    optimizeDeps: {
        // Exclude these from pre-bundling
        exclude: ['openai', 'dotenv', 'socket.io-client', 'socket.io', 'express']
    }
});

