# Quick Buttons Feature Documentation

## Overview
The Quick Buttons feature allows users to create custom action buttons that appear above the chat input in the chat-playground interface. These buttons provide quick access to commonly used prompts or queries.

## Features

### 1. **Quick Button Management (Scripts Page)**
- New "Quick Buttons" tab next to "Customized Theme" tab
- Add unlimited quick action buttons
- Each button contains:
  - **Label**: Display text (max 30 characters)
  - **Emoji**: Optional emoji icon (max 2 characters)
  - **Action Text**: Text that will be inserted when clicked (max 500 characters)
- Edit and delete existing buttons
- Preview before saving

### 2. **Button Display (Chat Playground)**
- Buttons appear above the chat input area
- Styled according to theme settings:
  - **Rounded**: Pill-shaped buttons (rounded-full)
  - **Square**: Sharp corners (rounded-none)
  - **Outline**: Transparent with colored border (rounded-lg + border)
  - **Default**: Standard rounded corners (rounded-lg)
- Colors match primary theme color
- Responsive layout with flex-wrap
- Disabled state when chat is loading

### 3. **User Interaction**
- Click button to insert text into input field
- Optionally auto-send (currently disabled, but can be enabled)
- Smooth integration with existing chat flow

## Database Schema

### Updated `script_settings` Table
```sql
CREATE TABLE script_settings (
    workspace_id VARCHAR PRIMARY KEY,
    theme_settings JSON NOT NULL,
    quick_buttons JSON,  -- NEW COLUMN
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Quick Button JSON Structure
```json
[
  {
    "id": "1698765432000",
    "label": "T-shirt Product",
    "text": "Show me information about t-shirt products",
    "emoji": "👕"
  },
  {
    "id": "1698765433000",
    "label": "Contact Us",
    "text": "How can I contact customer support?",
    "emoji": "📞"
  }
]
```

## API Changes

### GET `/api/script/<workspace_id>`
**Response:**
```json
{
  "workspace_id": "ws_123",
  "theme_settings": { ... },
  "quick_buttons": [
    {
      "id": "1698765432000",
      "label": "T-shirt Product",
      "text": "Show me information about t-shirt products",
      "emoji": "👕"
    }
  ],
  "created_at": "2025-10-25T10:00:00Z",
  "updated_at": "2025-10-25T12:00:00Z"
}
```

### POST `/api/script/<workspace_id>`
**Request:**
```json
{
  "theme_settings": { ... },
  "quick_buttons": [
    {
      "id": "1698765432000",
      "label": "T-shirt Product",
      "text": "Show me information about t-shirt products",
      "emoji": "👕"
    }
  ]
}
```

## Implementation Files

### Backend
1. **`server/models.py`**
   - Added `quick_buttons` JSON column to `ScriptSettings` model

2. **`server/script_routes.py`**
   - Updated GET endpoint to return `quick_buttons`
   - Updated POST endpoint to accept and save `quick_buttons`
   - Returns empty array `[]` if no buttons exist

### Frontend
1. **`client/src/pages/scripts-page.tsx`**
   - Added `QuickButton` interface
   - Added "Quick Buttons" tab with icon (Zap)
   - Created form to add new buttons (label, emoji, text)
   - Display list of existing buttons with delete option
   - Save quick buttons along with theme settings

2. **`client/src/pages/chat-playground.tsx`**
   - Added `QuickButton` interface
   - Fetch quick buttons from API
   - Display buttons above input area
   - Apply theme styling to buttons
   - Insert button text on click

## Migration

### Automatic Migration (with Flask-Migrate)
```bash
docker-compose exec backend flask db migrate -m "Add quick_buttons column"
docker-compose exec backend flask db upgrade
```

### Manual Migration
```bash
docker-compose exec backend psql -U nexus_user -d nexus_db -f /app/migrations/add_quick_buttons.sql
```

Or run the SQL directly:
```sql
ALTER TABLE script_settings 
ADD COLUMN IF NOT EXISTS quick_buttons JSON;
```

## Usage Examples

### Example 1: E-commerce Product Buttons
```javascript
const ecommerceButtons = [
  {
    id: "1",
    label: "T-shirt Products",
    text: "Show me all t-shirt products available",
    emoji: "👕"
  },
  {
    id: "2",
    label: "Shipping Info",
    text: "What are the shipping options and costs?",
    emoji: "📦"
  },
  {
    id: "3",
    label: "Return Policy",
    text: "What is your return and refund policy?",
    emoji: "↩️"
  }
];
```

### Example 2: Customer Support Buttons
```javascript
const supportButtons = [
  {
    id: "1",
    label: "Contact Us",
    text: "How can I reach customer support?",
    emoji: "📞"
  },
  {
    id: "2",
    label: "Order Status",
    text: "How do I check my order status?",
    emoji: "📊"
  },
  {
    id: "3",
    label: "FAQs",
    text: "Show me frequently asked questions",
    emoji: "❓"
  }
];
```

### Example 3: Documentation Buttons
```javascript
const docButtons = [
  {
    id: "1",
    label: "Getting Started",
    text: "How do I get started with this platform?",
    emoji: "🚀"
  },
  {
    id: "2",
    label: "API Docs",
    text: "Show me the API documentation",
    emoji: "📚"
  },
  {
    id: "3",
    label: "Tutorials",
    text: "Are there any video tutorials available?",
    emoji: "🎥"
  }
];
```

## Button Styling Based on Theme

### Light Theme + Rounded Style
```css
background: #6366f1;
color: #ffffff;
border-radius: 9999px;
```

### Dark Theme + Outline Style
```css
background: transparent;
color: #818cf8;
border: 2px solid #818cf8;
border-radius: 0.5rem;
```

### Minimal Theme + Square Style
```css
background: #000000;
color: #ffffff;
border-radius: 0;
```

## Best Practices

1. **Keep Labels Short**: Max 30 characters for better mobile display
2. **Use Clear Emojis**: Choose emojis that clearly represent the action
3. **Write Complete Prompts**: Action text should be a complete, clear prompt
4. **Limit Button Count**: 3-6 buttons recommended for optimal UX
5. **Test on Mobile**: Ensure buttons wrap properly on small screens
6. **Consistent Naming**: Use consistent terminology across buttons

## Future Enhancements

Potential improvements for future versions:

1. **Auto-send Option**: Add toggle to automatically send on button click
2. **Button Categories**: Group buttons into categories (Support, Products, etc.)
3. **Button Analytics**: Track which buttons are clicked most
4. **Button Ordering**: Drag-and-drop to reorder buttons
5. **Conditional Display**: Show buttons based on user state or context
6. **Button Templates**: Pre-built button sets for common use cases
7. **Multi-language Support**: Different button sets per language
8. **Button Icons**: Support for custom icon libraries beyond emojis

## Troubleshooting

### Buttons Not Appearing
1. Check if quick_buttons are saved in database
2. Verify client_id parameter is passed in iframe URL
3. Check browser console for API errors
4. Ensure quick_buttons is not null in database

### Buttons Not Styled Correctly
1. Verify theme_settings are loaded
2. Check button_style value in theme_settings
3. Inspect CSS classes applied to buttons
4. Check for conflicting CSS in parent application

### Database Migration Failed
1. Check PostgreSQL connection
2. Verify script_settings table exists
3. Run migration manually with SQL file
4. Check for existing quick_buttons column

## Testing

### Manual Testing Steps
1. Navigate to Scripts page
2. Click "Quick Buttons" tab
3. Add a new button with label, emoji, and text
4. Click "Save Quick Buttons"
5. Open Scripts tab and view iframe preview
6. Verify buttons appear above input
7. Click button and verify text is inserted
8. Test with different theme styles (rounded, square, outline)

### API Testing
```bash
# Get script settings
curl -X GET http://localhost:5000/api/script/ws_123

