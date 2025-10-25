# Chat Playground - Rich Content Rendering

## Overview

Enhanced the chat playground to properly render rich content including images, tables, lists, code blocks, and custom markdown formatting in AI responses. This enables card-like product displays, formatted tables, and structured content presentation.

---

## Features Implemented

### ✅ 1. Image Rendering with Card-Like Styling

**Features**:
- Rounded corners with shadow effects
- Responsive max-width (100%)
- Lazy loading for performance
- Error handling with fallback image
- Border styling for visual separation
- Inline-block display for proper spacing

**Example Response**:
```markdown
![Product 1](https://example.com/product1.jpg)

**Product 1**
This is a sample description for product 1.

---

![Product 2](https://example.com/product2.jpg)

**Product 2**
This is a sample description for product 2.
```

**Rendered As**:
- Images with rounded borders and shadows
- Product titles in bold white text
- Descriptions with proper spacing
- Horizontal rules as visual separators

---

### ✅ 2. Table Rendering

**Features**:
- Responsive overflow container
- Bordered cells with proper spacing
- Header row with dark background
- Alternating row hover effects
- Full-width tables with min-width

**Example Response**:
```markdown
| Product | Price | Stock |
|---------|-------|-------|
| Item 1  | $10   | 50    |
| Item 2  | $15   | 30    |
| Item 3  | $20   | 20    |
```

**Styling**:
- Dark header background (`#2f2f2f`)
- Border on all cells (`border-slate-600`)
- Padding: 3px per cell
- Overflow scroll for wide tables

---

### ✅ 3. Code Blocks

**Features**:
- Syntax-aware rendering
- Dark background with borders
- Inline code vs block code differentiation
- Overflow scroll for long code
- Rounded corners

**Example Response**:
````markdown
Here's a code example:

```javascript
function hello() {
  console.log("Hello, World!");
}
```

Or inline code: `console.log("test")`
````

**Styling**:
- Block code: Dark background, padded, scrollable
- Inline code: Subtle background, indigo accent color
- Border on code blocks for definition

---

### ✅ 4. Lists (Ordered & Unordered)

**Features**:
- Proper indentation (6px padding-left)
- Disc bullets for unordered lists
- Decimal numbers for ordered lists
- Consistent spacing between items

**Example Response**:
```markdown
Features:
- Fast performance
- Easy to use
- Highly customizable

Steps:
1. Install the package
2. Configure settings
3. Run the application
```

---

### ✅ 5. Custom Components

All markdown elements have custom renderers:

#### Images
```tsx
img: ({node, ...props}) => (
  <div className="my-4 inline-block">
    <img 
      src={src}
      alt={alt || 'Image'}
      className="rounded-lg shadow-lg max-w-full h-auto border border-slate-700"
      loading="lazy"
      onError={(e) => {
        // Fallback to placeholder
      }}
    />
  </div>
)
```

#### Tables
```tsx
table: ({node, ...props}) => (
  <div className="overflow-x-auto my-4 rounded-lg border border-slate-700">
    <table {...props} className="min-w-full border-collapse" />
  </div>
)
```

#### Code Blocks
```tsx
code: ({node, inline, className, children, ...props}) => {
  return !inline ? (
    <pre className="bg-[#2f2f2f] p-4 rounded-lg overflow-x-auto my-4 border border-slate-700">
      <code className={className} {...props}>
        {children}
      </code>
    </pre>
  ) : (
    <code className="bg-[#2f2f2f] px-1.5 py-0.5 rounded text-sm text-indigo-300">
      {children}
    </code>
  );
}
```

#### Links
```tsx
a: ({node, ...props}) => (
  <a 
    {...props} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-blue-400 hover:text-blue-300 hover:underline transition-colors" 
  />
)
```

#### Headings
```tsx
h1: ({node, ...props}) => (
  <h1 {...props} className="text-2xl font-bold text-white mt-6 mb-4" />
)
h2: ({node, ...props}) => (
  <h2 {...props} className="text-xl font-bold text-white mt-5 mb-3" />
)
h3: ({node, ...props}) => (
  <h3 {...props} className="text-lg font-semibold text-white mt-4 mb-2" />
)
```

#### Blockquotes
```tsx
blockquote: ({node, ...props}) => (
  <blockquote 
    {...props} 
    className="border-l-4 border-indigo-500 pl-4 italic my-4 text-slate-300" 
  />
)
```

