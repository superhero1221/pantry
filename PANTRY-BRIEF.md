# Pantry — product and front-end brief

**Paste this whole document into Claude Research (or any capable model) along
with the screenshot sheet `pantry-screens.png`. The questions you want answered
are at the end, in section 6.**

Live at **pantryglobe.com**. Everything described here is built and shipping,
not a proposal.

---

## 1. What the app is

**Pantry decides what you are cooking tonight, prices it at a real shop you can
walk to, and then walks you through cooking it one step at a time.**

The premise is that for a lot of people the expensive part of dinner is not the
cooking and not the money — it is **the deciding**. You open the fridge, you
open a delivery app, you close the delivery app, you open it again, and forty
minutes later you have spent £22 on something you did not really want. Pantry
is built to end that loop in about fifteen seconds.

You tell it two things: roughly what you fancy, and roughly what you want to
spend. It gives you **one dish**, costed to the penny at the cheapest shop near
you, with the shopping list already minus whatever you have told it you own.

### Who it is for

Built **ADHD-first**. That is a design constraint, not a marketing line, and it
drives most of the decisions below:

- **One decision on screen at a time.** Never a wall of nine options.
- **No open loops.** Nothing says "3 recipes waiting" or shows a red badge.
- **Nothing moves unless it means something.** The one permanently animated
  element on screen moves three pixels every three and a half seconds, and
  there is a switch to turn it off.
- **The cooking screen shows one step.** Not a numbered list you lose your
  place in when you look up from the pan.

It is also, by consequence, built for anyone cooking to a budget, anyone who
cooks alone, and anyone who finds recipe sites hostile.

### What is actually in it

| | |
|---|---|
| Recipes | **153**, from **37 countries** |
| Priced in | **8 countries** with live shop and price data; a measured baseline covers 62 more |
| Languages | **6** — English, Spanish, French, Polish, Urdu, Arabic (the last two right-to-left) |
| Dish pictures | 108 photographs (Wikimedia, individually credited), 45 generated drawings |
| Diets | 9 filters, deterministic — vegan, vegetarian, halal, kosher, gluten free, dairy free, nut free, no pork, no alcohol |
| Goals | 7 — lose weight, gain weight, build muscle, body composition, spend less, more energy, none |
| Cookbook rule | No pork and no alcohol anywhere, enforced by a test that fails the build |

### What makes it different from every other recipe app

1. **Real prices, not estimates.** Shops near you come from OpenStreetMap via
   Overpass, including opening hours. Prices come from Open Prices (photographed
   on the shelf by real people) and Open Food Facts pack weights, falling back
   to a measured baseline from the World Food Programme's price monitor, with
   today's exchange rate from the European Central Bank. The app tells you which
   of the three sources each number came from.
2. **Nutrition is computed, never typed in.** A 261-ingredient composition table
   plus an engine that totals the shopping list and divides by servings. A test
   fails the build if a printed number ever disagrees with the ingredients. The
   fourteen original hand-written recipes were all wrong — understating energy
   by 7 to 61 per cent, never once overstating it, because totting a recipe up
   by eye loses the oil and the tin of coconut milk and never invents them.
3. **It remembers what you own.** A cupboard you tick off once comes off every
   future shopping list. You are never asked to buy cumin twice.
4. **It works with no signal.** Installable, offline-capable — the kitchen is
   where your signal dies and the cooking screen is where you need it least to.
5. **No tracking of any kind.** No analytics, no third-party scripts, fonts
   self-hosted so reading a recipe does not send your IP to Google. Everything
   lives in one key in your own browser unless you choose to sign in.

---

## 2. What it looks like now

### The design system

Vendored from a design handoff called **Organic**. Warm, printed, slightly
1970s cookbook.

**Colour**

| Role | Hex |
|---|---|
| Page ground | `#f5ead8` (warm cream) — the page behind is a soft radial `#f7eeda → #e6d8bd` |
| Surface / cards | `#f9f4ed`, `#eee7db`, `#ebddc5` |
| Accent (primary) | `#c67139` terracotta — hover `#b2622d`, deep `#8c491a` |
| Accent light | `#ffe1d0`, `#fff2eb`, `#f6a06b` |
| Green (positive) | `#8fa073`, tints `#e1eecc`, `#f0fae1`, deep `#56633f` |
| Text | `#201e1d` primary, `#645c50` secondary, `#82796a` muted, `#a19786` faint |
| Dark panel | `#201e1d` with `#f5ead8` text — used for the spend chart and the savings panel |

