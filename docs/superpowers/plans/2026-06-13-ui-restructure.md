# Plan: UI Restructure + Landing Page + Portfolio

**Date:** 2026-06-13
**Goal:** Transform ClearSignal from a dev prototype into a polished, user-friendly product with proper onboarding, portfolio management, and wallet connectivity.

---

## New Page Structure

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing | Hero, feature highlights, CTA → "Launch App" |
| `/research` | Deep Dive | Main product (existing, rename from /deep-dive) |
| `/portfolio` | Portfolio | Wallet connect + Bitget holdings + P&L |
| `/decisions` | Decisions | Decision journal + Autopsy report |

**Remove:** `/compare`, `/log`, `/replay` (empty/half-baked, dilute the story)

---

## Task Breakdown

### Task 1: Landing Page

New file: `frontend/src/pages/Landing.tsx`

Sections:
1. **Hero** — tagline ("Trade smarter, not harder"), one-line description, "Launch App" button
2. **Problem** — "73% of retail traders lose money due to FOMO and emotional decisions"
3. **Feature cards** (3 columns):
   - Multi-Agent Research (financials + social + debate)
   - FOMO Protection (decision autopsy)
   - One-Click Trading (Bitget integration)
4. **How it works** — 3 steps: Research → Check yourself → Trade
5. **Footer** — "Built for Bitget Hackathon S1" + tech stack badges

Style: Same dark cinema theme. Hero gets a subtle gradient mesh background.

### Task 2: Portfolio Page

New file: `frontend/src/pages/Portfolio.tsx`

**Wallet Connect section:**
- Install: `wagmi`, `viem`, `@web3modal/wagmi`, `@tanstack/react-query`
- "Connect Wallet" button → MetaMask/WalletConnect modal
- Show: wallet address, ETH balance, connected chain

**Bitget Connect section:**
- Form: API Key + Secret Key + Passphrase inputs
- Store in localStorage (client-side only, never sent to our backend beyond the session)
- On connect → call `/price/{symbol}` or new `/portfolio` endpoint

**Portfolio view (after connected):**
- Holdings table: symbol, quantity, avg cost, current price, P&L %, P&L $
- Total portfolio value
- Margin info if available

**Backend:**
- New endpoint: `GET /portfolio/assets` — uses Bitget REST to fetch spot assets
- Already have `get_account_assets()` in trader.py

### Task 3: Decisions Page

New file: `frontend/src/pages/Decisions.tsx`

Two sections:
1. **Decision Journal** — table of past trades (ticker, date, reasoning, confidence, FOMO score, outcome)
2. **Autopsy Report** — stats cards (win rate, FOMO vs calm returns, avg confidence) + LLM insight

Calls: `GET /decisions` + `GET /autopsy`

### Task 4: Router + Navbar Cleanup

- Update `App.tsx`: remove old routes, add new ones
- Update `Navbar.tsx`: Landing page has its own minimal nav (just logo + "Launch App")
- App pages have full nav: Research, Portfolio, Decisions
- Active page highlighting

### Task 5: Polish & Responsive

- Mobile responsive (landing especially)
- Loading states on all pages
- Empty states ("No decisions yet — make your first trade")
- Smooth page transitions

---

## Dependency Order

```
Task 1 (Landing) — no deps, can start immediately
Task 4 (Router) — do alongside Task 1
Task 3 (Decisions) — backend already done, just frontend
Task 2 (Portfolio) — needs wagmi install + new backend endpoint
Task 5 (Polish) — last
```

## Install Required

```bash
cd frontend
npm install wagmi viem @web3modal/wagmi @tanstack/react-query
```

---

## Estimated Time

- Task 1: ~30 min
- Task 2: ~45 min (wallet connect is fiddly)
- Task 3: ~20 min
- Task 4: ~15 min
- Task 5: ~20 min

Total: ~2.5 hours of focused work

---

## Success Criteria

- [ ] Landing page loads at `/`, looks professional, has clear CTA
- [ ] "Launch App" takes user to `/research` (Deep Dive)
- [ ] Portfolio page connects MetaMask wallet and shows balance
- [ ] Portfolio page accepts Bitget API keys and shows holdings
- [ ] Decisions page shows journal + autopsy stats
- [ ] No dead/empty pages remain
- [ ] Mobile responsive (at minimum: landing + research)
- [ ] Frontend build clean, no TS errors
