Below are two ready-to-share master prompts: one optimized for **Google Stitch** to generate the UI, and one for **Claude** to implement the app. I grounded the visual direction in Nimiq’s public color system, which includes a palette with named families like Neutral, Blue, Green, Orange, Gold, Purple, and support for light/dark themes, plus gradient treatments. The Nimiq Wallet repo is a public Vue/TypeScript app, which is useful as a style reference for product tone and interaction polish. ([OnMax][1])

## 1) Master prompt for Google Stitch

**Prompt:**

Design a **mobile-first bill splitting app** for restaurants using **Nimiq’s visual identity**.

### Product goal

Create a fast, friendly, polished mobile experience that helps a user split a restaurant bill in a few steps. The app should feel trustworthy, clean, modern, and slightly playful, similar to a crypto-fintech product with excellent usability. Prioritize thumb-friendly mobile layouts, strong hierarchy, clear progress, and very low friction.

### Brand and visual direction

Use **Nimiq-inspired styling**:

* Bright, modern, gradient-friendly visual language
* Rounded cards and buttons
* Clean spacing and soft shadows
* High contrast, accessible typography
* Light theme first, but ensure the system can support dark mode
* Use Nimiq-style palette families and gradients, especially:

  * **Blue / Green / Orange / Gold / Purple / Neutral**
* Prefer colorful accents on primary CTAs, progress states, and summary cards
* Use gradients sparingly for hero sections, primary buttons, and totals
* Keep surfaces mostly clean and neutral so the colorful accents stand out
* The tone should feel like **“smart money app meets friendly utility tool”**

### UX principles

* Mobile-first, designed for 390px wide screens first
* Single primary action per screen
* Bottom-safe layouts for modern phones
* Progress indicator across steps
* Inputs should feel simple and forgiving
* Minimize cognitive load
* Make it obvious how the split is being calculated
* Include inline validation and helpful microcopy
* Use sticky bottom CTA where helpful
* Design for one-handed use

### App flow

Design the app around these steps:

#### Step 1 — Start

Screen title: **Split a bill**
Offer two choices:

1. **Scan bill**
2. **Enter total manually**

The screen should feel welcoming and lightweight.
If user chooses scan:

* show camera/photo upload flow
* include bill preview card after capture
* include OCR loading / parsing state
* allow fallback to manual correction if scan is imperfect

If user chooses manual:

* show numeric input for total bill amount
* currency selector or inferred currency treatment
* large keypad-friendly amount entry

#### Step 2 — Tip

Ask:
**Add a tip?**
Options:

* No tip
* Tip by percentage
* Tip by fixed amount

If percentage:

* quick chips like 10%, 12%, 15%, 18%, 20%
* custom percentage option

If amount:

* fixed amount input

Show a live subtotal/total preview.

#### Step 3 — People

Ask:
**Who’s splitting the bill?**

* choose number of people
* add nickname for each person
* make this feel playful and easy
* auto-generate rows/cards for each person
* optionally prefill names like Person 1, Person 2 until edited
* allow avatar color dots or initials badges

#### Step 4 — Split method

If bill was scanned, present 3 methods:

1. **Assign items to people**
2. **Split evenly**
3. **Split by percentages**

If bill was manually entered, present:

1. **Split evenly**
2. **Split by percentages**

##### 4A — Assign items to people

If scanned bill produced line items:

* show bill items as cards/list rows
* each item shows name and price
* user can assign an item to one or multiple people
* support quantity awareness when useful
* support unassigned state
* allow a quick assign interaction, such as chips/toggles
* clearly show running totals per person
* include tax/tip handling explanation
* if item can be shared, allow multi-select split
* keep the interaction compact and mobile-friendly

##### 4B — Split evenly

* show everyone pays the same amount
* show exact per-person amount
* explain rounding behavior
* if 1–2 cents remain, assign remainder clearly and transparently

##### 4C — Split by percentages