**Type**

- Headings: **Caprasimo** — a fat, friendly display serif. Used at 32–44px, tight tracking.
- Body and UI: **Figtree** — 13–17px. Both self-hosted, both SIL Open Font License.
- Prices are set in Caprasimo, large. Money is the loudest thing on any screen.

**Shape and motion**

- Radii are large and soft: pills at `999px`, cards at 22–34px.
- Shadows are low and warm: `0 3px 10px rgba(46,43,37,.16)`.
- Four keyframes exist in total: a rise, a drop, a ping, a flick — plus the
  mascot's hop and bob. `prefers-reduced-motion` kills all of them.

### The shell

Phone-first. Three states, no more:

| Width | Shell |
|---|---|
| Under 560px | Full viewport, max 480px column, five-tab bar along the bottom |
| 560px+ | A floating rounded card, max 640px, with a shadow — an iPad in two hands has the room |
| 1024px+ | Max 1120px, the tab bar becomes a **rail down the leading edge**, dish lists become a 2–3 column grid, prose keeps a 560px measure |

The shell is exactly `100dvh`. The screen inside it scrolls; the tab bar never
moves. In Arabic and Urdu the whole thing mirrors, including which edge the rail
sits on — the layout uses logical properties throughout, not left and right.

### The five tabs

**Tonight · Kitchen · Stats · Passport · You**

### The screens, in the order you meet them

**Onboarding — four questions, then you are in.**

1. **Welcome** — the name, one sentence, three bullets, one button: "Set me up — 4 quick screens". A "Skip all this" underneath that genuinely skips.
2. **Goal** — seven chips. Pick one and the mascot acts it out: on bathroom scales for losing weight, lifting a barbell for building muscle, counting change in a purse for spending less.
3. **What can you already do?** — one question, four big rows, one tap. Each row names two things you might have done ("Sear meat hard · Make a pan sauce") with the level name underneath in grey. *This replaced two screens of drag-and-drop — thirteen drag operations on a phone — last week.*
4. **Diet** — nine chips, multi-select, with a plain-English note about what filtering actually does.
5. **Where you are** — asks for location to find real shops. Refusing is fine and the app says so.

**The main loop.**

6. **Tonight (Home)** — a craving box with example chips, budget chips with an "Other" field, time chips, one big **Show me dinner**, and "I don't care — just pick one" underneath. Below that: Browse everything, The week, and the cupboard.
7. **Results** — one dish. Big photo, then the price in enormous type: what it costs to buy, and what it costs per serving. Then how far under budget you are. Then four nutrition tiles. Then a black panel: **"Instead of buying it — £7.00 → £0.16"** with what four times a month is worth. Then two alternates.
8. **Where to buy it (Shop)** — the shopping list, priced line by line, with which shop and how far. Things you already own are struck through and not counted.
9. **Cook** — **one step on screen.** Step number, minutes, a picture of the technique, one large sentence, and a tip in a peach box. Nothing else.
10. **You cooked it (After)** — the mascot celebrating, an optional photo of the plate, and three buttons: how much was left. That is the only thing it asks.

**The other tabs.**

11. **Browse** — all 153 dishes, filter chips along the top, priced per serving.
12. **Your kitchen** — what you own, what is going off soon, and its value.
13. **The week** — pick days and servings, one button builds a week and one shopping list.
14. **What I know (Stats)** — spend chart on a dark panel, money not spent on takeaway, what you cook most.
15. **Passport** — every country you have cooked from, cheapest per serving first, with flags.
16. **You (Settings)** — account, diets, cooking level, language, where you are, data export and delete.
17. **Legal** — privacy and terms, written to be read.

### The mascot

**Pantry** — a cream storage canister with a brown lid, a brass PANTRY plate,
rubber-hose arms in white gloves and brown shoes, drawn in the 1930s cartoon
idiom. Eleven poses. A small one stands in the trailing bottom corner of every
screen and hops in when you arrive; a large one appears where a screen has
something to say (acting out your goal, celebrating a finished dish). It never
speaks — it never says anything the screen does not already say — and there is
a switch in Settings to remove it.

### The technical shape (constrains any redesign)

