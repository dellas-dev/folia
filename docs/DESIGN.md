# Design System: The Curated Greenhouse

## 1. Overview & Creative North Star

**Creative North Star: The Botanical Editor**
This design system rejects the clinical, cold aesthetics of traditional SaaS. Instead, it draws inspiration from high-end botanical journals and curated physical workspaces. It is "Organic Minimalism"—a style that prioritizes breathing room, editorial authority, and a soft, tactile interface.

To move beyond a "template" look, we employ **Intentional Asymmetry**. Rather than perfectly centered grids, we use generous, unequal whitespace and overlapping card elements to create a sense of bespoke arrangement. The goal is for the UI to feel like a series of meticulously placed objects on a studio table, rather than rows in a spreadsheet.

---

## 2. Colors & Surface Philosophy

The palette is rooted in earth tones, utilizing a "high-contrast nature" approach where deep forest greens meet soft, milky creams.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To define boundaries between content areas, use background color shifts only. For example, a sidebar should be defined by `surface_container` sitting against a `surface` main stage. Standard 1px solid lines feel "cheap" and digital; tonal shifts feel architectural and premium.

### Surface Hierarchy & Tonal Layering
We treat the UI as physical layers of fine paper. Use the following hierarchy to create depth:
- **Base Layer:** `surface` (#fbf9f4) – The primary canvas.
- **Section Layer:** `surface_container_low` (#f5f3ee) – For secondary navigation or sidebar backgrounds.
- **Card/Action Layer:** `surface_container_lowest` (#ffffff) – Use this for primary interaction cards to make them "pop" off the cream background.
- **Active State Layer:** `secondary_container` (#bcf0ae) – Reserved strictly for active selections and highlights.

### Glass & Gradient Rules
- **Glassmorphism:** For floating menus or modals, use `surface` with 80% opacity and a `backdrop-blur` of 20px. This allows the organic colors behind to bleed through.
- **Signature Gradients:** For primary CTAs, use a subtle linear gradient from `primary` (#154212) to `primary_container` (#2d5a27) at a 145-degree angle. This adds a "silk" texture that flat colors lack.

---

## 3. Typography: Editorial Authority

We use a "Serif-First" hierarchy to establish a sophisticated, brand-forward voice.

| Level | Font Family | Size | Intent |
| :--- | :--- | :--- | :--- |
| **Display** | Newsreader | 3.5rem | High-impact moments; the "Cover Story." |
| **Headline** | Newsreader | 2rem | Chapter titles and main section headers. |
| **Title** | Plus Jakarta Sans | 1.125rem | Interface labels and card titles; functional. |
| **Body** | Plus Jakarta Sans | 0.875rem | Readability and clarity for long-form AI insights. |
| **Label** | Plus Jakarta Sans | 0.75rem | Metadata and secondary utility text. |

**The Contrast Rule:** Always pair a Newsreader headline with a Plus Jakarta Sans sub-headline. The tension between the organic serif and the geometric sans-serif is the core of our "Botanical Editor" identity.

---

## 4. Elevation & Depth

We avoid the "floating in a void" look of standard Material Design. Elevation is achieved through light and layering.

*   **Tonal Stacking:** Depth is primarily created by placing a light surface (`surface_container_lowest`) on top of a darker surface (`surface_dim`).
*   **Ambient Shadows:** If a shadow is required for a floating component (like a dropdown), use: `box-shadow: 0 10px 40px -10px rgba(27, 28, 25, 0.06)`. Note the tint—the shadow uses the `on_surface` color, not pure black, to maintain a natural, ambient light feel.
*   **The "Ghost Border":** If a container requires more definition for accessibility, use the `outline_variant` token at 15% opacity. It should be felt, not seen.
*   **Soft Radii:** Apply `rounded-3xl` (2rem) as the default for all cards and `rounded-full` for buttons. This removes "hostile" sharp corners, reinforcing the organic greenhouse theme.

---

## 5. Components

### Buttons & Interaction
*   **Primary:** `primary` background with `on_primary` text. Always `rounded-full`. Use the signature gradient on hover.
*   **Secondary:** `secondary_container` background with `on_secondary_container` text. This is our "Spring Green" accent—use it for active dashboard states.
*   **Tertiary:** No background. Use `primary` text with an underline that appears only on hover.

### Input Fields
*   **Form Style:** Use `surface_container_lowest` for the input background. No bottom border. Instead, use a subtle `outline_variant` (at 20% opacity) that transitions to `primary` (at 100% opacity) on focus.
*   **Padding:** Use `spacing-4` (1.4rem) internal padding to ensure the text has room to breathe.

### Botanical Cards
*   **Rule:** Forbid the use of divider lines within cards.
*   **Layout:** Use vertical whitespace (spacing-8) to separate sections. If distinct areas are needed within a card, use a subtle background shift to `surface_container`.

### Additional Component: The "Seed" Chip
*   Used for AI-generated tags or categories.
*   **Style:** `tertiary_fixed` background, `rounded-full`, with a small leading icon (botanical or AI-sparkle) in `primary`.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts where the right margin is larger than the left to create an editorial feel.
*   **Do** lean heavily on the "Spring Green" (#bcf0ae) for success states and active navigation items—it represents growth.
*   **Do** ensure high-contrast serif headlines are at least 200% larger than the body text they accompany.

### Don't
*   **Don't** use 1px solid borders to separate sections. It breaks the "curated paper" illusion.
*   **Don't** use pure black (#000000) for text. Use `on_background` (#1b1c19) to keep the contrast soft and readable.
*   **Don't** crowd the interface. If a screen feels "busy," increase the spacing scale by one increment across all elements.