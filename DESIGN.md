# HD Verse — DESIGN.md
## MVP Design System & Screen Specification
**Version:** 1.0 | **Classification:** Internal | **June 2026**
**Authority:** CTO (Eniola) — Design decisions governed by this document

---

## 0. Design North Star

> **"The product should feel like a universe, not a dashboard."**
> — HD Verse Product Design Playbook

Every design decision in this document is evaluated against one test:
*Does this make the creator feel like they've entered a space — or opened a tool?*

The signature aesthetic risk taken in this system: **the certificate is designed as a social artifact first, a legal document second.** It is built to be screenshotted, posted to WhatsApp status, and shared on Instagram — while simultaneously being legally defensible. This duality is the single most important design decision in the MVP.

---

## 1. Design Token System

### 1.1 Color Tokens

All product color decisions reference these tokens. No off-palette colors introduced.

#### Background Tokens
```
--color-bg-base:        #1B1F34   /* Verse Ink — primary dark background */
--color-bg-card:        #2B2D3A   /* Verse Charcoal — card/panel surfaces */
--color-bg-elevated:    #33374A   /* Slightly lifted surface for nested cards */
--color-bg-overlay:     rgba(27, 31, 52, 0.92)  /* Modal/drawer overlays */
```

#### Brand Gradient Tokens
```
--gradient-brand:       linear-gradient(135deg, #C903D0 0%, #A102A6 40%, #650268 75%, #140015 100%)
--gradient-brand-soft:  linear-gradient(135deg, #C903D0 0%, #8D0292 100%)
--gradient-brand-glow:  radial-gradient(ellipse at center, rgba(201,3,208,0.25) 0%, transparent 70%)
--gradient-brand-hero:  linear-gradient(160deg, #140015 0%, #3C013E 30%, #1B1F34 100%)
```

#### Semantic State Tokens
```
--color-success:        #3EFED0   /* Verse Teal — certificate issued, payment received */
--color-warning:        #E97609   /* Verse Orange — pending, needs attention */
--color-alert:          #FFDE06   /* Signal Yellow — infringement detected (use sparingly) */
--color-accent-sage:    #CCF382   /* Verse Sage — progress, growth indicators */
--color-neutral:        #D4D7E0   /* Verse Slate — borders, dividers, disabled states */
--color-error:          #E03B3B   /* Defined here — not in brand guide, added per Playbook §8 */
```

#### Text Tokens
```
--color-text-primary:   #FFFFFF   /* White — primary text on dark */
--color-text-secondary: #D4D7E0   /* Verse Slate — secondary/supporting text */
--color-text-muted:     #7A7F99   /* Muted text, timestamps, metadata */
--color-text-inverse:   #1B1F34   /* Verse Ink — text on light surfaces (certificates) */
--color-text-brand:     #C903D0   /* Verse Magenta — brand accent text */
```

#### Interactive Tokens
```
--color-cta-primary:    linear-gradient(135deg, #C903D0, #8D0292)
--color-cta-hover:      linear-gradient(135deg, #D435D9, #A102A6)
--color-cta-outline:    #C903D0   /* border color for secondary buttons */
--color-focus-ring:     rgba(201, 3, 208, 0.5)
```

---

### 1.2 Typography Tokens

```
/* Display — Bricolage Grotesque */
--font-display:         'Bricolage Grotesque', 'Manrope', sans-serif;

/* Body — Epilogue */
--font-body:            'Epilogue', 'Inter', sans-serif;

/* Scale */
--text-hero:            clamp(2.5rem, 5vw, 4rem);      /* Hero headlines */
--text-h1:              clamp(1.75rem, 3vw, 2.5rem);   /* Page titles */
--text-h2:              clamp(1.25rem, 2vw, 1.75rem);  /* Section headers */
--text-h3:              1.125rem;                       /* Card titles */
--text-body-lg:         1rem;                           /* Primary body */
--text-body:            0.9375rem;                      /* Default body */
--text-body-sm:         0.875rem;                       /* Secondary body */
--text-caption:         0.75rem;                        /* Labels, metadata */
--text-mono:            0.8125rem;                      /* Hash values, ISRCs */

/* Weights */
--font-weight-bold:     700;
--font-weight-semibold: 600;
--font-weight-medium:   500;
--font-weight-regular:  400;

/* Line heights */
--leading-tight:        1.15;   /* Display text */
--leading-normal:       1.5;    /* Body text */
--leading-relaxed:      1.7;    /* Long-form content */
```