- **React 19 + Vite + TypeScript**, no UI framework, no CSS framework, no component library.
- **All styling is CSS declaration strings** passed through a `css()` helper, e.g. `css('display:flex;gap:9px')`. Not style objects, not Tailwind, not styled-components.
- **Screens hold no state at all.** One hook computes every value, label, style string and handler; screens are pure functions of that one object. This is why a screen can be swapped out cheaply.
- Routing is a hand-rolled hash router with a real back stack.
- **Every string is translated six ways**, so any layout must survive Polish (long) and Arabic (right-to-left, different digits).
- Tap targets 44px minimum; every interactive element is a real button; the drag-and-drop that was removed had full keyboard support and its replacement is a proper radio group.

---

## 3. What I already know is weak

Be honest with me about these rather than agreeing:

- **Tonight is the front door and it is a form.** Craving box, then money chips, then time chips, then a button. Four decisions before anything happens, on the one screen that is meant to end decision paralysis.
- **Results is long.** Price, budget, nutrition, savings panel, alternates. Somebody who just wants to cook has to scroll past a lot of justification.
- **Browse is a 153-item list** with six filter chips. That is a lot of scrolling on a phone.
- **Stats and Passport may not deserve to be top-level tabs.** They are rewarding but nobody opens an app to look at them.
- **The first load is heavy** — around 1.3 MB of JavaScript before images.
- **Empty states are thin.** A brand-new user sees sample data on Stats and Kitchen, labelled as sample, but it is still a screen of somebody else's numbers.

---

## 4. What must not change

- The **warm cream and terracotta palette**, Caprasimo and Figtree.
- **One decision on screen at a time.** Any proposal that puts more choices in front of somebody is wrong for this audience even if it tests well generally.
- **Honesty about numbers.** Every price says where it came from. Nothing is invented to look better.
- **Right-to-left has to work.** Not as an afterthought.
- **It must work offline and with no account.**

---

## 5. Who to compare it against

Useful reference points, for different reasons:

- **Duolingo** — onboarding, one question per screen, the mascot as a guide rather than decoration. The onboarding here was rebuilt toward this.
- **Headspace / Calm** — calm-first layouts for people who are overwhelmed.
- **Monzo / Revolut** — how to make money legible at a glance.
- **HelloFresh / Gousto** — the meal-decision problem, solved with a subscription instead.
- **Yuka / Open Food Facts** — showing provenance of data without being boring.
- **Too Good To Go** — one-decision-per-screen commerce.

---

## 6. What I want back from you

Answer these in order. Be specific and opinionated — give recommendations, not
surveys of options. Where you disagree with a choice above, say so plainly and
say why.

**A. Screen layout analysis.**
For each of the five screens that matter most — **Tonight, Results, Cook,
Browse, Onboarding** — tell me:
- what a first-time user's eye does in the first three seconds, and whether that is the right thing;
- what should be removed, and what should be moved above the fold;
- the specific layout pattern you would use instead, described concretely enough to build;
- how it changes on a phone versus a tablet versus a desktop.

**B. The information hierarchy.**
On Results, what is the single most important thing on the screen? Right now it
is the price. Argue for or against. Where should the cook button be?

**C. Navigation.**
Are five tabs right? Should Stats and Passport be tabs, or should they live
inside a profile screen? Is a bottom tab bar even the right idiom for an app
whose main loop is a linear funnel (decide → shop → cook → log)?

**D. The one-decision principle, pressure-tested.**
Tonight currently asks for craving, money and time before it will answer.
Should it answer first and let you refine after? What would that cost?

**E. Then describe, in as much detail as you can, how the front end should be
built.**

This is the part I want most. Assume the reader is a competent engineer with no
context. Cover:
- the component structure and why it is divided that way;
- the layout system — grid, flex, container queries, what breakpoints and why those;
- how state flows, and whether the "one hook, dumb screens" approach above is right or should change;
- how the design tokens should be expressed (the current app uses CSS custom properties for tokens and declaration strings for everything else — say if that is wrong);
- motion: what should animate, what should not, and how to respect reduced-motion properly;
- accessibility: focus order, live regions, radio groups versus toggle buttons, contrast at these exact colours;
- internationalisation: how the layout survives Polish and Arabic without a second stylesheet;
- performance: what to load first, what to defer, and how to get the first meaningful paint down;
- what you would build first if you had one week.

Give me concrete markup and CSS where it helps. Name the trade-offs you are
making rather than hiding them.
