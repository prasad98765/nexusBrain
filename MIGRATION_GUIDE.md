# Quick Buttons Migration Guide

## The Error You're Seeing

```
column script_settings.quick_buttons does not exist
```

This means the database table hasn't been updated yet to include the new `quick_buttons` column.

## Solution: Run the Migration

### Step 1: Start Docker

1. **Open Docker Desktop** on your Mac
2. **Wait** until you see "Docker Desktop is running" (green icon in menu bar)
3. **Verify** by running: `docker ps`

### Step 2: Choose Your Migration Method

#### Method A: Using Flask-Migrate (Recommended)

```bash
cd /Users/prasadchaudhari/Desktop/Nexus\ Ai\ Hub/nexusBrain

# Generate migration
docker-compose exec backend flask db migrate -m "Add quick_buttons column"

# Apply migration
docker-compose exec backend flask db upgrade
```

#### Method B: Using Direct SQL

```bash
cd /Users/prasadchaudhari/Desktop/Nexus\ Ai\ Hub/nexusBrain

# Apply SQL directly
docker-compose exec backend psql -U nexus_user -d nexus_db -c "ALTER TABLE script_settings ADD COLUMN IF NOT EXISTS quick_buttons JSON;"
```

#### Method C: Using Python Migration Script

```bash
cd /Users/prasadchaudhari/Desktop/Nexus\ Ai\ Hub/nexusBrain

# Run the migration script
docker-compose exec backend python migrate_quick_buttons.py
```

#### Method D: Using the SQL File

```bash
cd /Users/prasadchaudhari/Desktop/Nexus\ Ai\ Hub/nexusBrain

# Run the SQL file
docker-compose exec backend psql -U nexus_user -d nexus_db -f /app/migrations/add_quick_buttons.sql
```

### Step 3: Verify the Migration

After running any of the above methods, verify the column was added:

```bash
docker-compose exec backend psql -U nexus_user -d nexus_db -c "\d script_settings"
```

You should see `quick_buttons` listed in the columns with type `json`.

### Step 4: Test the API

Now try your API call again:

```bash
curl http://localhost:5000/api/script/c344d53e-8fea-4948-8893-d1e456da7069
```

You should get a successful response with `quick_buttons: []`.

## Troubleshooting

### Docker Not Running
**Error**: `Cannot connect to the Docker daemon`

**Solution**: 
1. Open Docker Desktop application
2. Wait for it to fully start (check menu bar icon)
3. Run `docker ps` to confirm it's running

### Permission Denied
**Error**: `permission denied while trying to connect to the Docker daemon socket`

**Solution**:
```bash
# Add your user to docker group (Mac)
sudo dkpasswd -d $USER docker

# Or run with sudo (not recommended)
sudo docker-compose exec backend ...
```

### Container Not Running
**Error**: `Error: No such container`

**Solution**:
```bash
# Start all containers
docker-compose up -d

# Wait a few seconds, then try migration again
```

### Migration Already Applied
**Message**: `Column already exists`

**This is fine!** The migration uses `IF NOT EXISTS` so it's safe to run multiple times.

### Database Connection Failed
**Error**: `could not connect to server`

**Solution**:
```bash
# Restart the backend container
docker-compose restart backend

# Check logs
docker-compose logs backend
```

## Quick Reference Commands

```bash
# Check if Docker is running
docker ps

# Check if backend container is running
docker-compose ps

# View backend logs
docker-compose logs -f backend

# Restart backend
docker-compose restart backend

# Access PostgreSQL directly
docker-compose exec backend psql -U nexus_user -d nexus_db

# List all columns in script_settings
docker-compose exec backend psql -U nexus_user -d nexus_db -c "\d script_settings"

# Run Python migration script
docker-compose exec backend python migrate_quick_buttons.py
```

## What the Migration Does

The migration adds a new column to the `script_settings` table:

```sql
ALTER TABLE script_settings 
ADD COLUMN IF NOT EXISTS quick_buttons JSON;
```

This column stores an array of quick button configurations:

```json
[
  {
    "id": "1698765432000",
    "label": "T-shirt Product",
    "text": "Show me information about t-shirt products",
    "emoji": "👕"
  }
]
```

## After Migration Success

1. ✅ The API error should be resolved
2. ✅ You can now add quick buttons in the Scripts page
3. ✅ Quick buttons will appear in the chat playground
4. ✅ All theme styling will be applied correctly

## Need Help?

If you're still having issues:

1. **Check Docker Status**: Make sure Docker Desktop is running
2. **Check Logs**: Run `docker-compose logs backend` to see errors
3. **Verify Database**: Use `docker-compose exec backend psql -U nexus_user -d nexus_db` to connect
4. **Restart Everything**: `docker-compose down && docker-compose up -d`

## Summary

**TL;DR**: Start Docker, then run one of these:

```bash
# Easiest (direct SQL)
docker-compose exec backend psql -U nexus_user -d nexus_db -c "ALTER TABLE script_settings ADD COLUMN IF NOT EXISTS quick_buttons JSON;"

# Or use the migration script
docker-compose exec backend python migrate_quick_buttons.py

# Or use Flask-Migrate
docker-compose exec backend flask db migrate -m "Add quick_buttons"
docker-compose exec backend flask db upgrade
```

That's it! Your Quick Buttons feature will be ready to use. 🚀