# Save quick buttons
curl -X POST http://localhost:5000/api/script/ws_123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "theme_settings": {...},
    "quick_buttons": [
      {
        "id": "1",
        "label": "Test Button",
        "text": "This is a test",
        "emoji": "🧪"
      }
    ]
  }'
```

## Security Considerations

1. **Input Validation**: 
   - Label max length: 30 chars
   - Text max length: 500 chars
   - Emoji max length: 2 chars

2. **XSS Prevention**:
   - All user input is escaped in React
   - No innerHTML usage
   - Safe emoji rendering

3. **Authorization**:
   - POST endpoint requires authentication
   - Workspace validation on save
   - User must own workspace to modify

4. **Data Storage**:
   - JSON validation on backend
   - Schema validation for button structure
   - Safe database queries with parameterization

## Performance Considerations

1. **Load Time**: Quick buttons fetched with theme settings (single API call)
2. **Render Performance**: Buttons rendered only when array has items
3. **Button Limit**: No enforced limit, but 10-15 buttons recommended
4. **Caching**: Consider implementing browser cache for quick_buttons

## Accessibility

1. **Keyboard Navigation**: Buttons are focusable and keyboard-accessible
2. **Screen Readers**: Proper ARIA labels on buttons
3. **Color Contrast**: Theme colors should meet WCAG AA standards
4. **Focus Indicators**: Visible focus states on buttons

## Summary

The Quick Buttons feature provides a powerful way for users to customize their chat interface with frequently used prompts. It seamlessly integrates with the existing theme system and provides a consistent user experience across different button styles and color schemes.

Key benefits:
- ✅ Improves user efficiency
- ✅ Reduces typing for common queries
- ✅ Customizable per workspace
- ✅ Styled to match theme
- ✅ Easy to manage and update
- ✅ Mobile-responsive design
