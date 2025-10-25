# Quick Buttons Visual Reference

## Location in Chat Interface

```
┌─────────────────────────────────────────────────┐
│  Chat Messages Area                             │
│                                                 │
│  User: Hello                                    │
│  AI: Hi! How can I help you?                   │
│                                                 │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │ ← Quick Buttons Here
│  │ 👕 Shirts│ │ 📦 Ship  │ │ ↩️ Returns│       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  ┌───────────────────────────────────┐ [Send] │ ← Input Area
│  │ Ask anything...                    │        │
│  └───────────────────────────────────┘        │
│                                                 │
│  Nexus Chat can make mistakes...              │
└─────────────────────────────────────────────────┘
```

## Button Style Examples

### 1. Rounded Style (rounded-full)
```
┌─────────────────────────────┐
│  👕 T-shirt Products        │
└─────────────────────────────┘
Fully rounded pill shape
```

### 2. Square Style (rounded-none)
```
┌───────────────────────────┐
│  👕 T-shirt Products      │
└───────────────────────────┘
Sharp 90° corners
```

### 3. Outline Style (border + transparent bg)
```
┌───────────────────────────┐
│  👕 T-shirt Products      │  ← Transparent background
└───────────────────────────┘     Colored border
```

### 4. Default Style (rounded-lg)
```
┌────────────────────────────┐
│  👕 T-shirt Products       │
└────────────────────────────┘
Standard rounded corners
```

## Color Variations

### Light Theme
```
Background: #6366f1 (Indigo)
Text: #ffffff (White)
Border: None (except outline style)

Example:
┌─────────────────────────────┐
│  👕 T-shirt Products        │  ← Blue bg, white text
└─────────────────────────────┘
```

### Dark Theme
```
Background: #818cf8 (Light Indigo)
Text: #000000 (Black)
Border: None (except outline style)

Example:
┌─────────────────────────────┐
│  👕 T-shirt Products        │  ← Light blue bg, black text
└─────────────────────────────┘
```

### Outline Style (Any Theme)
```
Background: transparent
Text: Primary color
Border: 2px solid primary color

Example:
┌───────────────────────────┐
│  👕 T-shirt Products      │  ← Transparent, colored border & text
└───────────────────────────┘
```

## Real-World Examples

### E-commerce Chat Interface

```
┌──────────────────────────────────────────────────────┐
│  Chat Messages                                       │
│  ...                                                 │
└──────────────────────────────────────────────────────┘

Quick Action Buttons:
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 👕 T-shirts │ │ 👖 Jeans    │ │ 👟 Shoes    │ │ 📦 Shipping │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
┌─────────────┐ ┌─────────────┐
│ ↩️ Returns  │ │ 📞 Support  │
└─────────────┘ └─────────────┘

┌────────────────────────────────────────────┐ [🔼]
│ Ask anything...                            │
└────────────────────────────────────────────┘
```

### Customer Support Chat Interface

```
┌──────────────────────────────────────────────────────┐
│  Chat Messages                                       │
│  ...                                                 │
└──────────────────────────────────────────────────────┘

Quick Action Buttons:
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 📞 Contact Us    │ │ 📊 Order Status  │ │ ❓ FAQs         │
└──────────────────┘ └──────────────────┘ └──────────────────┘
┌──────────────────┐ ┌──────────────────┐
│ 💳 Billing       │ │ 🔧 Troubleshoot  │
└──────────────────┘ └──────────────────┘

┌────────────────────────────────────────────┐ [🔼]
│ Ask anything...                            │
└────────────────────────────────────────────┘
```

### Documentation Assistant

```
┌──────────────────────────────────────────────────────┐
│  Chat Messages                                       │
│  ...                                                 │
└──────────────────────────────────────────────────────┘

Quick Action Buttons:
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 🚀 Get Started  │ │ 📚 API Docs     │ │ 🎥 Tutorials   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐
│ 💡 Examples     │ │ 🔍 Search Docs  │
└─────────────────┘ └─────────────────┘

┌────────────────────────────────────────────┐ [🔼]
│ Ask anything...                            │
└────────────────────────────────────────────┘
```

## Mobile Responsive Layout

### Desktop (Wide Screen)
```
┌────────────────────────────────────────────────────┐
│ 👕 T-shirts │ 👖 Jeans │ 👟 Shoes │ 📦 Shipping   │
│ ↩️ Returns  │ 📞 Support                           │
└────────────────────────────────────────────────────┘
```

