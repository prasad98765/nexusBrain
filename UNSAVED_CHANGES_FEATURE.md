# Unsaved Changes Detection Feature

## Overview
Added unsaved changes detection to the Scripts page that alerts users when they have modified settings without saving.

## Implementation Details

### New State Variables
- `hasUnsavedChanges`: Boolean flag indicating if there are unsaved changes
- `savedThemeSettings`: Stores the last saved theme settings for comparison
- `savedQuickButtons`: Stores the last saved quick buttons for comparison
- `savedModelConfig`: Stores the last saved model configuration for comparison

### How It Works

1. **Initial State Capture**
   - When settings are loaded from the server, they are stored in both current and "saved" state variables
   - This happens in the `useEffect` that responds to `scriptSettings` changes

2. **Change Detection**
   - A dedicated `useEffect` continuously compares current settings with saved settings
   - Uses `JSON.stringify()` to perform deep comparison of objects
   - Checks three areas: theme settings, quick buttons, and model configuration
   - Sets `hasUnsavedChanges` to true if any differences are detected

3. **Warning Display**
   - When `hasUnsavedChanges` is true, an amber-colored warning banner appears
   - The banner shows above the tabs with:
     - Alert icon (AlertCircle)
     - "Unsaved Changes" title
     - Message: "You have unsaved changes. Click 'Save Changes' to keep your modifications."

4. **Clear Warning**
   - When user clicks "Save Changes" and save is successful:
     - Saved state variables are updated with current values
     - `hasUnsavedChanges` is set to false
     - Warning banner automatically disappears

## User Experience

### When Changes Are Made
- User modifies any setting (theme color, quick button, model config, etc.)
- Warning banner appears immediately at the top
- Banner persists across tab switches
- User is reminded to save changes

### When Changes Are Saved
- User clicks "Save Changes" button
- Success toast notification appears
- Warning banner automatically disappears
- All changes are now considered "saved"

## Visual Design

The warning banner uses:
- **Background**: Amber with 10% opacity (`bg-amber-500/10`)
- **Border**: Amber with 30% opacity (`border-amber-500/30`)
- **Icon**: Amber 400 color
- **Text**: Amber 200 for title, Amber 300/80 for description
- **Layout**: Flexbox with icon on left, text on right

## Code Location

File: `/client/src/pages/scripts-page.tsx`

### Key Sections:
1. State declarations (lines ~76-79)
2. Initial state capture (lines ~170-180)
3. Change detection logic (lines ~182-193)
4. Warning UI (after line ~480)
5. Save mutation success handler (lines ~195-210)

## Benefits

1. **Prevents Data Loss**: Users are warned before leaving page with unsaved changes
2. **Clear Feedback**: Visual indicator shows exactly when changes need saving
3. **Consistent UX**: Works across all tabs (Theme, Quick Buttons, Model Config)
4. **Automatic**: No manual tracking needed - automatically detects any changes
5. **Non-intrusive**: Warning only appears when needed and disappears after saving

## Future Enhancements

Potential improvements:
- Add browser `beforeunload` event to warn when leaving page
- Show which specific tab has unsaved changes
- Add "Discard Changes" button to revert to saved state
- Highlight the "Save Changes" button when unsaved changes exist
