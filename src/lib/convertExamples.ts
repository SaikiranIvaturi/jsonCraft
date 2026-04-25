export interface ConvertExample {
  label: string;
  json?: string;
  csv?: string;
  yaml?: string;
}

export const TS_EXAMPLES: ConvertExample[] = [
  {
    label: "Users",
    json: JSON.stringify(
      [
        { id: 1, name: "Alice Chen", email: "alice@example.com", role: "admin", verified: true, address: { city: "San Francisco", country: "US" } },
        { id: 2, name: "Bob Smith", email: "bob@example.com", role: "user", verified: false, address: { city: "London", country: "GB" } },
        { id: 3, name: "Carol White", email: "carol@example.com", role: "user", verified: true, address: { city: "Tokyo", country: "JP" }, phone: "+81-3-1234-5678" },
      ],
      null,
      2,
    ),
  },
  {
    label: "Products",
    json: JSON.stringify(
      {
        store: "TechShop",
        currency: "USD",
        products: [
          { id: "p1", name: "Wireless Mouse", price: 29.99, inStock: true, tags: ["electronics", "peripherals"], specs: { weight: 95, connectivity: "Bluetooth" } },
          { id: "p2", name: "Mechanical Keyboard", price: 149.99, inStock: true, tags: ["electronics", "peripherals"], discount: 10, specs: { weight: 850, connectivity: "USB-C", switches: "Cherry MX Red" } },
          { id: "p3", name: "USB-C Hub", price: 49.99, inStock: false, tags: ["electronics", "accessories"], specs: { weight: 120, connectivity: "USB-C", ports: 7 } },
        ],
      },
      null,
      2,
    ),
  },
  {
    label: "API Config",
    json: JSON.stringify(
      {
        server: { host: "api.example.com", port: 8443, tls: true, timeout: 30000 },
        auth: { provider: "oauth2", clientId: "abc123", scopes: ["read", "write"], tokenUrl: "https://auth.example.com/token" },
        rateLimit: { requests: 1000, windowMs: 60000, strategy: "sliding" },
        features: { cache: true, logging: true, metrics: false },
      },
      null,
      2,
    ),
  },
];

export const JSONPATH_EXAMPLES: ConvertExample[] = [
  {
    label: "Bookstore",
    json: JSON.stringify(
      {
        store: {
          books: [
            { category: "fiction", author: "J.R.R. Tolkien", title: "The Lord of the Rings", price: 22.99, inStock: true },
            { category: "fiction", author: "Frank Herbert", title: "Dune", price: 14.99, inStock: true },
            { category: "non-fiction", author: "Yuval Noah Harari", title: "Sapiens", price: 18.5, inStock: false },
            { category: "non-fiction", author: "Cal Newport", title: "Deep Work", price: 16.0, inStock: true },
          ],
          bicycle: { color: "red", price: 399.99, inStock: true },
        },
      },
      null,
      2,
    ),
  },
  {
    label: "Users",
    json: JSON.stringify(
      {
        users: [
          { id: 1, name: "Alice", age: 32, role: "admin", scores: [95, 88, 92], active: true },
          { id: 2, name: "Bob", age: 27, role: "user", scores: [72, 85, 79], active: true },
          { id: 3, name: "Carol", age: 45, role: "moderator", scores: [90, 94, 88], active: false },
          { id: 4, name: "Dan", age: 29, role: "user", scores: [65, 70, 68], active: true },
        ],
      },
      null,
      2,
    ),
  },
  {
    label: "Orders",
    json: JSON.stringify(
      {
        orders: [
          { id: "ORD-001", customer: { name: "Alice", tier: "gold" }, total: 249.99, status: "shipped", items: [{ sku: "KB-01", qty: 1 }, { sku: "MS-05", qty: 2 }] },
          { id: "ORD-002", customer: { name: "Bob", tier: "silver" }, total: 49.99, status: "pending", items: [{ sku: "CB-03", qty: 1 }] },
          { id: "ORD-003", customer: { name: "Carol", tier: "gold" }, total: 899.0, status: "delivered", items: [{ sku: "MN-02", qty: 1 }, { sku: "KB-01", qty: 2 }] },
        ],
      },
      null,
      2,
    ),
  },
];

