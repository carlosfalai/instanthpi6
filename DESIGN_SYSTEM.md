# InstantHPI Design System
**Based on Linear's Interface Aesthetic**

## 🎨 Color Palette

### Backgrounds
```css
--bg-primary: #0d0d0d;        /* Main background (almost black) */
--bg-secondary: #1a1a1a;      /* Cards, sidebar */
--bg-tertiary: #222222;       /* Hover states */
--bg-elevated: #2a2a2a;       /* Elevated elements */
```

### Borders
```css
--border-subtle: #2a2a2a;     /* Subtle dividers */
--border-default: #333333;    /* Default borders */
--border-strong: #444444;     /* Emphasized borders */
```

### Text
```css
--text-primary: #e6e6e6;      /* Primary text (light gray) */
--text-secondary: #999999;    /* Secondary text (medium gray) */
--text-tertiary: #666666;     /* Tertiary text (dark gray) */
--text-disabled: #4d4d4d;     /* Disabled text */
```

### Accents (Use Sparingly)
```css
--accent-purple: #8b5cf6;     /* Purple - primary actions */
--accent-blue: #3b82f6;       /* Blue - info */
--accent-green: #10b981;      /* Green - success/online */
--accent-red: #ef4444;        /* Red - errors/urgent */
--accent-amber: #f59e0b;      /* Amber - warnings */
```

---

## 📐 Layout Structure

### Sidebar Navigation (Doctor Pages)
```
┌─────────────┬──────────────────────────────┐
│             │                              │
│   SIDEBAR   │      MAIN CONTENT            │
│   (256px)   │      (flex-1)                │
│             │                              │
│   • Logo    │   Header                     │
│   • Nav     │   ┌────────────────────┐     │
│   • Links   │   │  Content Cards     │     │
│             │   └────────────────────┘     │
│             │                              │
└─────────────┴──────────────────────────────┘
```

**Sidebar Specifications:**
- Width: `256px` (64 * 4 = w-64)
- Background: `#1a1a1a`
- Border: `1px solid #333` on right
- Padding: `24px` (p-6)
- Logo at top with icon + text
- Nav items: `12px gap` between items
- Active state: `bg-[#222]` with border
- Hover: `bg-[#222]/50`

### Top Navigation (Patient Pages - Exception)
```
┌──────────────────────────────────────┐
│           TOP NAV (h-14)             │
├──────────────────────────────────────┤
│                                      │
│         MAIN CONTENT                 │
│                                      │
└──────────────────────────────────────┘
```

