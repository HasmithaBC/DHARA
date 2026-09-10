# Dhara Construction & Technology — Design System

![Dhara Logo](../public/images/brand/logo-white.png)

This document outlines the core design tokens and guidelines derived from the site audit and brand identity, using Tailwind CSS v4 variables mapped in `src/app/globals.css`.

## 1. Brand Colors

The visual identity relies on a premium, modern architectural vibe: Off-white backgrounds, Dark Charcoal/Black overlays, and a Gold accent.

| Token | CSS Variable / Tailwind | Hex Value | Usage |
|-------|-------------------------|-----------|-------|
| **Gold (Primary)** | `--color-primary` (`bg-primary`) | `#E2C876` | Primary CTAs, accents, icons |
| **Dark Charcoal** | `--color-charcoal` (`bg-charcoal`) | `#1F2224` | Overlays, footer backgrounds, primary dark mode |
| **Off-White** | `--color-offwhite` (`bg-offwhite`) | `#F8F9FA` | Main site background |
| **Black (Text)** | `--color-text-main` | `#111111` | Primary typography |
| **Muted Gray** | `--color-text-muted` | `#6B7280` | Subtitles, disabled states |

## 2. Typography

We use Montserrat for headings and Inter (or standard Sans) for body copy to ensure clean readability.

- **Headings (Font Family 1):** `font-montserrat`
- **Body (Font Family 2):** `font-sans`

### Type Scale
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px) — *Body text*
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px) — *Section headings*
- `text-5xl`: 3rem (48px) — *Hero headings*

## 3. UI Primitives

All primitives are located in `src/components/ui/`.

### Buttons
Buttons must have a minimum 44x44px touch target (NFR-UI-004).
- **Primary:** Gold background (`bg-primary`), Dark Charcoal text (`text-charcoal`), hover effect.
- **Secondary:** Outline button with Gold border (`border-primary`) or Dark border.
- **Ghost:** Transparent background, hover background.

### Cards
Cards use a subtle shadow (`shadow-md`) and rounded corners (`rounded-lg`). On hover, cards might elevate slightly (`hover:shadow-lg`).

### Forms (Input & Select)
- Default padding ensuring 44px height (`min-h-[44px]`).
- Focus rings for accessibility (`focus:ring-2 focus:ring-primary focus:outline-none`).

## 4. Layout Constraints

- **Max Container Width:** 1440px
- **Mobile padding:** `px-4`
- **Tablet padding:** `px-8`
- **Desktop padding:** `px-12`

Breakpoints:
- `sm`: 360px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1440px
