export const EXAMPLES: Record<string, { label: string; json: string }> = {
  api: {
    label: 'API Response',
    json: JSON.stringify(
      {
        status: 'success',
        data: {
          user: {
            id: 'usr_01HQ8Z9XVKY4BFRP8GE3',
            name: 'Alex Rivera',
            email: 'alex@example.com',
            role: 'admin',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
            createdAt: '2024-01-15T09:23:11Z',
            preferences: {
              theme: 'dark',
              notifications: true,
              language: 'en-US',
            },
          },
          session: {
            token: 'eyJhbGciOiJIUzI1NiJ9.example',
            expiresAt: '2024-12-31T23:59:59Z',
          },
        },
        meta: {
          requestId: 'req_abc123',
          duration: 42,
          version: '2.1.0',
        },
      },
      null,
      2
    ),
  },
  config: {
    label: 'Config File',
    json: JSON.stringify(
      {
        app: {
          name: 'my-service',
          port: 3000,
          env: 'production',
          debug: false,
        },
        database: {
          host: 'db.internal',
          port: 5432,
          name: 'app_db',
          pool: { min: 2, max: 10, idle: 30000 },
          ssl: true,
        },
        cache: {
          driver: 'redis',
          host: 'cache.internal',
          ttl: 3600,
        },
        features: {
          rateLimit: true,
          cors: true,
          compression: true,
          logging: { level: 'info', format: 'json' },
        },
      },
      null,
      2
    ),
  },
  geojson: {
    label: 'GeoJSON Feature',
    json: JSON.stringify(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-73.9857, 40.7484],
            },
            properties: {
              name: 'Empire State Building',
              city: 'New York',
              country: 'US',
              elevation: 443,
              opened: 1931,
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-74.0059, 40.7128],
                  [-73.9794, 40.7614],
                  [-73.949, 40.7282],
                  [-74.0059, 40.7128],
                ],
              ],
            },
            properties: {
              name: 'Manhattan Area',
              area_km2: 87.5,
            },
          },
        ],
      },
      null,
      2
    ),
  },
  packageJson: {
    label: 'package.json',
    json: JSON.stringify(
      {
        name: 'my-awesome-app',
        version: '1.0.0',
        description: 'A cool application',
        main: 'dist/index.js',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          test: 'vitest',
          lint: 'eslint . --ext ts,tsx',
        },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
        devDependencies: {
          typescript: '~5.7.0',
          vite: '^6.0.0',
          vitest: '^2.0.0',
        },
        engines: { node: '>=20.0.0' },
        license: 'MIT',
      },
      null,
      2
    ),
  },
  nested: {
    label: 'Deeply Nested',
    json: JSON.stringify(
      {
        level1: {
          level2a: {
            level3: {
              level4: {
                value: 'deep!',
                items: [1, 2, { nested: true, count: 42 }],
              },
            },
          },
          level2b: [
            { id: 1, tags: ['alpha', 'beta'], meta: { active: true } },
            { id: 2, tags: ['gamma'], meta: { active: false } },
            { id: 3, tags: [], meta: { active: true, note: 'special' } },
          ],
        },
        matrix: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        nullValue: null,
        boolValues: { yes: true, no: false },
        numbers: { int: 42, float: 3.14159, negative: -7, big: 1000000 },
      },
      null,
      2
    ),
  },
}
