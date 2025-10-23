# Migration Example: Updating Existing Components

## Real-World Example: Model Configuration Component

### Before (Old Implementation)
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export default function ModelConfiguration() {
  const { token } = useAuth();
  
  // ❌ OLD: Manual token handling in every request
  const { data: modelConfig } = useQuery({
    queryKey: ['model-config'],
    queryFn: async () => {
      const response = await fetch('/api/workspace/model-config', {
        headers: {
          'Authorization': `Bearer ${token}`  // ❌ Manual token
        }
      });
      
      // ❌ Manual 401 handling
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/auth';
        return null;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      return response.json();
    },
    enabled: !!token,
  });

  // ❌ OLD: Mutation with manual token
  const saveMutation = useMutation({
    mutationFn: async (newConfig) => {
      const response = await fetch('/api/workspace/model-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  // ❌ Manual token
        },
        body: JSON.stringify({ model_config: newConfig }),
      });

      // ❌ Manual 401 handling
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        toast({
          title: 'Session Expired',
          description: 'Please login again',
          variant: 'destructive'
        });
        window.location.href = '/auth';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        throw new Error('Failed to save');
      }
      return response.json();
    }
  });

  return (
    // Component JSX
  );
}
```

### After (New Implementation with API Client)
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';  // ✅ Import API client

export default function ModelConfiguration() {
  // ✅ No need to destructure token anymore!
  
  // ✅ NEW: Automatic token and 401 handling
  const { data: modelConfig } = useQuery({
    queryKey: ['model-config'],
    queryFn: async () => {
      const response = await api.get('/api/workspace/model-config');
      return response.json();
    }
    // ✅ No need for 'enabled: !!token'
  });

  // ✅ NEW: Clean mutation with automatic handling
  const saveMutation = useMutation({
    mutationFn: async (newConfig) => {
      const response = await api.post('/api/workspace/model-config', {
        model_config: newConfig
      });
      return response.json();
    }
    // ✅ 401 is automatically handled!
  });

  return (
    // Component JSX (unchanged)
  );
}
```

---

## Comparison

| Feature | Old Approach | New Approach |
|---------|-------------|--------------|
| **Lines of code** | ~40 lines | ~10 lines |
| **Token handling** | Manual in every request | Automatic |
| **401 handling** | Manual in every request | Automatic |
| **Error messages** | Inconsistent | Consistent |
| **Redirect logic** | Duplicated everywhere | Centralized |
| **Maintenance** | Update 50+ places | Update 1 place |

---

## Step-by-Step Migration

### Step 1: Add the import
```typescript
import { api } from '@/lib/apiClient';
```

### Step 2: Remove useAuth token (optional)
```typescript
// Before
const { token } = useAuth();

// After (token no longer needed)
// Remove this line
```

### Step 3: Replace fetch calls

**GET requests:**
```typescript
// Before
fetch('/api/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// After
api.get('/api/endpoint')
```

**POST requests:**
```typescript
// Before
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
})

// After
api.post('/api/endpoint', data)
```

**DELETE requests:**
```typescript
// Before
fetch('/api/endpoint', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
})

// After
api.delete('/api/endpoint')
```

### Step 4: Remove manual 401 checks
```typescript
// Before
if (response.status === 401) {
  localStorage.removeItem('auth_token');
  window.location.href = '/auth';
  return null;
}

// After
// Delete these lines - handled automatically!
```

### Step 5: Remove manual error toasts for 401
```typescript
// Before
if (response.status === 401) {
  toast({
    title: 'Session Expired',
    // ...
  });
}

// After
// Delete - handled by API client!
```

---

## More Examples

### Example 1: Usage Logs Component

**Before:**
```typescript
const { data: logsData } = useQuery({
  queryKey: ['usage-logs', filters],
  queryFn: async () => {
    const response = await fetch(`/api/api-tokens/usage-logs?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401) {
      // Manual handling...
    }
    if (!response.ok) throw new Error('Failed');
    return response.json();
  }
});
```

**After:**
```typescript
const { data: logsData } = useQuery({
  queryKey: ['usage-logs', filters],
  queryFn: async () => {
    const response = await api.get(`/api/api-tokens/usage-logs?${params}`);
    return response.json();
  }
});
```

### Example 2: Available Models

**Before:**
```typescript
const { data: models } = useQuery({
  queryKey: ['available-models'],
  queryFn: async () => {
    const response = await fetch('/api/v1/models', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/auth';
    }
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    return data.data?.map(model => ({
      id: model.id,
      name: model.name || model.id
    }));
  },
  enabled: !!token
});
```

**After:**
```typescript
const { data: models } = useQuery({
  queryKey: ['available-models'],
  queryFn: async () => {
    const response = await api.get('/api/v1/models');
    const data = await response.json();
    return data.data?.map(model => ({
      id: model.id,
      name: model.name || model.id
    }));
  }
});
```

---

## Benefits Summary

### Code Reduction
- **Before:** 15-20 lines per API call
- **After:** 2-3 lines per API call
- **Savings:** 70-85% less code

### Maintenance
- **Before:** Update 401 logic in 50+ places
- **After:** Update once in apiClient.ts

### Consistency
- **Before:** Different error messages/behaviors
- **After:** Consistent user experience

### Security
- **Before:** Easy to forget 401 handling
- **After:** Impossible to bypass security

---

## Quick Migration Checklist

- [ ] Import `api` from '@/lib/apiClient'
- [ ] Replace `fetch()` with `api.get/post/put/delete()`
- [ ] Remove manual `Authorization` headers
- [ ] Remove manual 401 status checks
- [ ] Remove manual `localStorage.removeItem('auth_token')`
- [ ] Remove manual redirects to `/auth`
- [ ] Remove manual 401 error toasts
- [ ] Test the component thoroughly
- [ ] Remove unused `useAuth()` if only used for token

---

## Testing Your Migration

1. **Test Normal Flow:**
   - Login and use the feature normally
   - Verify API calls work as before

2. **Test 401 Handling:**
   - Open DevTools → Application → Local Storage
   - Delete or modify `auth_token`
   - Make an API call
   - Verify: Toast appears → Redirect to /auth

3. **Test Error Handling:**
   - Simulate network errors
   - Verify error handling still works

---

## Need Help?

Common issues and solutions:

**Issue:** "api is not defined"
- **Solution:** Add `import { api } from '@/lib/apiClient';`

**Issue:** TypeScript errors on api.post()
- **Solution:** Ensure data is typed correctly

**Issue:** Still redirecting multiple times
- **Solution:** Check for duplicate useAuth() calls or nested fetch()

**Issue:** Toast not showing
- **Solution:** Verify toast provider is in App.tsx
