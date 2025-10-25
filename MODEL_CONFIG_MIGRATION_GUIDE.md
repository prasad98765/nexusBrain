# Model Configuration Migration Guide

## Overview
This guide documents the migration of Model Configuration from the chat-playground settings panel to the Scripts page for centralized management.

## Changes Completed ✅

### 1. Database Model Updated
**File**: `server/models.py`
- ✅ Added `model_config` JSON column to `ScriptSettings` model
```python
model_config = db.Column(db.JSON, nullable=True)  # Store model configuration settings
```

### 2. API Routes Updated
**File**: `server/script_routes.py`
- ✅ GET endpoint now returns `model_config` with default values
- ✅ POST endpoint accepts and saves `model_config`
- ✅ Default model configuration added to responses

**Default Model Config**:
```json
{
  "model": "meta-llama/llama-3.3-8b-instruct:free",
  "max_tokens": 300,
  "temperature": 0.5,
  "stream": true,
  "cache_threshold": 0.5,
  "is_cached": false,
  "use_rag": false
}
```

### 3. Scripts Page Enhanced
**File**: `client/src/pages/scripts-page.tsx`
- ✅ Added `ModelConfig` interface
- ✅ Added model configuration state
- ✅ Added model search functionality
- ✅ Integrated available models query
- ✅ Added "Model Config" tab (4th tab)
- ✅ Complete Model Configuration UI with:
  - Model selection dropdown with search
  - Max Tokens slider (50-4000)
  - Temperature slider (0-2)
  - Cache Threshold slider (0-1)
  - Stream Responses toggle
  - Use Cache toggle
  - Use RAG toggle
- ✅ Save functionality includes model_config

### 4. Migration Files Created
**File**: `migrations/add_model_config.sql`
- ✅ SQL script to add model_config column
- ✅ Safe with `IF NOT EXISTS` clause

## Changes Needed (Chat Playground) ⚠️

### Remove Settings Panel

The following changes need to be made to `client/src/pages/chat-playground.tsx`:

#### 1. Remove State Variables
Delete these lines:
```typescript
const [settingsOpen, setSettingsOpen] = useState(false);
const [modelSearchOpen, setModelSearchOpen] = useState(false);
```

#### 2. Remove Model Fetch Query
Delete the entire `availableModels` query (around line 140-155):
```typescript
// DELETE THIS ENTIRE BLOCK
const { data: availableModels = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['available-models-playground'],
    ...
});
```

#### 3. Update Theme Fetch
The model config fetch is already done ✅ (completed in previous edit)

####  4. Remove Settings Button from Sidebar
Find and delete this section (around line 600-615):
```typescript
<Button
    variant="ghost"
    className="w-full justify-start h-10"
    onClick={() => setSettingsOpen(true)}  // ← Remove this
    style={{ color: themeSettings?.theme_preset === 'light' ? '#4b5563' : '#d1d5db' }}
>
    <Settings2 className="w-4 h-4 mr-2" />
    Settings
</Button>
```

#### 5. Remove Entire Settings Sheet
Delete the entire `<Sheet>` component at the end of the file (lines 1125-1308):
```typescript
// DELETE THIS ENTIRE SECTION
<Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
    <SheetContent ...>
        ... all model configuration UI ...
    </SheetContent>
</Sheet>
```

#### 6. Clean Up Unused Imports
After removing the settings panel, these imports are no longer needed:
```typescript
// Remove from imports:
- Settings2 (from lucide-react)
- Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle (from ui/sheet)
- Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (from ui/command)
- Popover, PopoverContent, PopoverTrigger (from ui/popover) - if not used elsewhere
- Slider (from ui/slider)
- Switch (from ui/switch)
- ChevronsUpDown (from lucide-react)
```

## Database Migration Required

Run this migration before deploying:

```bash
# Option 1: Using Docker
docker-compose exec backend psql -U nexus_user -d nexus_db -f /app/migrations/add_model_config.sql

# Option 2: Direct SQL
docker-compose exec backend psql -U nexus_user -d nexus_db -c "ALTER TABLE script_settings ADD COLUMN IF NOT EXISTS model_config JSON;"

# Option 3: Flask-Migrate
docker-compose exec backend flask db migrate -m "Add model_config column"
docker-compose exec backend flask db upgrade
```

## Testing Checklist

### Scripts Page
- [ ] Model Config tab appears as 4th tab
- [ ] Can select AI model from dropdown
- [ ] Model search works
- [ ] Max Tokens slider works (50-4000)
- [ ] Temperature slider works (0-2)
- [ ] Cache Threshold slider works (0-1)
- [ ] Stream toggle works
- [ ] Cache toggle works
- [ ] RAG toggle works
- [ ] Save Changes button saves model config
- [ ] Refresh preserves model config