#### Horizontal Rules
```tsx
hr: ({node, ...props}) => (
  <hr {...props} className="border-slate-600 my-6" />
)
```

---

## Enhanced Prose Styling

Applied comprehensive Tailwind prose modifiers:

```tsx
className={cn(
  "prose prose-invert max-w-none text-[15px] leading-7",
  
  // Images
  "prose-img:rounded-lg prose-img:shadow-lg prose-img:my-4 prose-img:max-w-full prose-img:h-auto",
  
  // Headings
  "prose-headings:font-semibold prose-headings:text-white",
  
  // Paragraphs
  "prose-p:text-slate-200 prose-p:my-2",
  
  // Links
  "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline",
  
  // Strong/Bold
  "prose-strong:text-white prose-strong:font-semibold",
  
  // Lists
  "prose-ul:list-disc prose-ul:pl-6 prose-ul:my-3",
  "prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-3",
  "prose-li:text-slate-200 prose-li:my-1",
  
  // Blockquotes
  "prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4",
  
  // Code
  "prose-code:bg-[#2f2f2f] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-slate-200",
  "prose-pre:bg-[#2f2f2f] prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4",
  
  // Tables
  "prose-table:border-collapse prose-table:w-full prose-table:my-4",
  "prose-thead:bg-[#2f2f2f]",
  "prose-th:border prose-th:border-slate-600 prose-th:bg-[#2f2f2f] prose-th:p-3 prose-th:text-left prose-th:font-semibold",
  "prose-td:border prose-td:border-slate-600 prose-td:p-3",
  "prose-tr:border-b prose-tr:border-slate-700",
  
  // Horizontal Rules
  "prose-hr:border-slate-600 prose-hr:my-6"
)}
```

---

## Example Use Cases

### 1. Product Cards

**AI Response**:
```markdown
Here are the products:

---

![Product 1](https://example.com/product1.jpg)

**Product 1**
This is a sample description for product 1.
Price: $99.99

---

![Product 2](https://example.com/product2.jpg)

**Product 2**
This is a sample description for product 2.
Price: $149.99
```

**Renders As**:
- Card-like layout with images
- Bold product names
- Separated by horizontal rules
- Professional spacing

---

### 2. Comparison Tables

**AI Response**:
```markdown
Feature comparison:

| Feature | Basic | Pro | Enterprise |
|---------|-------|-----|------------|
| Users | 5 | 50 | Unlimited |
| Storage | 10GB | 100GB | 1TB |
| Support | Email | Priority | 24/7 |
| Price | $9 | $49 | $199 |
```

**Renders As**:
- Formatted table with borders
- Header row highlighted
- Responsive scrolling
- Professional styling

---

### 3. Step-by-Step Guides

**AI Response**:
```markdown
# How to Setup

Follow these steps:

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Configure your environment:
   - Create `.env` file
   - Add API keys
   - Set database URL

3. Run the application:
   ```bash
   npm start
   ```

> **Note**: Make sure you have Node.js v18+ installed.
```

**Renders As**:
- Large heading
- Numbered steps
- Code blocks with syntax
- Nested bullets
- Highlighted note (blockquote)

---

### 4. Lists with Rich Content

**AI Response**:
```markdown
Available features:

- **Fast Performance**: Optimized for speed
- **Easy Integration**: Simple API
- **Secure**: End-to-end encryption
- **Scalable**: Handles millions of requests

Next steps:
1. Sign up for an account
2. Generate API key
3. Read the documentation
4. Start building!
```

**Renders As**:
- Bulleted list with bold labels
- Numbered instructions
- Proper spacing and indentation

---

## Error Handling

### Image Load Failures

When an image fails to load, it's replaced with a placeholder SVG:

```typescript
onError={(e) => {
  const target = e.target as HTMLImageElement;
  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"...';
}}
```

**Fallback Image**:
- Gray background
- "Image not found" text
- Maintains layout integrity

---

## Performance Optimizations

### 1. Lazy Loading
```tsx
<img loading="lazy" ... />
```
- Images load only when visible
- Reduces initial page load
- Better performance for long conversations

### 2. Responsive Images
```tsx
className="max-w-full h-auto"
```
- Prevents overflow
- Maintains aspect ratio
- Mobile-friendly

