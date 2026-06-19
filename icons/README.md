# @velocity-exchange/icons

React icon components generated from Figma. 200+ icons, each rendered as an SVG wrapped in a styled `<span>`.

## Installation

```bash
npm install @velocity-exchange/icons
# or
bun add @velocity-exchange/icons
```

## Usage

```tsx
import { Account, ArrowLeft, ChevronDown } from '@velocity-exchange/icons';

// Default — 16px, inherits currentColor
<Account />

// Custom size and color
<ArrowLeft size={24} color="#6683A7" />

// Scale with font-size (useful inside text)
<ChevronDown autoSize />

// Pass props directly to the SVG element
<Account svgProps={{ strokeWidth: 2 }} />
```

## Props

All icon components accept `IconProps`:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | `currentColor` | Fill color |
| `size` | `number` | `16` | Width and height in px |
| `autoSize` | `boolean` | `false` | Set width/height to `1em` (scales with font-size) |
| `svgProps` | `React.SVGProps<SVGSVGElement>` | — | Props forwarded to the `<svg>` element |
| ...rest | `React.HTMLProps<HTMLSpanElement>` | — | Any other prop is forwarded to the wrapping `<span>` |

`color` and `size` are omitted from the spread to the span so they don't conflict with HTML attributes.

## Generating icons from Figma

> Requires Figma admin access on the source file.

**1. Configure environment**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```env
FIGMA_API_TOKEN="<your personal access token>"
FIGMA_FILE_ID=7ontXyBmE6iK8xhRMLfkCV
FIGMA_CANVAS='24x24 Product icon'
```

Get a personal access token from **Figma → Settings → Security → Personal access tokens**.

**2. Install dependencies**

```bash
bun install
```

**3. Compile the generator script**

```bash
bun run build-icons-script
```

**4. Pull icons from Figma and generate components**

```bash
bun run icons
```

This fetches all SVGs from the configured Figma canvas, converts them to TypeScript React components via [SVGR](https://react-svgr.com/), and writes them to `src/icons/components/`. It also regenerates `src/icons/index.ts`.

**5. Build the package**

```bash
bun run build
```

Output goes to `dist/`.

## Adding icons manually

Drop `.svg` files into `src/icons/svgs/`. They will be picked up by `bun run icons` alongside the Figma icons and converted into components. The generator logs any existing components that don't match a Figma SVG so stale ones are easy to spot.

## Scripts

| Script | Description |
|--------|-------------|
| `bun run build-icons-script` | Compile `generate.ts` → `generate.js` |
| `bun run icons` | Fetch from Figma and generate React components |
| `bun run icons:debug` | Same as above with Node inspector attached |
| `bun run build` | Compile TypeScript → `dist/` |
| `bun run clean` | Remove `dist/` |
| `bun run clean-icons` | Remove generated components in `src/icons/components/` |
