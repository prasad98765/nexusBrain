# Scripts Feature - Embed & Theme Customization

## Overview

The Scripts feature allows users to customize their AI Search Engine theme and generate iframe embed scripts for their websites. All settings are stored per `workspace_id` and can be dynamically applied to embedded chat interfaces.

## Features

### 1. **Left Menu Integration**
- New "Scripts" menu item in the sidebar (with FileCode icon)
- Route: `/nexus/scripts`
- Page header: "Embed Script & Settings"

### 2. **Generate Script Button**
- Located at top-right of the Scripts page
- Fetches workspace_id and token from API tokens
- Displays tabbed interface with "Customized Theme" and "Script" tabs

### 3. **Theme Customization Tab**

#### Theme Settings Available:
| Setting | Type | Description |
|---------|------|-------------|
| Primary Color | Color Picker | Main UI highlights |
| Secondary Color | Color Picker | Borders/text links |
| Background Color | Color Picker | Chat background |
| Font Style | Dropdown | Inter, Roboto, or Poppins |
| Button Style | Dropdown | Rounded, Square, or Outline |
| Logo URL | Text Input + Upload | Company logo |
| AI Search Engine Name | Text Input | Custom chatbot header name |
| Welcome Message | Textarea | Custom welcome message |
| Theme Presets | 3 Buttons | Light, Dark, Minimal presets |

#### Theme Presets:
- **Light**: Indigo primary (#6366f1), Purple secondary (#8b5cf6), White background
- **Dark**: Light indigo primary (#818cf8), Light purple secondary (#a78bfa), Dark gray background (#1f2937)
- **Minimal**: Black primary, Gray secondary (#6b7280), Light background (#f9fafb)

#### Save Theme:
- **Endpoint**: `POST /api/script/{workspace_id}`
- **Success Toast**: "Theme saved successfully."
- Data is stored in `script_settings` table

### 4. **Script Tab**

#### Embed Code Display:
```html
<iframe
  src="https://nexusaihub.com/chat-playground?token={token}&client_id={workspace_id}"
  style="width: 100%; height: 600px; border: none; border-radius: 10px;"
></iframe>
```

#### Features:
- Copy Script button with "Copied!" tooltip
- Live preview area showing chat playground with applied theme
- Preview loads existing theme automatically

### 5. **Theme Application in Chat Playground**

When iframe loads:
1. Extract `client_id` and `token` from URL params
2. Fetch theme via `GET /api/script/{client_id}`
3. Apply theme settings dynamically using CSS variables:
   - `--theme-primary`
   - `--theme-secondary`
   - `--theme-background`
   - `--theme-font`
4. If no theme exists, use default theme

## Database Schema

### `script_settings` Table

```sql
CREATE TABLE script_settings (
    workspace_id VARCHAR PRIMARY KEY REFERENCES workspaces(id),
    theme_settings JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `theme_settings` JSON Structure:

```json
{
    "primary_color": "#6366f1",
    "secondary_color": "#8b5cf6",
    "background_color": "#ffffff",
    "font_style": "Inter",
    "button_style": "rounded",
    "logo_url": "https://example.com/logo.png",
    "ai_search_engine_name": "AI Search Engine",
    "theme_preset": "light",
    "welcome_message": "Hello! How can I help you today?"
}
```

## API Endpoints

### GET `/api/script/<workspace_id>`
**Description**: Fetch theme settings for a workspace

**Response** (200 OK):
```json
{
    "workspace_id": "workspace-123",
    "theme_settings": {
        "primary_color": "#6366f1",
        "secondary_color": "#8b5cf6",
        ...
    },
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T11:45:00Z"
}
```

**Default Response** (when no settings exist):
```json
{
    "workspace_id": "workspace-123",
    "theme_settings": {
        "primary_color": "#6366f1",
        "secondary_color": "#8b5cf6",
        "background_color": "#ffffff",
        "font_style": "Inter",
        "button_style": "rounded",
        "logo_url": "",
        "ai_search_engine_name": "AI Search Engine",
        "theme_preset": "light",
        "welcome_message": "Hello! How can I help you today?"
    },
    "created_at": null,
    "updated_at": null
}
```

### POST `/api/script/<workspace_id>`
**Description**: Save or update theme settings (requires authentication)

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
    "theme_settings": {
        "primary_color": "#6366f1",
        "secondary_color": "#8b5cf6",
        "background_color": "#ffffff",
        "font_style": "Inter",
        "button_style": "rounded",
        "logo_url": "https://example.com/logo.png",
        "ai_search_engine_name": "My AI Assistant",
        "theme_preset": "light",
        "welcome_message": "Welcome! How may I assist you?"
    }
}
```

**Response** (200 OK):
```json
{
    "message": "Theme settings saved successfully",
    "workspace_id": "workspace-123",
    "theme_settings": { ... },
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T11:45:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields
- `403 Forbidden`: Unauthorized access to workspace
- `404 Not Found`: Workspace not found
- `500 Internal Server Error`: Server error

## File Structure

### Backend Files
```
server/
├── models.py                          # ScriptSettings model
├── script_routes.py                   # API endpoints
├── app.py                            # Blueprint registration
└── migrations/
    └── add_script_settings_table.py  # Database migration
```

### Frontend Files
```
client/src/
├── pages/
│   ├── scripts-page.tsx              # Main Scripts page
│   ├── chat-playground.tsx           # Updated with theme application
│   ├── Layout.tsx                    # Updated sidebar menu
│   └── App.tsx                       # Updated routes
```

## Usage Flow

### For Users:
1. Navigate to **Scripts** from left sidebar
2. Click **Generate Script** button
3. Customize theme in **Customized Theme** tab
4. Click **Save Theme** to persist settings
5. Switch to **Script** tab
6. Copy the iframe embed code
7. Paste code into your website
8. Preview shows live theme application

### For Developers:
1. Theme settings are fetched when `client_id` is present in URL
2. CSS variables are dynamically set on `document.documentElement`
3. Theme applies automatically to chat interface
4. Default theme is used if no custom theme exists

## Testing Checklist

- [x] Create new theme settings
- [x] Save theme successfully
- [x] Apply theme presets (Light, Dark, Minimal)
- [x] Generate embed script with correct token and workspace ID
- [x] Copy script to clipboard
- [x] Preview shows applied theme
- [x] Embed iframe loads with custom theme
- [x] Default theme applies when no custom theme exists
- [x] Unauthorized access is blocked
- [x] Invalid workspace returns 404

## Future Enhancements

- [ ] Custom CSS injection
- [ ] Advanced styling options (shadows, borders, animations)
- [ ] Multiple theme versions per workspace
- [ ] Theme version history
- [ ] A/B testing for different themes
- [ ] Logo upload to server (currently URL-based)
- [ ] Font upload support
- [ ] Export/Import theme configurations
- [ ] Theme marketplace/templates

## Security Considerations

- ✅ Authentication required for saving themes
- ✅ Workspace ownership verification
- ✅ Public access for fetching themes (required for iframe embed)
- ✅ Input validation for all theme fields
- ✅ JSON schema validation
- ⚠️ Logo URLs are not validated (XSS risk - should be sanitized)
- ⚠️ Consider rate limiting for public endpoint

## Notes

- The `logo_url` field currently accepts any URL. Consider implementing image validation or hosting
- Theme changes are instant in preview but may require iframe refresh in production
- CSS variables provide flexible theming without CSS injection risks
- Theme settings are workspace-scoped, allowing different themes per workspace