---

### 1.3 Spacing & Layout Tokens

```
/* Base unit: 4px */
--space-1:   0.25rem;   /*  4px */
--space-2:   0.5rem;    /*  8px */
--space-3:   0.75rem;   /* 12px */
--space-4:   1rem;      /* 16px */
--space-5:   1.25rem;   /* 20px */
--space-6:   1.5rem;    /* 24px */
--space-8:   2rem;      /* 32px */
--space-10:  2.5rem;    /* 40px */
--space-12:  3rem;      /* 48px */
--space-16:  4rem;      /* 64px */
--space-20:  5rem;      /* 80px */
--space-24:  6rem;      /* 96px */

/* Layout */
--max-width-content:    1200px;
--max-width-form:       480px;
--max-width-dashboard:  1080px;

/* Radius */
--radius-sm:   6px;
--radius-md:   12px;
--radius-lg:   20px;
--radius-xl:   28px;
--radius-full: 9999px;

/* Shadows */
--shadow-card:    0 4px 24px rgba(0,0,0,0.3);
--shadow-glow-mg: 0 0 40px rgba(201,3,208,0.2);
--shadow-glow-tl: 0 0 24px rgba(62,254,208,0.15);
--shadow-elevated: 0 8px 40px rgba(0,0,0,0.4);
```

---

### 1.4 Motion Tokens

```
--duration-instant:  100ms;
--duration-fast:     200ms;
--duration-normal:   300ms;
--duration-slow:     500ms;
--duration-ceremony: 800ms;   /* Certificate issuance animation */

--ease-out:     cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-in-out:  cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);  /* Celebratory moments */
```

**Motion Rules:**
- Core workflows (registration, upload, disputes): motion marks completion only — no ambient animation
- Certificate issuance: one deliberate celebratory animation, duration 800ms, never repeated on re-view
- Page transitions: soft gradient sweep (opacity + slight upward translate), 300ms
- Hover states: 200ms ease-out only — no scale transforms on functional elements
- `prefers-reduced-motion`: all animations collapse to instant opacity change

---

## 2. Component Library Specification

### 2.1 Buttons

```
PRIMARY BUTTON
─────────────────────────────────────────
Background:   --gradient-brand-soft
Text:         White, Epilogue, 15px, weight 600
Padding:      14px 28px
Radius:       --radius-full
Shadow:       --shadow-glow-mg
Hover:        --color-cta-hover + shadow intensifies
Active:       Scale 0.98
Disabled:     --color-neutral at 30% opacity, no gradient
Focus:        2px solid --color-focus-ring, 2px offset

Rule: ONE primary button per screen. Never two.

SECONDARY BUTTON
─────────────────────────────────────────
Background:   transparent
Border:       1.5px solid --color-cta-outline
Text:         --color-text-brand, Epilogue, 15px, weight 500
Padding:      13px 27px
Radius:       --radius-full
Hover:        Background rgba(201,3,208,0.08)

GHOST BUTTON
─────────────────────────────────────────
Background:   transparent
Border:       none
Text:         --color-text-secondary
Hover:        --color-text-primary
Used for:     Cancel actions, back navigation

DESTRUCTIVE BUTTON
─────────────────────────────────────────
Background:   --color-error (#E03B3B)
Text:         White
Used for:     Delete actions only — never for warnings
```

---

### 2.2 Cards & Surfaces

```
BASE CARD
─────────────────────────────────────────
Background:   --color-bg-card (#2B2D3A)
Border:       1px solid rgba(212,215,224,0.08)
Radius:       --radius-lg (20px)
Padding:      --space-6 (24px)
Shadow:       --shadow-card

Rule: No hard black borders. Soft border or ambient glow only.

HIGHLIGHTED CARD (dashboard key metrics)
─────────────────────────────────────────
Same as base card +
Border:       1px solid rgba(201,3,208,0.2)
Shadow:       --shadow-glow-mg
Background:   linear-gradient(135deg, rgba(201,3,208,0.06), #2B2D3A)

ALERT CARD (infringement detected)
─────────────────────────────────────────
Border-left:  3px solid --color-alert (#FFDE06)
Background:   rgba(255,222,6,0.05)
Icon:         Signal Yellow warning icon
```