* let user assign a percentage to each person
* visually show progress toward 100%
* the **last person automatically receives the remaining difference**
* if percentages exceed 100 before the last person, warn clearly
* make the remaining amount extremely visible

#### Step 5 — Results

Show a clear summary of how much each person owes.
For each person:

* nickname
* avatar/initial
* amount owed
* optional breakdown

  * items subtotal
  * tip share
  * tax/share adjustments
* emphasize the final amount strongly

Include:

* summary card with bill total, tip, split method
* “Start over” action
* “Edit split” action
* optional “Share summary” CTA
* optional “Copy amounts” CTA

### Screens to generate

Generate a coherent mobile app flow with these screens:

1. Welcome / start screen
2. Scan bill screen
3. OCR processing state
4. Bill review / correction screen
5. Manual total entry screen
6. Tip selection screen
7. People entry screen
8. Split method chooser
9. Item assignment screen
10. Even split confirmation screen
11. Percentage split screen
12. Final results screen

Also generate:

* empty states
* validation/error states
* loading states
* edge cases for scan failure and incomplete percentage allocation

### Components to include

Use a consistent design system with:

* top app bar
* progress stepper
* segmented controls
* rounded text inputs
* numeric keypad-friendly fields
* chips for presets
* sticky bottom CTA
* person chips / avatar initials
* item cards
* summary cards
* toast/snackbar for small confirmations
* bottom sheet where helpful
* clear modal/dialog patterns for edits

### Interaction details

* Make interactions feel fast and polished
* Use subtle motion and microinteractions
* Highlight the active split method clearly
* Show live recalculation where relevant
* Keep primary CTA labels explicit:

  * Continue
  * Review scanned bill
  * Add people
  * Choose split method
  * Calculate split
  * View results

### Content tone

Use concise, friendly copy.
Examples:

* “How do you want to add the bill?”
* “Want to include a tip?”
* “Who’s joining?”
* “How should we split it?”
* “Here’s what everyone owes.”

### Output expectations

Produce:

* high-fidelity mobile UI concepts
* a coherent end-to-end flow
* a reusable component style
* design tokens suggestions for color, radius, spacing, shadows, and typography
* at least one version with stronger gradients and one version with a more minimal neutral style

---

## 2) Master prompt for Claude

**Prompt:**

Build a **mobile-first restaurant bill splitting app** inspired by **Nimiq’s visual identity**.

### Objective

Create a polished, production-quality front-end app that helps users split restaurant bills through a guided step-by-step flow. The UX should be simple, fast, and optimized for phones first.

### Core flow

Implement this exact user flow:

#### Step 1 — Choose input method

User can:

* **Scan the bill using a photo**
* **Enter the total bill manually**

Requirements:

* If scanning, provide camera/upload UI and a bill preview state
* Simulate or structure OCR parsing cleanly, even if real OCR is abstracted
* Allow manual correction after scan
* If manual entry, provide a currency-aware total amount input

#### Step 2 — Add tip

Ask whether a tip should be added.
Support:

* No tip
* Percentage tip
* Fixed amount tip

Requirements:

* Percentage presets and custom value
* Fixed amount input
* Live update of total including tip

#### Step 3 — Add people

Ask how many people are splitting.
Collect:

* number of people
* nickname for each person

Requirements:

* dynamic person list
* validation for empty nicknames
* default placeholder names
* visually distinct initials/avatar markers

#### Step 4 — Choose split method

If the bill was scanned, allow:

* assign items to persons
* split evenly
* split by percentages

If the bill was manually entered, allow:

* split evenly
* split by percentages

##### Split method A — Assign items

For scanned bills with parsed items:

* display line items with name and amount
* allow assigning each item to one or more people
* support shared items
* if multiple people are selected, divide item fairly among them
* recalculate each person’s subtotal live

##### Split method B — Even split

* divide final total equally among all people
* handle rounding safely
* surface who absorbs any rounding remainder in a transparent way