### 3. Overflow Handling
```tsx
className="overflow-x-auto"
```
- Tables scroll horizontally on mobile
- Code blocks scroll for long lines
- No layout breaking

---

## Browser Support

### ReactMarkdown Features
- ✅ Markdown parsing
- ✅ GFM (GitHub Flavored Markdown)
- ✅ Custom component rendering
- ✅ Inline HTML (with sanitization)

### CSS Features
- ✅ Tailwind prose classes
- ✅ Custom component styles
- ✅ Responsive design
- ✅ Dark theme compatibility

---

## Technical Details

### Dependencies Used
- `react-markdown`: Markdown parsing and rendering
- `remark-gfm`: GitHub Flavored Markdown support (tables, strikethrough, etc.)
- `rehype-raw`: Allows HTML tags in markdown (for `<img>` tags)
- `rehype-sanitize`: Sanitizes HTML to prevent XSS attacks

### Configuration
```tsx
<ReactMarkdown 
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeRaw, rehypeSanitize]}  // Enable HTML parsing
  components={{
    // Custom renderers for all elements
  }}
>
  {message.content}
</ReactMarkdown>
```

**Key Plugins**:
- `remarkGfm`: Enables GitHub Flavored Markdown (tables, task lists, strikethrough)
- `rehypeRaw`: Parses HTML tags like `<img>`, `<br>`, `<div>` in markdown
- `rehypeSanitize`: Sanitizes HTML to prevent XSS attacks (security)

---

## Testing Scenarios

### Test 1: Product Cards Response

**Prompt**: "Show me 3 products with images"

**Expected Response Format**:
```markdown
![Product](image-url) **Name** Description
```

**Expected Render**:
- Images with rounded borders
- Bold product names
- Card-like appearance

### Test 2: Table Response

**Prompt**: "Compare pricing plans in a table"

**Expected Response Format**:
```markdown
| Plan | Price | Features |
|------|-------|----------|
| ... | ... | ... |
```

**Expected Render**:
- Bordered table
- Dark header row
- Scrollable on mobile

### Test 3: Code Examples

**Prompt**: "Show me a code example"

**Expected Response Format**:
````markdown
```javascript
code here
```
````

**Expected Render**:
- Syntax-highlighted block
- Dark background
- Scrollable if long

---

## Future Enhancements

### Possible Additions

1. **Syntax Highlighting**
   - Use `prism-react-renderer` or `highlight.js`
   - Color-coded code blocks
   - Language-specific formatting

2. **Mermaid Diagrams**
   - Render flowcharts, sequence diagrams
   - Use `react-mermaid` component
   - Inline diagram support

3. **LaTeX Math**
   - Render mathematical equations
   - Use `remark-math` + `rehype-katex`
   - Display formulas beautifully

4. **Interactive Components**
   - Collapsible sections
   - Tabs for code examples
   - Copy-to-clipboard buttons

5. **Image Galleries**
   - Lightbox for full-size images
   - Image carousels
   - Grid layouts for multiple images

---

## Styling Guidelines

### Color Palette
- Background: `#2f2f2f` (dark gray)
- Border: `#565869`, `border-slate-600`, `border-slate-700`
- Text: `text-slate-200`, `text-white`
- Accent: `text-blue-400`, `text-indigo-300`, `border-indigo-500`
- Hover: `hover:text-blue-300`, `hover:bg-[#40414f]`

### Spacing
- Images: `my-4` (1rem top/bottom)
- Tables: `my-4`, `p-3` (cells)
- Code: `my-4`, `p-4` (blocks)
- Lists: `my-3`, `pl-6`
- Headings: `mt-4`, `mb-2` (varies by level)

### Borders
- Images: `border-slate-700`
- Tables: `border-slate-600`
- Code blocks: `border-slate-700`
- Blockquotes: `border-l-4 border-indigo-500`

---

## Conclusion

The chat playground now fully supports rich content rendering including:

✅ **Images** with card-like styling and error handling  
✅ **Tables** with responsive containers and borders  
✅ **Code blocks** with syntax awareness  
✅ **Lists** with proper formatting  
✅ **Links** opening in new tabs  
✅ **Headings** with size hierarchy  
✅ **Blockquotes** with left border accent  
✅ **Horizontal rules** as separators  

All elements are styled consistently with the dark theme, ensuring a professional and readable chat experience. The implementation handles both streaming and non-streaming responses, maintaining rich formatting in all cases.