---

### 2.3 Form Elements

```
INPUT FIELD
─────────────────────────────────────────
Background:   rgba(255,255,255,0.04)
Border:       1px solid rgba(212,215,224,0.15)
Border-focus: 1px solid --color-cta-outline + --color-focus-ring
Text:         --color-text-primary, Epilogue 15px
Label:        --color-text-secondary, Epilogue 13px, weight 500
Placeholder:  --color-text-muted
Radius:       --radius-md (12px)
Padding:      14px 16px
Error state:  Border --color-error, error text below in --color-error

FILE UPLOAD ZONE
─────────────────────────────────────────
Background:   rgba(201,3,208,0.04)
Border:       2px dashed rgba(201,3,208,0.3)
Border-hover: 2px dashed rgba(201,3,208,0.7)
Background-hover: rgba(201,3,208,0.08)
Text:         "Drop your track here or browse files"
Subtext:      "MP3, WAV, AIFF — up to 500MB"
Icon:         Upload cloud icon, --color-text-brand
Radius:       --radius-lg
Padding:      --space-12 (48px) --space-8
Transition:   200ms ease-out on all properties
```

---

### 2.4 Status Badges

```
CERTIFICATE ISSUED    → Teal (#3EFED0) bg at 10%, Teal text
PENDING               → Orange (#E97609) bg at 10%, Orange text
INFRINGEMENT DETECTED → Yellow (#FFDE06) bg at 10%, Yellow text
PROCESSING            → Slate bg, animated pulse on dot
FAILED                → Error (#E03B3B) bg at 10%, Error text

All badges: Epilogue 12px, weight 600, uppercase,
            letter-spacing 0.05em, radius --radius-full,
            padding 4px 10px
```

---

### 2.5 Navigation

```
SIDEBAR (desktop)
─────────────────────────────────────────
Background:   #161929 (slightly darker than bg-base)
Width:        240px
Border-right: 1px solid rgba(212,215,224,0.06)
Logo:         HD Verse mark + wordmark, top left, 24px height

Nav items:    Epilogue 14px, weight 500, --color-text-secondary
Nav active:   --color-text-primary + left border 2px --color-cta-outline
              + background rgba(201,3,208,0.08)
Nav hover:    --color-text-primary, transition 150ms

Nav sections (MVP):
  — Dashboard
  — My Works
  — Certificates
  — Detection Alerts
  — Account

MOBILE NAVIGATION
─────────────────────────────────────────
Bottom tab bar, 5 items max
Background:   #161929 + top border rgba(212,215,224,0.06)
Active tab:   --color-text-brand + gradient dot indicator
```

---

## 3. Screen-by-Screen Specification

### SCREEN 01 — Landing Page (Pre-auth)

**Job:** Convert a Nigerian producer arriving from an influencer link into a registered user.

**Layout:**
```
┌─────────────────────────────────────────┐
│  [HD Verse logo]              [Sign In] │
├─────────────────────────────────────────┤
│                                         │
│   PROVE IT'S YOURS.                     │
│   PROTECT IT EVERYWHERE.                │
│   GET PAID FOR IT.                      │
│                                         │
│   [Subtext in Epilogue, slate color]    │
│   Before you send that beat — lock it. │
│   NCC-grade proof in 60 seconds.        │
│                                         │
│        [Get Started Free →]             │
│                                         │
│   ✦ 4-star spark: "nobody fit steal    │
│     am, not even AI artists"           │
│     — Lagos producer, early access     │
│                                         │
├─────────────────────────────────────────┤
│  HOW IT WORKS                           │
│  01 Upload your beat                    │
│  02 Get your certificate instantly      │
│  03 Share. Prove. Protect.              │
├─────────────────────────────────────────┤
│  [Certificate preview — brand artifact] │
├─────────────────────────────────────────┤
│  PRICING (simple 3-column)              │
│  Pay-per-cert | Basic | Pro             │
│  [Basic + Pro show "Coming Soon" badge] │
├─────────────────────────────────────────┤
│  AI SCRAPING CALLOUT SECTION            │
│  "Your certificate is your proof when  │
│   AI uses your sound without permission"│
└─────────────────────────────────────────┘
```

