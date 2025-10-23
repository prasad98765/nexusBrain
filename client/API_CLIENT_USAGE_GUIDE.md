# API Client - 401 Handling Implementation

## Overview

A centralized API client has been implemented to automatically handle **401 (Unauthorized)** responses across all API calls in the application. When a token is invalid or expired, the system will:

1. ✅ Clear the authentication token from localStorage
2. ✅ Show an appropriate error message to the user
3. ✅ Redirect to the login page automatically

---

## Files Modified/Created

### 1. **Created: `/client/src/lib/apiClient.ts`**
A singleton API client with automatic 401 handling.

### 2. **Updated: `/client/src/lib/queryClient.ts`**
Integrated the new API client for React Query operations.

---

## How to Use

### Option 1: Direct API Calls (Recommended for new code)

```typescript
import { api } from '@/lib/apiClient';

// GET request
const response = await api.get('/api/user');
const data = await response.json();

// POST request
const response = await api.post('/api/workspace/model-config', {
  model_config: { /* config */ }
});

// PUT request
const response = await api.put('/api/user', userData);

// DELETE request
const response = await api.delete('/api/workspace/model-config');

// PATCH request
const response = await api.patch('/api/user/profile', { name: 'New Name' });

// Custom fetch with full control
const response = await api.fetch('/api/custom', {
  method: 'POST',
  headers: { 'Custom-Header': 'value' },
  body: JSON.stringify(data)
});
```

### Option 2: With React Query (Already integrated)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

// Query example
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await api.get('/api/users');
    return response.json();
  }
});

// Mutation example
const mutation = useMutation({
  mutationFn: async (userData) => {
    const response = await api.post('/api/users', userData);
    return response.json();
  }
});
```

### Option 3: Skip Authentication (for public endpoints)

```typescript
import { api } from '@/lib/apiClient';

// For public endpoints that don't require authentication
const response = await api.get('/api/public/models', {
  skipAuth: true
});
```

---

## Migration Guide

### Before (Old code):
```typescript
const response = await fetch('/api/user', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.status === 401) {
  // Manual 401 handling
  localStorage.removeItem('auth_token');
  window.location.href = '/auth';
}
```

### After (New code):
```typescript
import { api } from '@/lib/apiClient';

// 401 handling is automatic!
const response = await api.get('/api/user');
// If 401 occurs, user is automatically redirected to login
```

---

## Features

### 1. **Automatic Token Injection**
- Automatically adds `Authorization: Bearer ${token}` header
- No need to manually handle token in every request

### 2. **401 Auto-Redirect**
- Detects 401 responses
- Clears invalid/expired token
- Shows user-friendly error message
- Redirects to `/auth` page

### 3. **Toast Notification**
When a 401 occurs:
```
Title: "Session Expired"
Description: "Your session has expired. Please log in again."
Variant: destructive
Duration: 5 seconds
```

### 4. **Singleton Pattern**
- Single instance across the application
- Consistent behavior everywhere

### 5. **TypeScript Support**
- Full type safety
- IntelliSense support

---

## Examples in Existing Code

### Example 1: Model Configuration Page

**Before:**
```typescript
const response = await fetch('/api/workspace/model-config', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**After:**
```typescript
import { api } from '@/lib/apiClient';

const response = await api.get('/api/workspace/model-config');
```

### Example 2: Usage Logs

**Before:**
```typescript
const response = await fetch(`/api/api-tokens/usage-logs?${params}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

**After:**
```typescript
import { api } from '@/lib/apiClient';

const response = await api.get(`/api/api-tokens/usage-logs?${params}`);
```

### Example 3: React Query Integration

**Before:**
```typescript
const { data } = useQuery({
  queryKey: ['model-config'],
  queryFn: async () => {
    const response = await fetch('/api/workspace/model-config', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed');
    return response.json();
  }
});
```

**After:**
```typescript
import { api } from '@/lib/apiClient';

const { data } = useQuery({
  queryKey: ['model-config'],
  queryFn: async () => {
    const response = await api.get('/api/workspace/model-config');
    return response.json();
  }
});
```

---

## Error Handling

### The API Client handles errors gracefully:

```typescript
try {
  const response = await api.get('/api/some-endpoint');
  const data = await response.json();
} catch (error) {
  // 401 errors are automatically handled before this catch block
  // Other errors will be caught here
  console.error('API Error:', error);
}
```

---

## Benefits

✅ **Centralized 401 Handling** - No need to check status in every API call  
✅ **Consistent User Experience** - Same behavior across all pages  
✅ **Reduced Code Duplication** - No manual token handling everywhere  
✅ **Better Security** - Automatic cleanup of invalid tokens  
✅ **User-Friendly** - Clear error messages and automatic redirect  
✅ **Type Safety** - Full TypeScript support  
✅ **Easy Migration** - Simple to update existing code  

---

## Testing

### Test 401 Handling:

1. **Expired Token Test:**
   - Login to the application
   - Manually expire the token in localStorage
   - Make any API call
   - Expected: Redirect to `/auth` with toast message

2. **Invalid Token Test:**
   - Set an invalid token in localStorage
   - Navigate to any authenticated page
   - Expected: Redirect to `/auth` with error message

3. **No Token Test:**
   - Clear localStorage
   - Try to access protected resource
   - Expected: Handled gracefully

---

## Future Enhancements

- [ ] Add retry logic for failed requests
- [ ] Add request/response interceptors
- [ ] Add request cancellation support
- [ ] Add request timeout configuration
- [ ] Add refresh token logic
- [ ] Add offline request queueing

---

## Support

For issues or questions:
1. Check this documentation
2. Review the apiClient.ts implementation
3. Check browser console for error messages
4. Verify localStorage for auth_token