**Patient pages use light theme (#E6E0F2) BUT with consistent components**

---

## 🔤 Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
```

### Font Sizes
```css
--text-xs: 0.75rem;    /* 12px - labels, metadata */
--text-sm: 0.875rem;   /* 14px - body text */
--text-base: 1rem;     /* 16px - default */
--text-lg: 1.125rem;   /* 18px - section headings */
--text-xl: 1.25rem;    /* 20px - page headings */
--text-2xl: 1.5rem;    /* 24px - main titles */
```

### Font Weights
```css
--font-normal: 400;     /* Body text */
--font-medium: 500;     /* Headings, emphasis */
--font-semibold: 600;   /* Strong emphasis */
```

### Usage
- **Headings:** `font-medium` (500 weight)
- **Body text:** `text-sm` (14px)
- **Labels:** `text-xs` (12px) with `text-[#666]`
- **Metadata:** `text-xs` with `uppercase` + `tracking-wider`

---

## 🧩 Components

### Buttons

**Primary Button**
```tsx
<button className="
  px-4 py-2 
  bg-[#1a1a1a] 
  border border-[#333] 
  text-[#e6e6e6] 
  rounded-md 
  hover:bg-[#222] 
  transition-colors 
  text-sm font-medium
">
  Button Text
</button>
```

**Icon Button**
```tsx
<button className="
  w-8 h-8 
  flex items-center justify-center 
  bg-[#1a1a1a] 
  border border-[#333] 
  rounded-md 
  hover:bg-[#222]
">
  <Icon className="w-4 h-4 text-[#999]" />
</button>
```

**Ghost Button** (for sidebar nav)
```tsx
<button className="
  flex items-center gap-3 
  px-3 py-2.5 
  text-[#999] 
  hover:text-[#e6e6e6] 
  hover:bg-[#222]/50 
  rounded-md 
  w-full text-left 
  transition-all
">
  <Icon className="w-4 h-4" />
  <span className="text-sm">Label</span>
</button>
```

**Active Nav Button**
```tsx
<button className="
  flex items-center gap-3 
  px-3 py-2.5 
  bg-[#222] 
  text-[#e6e6e6] 
  border border-[#2a2a2a] 
  rounded-md 
  w-full text-left
">
  <Icon className="w-4 h-4" />
  <span className="text-sm font-medium">Active</span>
</button>
```

### Cards

**Default Card**
```tsx
<div className="
  bg-[#1a1a1a] 
  border border-[#2a2a2a] 
  rounded-lg 
  p-6 
  hover:bg-[#1a1a1a]/80 
  transition-colors
">
  Content
</div>
```

**Elevated Card** (for modals/dialogs)
```tsx
<div className="
  bg-[#1a1a1a] 
  border border-[#333] 
  rounded-xl 
  p-8 
  shadow-lg
">
  Content
</div>
```

### Inputs

**Text Input**
```tsx
<input className="
  w-full 
  px-3 py-2 
  bg-[#1a1a1a] 
  border border-[#333] 
  text-[#e6e6e6] 
  placeholder:text-[#666] 
  rounded-md 
  text-sm 
  focus:outline-none 
  focus:ring-2 
  focus:ring-[#8b5cf6] 
  focus:border-transparent
" />
```

**Search Input** (with icon)
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
  <input className="
    pl-10 pr-4 py-2 
    bg-[#1a1a1a] 
    border border-[#333] 
    text-[#e6e6e6] 
    rounded-md 
    text-sm
    w-64
  " />
</div>
```

### Badges

**Status Badge**
```tsx
<span className="
  inline-flex items-center 
  px-2.5 py-0.5 
  bg-[#222] 
  border border-[#2a2a2a] 
  rounded-full 
  text-xs font-medium 
  text-[#999]
">
  Status
</span>
```

**Count Badge**
```tsx
<span className="
  inline-flex items-center justify-center 
  w-5 h-5 
  bg-[#222] 
  rounded-full 
  text-xs font-medium 
  text-[#e6e6e6]
">
  2
</span>
```

### Dividers

**Horizontal Divider**
```tsx
<div className="border-t border-[#2a2a2a]"></div>
```

**Section Separator** (with label)
```tsx
<div className="border-t border-[#333] pt-6 mt-6">
  <p className="text-xs font-medium text-[#666] uppercase tracking-wider mb-3">
    Section Label
  </p>
</div>
```

---

## 📏 Spacing System

### Padding/Margin Scale (Tailwind)
```
p-1  = 4px     (0.25rem)
p-2  = 8px     (0.5rem)
p-3  = 12px    (0.75rem)
p-4  = 16px    (1rem)
p-6  = 24px    (1.5rem)
p-8  = 32px    (2rem)
p-12 = 48px    (3rem)
```

### Container Spacing
- **Page padding:** `p-6` (24px)
- **Card padding:** `p-6` (24px) or `p-4` (16px) for compact
- **Sidebar padding:** `p-6` (24px)
- **Stack gaps:** `space-y-6` (24px) for sections, `space-y-4` (16px) for items

---

## 🎭 Interaction States

### Hover States
```css
/* Default hover */
hover:bg-[#222]

/* Subtle hover (for already visible elements) */
hover:bg-[#222]/50

/* Border highlight on hover */
hover:border-[#444]
```

### Active/Selected States
```css
/* Active item */
bg-[#222] 
border-[#2a2a2a]
text-[#e6e6e6]

/* Selected row/item */
bg-[#222] 
border-l-2 border-l-[#8b5cf6]
```

### Focus States
```css
focus:outline-none 
focus:ring-2 
focus:ring-[#8b5cf6] 
focus:border-transparent
```

### Disabled States
```css
disabled:opacity-50 
disabled:cursor-not-allowed 
disabled:hover:bg-[current]
```

---

## 🚫 Anti-Patterns (DO NOT USE)

### ❌ Rainbow Colors
```css
/* WRONG - Different color for each button */
<button className="bg-blue-600">Action 1</button>
<button className="bg-purple-600">Action 2</button>
<button className="bg-green-500">Action 3</button>
<button className="bg-yellow-600">Action 4</button>
```

**Why:** Creates "clown aesthetic" - unprofessional and distracting

**Instead:** Use consistent `bg-[#1a1a1a]` with accent colors ONLY for specific states (success, error, warning)

### ❌ Mixed Navigation Patterns
```css
/* WRONG - Both top nav AND sidebar nav on same page */
```

**Why:** Confusing and inconsistent

**Instead:** Pick one pattern per portal (sidebar for doctor, top for patient)

### ❌ Too Many Background Colors
```css
/* WRONG - Using 15+ different background shades */
```

**Why:** Creates visual noise and inconsistency

**Instead:** Stick to 4-5 core backgrounds: #0d0d0d, #1a1a1a, #222, #2a2a2a, #333

---

## 📱 Responsive Behavior

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Sidebar on Mobile
- Hide sidebar by default
- Show hamburger menu icon
- Sidebar slides in as overlay when opened
- Backdrop overlay when sidebar open

### Layout Adjustments
```tsx
{/* Desktop: Sidebar + Content */}
<div className="hidden lg:flex">
  <Sidebar />
</div>

{/* Mobile: Hamburger menu */}
<button className="lg:hidden">
  <Menu className="w-6 h-6" />
</button>
```

---

## 🎯 Page Templates

### Doctor Dashboard Template
```tsx
<div className="min-h-screen bg-[#0d0d0d] flex">
  {/* Sidebar */}
  <aside className="w-64 bg-[#1a1a1a] border-r border-[#333]">
    <div className="p-6">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-[#e6e6e6]">InstantHPI</h1>
        <p className="text-xs text-[#666]">Medical Platform</p>
      </div>
      
      {/* Navigation */}
      <nav className="space-y-1">
        {/* Nav items here */}
      </nav>
    </div>
  </aside>

  {/* Main Content */}
  <main className="flex-1 bg-[#0d0d0d]">
    <div className="p-6">
      {/* Page content */}
    </div>
  </main>
</div>
```

### Patient Page Template (Light Theme Exception)
```tsx
<div className="min-h-screen bg-[#E6E0F2]">
  {/* Top Navigation */}
  <header className="bg-white border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Header content */}
    </div>
  </header>

  {/* Main Content */}
  <main className="max-w-7xl mx-auto px-4 py-8">
    {/* Use consistent card/button components from design system */}
    {/* Just with light background */}
  </main>
</div>
```

---

## ✅ Implementation Checklist

### For Each Page:

- [ ] **Background:** `bg-[#0d0d0d]` for doctor pages (or `#E6E0F2` for patient)
- [ ] **Sidebar:** 256px wide, `bg-[#1a1a1a]`, right border `#333`
- [ ] **Navigation:** Ghost buttons, active state with `bg-[#222]`
- [ ] **Cards:** `bg-[#1a1a1a]`, border `#2a2a2a`, rounded corners
- [ ] **Buttons:** Consistent styling, no rainbow colors
- [ ] **Text:** `text-[#e6e6e6]` primary, `text-[#999]` secondary
- [ ] **Inputs:** `bg-[#1a1a1a]`, border `#333`, purple focus ring
- [ ] **Spacing:** Use 16px/24px/32px increments
- [ ] **Typography:** 14px body, 12px labels, font-medium for headings
- [ ] **Icons:** 16px (w-4 h-4) for inline, 20px (w-5 h-5) for emphasis
- [ ] **Hover states:** `hover:bg-[#222]` consistently
- [ ] **No mixed patterns:** One nav style per section

---

## 🔄 Migration Guide

### Step 1: Update Layout Structure
```tsx
// OLD (inconsistent)
<div className="min-h-screen bg-gray-950">

// NEW (Linear style)
<div className="min-h-screen bg-[#0d0d0d] flex">
```

### Step 2: Replace Buttons
```tsx
// OLD (rainbow colors)
<button className="bg-blue-600">Action</button>

// NEW (monochromatic)
<button className="bg-[#1a1a1a] border border-[#333] text-[#e6e6e6] hover:bg-[#222]">
  Action
</button>
```

### Step 3: Update Cards
```tsx
// OLD
<div className="bg-gray-900 border-gray-800">

// NEW
<div className="bg-[#1a1a1a] border-[#2a2a2a]">
```

### Step 4: Standardize Text Colors
```tsx
// OLD (various grays)
<p className="text-gray-400">Text</p>

// NEW (design system)
<p className="text-[#999]">Text</p>
```

---

## 🧪 Testing

Use the Playwright layout audit:
```bash
npx playwright test layout-universalization
```

This will:
- Screenshot all pages
- Extract color palettes
- Detect layout patterns
- Flag inconsistencies
- Generate HTML report

---

## 📚 Resources

- **Linear App:** [linear.app](https://linear.app) (reference)
- **GitHub UI:** Similar dark aesthetic
- **Tailwind Docs:** [tailwindcss.com](https://tailwindcss.com)
- **Color Picker:** Use exact hex values (#0d0d0d, #1a1a1a, etc.)

---

**Last Updated:** October 8, 2025  
**Version:** 1.0  
**Status:** ✅ Active Design System