**Design direction:**
- Hero background: `--gradient-brand-hero` with soft magenta radial glow centre-right
- Headline: Bricolage Grotesque, `--text-hero`, white, tight leading
- Pidgin quote used as social proof — styled as a pull quote with `--color-alert` spark icon
- Certificate preview card floats with `--shadow-glow-mg` — this is the "wow" preview
- No photography on landing — cosmic gradient + typography only at MVP stage

---

### SCREEN 02 — Registration

**Job:** Get the producer to create an account with minimum friction.

**Layout:**
```
┌──────────────────────────────────────┐
│  [HD Verse logo, centered]           │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Create your account           │  │
│  │                                │  │
│  │  Full name        [__________] │  │
│  │  Email address    [__________] │  │
│  │  Password         [__________] │  │
│  │  Phone (for OTP)  [__________] │  │
│  │                                │  │
│  │  [Create Account →]            │  │
│  │                                │  │
│  │  Already registered? Sign in   │  │
│  └────────────────────────────────┘  │
│                                      │
│  [Background: soft magenta glow      │
│   emanating from behind the card]    │
└──────────────────────────────────────┘
```

**Design direction:**
- Background: `--color-bg-base` + `--gradient-brand-glow` positioned top-right
- Form card: `--color-bg-card`, `--radius-xl`, `--shadow-elevated`
- Single column, no sidebars — full focus on the form
- Phone field: flag selector (🇳🇬 default) + number input
- Password: show/hide toggle with eye icon

---

### SCREEN 03 — OTP Verification (Smile Identity)

**Job:** Complete KYC Tier 1 before any payment flow.

**Layout:**
```
┌──────────────────────────────────────┐
│                                      │
│  Verify your number                  │
│                                      │
│  We sent a code to +234 XXX XXX XX  │
│                                      │
│  [_] [_] [_] [_] [_] [_]           │
│                                      │
│  [Verify →]                          │
│                                      │
│  Didn't get it? Resend in 0:45       │
│                                      │
└──────────────────────────────────────┘
```

**Design direction:**
- OTP boxes: large (56px × 64px), `--color-bg-elevated`, auto-advance on input
- Active box: `--color-cta-outline` border + subtle glow
- Resend timer in `--color-text-muted`, changes to `--color-text-brand` when active

---

### SCREEN 04 — Upload & Registration Flow

**Job:** Producer uploads their beat and enters metadata. Must feel serious and frictionless simultaneously.

**Layout:**
```
┌──────────────────────────────────────────┐
│  ← Back          Register a Work    1/2  │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │    ☁ Drop your track here          │  │
│  │    or browse files                 │  │
│  │    MP3, WAV, AIFF — up to 500MB   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Work title           [_______________]  │
│  Artist / Producer    [_______________]  │
│  Genre                [_______________]  │
│  Year of creation     [_______________]  │
│  Co-creators (opt.)   [_______________]  │
│                                          │
│  [Continue →]                            │
│                                          │
└──────────────────────────────────────────┘

Step 2/2 — Review & Pay
┌──────────────────────────────────────────┐
│  ← Back         Review & Pay       2/2   │
├──────────────────────────────────────────┤
│                                          │
│  WORK SUMMARY                            │
│  ┌──────────────────────────────────┐    │
│  │  🎵 [filename.mp3]               │    │
│  │  Title: [Work Title]             │    │
│  │  Artist: [Name]                  │    │
│  │  SHA-256: a3f9...d271 [truncated]│    │
│  └──────────────────────────────────┘    │
│                                          │
│  CERTIFICATE FEE                         │
│  Ownership Certificate          $2.00    │
│  ISRC Assignment                Included │
│  Detection Registration         Included │
│  ─────────────────────────────────────   │
│  Total                          $2.00    │
│                                          │
│  [Pay $2 & Get Certificate →]            │
│                                          │
│  🔒 Your file is never shared or         │
│     accessed by anyone at HD Verse.      │
│     Stored encrypted on AWS S3.          │
│                                          │
└──────────────────────────────────────────┘
```

