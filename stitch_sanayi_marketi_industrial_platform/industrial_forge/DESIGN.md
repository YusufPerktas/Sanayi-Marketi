# Design System Document: Industrial Precision & Digital Depth

## 1. Overview & Creative North Star: "The Architectural Ledger"
This design system moves away from the "cheap" feel of generic e-commerce platforms. Our North Star is **"The Architectural Ledger"**—an aesthetic that mirrors the precision of industrial engineering with the clarity of high-end editorial magazines. 

We replace "standard" marketplace noise with intentional white space, authoritative typography, and a "layered" logic. Instead of using lines to separate parts, we use tonal shifts to create a sense of physical structure. The goal is to make the user feel they are interacting with a robust, institutional tool rather than a volatile consumer shop.

---

## 2. Colors: Tonal Architecture
We utilize a sophisticated palette where color indicates function and depth, not just decoration.

### The "No-Line" Rule
**Prohibited:** 1px solid borders for sectioning or container boundaries. 
**The Solution:** Boundaries are defined strictly through background color shifts. A `surface-container-low` section sits directly on a `surface` background. This creates a "milled" look, as if the UI was carved from a single block of material.

### Color Tokens
*   **Primary Base:** `primary` (#004ac6) – Used for high-priority actions and brand presence.
*   **Surface Hierarchy:**
    *   `surface`: #f9f9ff (The base canvas)
    *   `surface-container-low`: #f0f3ff (Secondary sections)
    *   `surface-container-high`: #dee8ff (Active/Interactive containers)
    *   `surface-container-highest`: #d8e3fb (Floating elements/Modals)
*   **Accents & Semantics:**
    *   `tertiary`: #006058 (Refined Teal for "Satıcı" roles)
    *   `error`: #ba1a1a (Critical alerts)

### Signature Textures
To add "soul" to the industrial aesthetic, use subtle linear gradients on Primary CTAs: 
*   **CTA Gradient:** From `primary` (#004ac6) to `primary-container` (#2563eb) at a 135-degree angle. This prevents the button from looking "flat" or "web-standard."

---

## 3. Typography: Editorial Authority
We pair **Manrope** (Display/Headings) with **Inter** (Body/UI) to balance industrial grit with digital readability.

*   **Display (Display-LG/MD):** 3.5rem to 2.75rem. Use for high-impact hero statements. Tight letter spacing (-0.02em).
*   **Headlines (Headline-LG/MD):** 2rem to 1.75rem. Manrope Bold. These are your "Anchors." They should feel heavy and permanent.
*   **Titles (Title-LG/SM):** 1.375rem to 1rem. Inter Bold. Used for card titles and section headers.
*   **Body (Body-LG/MD):** 1rem to 0.875rem. Inter Regular. High line-height (1.6) to ensure complex industrial data remains legible.
*   **Labels (Label-MD/SM):** 0.75rem. Inter Medium (All-caps for Statuses). 

---

## 4. Elevation & Depth: The Layering Principle
Forget shadows that look like "drops." Our depth is environmental.

*   **Tonal Layering:** To create a card, place a `surface-container-lowest` (#ffffff) object on a `surface-container-low` (#f0f3ff) background. The `0.75rem` (md) or `1rem` (lg) border radius provides the "object" feel.
*   **Ambient Shadows:** For floating elements (Modals, Hover states), use a "Cloud Shadow": 
    *   `box-shadow: 0 20px 40px rgba(17, 28, 45, 0.06);` 
    *   The shadow color is a tinted version of `on-surface`, never pure black.
*   **Glassmorphism:** For top navigation bars or sticky headers, use:
    *   Background: `rgba(249, 249, 255, 0.8)`
    *   Backdrop-blur: `12px`
    *   This allows the industrial content to scroll beneath, creating a sense of sophisticated transparency.
*   **The Ghost Border Fallback:** If a container sits on a background of the same color, use a `1px` border of `outline-variant` at **15% opacity**.

---

## 5. Components: Precision Engineered

### Buttons (Butonlar)
*   **Primary:** Gradient fill (`primary` to `primary-container`), white text, `md` (0.75rem) roundedness. 
*   **Secondary:** No fill. `Ghost Border` (15% opacity `outline`). Inter Bold.
*   **Tertiary:** No fill, no border. Text-only with a subtle background shift on hover to `surface-container-high`.

### Status Badges (Durum Rozetleri)
*   *Usage: All-caps Label-SM, Semi-transparent backgrounds.*
*   **Aktif:** On `surface`, use `color: #006058` with a 10% opacity green background.
*   **Beklemede:** Soft Amber text on 10% amber background.
*   **Reddedildi:** `error` text on `error-container` (low opacity).

### Role Badges (Rol Rozetleri)
*   **Üretici (Blue):** `primary` text / `primary-fixed` background.
*   **Satıcı (Teal):** `tertiary` text / `tertiary-fixed` background.
*   **Her İkisi (Purple):** Secondary (#3755c3) text / `secondary-fixed` background.

### Cards & Lists (Kartlar ve Listeler)
*   **Rule:** Forbid divider lines. 
*   **Execution:** Use `40px` (2.5rem) vertical spacing between list items. For data-heavy tables, use alternating row backgrounds: `surface` and `surface-container-low`.
*   **Corner Radius:** Cards must strictly use `lg` (1rem / 16px) for outer containers and `md` (0.75rem / 12px) for inner elements.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts. A sidebar that is slightly wider than a standard grid creates a "custom" feel.
*   **Do** prioritize "Breathing Room." Industrial data is dense; the UI must be the opposite.
*   **Do** use "Manrope" for numbers. It has a geometric quality that feels like high-end machinery specs.

### Don't:
*   **Don't** use 100% black text. Use `on-surface` (#111c2d) to keep the contrast professional, not jarring.
*   **Don't** use "Standard Blue" (#0000FF). Always use our refined `primary` (#004ac6) which has a slightly deeper, corporate tone.
*   **Don't** use shadows on buttons. Let the gradient and the tonal shift of the surface do the work.