import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
    },
});
//# sourceMappingURL=vitest.config.js.map