**Design direction:**
- Step indicator: simple "1/2" and "2/2" — not a progress bar (too corporate)
- Upload zone: full magenta dashed border treatment as specified in components
- SHA-256 hash displays in monospace (`--font-mono`) — makes it feel technically credible
- Privacy trust line at bottom of payment step: `--color-text-muted`, lock icon
- "Pay & Get Certificate" button: PRIMARY, full width, gradient, one per screen

---

### SCREEN 05 — Certificate Issuance (The Ceremony)

**Job:** The single most important moment in the product. Must feel earned.

**Animation Sequence (800ms total):**
```
0ms    → Screen fades to near-black (#0D0010)
100ms  → HD Verse logo mark appears, centre screen, small
300ms  → Logo pulses outward with magenta glow ring
500ms  → Certificate card rises from bottom with spring easing
700ms  → "Certificate Issued" text fades in, Teal color
800ms  → Confetti-style spark burst (4-point stars, brand colors)
```

**Certificate Card Design (the social artifact):**
```
┌─────────────────────────────────────────────┐
│  [gradient background: brand-hero gradient] │
│                                             │
│  ✦  HD VERSE                    [HD logo]  │
│                                             │
│  CERTIFICATE OF OWNERSHIP                   │
│  ──────────────────────────────────────     │
│                                             │
│  [WORK TITLE in Bricolage Grotesque, 28px] │
│                                             │
│  Creator          [Name]                    │
│  ISRC             [XX-XXX-XX-XXXXX]        │
│  Registered       [Date, Time UTC]          │
│  SHA-256          [a3f9...d271]             │
│  Timestamp        RFC 3161 Verified ✓       │
│                                             │
│  ──────────────────────────────────────     │
│  This certificate serves as timestamped    │
│  proof of ownership registered with        │
│  HD Verse and is compatible with the       │
│  Nigerian Copyright Commission framework.  │
│                                             │
│  [QR code — links to verification URL]     │
│                                             │
│  myhdverse.com          © HD Verse 2026    │
└─────────────────────────────────────────────┘
```

**Action buttons below certificate:**
```
[Download PDF]    [Share Certificate]    [Register Another →]
  (secondary)       (secondary)              (primary)
```

**Design direction:**
- Certificate background: full `--gradient-brand` treatment
- White text throughout the certificate (light mode exception: certificate only)
- QR code links to public verification page (no login required to verify)
- "Share Certificate" triggers native share sheet (mobile) or copy link (desktop)
- The certificate IS the marketing. It must look premium enough to post.
- PDF generation: preserves gradient — use canvas/image-based PDF, not CSS print

---

### SCREEN 06 — Creator Dashboard

**Job:** Give the producer a clear view of their registered works, certificate status, and detection alerts.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Sidebar]  │  Good evening, [Name] ✦               │
│             │                                        │
│  Dashboard  │  ┌──────────┐ ┌──────────┐ ┌───────┐ │
│  My Works   │  │ Works    │ │Detection │ │Alerts │ │
│  Certs      │  │ Registered│ │ Active  │ │  0    │ │
│  Alerts     │  │    3     │ │    3    │ │       │ │
│  Account    │  │[Teal num]│ │[Mg num] │ │[Yel]  │ │
│             │  └──────────┘ └──────────┘ └───────┘ │
│             │                                        │
│             │  MY WORKS                              │
│             │  ┌────────────────────────────────┐   │
│             │  │ 🎵 Track Name    CERT ISSUED ✓ │   │
│             │  │    Registered 12 Jun 2026       │   │
│             │  │    ISRC: XX-XXX-26-00001  [↓]  │   │
│             │  ├────────────────────────────────┤   │
│             │  │ 🎵 Track Name 2  PENDING  ○    │   │
│             │  │    Registered 10 Jun 2026       │   │
│             │  └────────────────────────────────┘   │
│             │                                        │
│             │  [+ Register New Work]                 │
│             │                                        │
│             │  DETECTION ALERTS                      │
│             │  ┌────────────────────────────────┐   │
│             │  │ ⚠ No alerts yet                │   │
│             │  │ We're monitoring your works.   │   │
│             │  │ You'll hear from us if we find │   │
│             │  │ an unauthorized use.            │   │
│             │  └────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Design direction:**
- Metric cards: `--color-bg-card` with `--shadow-card`
- Numbers: Bricolage Grotesque, `--text-h1`, color-coded by meaning
- Works list: simple table-style on desktop, card stack on mobile
- Empty detection state: invitation tone, NOT a sad-face graphic
- "Register New Work" CTA: always visible, primary button style