### Tablet (Medium Screen)
```
┌────────────────────────────────────┐
│ 👕 T-shirts │ 👖 Jeans │ 👟 Shoes  │
│ 📦 Shipping │ ↩️ Returns            │
│ 📞 Support                         │
└────────────────────────────────────┘
```

### Mobile (Narrow Screen)
```
┌──────────────────────┐
│ 👕 T-shirts          │
│ 👖 Jeans             │
│ 👟 Shoes             │
│ 📦 Shipping          │
│ ↩️ Returns           │
│ 📞 Support           │
└──────────────────────┘
```

## Button States

### Default State
```
┌─────────────────────────────┐
│  👕 T-shirt Products        │
└─────────────────────────────┘
Normal appearance, clickable
```

### Hover State
```
┌─────────────────────────────┐
│  👕 T-shirt Products        │  ← Slightly dimmed (opacity: 0.8)
└─────────────────────────────┘
Cursor: pointer
```

### Disabled State (when chat is loading)
```
┌─────────────────────────────┐
│  👕 T-shirt Products        │  ← Grayed out, not clickable
└─────────────────────────────┘
Cursor: not-allowed
```

## Interaction Flow

```
1. User clicks button
   ┌─────────────────────────────┐
   │  👕 T-shirt Products        │  ← Click!
   └─────────────────────────────┘

2. Button text is inserted into input
   ┌────────────────────────────────────────────┐
   │ Show me information about t-shirt products │
   └────────────────────────────────────────────┘

3. User can edit before sending (or auto-send if enabled)
   ┌────────────────────────────────────────────┐ [Send]
   │ Show me information about t-shirt products │  ← Ready to send
   └────────────────────────────────────────────┘
```

## Admin Interface (Scripts Page)

### Quick Buttons Tab
```
┌─────────────────────────────────────────────────────┐
│  Customized Theme  │  Quick Buttons  │  Script      │
└─────────────────────────────────────────────────────┘
                           ▲
                       Active Tab

┌─────────────────────────────────────────────────────┐
│  Add New Button                                     │
│                                                     │
│  Button Label *           Emoji (Optional)         │
│  ┌─────────────────┐     ┌──────┐                 │
│  │ T-shirt Product │     │ 👕   │                 │
│  └─────────────────┘     └──────┘                 │
│                                                     │
│  Button Action Text *                              │
│  ┌──────────────────────────────────────────────┐ │
│  │ Show me information about t-shirt products   │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  [+ Add Quick Button]                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Your Quick Buttons (3)                             │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ 👕 T-shirt Product                      [🗑]│  │
│  │ Show me information about t-shirt products  │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ 📦 Shipping Info                        [🗑]│  │
│  │ What are the shipping options?              │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ ↩️ Return Policy                        [🗑]│  │
│  │ What is your return policy?                 │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [✓ Save Quick Buttons]                            │
└─────────────────────────────────────────────────────┘
```

## Integration with Existing Theme

The quick buttons automatically inherit and respect all theme settings:

### Theme Settings Applied to Buttons
1. **Primary Color** → Button background (or border for outline style)
2. **Button Style** → Border radius (rounded/square/outline)
3. **Theme Preset** → Text color (light/dark contrast)
4. **Font Style** → Text font family

### Example: Light Theme with Rounded Buttons
```css
/* Inherited from theme settings */
background-color: #6366f1;     /* from primary_color */
color: #ffffff;                /* light theme text */
border-radius: 9999px;         /* from button_style: 'rounded' */
font-family: 'Inter';          /* from font_style */
```

### Example: Dark Theme with Outline Buttons
```css
/* Inherited from theme settings */
background-color: transparent;
border: 2px solid #818cf8;    /* from primary_color */
color: #818cf8;                /* from primary_color */
border-radius: 0.5rem;         /* from button_style: 'outline' */
font-family: 'Poppins';        /* from font_style */
```

## Summary

The Quick Buttons appear as a horizontal row of styled buttons positioned directly above the chat input field. They adapt to the theme settings and wrap responsively on smaller screens. When clicked, they insert pre-defined text into the input field, making it easy for users to access common prompts without typing.

Visual hierarchy:
1. Chat messages (top)
2. **Quick buttons** (middle) ← NEW
3. Input field (bottom)
4. Footer text (bottom-most)