##### Split method C — Percentage split

* user assigns percentages per person
* show running total percent
* final person automatically gets the remaining percentage difference
* prevent invalid states cleanly
* calculate final owed amount per person

#### Step 5 — Results

Display each person’s owed amount.

Include:

* nickname
* final amount owed
* optional breakdown
* overall summary:

  * base bill
  * tip
  * grand total
  * split method

Add actions:

* edit split
* restart
* share/copy summary

---

### Design requirements

Use **Nimiq-inspired styling**:

* bright fintech aesthetic
* rounded UI
* strong but tasteful gradients
* clean neutral backgrounds
* accent colors based on Nimiq-style palette families:

  * blue
  * green
  * orange
  * gold
  * purple
  * neutral
* design should feel premium, friendly, trustworthy, and modern
* mobile-first layout with safe-area support
* sticky bottom CTA on key steps
* clear progress indicator
* accessible contrast and tap targets

### Technical expectations

Build this as a high-quality front-end application.

Preferred stack:

* **React + TypeScript**
* **Tailwind CSS**
* componentized architecture
* mobile-first responsive design
* local state or lightweight app state management
* clean separation of:

  * models/types
  * calculation utilities
  * flow state
  * reusable UI components

### Suggested architecture

Create:

* `App`
* `BillSplitFlow`
* `StepStart`
* `StepScanBill`
* `StepManualAmount`
* `StepTip`
* `StepPeople`
* `StepSplitMethod`
* `StepAssignItems`
* `StepEvenSplit`
* `StepPercentageSplit`
* `StepResults`

Reusable components:

* `ScreenShell`
* `ProgressStepper`
* `BottomCTA`
* `AmountInput`
* `TipSelector`
* `PersonCard`
* `PersonListEditor`
* `SplitMethodCard`
* `BillItemCard`
* `ResultsCard`
* `SummaryCard`

Utilities:

* `calculateTip`
* `calculateEvenSplit`
* `calculatePercentageSplit`
* `calculateItemAssignments`
* `distributeRemainder`
* `formatCurrency`

Types:

* `Person`
* `BillItem`
* `SplitMethod`
* `TipMode`
* `BillSource`
* `SplitResult`

### Behavior requirements

* live recalculation on all relevant steps
* robust validation
* graceful empty states
* clear error handling
* mock OCR result data for scanned bills
* editable parsed items after OCR
* deterministic rounding strategy
* transparent handling of cents remainder
* smooth transitions between steps

### UX requirements

* one clear primary action per screen
* concise microcopy
* one-handed mobile use
* no clutter
* final results should feel celebratory and very clear
* use bottom sheets or modals sparingly and only when they improve usability

### Output requirements

Produce:

1. Complete runnable code
2. Clean file structure
3. TypeScript types
4. Mock data for scanned bills
5. Calculation utilities
6. Reusable UI components
7. Nice default theme tokens inspired by Nimiq
8. Comments only where useful, not excessive

### Important implementation notes

* Make the app functional even without real OCR integration
* For the scan flow, create a mocked parse result such as:

  * Burger — 12.50
  * Fries — 5.00
  * Soda — 3.50
  * Dessert — 6.00
* Let the user edit parsed item names and prices
* When splitting item assignments across multiple people, divide the item evenly
* Tip should be distributed proportionally based on each person’s share unless the split is even, in which case split tip evenly too
* In percentage mode, base the final amount on the grand total after tip
* Ensure the last person gets any remaining percent or cent differences so totals always reconcile exactly

### Code quality bar

Write the code like a strong senior front-end engineer:

* readable
* modular
* typed
* polished
* consistent
* production-minded

---

If you want, I can also turn this into a single **combined super-prompt** that works for both Stitch and Claude with sections for design + implementation.

[1]: https://onmax.github.io/nimiq-ui/nimiq-css/palette.html "Nimiq Colors | Nimiq UI"