export const JSONPATH_QUERY_EXAMPLES: { label: string; query: string }[] = [
  { label: "All titles", query: "$.store.books[*].title" },
  { label: "Price > 15", query: "$.store.books[?(@.price > 15)]" },
  { label: "In stock", query: "$..books[?(@.inStock == true)].title" },
  { label: "All prices", query: "$..price" },
  { label: "First book", query: "$.store.books[0]" },
  { label: "Deep wildcard", query: "$..*" },
];

export const CSV_JSON_EXAMPLES: ConvertExample[] = [
  {
    label: "Employees",
    json: JSON.stringify(
      [
        { id: 1, name: "Alice Chen", department: "Engineering", role: "Senior Engineer", salary: 135000, startDate: "2020-03-15", remote: true },
        { id: 2, name: "Bob Smith", department: "Marketing", role: "Growth Manager", salary: 95000, startDate: "2021-07-01", remote: false },
        { id: 3, name: "Carol White", department: "Engineering", role: "Lead Architect", salary: 160000, startDate: "2019-01-20", remote: true },
        { id: 4, name: "Dan Lee", department: "Design", role: "UX Designer", salary: 110000, startDate: "2022-04-11", remote: true },
        { id: 5, name: "Eva Rossi", department: "Engineering", role: "DevOps Engineer", salary: 125000, startDate: "2020-09-05", remote: false },
      ],
      null,
      2,
    ),
  },
  {
    label: "Sales",
    json: JSON.stringify(
      [
        { date: "2024-01-15", product: "Widget Pro", region: "North America", units: 142, revenue: 28400.0, cost: 17040.0 },
        { date: "2024-01-15", product: "Gadget Plus", region: "Europe", units: 89, revenue: 13350.0, cost: 7120.0 },
        { date: "2024-01-22", product: "Widget Pro", region: "Asia Pacific", units: 205, revenue: 41000.0, cost: 24600.0 },
        { date: "2024-01-22", product: "Starter Kit", region: "North America", units: 310, revenue: 15500.0, cost: 9300.0 },
        { date: "2024-01-29", product: "Gadget Plus", region: "North America", units: 178, revenue: 26700.0, cost: 14240.0 },
      ],
      null,
      2,
    ),
  },
  {
    label: "Inventory",
    json: JSON.stringify(
      [
        { sku: "KB-MX-BLK", name: "Mechanical Keyboard Black", category: "Peripherals", stock: 45, reorderLevel: 10, supplier: "TechCo", unitCost: 72.5 },
        { sku: "MS-WL-SLV", name: "Wireless Mouse Silver", category: "Peripherals", stock: 8, reorderLevel: 15, supplier: "TechCo", unitCost: 18.0 },
        { sku: "MN-4K-27", name: '27" 4K Monitor', category: "Displays", stock: 12, reorderLevel: 5, supplier: "DisplayCorp", unitCost: 320.0 },
        { sku: "HB-USB-7P", name: "7-Port USB Hub", category: "Accessories", stock: 0, reorderLevel: 20, supplier: "ConnectPro", unitCost: 22.0 },
      ],
      null,
      2,
    ),
  },
];

export const CSV_CSV_EXAMPLES: ConvertExample[] = [
  {
    label: "Simple CSV",
    csv: `name,age,city,active
Alice Chen,32,San Francisco,true
Bob Smith,27,London,true
Carol White,45,Tokyo,false
Dan Lee,29,New York,true`,
  },
  {
    label: "Quoted fields",
    csv: `id,title,description,price
1,"Wireless Mouse","Ergonomic, rechargeable mouse",29.99
2,"USB-C Hub","7-port hub, supports 4K",49.99
3,"Keyboard","Mechanical, RGB backlit",149.99`,
  },
];