---

### SCREEN 07 — Detection Alert

**Job:** Deliver the subscription conversion trigger. This is the moment a pay-per-cert user becomes a $19/month subscriber.

**Layout:**
```
┌────────────────────────────────────────────┐
│                                            │
│  ⚠  MATCH DETECTED                        │
│  Signal Yellow alert card, full width      │
│                                            │
│  Your track "[Title]" was detected         │
│  on [Platform] on [Date].                  │
│                                            │
│  MATCH DETAILS                             │
│  Platform          [ACRCloud source]       │
│  Detected          [Timestamp]             │
│  Your Certificate  [ISRC] — Issued [Date] │
│  Match Confidence  High                    │
│                                            │
│  WHAT THIS MEANS                           │
│  This track was identified playing on a   │
│  platform that may not have your           │
│  authorization. Your certificate proves    │
│  you registered it first.                  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Upgrade to Pro to get weekly        │  │
│  │  detection reports + enforcement     │  │
│  │  support.                            │  │
│  │                                      │  │
│  │  [Upgrade to Pro — $50/month →]     │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  [Download Certificate as Evidence]        │
│                                            │
└────────────────────────────────────────────┘
```

**Design direction:**
- Alert card: `--color-alert` left border (3px), yellow-tinted background
- This is the ONE screen where Signal Yellow dominates — it has earned its place
- Upgrade prompt immediately follows the alert — the emotional moment drives conversion
- "Download Certificate as Evidence" reinforces certificate value post-purchase

---

### SCREEN 08 — Pricing / Upgrade

**Job:** Convert pay-per-cert users to subscription. Basic and Pro displayed; subscriptions show "Coming Soon" in Week 1–3.

**Layout:**
```
┌────────────────────────────────────────────────┐
│                                                │
│  Choose your plan                              │
│  Epilogue subtext: "Start with one track.     │
│  Scale when you're ready."                    │
│                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌────────┐ │
│  │ PAY-PER-CERT │ │    BASIC     │ │  PRO   │ │
│  │              │ │              │ │        │ │
│  │   $2–$5      │ │  $19/month   │ │  $50   │ │
│  │  per work    │ │              │ │ /month │ │
│  │              │ │ [COMING SOON]│ │[COMING │ │
│  │ ✓ Certificate│ │              │ │  SOON] │ │
│  │ ✓ ISRC       │ │ Up to 12    │ │        │ │
│  │ ✓ Detection  │ │ uploads/mo  │ │12+ up/ │ │
│  │   registered │ │ Email alerts│ │mo, week│ │
│  │              │ │ 2x/month    │ │ly det. │ │
│  │ [Get Cert →] │ │ [Join List] │ │[Join]  │ │
│  └──────────────┘ └──────────────┘ └────────┘ │
│                                                │
│  Pay-per-cert card: highlighted with           │
│  magenta border (active/recommended)           │
└────────────────────────────────────────────────┘
```

---

## 4. Certificate PDF Specification

The certificate PDF is a brand + growth artifact. It must be rendered as an image-based PDF (not CSS print) to preserve gradient fidelity.

**Dimensions:** A4 portrait (210mm × 297mm) — or US Letter for international use
**Bleed:** 3mm all sides
**Safe zone:** 15mm from edge

**Sections:**
```
TOP THIRD:    Full brand gradient wash, HD Verse logo + wordmark (white)
              4-point spark decorative elements (brand guide motif)

MIDDLE THIRD: White or near-white panel
              Certificate title: "CERTIFICATE OF OWNERSHIP"
              Bricolage Grotesque, 32pt, Verse Ink
              
              Work title: Bricolage Grotesque, 24pt, Verse Magenta
              All metadata: Epilogue, 11pt, Verse Ink
              — Creator name
              — ISRC
              — Registration date + time (UTC)
              — SHA-256 hash (truncated with "..." at 20 chars)
              — "RFC 3161 Timestamp Verified"
              — "Compatible with Nigerian Copyright Commission framework"

BOTTOM THIRD: QR code (right-aligned, 40mm × 40mm)
              HD Verse URL + tagline
              "This certificate is verifiable at myhdverse.com/verify"
              Verse Magenta footer strip with HD Verse mark
```

