# Quick Buttons - Quick Start Guide

## What are Quick Buttons?

Quick Buttons are customizable action buttons that appear above your chat input, allowing your users to quickly access common prompts with a single click. Perfect for e-commerce product inquiries, customer support FAQs, or any frequently asked questions!

## Setup in 3 Easy Steps

### Step 1: Navigate to Scripts Page
1. Log in to your Nexus AI Hub dashboard
2. Click on the **Scripts** icon in the left sidebar (looks like `</>`)
3. If you haven't generated a script yet, click **"Generate Script"**

### Step 2: Create Your Quick Buttons
1. Click on the **"Quick Buttons"** tab (⚡ icon)
2. Fill in the form:
   - **Button Label**: Short display text (e.g., "T-shirt Product")
   - **Emoji** (Optional): Add a visual icon (e.g., 👕)
   - **Button Action Text**: The full prompt that will be inserted (e.g., "Show me information about t-shirt products")
3. Click **"Add Quick Button"**
4. Repeat for each button you want to add
5. Click **"Save Quick Buttons"** when done

### Step 3: Preview Your Buttons
1. Go to the **"Script"** tab
2. Scroll to the preview section
3. You'll see your quick buttons appear above the chat input
4. Click any button to test it!

## Example Use Cases

### 🛍️ E-commerce Store
```
Button 1:
Label: "T-shirt Products"
Emoji: 👕
Text: "Show me all available t-shirt products"

Button 2:
Label: "Shipping Info"
Emoji: 📦
Text: "What are your shipping options and delivery times?"

Button 3:
Label: "Return Policy"
Emoji: ↩️
Text: "What is your return and refund policy?"
```

### 📞 Customer Support
```
Button 1:
Label: "Contact Us"
Emoji: 📞
Text: "How can I reach customer support?"

Button 2:
Label: "Order Status"
Emoji: 📊
Text: "How do I check my order status?"

Button 3:
Label: "FAQs"
Emoji: ❓
Text: "Show me frequently asked questions"
```

### 📚 Documentation Site
```
Button 1:
Label: "Get Started"
Emoji: 🚀
Text: "How do I get started with this platform?"

Button 2:
Label: "API Documentation"
Emoji: 📚
Text: "Show me the API documentation and examples"

Button 3:
Label: "Video Tutorials"
Emoji: 🎥
Text: "Are there any video tutorials available?"
```

## Button Styling

Your quick buttons automatically match your customized theme!

### Choose Your Button Style:
1. Go to **"Customized Theme"** tab
2. Under **"Button Style"**, select:
   - **Rounded**: Pill-shaped buttons (smooth, modern)
   - **Square**: Sharp corners (professional, clean)
   - **Outline**: Transparent with border (minimal, elegant)

### Your buttons will automatically use:
- ✅ Your primary color for background
- ✅ Your chosen button style for shape
- ✅ Your font style for text
- ✅ Light/dark contrast based on your theme preset

## Best Practices

### ✅ DO:
- Keep button labels short and clear (2-4 words)
- Use descriptive emojis that match the action
- Write complete, clear prompts for action text
- Test your buttons before deploying
- Use 3-6 buttons for optimal user experience

### ❌ DON'T:
- Create too many buttons (becomes overwhelming)
- Use long, confusing labels
- Write vague or incomplete prompts
- Forget to save after adding buttons
- Use inappropriate or confusing emojis

## Tips for Success

1. **Think Like Your Users**: What questions do they ask most often?
2. **Be Specific**: Each button should serve a clear, distinct purpose
3. **Update Regularly**: Review and update buttons based on actual usage
4. **Mobile-Friendly**: Keep labels short for better mobile display
5. **Visual Clarity**: Choose emojis that clearly represent the action

## How It Looks to Your Users

When your users visit your embedded chat:

```
┌──────────────────────────────────────┐
│  Chat conversation here...           │
│                                      │
└──────────────────────────────────────┘

  👕 T-shirts   📦 Shipping   ↩️ Returns    ← Your quick buttons

┌──────────────────────────┐ [Send]
│ Ask anything...          │
└──────────────────────────┘
```

When they click a button:
1. The button's action text is inserted into the input field
2. They can edit it if needed
3. They click send to get their answer

## Troubleshooting

### My buttons aren't showing up
1. Make sure you clicked **"Save Quick Buttons"**
2. Refresh your preview iframe
3. Check that you've added at least one button

### Buttons look different than expected
1. Check your theme settings in **"Customized Theme"** tab
2. Verify your button style selection (rounded/square/outline)
3. Make sure your theme is saved

### I want to remove a button
1. Go to **"Quick Buttons"** tab
2. Click the trash icon (🗑) next to the button
3. Click **"Save Quick Buttons"**

### I want to edit a button
1. Currently, you need to delete and recreate the button
2. Future update: In-place editing coming soon!

## Database Migration Required

⚠️ **Important**: Before using this feature, make sure to run the database migration:

### If using Docker:
```bash
docker-compose exec backend flask db migrate -m "Add quick_buttons column"
docker-compose exec backend flask db upgrade
```

### Manual migration:
```bash
docker-compose exec backend psql -U nexus_user -d nexus_db
```
Then run:
```sql
ALTER TABLE script_settings ADD COLUMN IF NOT EXISTS quick_buttons JSON;
```

## Advanced: Auto-Send Feature

Currently, clicking a button inserts text into the input field, allowing users to edit before sending.

**Want buttons to auto-send?**

In `chat-playground.tsx`, change this line:
```typescript
// Current (insert only):
setInput(button.text);

// Change to (auto-send):
sendMessage(button.text);
```

## Need Help?

- 📖 Full documentation: `QUICK_BUTTONS_FEATURE.md`
- 🎨 Visual examples: `QUICK_BUTTONS_VISUAL_REFERENCE.md`
- 💻 Technical details: See code comments in the files

## Summary

Quick Buttons make your AI chat more user-friendly by providing instant access to common questions. Set them up once, and your users will enjoy a faster, more efficient chat experience!

**Ready to get started?**
1. Go to Scripts page
2. Click "Quick Buttons" tab
3. Add your first button
4. Save and test!

Happy chatting! 🚀
