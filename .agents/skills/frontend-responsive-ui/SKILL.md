---
name: frontend-responsive-ui
description: >-
  Use this skill when developing frontend UI components, pages, dashboard canvas, responsive layouts, and accessibility features.
---

# Frontend Architecture & Responsive UI Skill

## 1. Component Separation Pattern (Container / Presentational / Hook)

- **Hooks (`use*.ts`)**: Encapsulate TanStack Query fetching, SSE stream subscriptions, local state.
- **Presentational (`*View.tsx` or components)**: Pure visual components receiving props, fully testable in isolation.
- **Containers (`*Container.tsx` or page routes)**: Wire hooks and state to presentational components.

## 2. Responsive Design Standards
- **Mobile-First Breakpoints**: Use Tailwind CSS conventions (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`).
- **Dashboard Grid**: The dashboard grid must collapse gracefully from multi-column desktop layout (`grid-cols-12`) to stacked cards on mobile (`grid-cols-1` or `grid-cols-2`).
- **Touch Targets**: All buttons, dropdowns, and interactive widgets must have minimum 44x44px touch targets on mobile.
- **Fluid Typography and Spacing**: Use CSS clamp or Tailwind dynamic scale rather than fixed pixel dimensions.

## 3. Visual Excellence & Styling Guidelines
- **Design Tokens**: Standardized colors via Tailwind CSS variables (HSL tailored palettes). Avoid arbitrary hex codes in JSX (`#ff0000`).
- **Dark Mode**: Native support via CSS classes (`dark:` modifier) with smooth transition tokens.
- **Data Visualizations**: Wrap Apache ECharts inside responsive ResizeObserver containers. Never hardcode pixel widths on charts.
- **Micro-Animations**: Use Framer Motion or lightweight CSS transitions (150ms-250ms cubic-bezier) for hover, modal, and drawer states.

## 4. Accessibility (WCAG 2.2 AA)
- Semantic HTML tags (`<main>`, `<nav>`, `<header>`, `<article>`, `<button>`).
- ARIA labels and live regions for dynamic chart updates and SSE notifications.
- Complete keyboard navigation (focus visible, Escape to close modals, arrow navigation in lists).