**Generation stack:** Puppeteer (Node.js) rendering an HTML template to PDF.
Preserves gradient. Fonts embedded. QR code generated server-side.

---

## 5. Email Design Specification

### 5.1 Certificate Delivery Email

```
Subject:    Your HD Verse Certificate is ready ✦
Preview:    [Work Title] is now protected.

Header:     HD Verse logo on dark (#1B1F34) background
            Magenta gradient strip

Body:       White background (email client safe)
            
            Headline (Bricolage Grotesque equivalent — web-safe fallback):
            "Your certificate is ready."
            
            Body (Epilogue / Arial fallback):
            "[Name], your track '[Title]' is now registered and 
            protected on HD Verse."
            
            Certificate summary card:
            — ISRC
            — Registration date
            — SHA-256 (truncated)
            
            CTA button:  [Download Your Certificate]
                         Magenta gradient, white text
            
            Secondary:   [Register Another Work]

Footer:     "Nobody fit steal am now."
            myhdverse.com | hello@myhdverse.com
            Verse Ink background
```

### 5.2 Detection Alert Email

```
Subject:    ⚠ Match detected on one of your works
Preview:    Your track '[Title]' was found on [Platform].

Header:     Signal Yellow (#FFDE06) strip — ONLY email where yellow leads
            "MATCH DETECTED" in Verse Ink

Body:       Plain white
            Match details table
            Certificate as proof — download link
            Upgrade CTA: [Get Weekly Monitoring — $50/month]

Footer:     Standard HD Verse dark footer
```

---

## 6. Public Verification Page

**URL:** `myhdverse.com/verify/[certificate-id]`
**Auth:** None required — public page

**Purpose:** When someone receives a shared certificate or scans the QR code, this page confirms the ownership is real.

```
┌──────────────────────────────────────────┐
│  [HD Verse logo]                         │
│                                          │
│  ✓ CERTIFICATE VERIFIED                  │
│  [Teal color, large checkmark]           │
│                                          │
│  "[Work Title]"                          │
│  Registered to: [Creator Name]           │
│  Date: [Registration Date]               │
│  ISRC: [XX-XXX-XX-XXXXX]               │
│  SHA-256: [hash]                         │
│  RFC 3161 Timestamp: Verified            │
│                                          │
│  This certificate was issued by HD Verse │
│  and is compatible with the Nigerian     │
│  Copyright Commission framework.         │
│                                          │
│  [Protect Your Own Work →]              │
│                                          │
└──────────────────────────────────────────┘
```

This page is a **growth surface**. Every creator who verifies someone else's certificate sees the product and gets a CTA. No login wall.

---

## 7. Open Design Items (Inherited from Playbook §8)

| Item | Status | Resolution |
|------|--------|------------|
| Error/destructive color | **RESOLVED** | #E03B3B defined in token system |
| Light mode specification | **DEFERRED** | Certificates use light treatment. Full light mode post-MVP |
| Icon library | **DECIDED** | Lucide Icons (rounded, geometric, open source) + custom 4-point spark accent from brand guide |
| Illustration style | **DEFERRED** | Phase 1: typography + color only. No illustration pack in MVP |
| Internal doc templates | **DEFERRED** | Post-MVP brand refresh |

---

## 8. Accessibility Baseline

- WCAG 2.1 AA minimum on all text/background combinations
- All interactive elements keyboard navigable
- Focus rings visible (using `--color-focus-ring`)
- `prefers-reduced-motion` respected for all animations
- Color never the sole indicator of state — always paired with icon or text label
- Minimum touch target: 44px × 44px on all interactive elements

---

## 9. Responsive Breakpoints

```
Mobile:   320px — 767px    (primary target for Nigerian creators)
Tablet:   768px — 1023px
Desktop:  1024px+

Design-first breakpoint: 390px (iPhone 14 Pro — most common Nigerian smartphone)
Upload flow: optimized for one-handed mobile use
```

---

*DESIGN.md v1.0 — HD Verse MVP*
*Generated: June 2026 | Authority: CTO (Eniola)*
*Next review: Before Phase 2A build begins*