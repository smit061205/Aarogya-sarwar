---
name: The Design System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d8dae2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fc'
  surface-container: '#ecedf6'
  surface-container-high: '#e6e8f0'
  surface-container-highest: '#e0e2ea'
  on-surface: '#181c21'
  on-surface-variant: '#414752'
  inverse-surface: '#2d3037'
  inverse-on-surface: '#eff0f9'
  outline: '#717783'
  outline-variant: '#c1c6d4'
  surface-tint: '#005faf'
  primary: '#005dac'
  on-primary: '#ffffff'
  primary-container: '#1976d2'
  on-primary-container: '#fffdff'
  inverse-primary: '#a5c8ff'
  secondary: '#106d20'
  on-secondary: '#ffffff'
  secondary-container: '#9df898'
  on-secondary-container: '#1a7425'
  tertiary: '#944700'
  on-tertiary: '#ffffff'
  tertiary-container: '#ba5b00'
  on-tertiary-container: '#fffeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a5c8ff'
  on-primary-fixed: '#001c3a'
  on-primary-fixed-variant: '#004786'
  secondary-fixed: '#9df898'
  secondary-fixed-dim: '#82db7e'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005312'
  tertiary-fixed: '#ffdbc7'
  tertiary-fixed-dim: '#ffb688'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#733600'
  background: '#f9f9ff'
  on-background: '#181c21'
  surface-variant: '#e0e2ea'
typography:
  display:
    fontFamily: Public Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  h1:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  h2:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Public Sans
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  button:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
This design system is built on the principle of **Assisted Clarity**. It targets elderly users and individuals with limited technical proficiency, prioritizing cognitive ease and physical accessibility. The aesthetic blends **Corporate Modern** efficiency with a warm, clinical cleanliness. 

The visual language avoids "mystery meat" navigation or hidden gestures, opting instead for explicit labeling and high-contrast affordances. By borrowing the information density of an ERP dashboard but filtering it through a minimalist lens, the system provides a sense of control and reliability. The emotional goal is to evoke safety, competence, and calmness, ensuring users never feel overwhelmed by their health data.

## Colors
The palette is rooted in traditional healthcare signals to ensure instant recognition. 

- **Primary Blue (#1976D2):** Used for primary actions, navigation, and brand-critical elements. It signals trust and stability.
- **Success Green (#388E3C):** Reserved for "Stable" health statuses, confirmation messages, and "Go" actions.
- **Emergency Red (#D32F2F):** Strictly for alerts, critical health warnings, and destructive actions (e.g., "Cancel Appointment").
- **Neutral Palette:** The background uses a very soft off-white (#F8FAFC) to reduce screen glare, while the primary surface is pure white (#FFFFFF) to create a clear "card" distinction. Text is kept at a high-contrast dark slate (#1E293B) to ensure AA/AAA accessibility standards.

## Typography
This design system utilizes **Public Sans** for its institutional clarity and exceptional legibility at large scales. To accommodate elderly users, the typography scale is intentionally oversized.

The base body size is set to **18px**, significantly larger than the web standard, to account for visual impairment. Headlines are bold and heavy to create a clear information hierarchy. Paragraphs use a generous line height (1.6) to prevent "line jumping" while reading. All caps should be avoided for long strings of text, reserved only for short, high-contrast labels.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop to keep content centered and within the user's primary field of vision. A 12-column system is used with wide **24px gutters** to ensure elements are never visually cramped.

Spacing follows an 8px linear scale. For elderly users, "white space" is treated as a functional tool to separate interactive zones, reducing the risk of accidental taps. Information density is kept low; each "row" or "section" in the dashboard should focus on a single task or health metric.

## Elevation & Depth
Depth is used to signify "interactivity." This design system employs **Ambient Shadows** to lift cards off the background, creating a tactile feel that suggests the element can be clicked or tapped.

- **Level 0 (Background):** #F8FAFC, flat.
- **Level 1 (Cards/Surface):** White background with a soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.05)).
- **Level 2 (Active/Hover):** A more pronounced shadow to indicate focus (0px 8px 30px rgba(0,0,0,0.10)).

Avoid complex layering. No more than two levels of depth should exist on a screen at once to maintain a simple mental model for the user.

## Shapes
The design system uses a **Rounded (Level 2)** shape language. This softens the "clinical" feel of the app and makes the UI feel more approachable.

- **Standard Buttons & Inputs:** 0.5rem (8px) corner radius.
- **Content Cards:** 1rem (16px) corner radius.
- **Status Chips:** Full pill-shape (999px) to differentiate them from interactive buttons.

The consistency of these radii helps users quickly categorize what they see: sharp corners are never used, as they can feel "aggressive" or "broken" in this specific friendly context.

## Components

### Buttons
Buttons must have a minimum height of **56px** to provide a large "hit area" for users with reduced motor control. Use high-contrast text and a subtle inner glow on hover to confirm the interaction.

### Cards
Cards are the primary container for all information. Every card should have a clear header in **h2** or **label-bold** typography. Use a white background and Level 1 elevation.

### Input Fields
Inputs must have persistent labels (never use placeholder text as the only label). Borders should be 2px thick when focused, using the Primary Blue to provide an unmistakable visual cue of where the user is typing.

### Chips & Badges
Used for health status (e.g., "Medication Taken"). These use the pill-shape and a light tinted background of the status color (e.g., Success Green at 10% opacity with 100% opacity text).

### Lists
Lists are "chunky," with each item separated by at least 12px of vertical space. Every list item that is clickable must include a "chevron-right" icon to signal that it leads to a new screen.

### Critical Alerts
A specialized component for "Emergency Red" notifications. These use a thick 4px left-border and a high-contrast background to ensure they cannot be missed by the user.