export const YAML_JSON_EXAMPLES: ConvertExample[] = [
  {
    label: "Docker Compose",
    json: JSON.stringify(
      {
        version: "3.9",
        services: {
          api: { image: "node:20-alpine", ports: ["3000:3000"], environment: { NODE_ENV: "production", DATABASE_URL: "postgres://db:5432/app" }, depends_on: ["db"], restart: "unless-stopped" },
          db: { image: "postgres:16", environment: { POSTGRES_DB: "app", POSTGRES_USER: "admin", POSTGRES_PASSWORD: "secret" }, volumes: ["pgdata:/var/lib/postgresql/data"] },
          redis: { image: "redis:7-alpine", ports: ["6379:6379"] },
        },
        volumes: { pgdata: {} },
      },
      null,
      2,
    ),
  },
  {
    label: "App Config",
    json: JSON.stringify(
      {
        app: { name: "JSONCraft API", version: "1.1.0", environment: "production" },
        server: { host: "0.0.0.0", port: 8080, cors: { origins: ["https://jsoncraft.in"], methods: ["GET", "POST"] } },
        database: { host: "localhost", port: 5432, name: "jsoncraft", pool: { min: 2, max: 10 } },
        logging: { level: "info", format: "json", destinations: ["stdout", "file"] },
      },
      null,
      2,
    ),
  },
  {
    label: "GitHub Actions",
    json: JSON.stringify(
      {
        name: "CI",
        on: { push: { branches: ["main"] }, pull_request: { branches: ["main"] } },
        jobs: {
          build: {
            "runs-on": "ubuntu-latest",
            steps: [
              { uses: "actions/checkout@v4" },
              { name: "Setup Node", uses: "actions/setup-node@v4", with: { "node-version": "20" } },
              { name: "Install", run: "npm ci" },
              { name: "Build", run: "npm run build" },
              { name: "Test", run: "npm test" },
            ],
          },
        },
      },
      null,
      2,
    ),
  },
];

export const YAML_YAML_EXAMPLES: ConvertExample[] = [
  {
    label: "Kubernetes",
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: jsoncraft-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: jsoncraft-api
  template:
    metadata:
      labels:
        app: jsoncraft-api
    spec:
      containers:
        - name: api
          image: jsoncraft/api:1.1.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: 128Mi
              cpu: 100m
            limits:
              memory: 512Mi
              cpu: 500m`,
  },
  {
    label: "ESLint Config",
    yaml: `root: true
env:
  browser: true
  es2022: true
  node: true
parser: "@typescript-eslint/parser"
parserOptions:
  ecmaVersion: latest
  sourceType: module
plugins:
  - "@typescript-eslint"
  - react-hooks
extends:
  - eslint:recommended
  - plugin:@typescript-eslint/recommended
rules:
  no-console: warn
  prefer-const: error
  "@typescript-eslint/no-unused-vars":
    - error
    - argsIgnorePattern: "^_"`,
  },
];

export const SCHEMA_EXAMPLES: ConvertExample[] = [
  {
    label: "User Profile",
    json: JSON.stringify(
      {
        id: "usr_01HX3K",
        username: "alice_dev",
        email: "alice@example.com",
        age: 32,
        verified: true,
        createdAt: "2024-01-15T10:30:00Z",
        address: { street: "123 Main St", city: "San Francisco", state: "CA", country: "US", zip: "94105" },
        preferences: { theme: "dark", language: "en", notifications: true },
        tags: ["developer", "admin"],
      },
      null,
      2,
    ),
  },
  {
    label: "API Response",
    json: JSON.stringify(
      {
        success: true,
        data: {
          items: [
            { id: 1, title: "Item One", price: 19.99, available: true },
            { id: 2, title: "Item Two", price: 34.5, available: false },
          ],
          pagination: { page: 1, perPage: 20, total: 2, totalPages: 1 },
        },
        meta: { requestId: "req_abc123", durationMs: 42, version: "v2" },
      },
      null,
      2,
    ),
  },
  {
    label: "E-commerce Order",
    json: JSON.stringify(
      {
        orderId: "ORD-2024-00142",
        status: "shipped",
        customer: { id: 42, name: "Bob Smith", email: "bob@example.com" },
        items: [
          { sku: "KB-MX-01", name: "Mechanical Keyboard", qty: 1, unitPrice: 149.99 },
          { sku: "MS-WL-05", name: "Wireless Mouse", qty: 2, unitPrice: 29.99 },
        ],
        shipping: { method: "express", carrier: "FedEx", trackingId: "FX123456789", estimatedDelivery: "2024-02-01" },
        totals: { subtotal: 209.97, tax: 18.9, shipping: 9.99, total: 238.86 },
      },
      null,
      2,
    ),
  },
];
