---
name: Curio
colors:
surface: '#fff9ef'
surface-dim: '#dfd9d0'
surface-bright: '#fff9ef'
surface-container-lowest: '#ffffff'
surface-container-low: '#f9f3e9'
surface-container: '#f3ede3'
surface-container-high: '#ede7de'
surface-container-highest: '#e7e2d8'
on-surface: '#1d1b16'
on-surface-variant: '#414846'
inverse-surface: '#32302a'
inverse-on-surface: '#f6f0e6'
outline: '#727975'
outline-variant: '#c1c8c4'
surface-tint: '#48645c'
primary: '#07231d'
on-primary: '#ffffff'
primary-container: '#1e3932'
on-primary-container: '#86a399'
inverse-primary: '#afcdc3'
secondary: '#4f625d'
on-secondary: '#ffffff'
secondary-container: '#d2e7e0'
on-secondary-container: '#556863'
tertiary: '#281e09'
on-tertiary: '#ffffff'
tertiary-container: '#3e331c'
on-tertiary-container: '#ac9b7e'
error: '#ba1a1a'
on-error: '#ffffff'
error-container: '#ffdad6'
on-error-container: '#93000a'
primary-fixed: '#cbe9df'
primary-fixed-dim: '#afcdc3'
on-primary-fixed: '#04201a'
on-primary-fixed-variant: '#314c44'
secondary-fixed: '#d2e7e0'
secondary-fixed-dim: '#b6cbc4'
on-secondary-fixed: '#0c1f1b'
on-secondary-fixed-variant: '#384a46'
tertiary-fixed: '#f4e0c0'
tertiary-fixed-dim: '#d7c4a5'
on-tertiary-fixed: '#241a06'
on-tertiary-fixed-variant: '#52452d'
background: '#fff9ef'
on-background: '#1d1b16'
surface-variant: '#e7e2d8'
typography:
display-lg:
fontFamily: Libre Caslon Text
fontSize: 48px
fontWeight: '700'
lineHeight: 56px
letterSpacing: -0.02em
headline-lg:
fontFamily: Libre Caslon Text
fontSize: 32px
fontWeight: '600'
lineHeight: 40px
headline-lg-mobile:
fontFamily: Libre Caslon Text
fontSize: 28px
fontWeight: '600'
lineHeight: 36px
headline-md:
fontFamily: Libre Caslon Text
fontSize: 24px
fontWeight: '600'
lineHeight: 32px
body-lg:
fontFamily: Hanken Grotesk
fontSize: 18px
fontWeight: '400'
lineHeight: 28px
body-md:
fontFamily: Hanken Grotesk
fontSize: 16px
fontWeight: '400'
lineHeight: 24px
label-md:
fontFamily: Hanken Grotesk
fontSize: 14px
fontWeight: '600'
lineHeight: 20px
letterSpacing: 0.05em
label-sm:
fontFamily: Hanken Grotesk
fontSize: 12px
fontWeight: '500'
lineHeight: 16px
rounded:
sm: 0.125rem
DEFAULT: 0.25rem
md: 0.375rem
lg: 0.5rem
xl: 0.75rem
full: 9999px
spacing:
unit: 8px
container-max: 1280px
gutter: 24px
margin-desktop: 64px
margin-mobile: 20px
section-gap: 80px
Brand & Style
The design system is built on the concept of "The Modern Archive"—a digital space that feels as tactile and welcoming as a boutique neighborhood café. The brand personality is sophisticated, sustainable, and curated, targeting a demographic that values longevity over fast fashion.
The design style is Minimalist with Tactile accents. It leverages heavy whitespace and a restricted, nature-inspired palette to evoke an emotional response of calm and trust. While the layout remains strictly functional and modern, the use of sophisticated serif headers and subtle container treatments provides a premium, "editorial" feel reminiscent of high-end independent magazines.
Key visual principles:
Spaciousness: Generous margins and clear internal padding to let product photography breathe.
Organic Sophistication: A blend of sharp grid precision with warm, earthy tones.
Authenticity: UI elements should never distract from the "preloved" items; instead, they should frame them like artifacts in a gallery.
Colors
The palette is anchored in deep, botanical greens and warm, architectural neutrals.
Primary (Deep Forest): Used for primary actions, navigation backgrounds, and high-level branding. It conveys stability and premium quality.
Secondary (Sage): Used for subtle backgrounds, secondary buttons, and success states. It provides a soft contrast to the dark primary green.
Tertiary (Warm Wood): A decorative accent used for highlighting "sustainable" or "hand-picked" badges and occasional background sections to break up white space.
Neutral (Obsidian): Reserved for high-contrast typography and iconography to ensure maximum legibility against the cream background.
Background (Cream/Paper): The default canvas is a warm off-white, reducing the harshness of pure white and reinforcing the vintage/preloved narrative.
Typography
This design system employs a classic typographic pairing to balance heritage with modern utility.
Libre Caslon Text is used for all headlines and display roles. Its high-contrast strokes and traditional serifs evoke the feeling of a printed catalog or a premium shopfront. It should be used with slightly tighter letter-spacing in larger sizes.
Hanken Grotesk serves as the workhorse for body copy, labels, and UI elements. It is a clean, contemporary sans-serif that ensures readability at small sizes and provides a functional counterpoint to the decorative nature of the serif headlines.
Formatting Rules:
All labels (`label-md`) should use uppercase styling with increased letter spacing to create a sense of organized "tagging."
Body text should maintain a generous line height (1.5x minimum) to support the spacious aesthetic.
Layout & Spacing
The layout philosophy follows a Fixed Grid model on desktop to create a centered, gallery-like experience. On mobile, the system transitions to a fluid model with consistent safe-area margins.
Grid: A 12-column system is used for desktop (1280px max-width). For product listings, use a 2 or 3-column grid on mobile to maintain image quality.
Rhythm: An 8px base unit governs all padding and margins.
White Space: This design system prioritizes "Negative Space as Luxury." Elements should be grouped logically but separated by significant vertical gaps (`section-gap`) to prevent the marketplace from feeling cluttered.
Product Display: Product cards should never feel cramped; use a minimum of 24px gutter between cards to emphasize the "curated" nature of each item.
Elevation & Depth
To maintain a sophisticated and clean aesthetic, this design system avoids heavy shadows in favor of Tonal Layers and Low-contrast outlines.
Surface Levels:
Level 0 (Base): The Cream (#F5F5F5) background.
Level 1 (Cards): Pure white surfaces with a subtle 1px border in Sage (#D4E9E2) or a very soft, diffused shadow (0px 4px 20px, 5% opacity Neutral).
Level 2 (Modals/Popovers): Standard white surfaces with a medium-soft shadow to indicate clear separation from the background.
Interactions: Hover states on cards should not "lift" excessively. Instead, use a subtle shift in border-color or a slight scale-up of the image within the container to indicate interactivity.
Shapes
The shape language is Soft and Architectural. While rounded corners are used to ensure the UI feels approachable and "cozy," they are kept subtle to maintain a premium, structured look.
Small Components: Checkboxes and small tags use a 4px (0.25rem) radius.
Main Components: Buttons and Input fields use a 4px (0.25rem) radius to feel "tailored."
Containers: Product cards and Image containers use an 8px (0.5rem) radius (`rounded-lg`) to soften the edges of photography.
Pill Elements: Only used for status indicators (e.g., "Sold," "New Arrival") to provide a distinct shape contrast against the predominantly rectangular grid.
Components
Buttons
Primary: Deep Forest Green background with Cream text. Sharp, 4px corners. No gradients.
Secondary: Sage Green background with Deep Forest Green text.
Ghost: Transparent background with a 1px Deep Forest Green border. Used for tertiary actions.
Input Fields
Styling: Underlined or light-gray bordered fields with Hanken Grotesk labels. Focus state uses a 2px Deep Forest Green bottom border.
Typography: Placeholder text should be in a muted version of the Neutral color.
Product Cards
Structure: Full-width image at the top, followed by a 16px padding area containing the serif Title (`headline-md`) and a sans-serif Price (`body-md`).
Sustainability Badge: A small, Tertiary (Warm Wood) colored tag in the top-right corner of the image to highlight curated items.
Chips & Tags
Filter Chips: Light Sage background, removing the background and adding a 1px border when "unselected."
Category Tags: All-caps `label-md` style, used sparingly to keep the interface clean.
Navigation
Desktop: Minimalist top bar with serif links. A "sticky" behavior is preferred to keep the "Sell an Item" (Primary Button) always accessible.
Search: A prominent, clean search bar with a "Find something unique..." placeholder, reflecting the boutique nature of the store.