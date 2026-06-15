# Design Spec: UI Restructure + Landing Page + Portfolio

**Date:** 2026-06-15
**Based on:** `docs/superpowers/plans/2026-06-13-ui-restructure.md`
**Design direction:** High-end fintech dark cinema, elevated with better typography, spacing, motion, and glassmorphism depth.

---

## Route Structure

| Route | Page | Nav Style |
|-------|------|-----------|
| `/` | Landing | Minimal (logo + "Launch App" button) |
| `/research` | Deep Dive (existing, renamed route) | Full app nav |
| `/portfolio` | Portfolio | Full app nav |
| `/decisions` | Decisions | Full app nav |

**Removed:** `/compare`, `/log`, `/replay`, `/` (old Dashboard)

**App Navbar links:** Research, Portfolio, Decisions (3 items only). Active state: purple highlight with border.

---

## Landing Page (`/`)

### Section 1: Hero — Problem-First Bold

- **Layout:** Left-aligned text, floating gradient orbs (purple top-right, gold bottom-left)
- **Minimal nav:** Logo left, "Launch App" ghost button right
- **Copy:**
  - Headline: "73% of retail traders lose." (32px, font-weight 800, white)
  - Subline: "You don't have to." (18px, font-weight 600, gold)
  - Body: One sentence describing the product (12px, text-secondary)
- **CTAs:** 
  - Primary: "Start Trading Smarter" — gradient button (purple → gold)
  - Secondary: "See How It Works" — ghost button with border
- **Motion:** Orbs float with CSS translateY oscillation (6s ease-in-out infinite). Hero text fades in with 200ms stagger per line on page load.

### Section 2: Feature Cards — "Three layers of protection"

- **Section label:** "WHAT YOU GET" (10px, uppercase, letter-spacing 2px, purple)
- **Heading:** "Three layers of protection" (20px, bold, white)
- **Layout:** 3-column grid, glass-card style
- **Cards:**
  1. **Multi-Agent Research** — Icon: `Brain` (Lucide, purple bg). "5 AI agents analyze financials, social sentiment, and news. Bull vs Bear debate with a judge verdict."
  2. **FOMO Protection** — Icon: `ShieldCheck` (Lucide, gold bg). "Every trade goes through a behavioral check. Regret simulation shows potential downside before you commit."
  3. **One-Click Execution** — Icon: `Zap` (Lucide, green bg). "Connected to Bitget. Research, check yourself, then trade — all in one seamless flow."
- **Motion:** Cards fade-in + slide-up on scroll (IntersectionObserver, CSS transitions, 100ms stagger between cards).

### Section 3: How It Works — 3 Steps

- **Section label:** "HOW IT WORKS" (10px, uppercase, gold)
- **Heading:** "Three steps to a better trade" (20px, bold, white)
- **Layout:** Horizontal flex, 3 steps connected by gradient lines
- **Steps:**
  1. Purple numbered circle → "Research" — "Enter a ticker. AI agents analyze it from every angle." Icon: `Search`
  2. Gold numbered circle → "Check Yourself" — "FOMO guardian scores your emotional state. Journal your reasoning." Icon: `Shield`
  3. Green numbered circle → "Trade" — "Execute directly on Bitget. Track outcomes. Learn from every decision." Icon: `ArrowRightLeft`
- **Connectors:** Gradient line (purple→gold, gold→green) between steps
- **Motion:** Staggered reveal left-to-right on scroll.
- **Mobile:** Stack vertically, connectors become vertical lines.

### Section 4: Trust Bar

- **Layout:** Centered row of pill badges
- **Content:** "Bitget Hackathon S1 - Track 3" (with trophy icon), "Python + FastAPI", "React + Tailwind", "Claude AI", "Bitget MCP"
- **Style:** Ghost pills (border only, 8px border-radius, 11px text, text-secondary)

### Section 5: Final CTA

- **Background:** Subtle radial purple glow centered
- **Heading:** "Ready to trade with clarity?" (22px, bold)
- **Body:** "No signup required. Connect your Bitget account and start."
- **CTA:** "Launch ClearSignal" gradient button (same as hero)
- **Motion:** Button has subtle pulse glow on hover.

### Section 6: Footer

- **Layout:** Flex space-between
- **Left:** Logo mark + "ClearSignal" text
- **Right:** "Built for Bitget Hackathon S1 - 2026"

---

## Portfolio Page (`/portfolio`)

### Page Header

- Icon: `Wallet` (Lucide) in green gradient circle
- Title: "Portfolio"
- Subtitle: "Connect wallet & Bitget to view holdings"

### Connect Section (2-column grid)

