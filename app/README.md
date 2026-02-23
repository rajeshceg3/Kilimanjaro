# Mount Kilimanjaro Experience

A serene, immersive Three.js journey through the altitude zones of Mount Kilimanjaro.

## Getting Started

1. Navigate to the app directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Tech Stack
- React + TypeScript
- Three.js + React Three Fiber
- Zustand (State Management)
- Tailwind CSS (Styling)
- Vitest + Testing Library (Unit/Integration Tests)
- Playwright (E2E Tests)

## Testing Strategy

This project employs a multi-layered testing strategy to ensure reliability and correctness.

### 1. Unit Tests
Located in `src/**/*.test.ts`.
- Focus: Pure logic, configuration, and state management.
- Tools: Vitest.
- Run: `npm test`

### 2. Integration Tests
Located in `src/**/*.test.tsx`.
- Focus: Component interactions, rendering, and state updates.
- Tools: Vitest, React Testing Library.
- Mocks: Three.js components are mocked to avoid WebGL context issues in JSDOM.
- Run: `npm test`

### 3. End-to-End (E2E) Tests
Located in `e2e/`.
- Focus: Critical user journeys, scrolling interaction, zone transitions.
- Tools: Playwright.
- Run: `npm run test:e2e`
- Note: E2E tests run against the dev server (`npm run dev`).

## CI/CD

GitHub Actions pipeline is configured in `.github/workflows/ci.yml`.
It runs:
- Linting
- Unit/Integration Tests (with coverage)
- E2E Tests

## Coverage

Run `npm run test:coverage` to generate a coverage report.
Target coverage: > 80% for logic and components.
