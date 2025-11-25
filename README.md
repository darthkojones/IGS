# IGS - Meeting Room Booking System

> MCI Integrative Project 2025 - Intelligent Group Spaces

A comprehensive web application for managing meeting room bookings with real-time status updates, automatic room control, and full accessibility compliance.

## 🎯 Quick Links

- **[📖 Project Structure](./PROJECT_STRUCTURE.md)** - Detailed architecture documentation
- **[🚀 Quick Start Guide](./QUICK_START.md)** - Step-by-step implementation guide  
- **[📋 Setup Summary](./README_SETUP.md)** - What's been created and next steps
- **[📄 Original Requirements](./project.md)** - Project specifications

## ✨ Features

- 🏢 **Room Management** - Browse and book available meeting rooms
- 📅 **Smart Booking** - Reserve rooms with 5-minute entry confirmation
- 🎨 **Visual Status** - Color-coded room availability (🟢 Free, 🟡 Reserved, 🔴 Occupied)
- ♿ **Accessibility** - WCAG 2.1 Level AA compliant
- 📊 **Statistics** - Track usage patterns and occupancy
- 🔐 **Role-Based Access** - Student, Teacher, Staff, and Admin roles
- 📱 **Responsive Design** - Works on all devices

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Visit: http://localhost:5173

## 📁 Project Structure

```
src/
├── types/          # TypeScript definitions
├── stores/         # Pinia state management
├── services/       # API communication
├── composables/    # Reusable logic
├── components/     # UI components
├── views/          # Page components
└── router/         # Route configuration
```

## 🛠️ Tech Stack

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Pinia** for state management
- **Vue Router** for routing
- **Vite** as build tool

## 📚 Documentation

See the detailed documentation files:

- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Architecture & design decisions
- **[QUICK_START.md](./QUICK_START.md)** - Implementation guide
- **[README_SETUP.md](./README_SETUP.md)** - Setup summary

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