### Chat Playground
- [ ] Fetches model config from API
- [ ] Uses fetched model config for chat
- [ ] No Settings button in sidebar
- [ ] No Settings sheet/panel exists
- [ ] Model config from Scripts page applies correctly
- [ ] Streaming works with configured settings
- [ ] Cache works with configured settings
- [ ] RAG works with configured settings

### API
- [ ] GET /api/script/{workspace_id} returns model_config
- [ ] POST /api/script/{workspace_id} accepts model_config
- [ ] Default model config returned when none exists
- [ ] Model config persists after save

## User Flow

### Before Migration
```
1. User opens chat-playground
2. User clicks Settings gear icon
3. User configures model in sidebar panel
4. Settings only apply to current session
5. Settings lost on refresh
```

### After Migration
```
1. User goes to Scripts page
2. User clicks "Model Config" tab
3. User configures model settings
4. User clicks "Save Changes"
5. Settings apply to ALL embedded chats
6. Settings persist across sessions
7. Chat-playground auto-loads config
```

## Benefits

### Centralized Management
- ✅ One place to configure everything
- ✅ Settings apply to all embeds
- ✅ No per-instance configuration needed

### Persistent Configuration
- ✅ Settings saved in database
- ✅ Survives page refreshes
- ✅ Consistent across all chat instances

### Simplified Chat Interface
- ✅ Cleaner chat UI (no settings panel)
- ✅ Fewer controls for end users
- ✅ Admin controls configuration centrally

### Better UX
- ✅ Fewer clicks for users
- ✅ Clear separation of concerns
- ✅ Predictable behavior

## Breaking Changes

⚠️ **None** - This is additive:
- Existing chat-playground instances continue to work
- Default model config provided if none saved
- Backward compatible with existing data

## Rollback Plan

If issues occur:

### Database Rollback
```sql
ALTER TABLE script_settings DROP COLUMN IF EXISTS model_config;
```

### Code Rollback
```bash
git revert <commit_hash>
docker-compose up -d --build
```

## Implementation Steps

### Step 1: Database Migration ✅
- [x] Add model_config column to models.py
- [ ] Run database migration

### Step 2: Backend API ✅
- [x] Update GET endpoint
- [x] Update POST endpoint  
- [x] Add default model config

### Step 3: Scripts Page ✅
- [x] Add Model Config interface
- [x] Add model config state
- [x] Add Model Config tab
- [x] Add all configuration controls
- [x] Integrate with save function

### Step 4: Chat Playground  
- [x] Fetch model config from API
- [ ] Remove settingsOpen state
- [ ] Remove modelSearchOpen state
- [ ] Remove availableModels query
- [ ] Remove Settings button
- [ ] Remove Settings sheet
- [ ] Clean up unused imports

### Step 5: Testing
- [ ] Test Scripts page model config
- [ ] Test chat-playground with config
- [ ] Test save/load functionality
- [ ] Test default config
- [ ] Test all model settings apply

### Step 6: Documentation
- [ ] Update user documentation
- [ ] Update API documentation
- [ ] Create migration guide (this file)

## File Changes Summary

### Modified Files
1. ✅ `server/models.py` (+1 line)
2. ✅ `server/script_routes.py` (+25 lines)
3. ✅ `client/src/pages/scripts-page.tsx` (+200 lines)
4. ⚠️ `client/src/pages/chat-playground.tsx` (needs -200 lines)

### Created Files
1. ✅ `migrations/add_model_config.sql`
2. ✅ `MODEL_CONFIG_MIGRATION_GUIDE.md` (this file)

## Next Steps

1. **Run Database Migration**
   ```bash
   docker-compose exec backend psql -U nexus_user -d nexus_db -f /app/migrations/add_model_config.sql
   ```

2. **Complete Chat Playground Cleanup**
   - Remove settings panel code
   - Remove unused imports
   - Test functionality

3. **Test End-to-End**
   - Configure model in Scripts page
   - Verify chat-playground uses config
   - Test all model settings

4. **Deploy**
   - Backend changes
   - Frontend changes
   - Database migration

## Support

If you encounter issues:
1. Check database migration completed
2. Verify API returns model_config
3. Check browser console for errors
4. Verify chat-playground fetches config
5. Test with default workspace

---

**Status**: Partially Complete (Backend ✅, Scripts Page ✅, Chat Playground ⚠️)

**Next Action**: Complete chat-playground cleanup to remove settings panel