**Web3 Wallet Card (glass-card):**
- Label: "WEB3 WALLET" (uppercase, muted)
- Disconnected state: "Connect MetaMask" button (purple border)
- Connected state: Wallet address (truncated), ETH balance, chain name
- Uses: `wagmi`, `viem`, `@web3modal/wagmi`, `@tanstack/react-query`

**Bitget API Card (glass-card):**
- Label: "BITGET API" (uppercase, muted)
- Disconnected state: "Enter API Keys" button (gold border)
- Expanded: 3 inputs (API Key, Secret Key, Passphrase) + Connect button
- Connected state: Green dot + "Connected" badge
- Storage: localStorage only, never sent to backend beyond the session API call

### Holdings Table (glass-card, shown after Bitget connected)

- **Header row:** Total portfolio value (large, bold, right-aligned)
- **Columns:** Asset, Quantity, Avg Cost, Current Price, P&L %
- **Row style:** Alternating subtle bg (rgba white 0.02), rounded rows
- **P&L colors:** Green for positive, red for negative (existing bullish/bearish colors)
- **Empty state:** "Connect your Bitget API to see holdings" with icon

### Backend

- New endpoint: `GET /portfolio/assets` — calls Bitget REST to fetch spot assets
- Uses existing `get_account_assets()` from bitget_client.py

---

## Decisions Page (`/decisions`)

### Page Header

- Icon: `BookOpen` (Lucide) in gold gradient circle
- Title: "Decisions"
- Subtitle: "Journal + Autopsy Report"

### Autopsy Stats (4-column grid of glass-cards)

| Stat | Color | Source |
|------|-------|--------|
| Win Rate (%) | Green | `GET /autopsy` |
| Calm Trades avg return | Gold | `GET /autopsy` |
| FOMO Trades avg return | Red | `GET /autopsy` |
| Avg Confidence | Purple | `GET /autopsy` |

Style: Large number (18px bold), small label below (9px uppercase muted).

### AI Insight Card

- Glass-card with purple-to-gold gradient border
- Label: "AI INSIGHT" (purple, uppercase)
- Body: LLM-generated behavioral analysis text from autopsy endpoint
- Style: Slightly elevated with glow-purple

### Decision Journal Table (glass-card)

- **Columns:** Ticker, Reasoning (truncated), FOMO Level (badge), Confidence, Result (% with color)
- **FOMO badges:** LOW=green, MED=gold, HIGH=red (small pill badges)
- **Empty state:** "No decisions yet — make your first trade in Research" with link
- **Source:** `GET /decisions`

---

## Navbar Updates

### Landing Nav (renders on `/` only)

- Logo left, "Launch App →" button right
- Transparent background, no border
- Position: absolute over hero (not sticky)

### App Nav (renders on `/research`, `/portfolio`, `/decisions`)

- Same sticky glass style as current
- Links: Research (`/research`), Portfolio (`/portfolio`), Decisions (`/decisions`)
- Active state: purple bg/border (existing style)
- Logo click → `/` (landing)

---

## Design System Notes

### Icons
- All icons: Lucide React (already installed)
- Icon containers: 32px rounded-lg with 10-15% opacity accent bg

### Motion (Subtle Polish — CSS only, no GSAP)
- **Scroll reveals:** IntersectionObserver + CSS transitions (opacity 0→1, translateY 20px→0, 400ms ease)
- **Hero orbs:** `@keyframes float` — translateY oscillation, 6s ease-in-out infinite
- **Hover states:** 200ms transitions on all interactive elements
- **Page transitions:** None (keep it snappy, no route transition library)
- **Loading states:** Existing shimmer animation

### Typography
- Keep existing Inter font stack
- Hero headline: 32px/800 weight, -0.5px letter-spacing
- Section headings: 20px/700
- Section labels: 10px/600 uppercase, 2px letter-spacing
- Body: 12-13px, line-height 1.6-1.7

### Colors
- Keep entire existing palette (no changes to index.css @theme)
- Glass-card style unchanged
- Glow effects unchanged

### Responsive
- Landing hero: Stack vertically on mobile, reduce headline to 24px
- Feature cards: Stack to single column below md
- How It Works: Vertical stack on mobile
- Portfolio connect cards: Stack below sm
- Decision stats: 2x2 grid on mobile

---

## Dependencies to Install

```bash
cd frontend
npm install wagmi viem @web3modal/wagmi @tanstack/react-query
```

---

## What's NOT Changing

- Deep Dive page (`DeepDive.tsx`) — stays as-is, just route changes from `/deep-dive` to `/research`
- API layer (`api.ts`) — add new calls, don't modify existing
- Backend existing endpoints — untouched
- index.css theme/colors — untouched
- Existing components (ScoreCard, VerdictBadge, ShockBanner) — untouched
