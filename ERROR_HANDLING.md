# Error Handling & User Feedback System

This document explains the error handling and user feedback system implemented in PlateDetect.

## Components

### 1. Toast Notifications (`lib/toast-context.tsx` & `components/toast-display.tsx`)

Toast notifications provide non-intrusive feedback to users about actions.

**Types:**

- `success` - Green toast for successful operations
- `error` - Red toast for errors
- `warning` - Yellow toast for warnings
- `info` - Blue toast for informational messages

**Usage:**

```typescript
import { useToast } from "@/lib/toast-context";

export function MyComponent() {
  const { addToast } = useToast();

  const handleAction = async () => {
    try {
      await someAction();
      addToast("Action completed successfully", "success");
    } catch (error: any) {
      addToast(error.message || "Action failed", "error");
    }
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

**Features:**

- Auto-dismiss after 3 seconds (configurable)
- Manual dismiss with X button
- Stacks multiple toasts
- Smooth animations

### 2. Confirmation Modal (`components/confirmation-modal.tsx`)

Modal dialogs for confirming dangerous or important actions.

**Usage:**

```typescript
import { ConfirmationModal } from "@/components/confirmation-modal";

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = async () => {
    await dangerousAction();
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Delete</button>
      <ConfirmationModal
        isOpen={isOpen}
        title="Delete Item"
        description="Are you sure?"
        message="This action cannot be undone."
        confirmText="Delete"
        isDangerous={true}
        onConfirm={handleConfirm}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
```

**Props:**

- `isOpen` - Whether modal is visible
- `title` - Modal title
- `description` - Modal description
- `message` - Additional message (optional)
- `confirmText` - Confirm button text (default: "Confirm")
- `cancelText` - Cancel button text (default: "Cancel")
- `isDangerous` - Shows red button and warning icon (default: false)
- `isLoading` - Shows loading state (default: false)
- `onConfirm` - Callback when confirmed (can be async)
- `onCancel` - Callback when cancelled

**Features:**

- Handles async operations
- Shows loading state during operation
- Displays errors if operation fails
- Prevents closing while processing

### 3. Error Boundary (`components/error-boundary.tsx`)

Catches React component errors and displays a fallback UI.

**Usage:**

```typescript
import { ErrorBoundary } from "@/components/error-boundary";

export default function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

**Features:**

- Catches rendering errors
- Shows error message
- Provides "Try Again" button
- Prevents white screen of death

## Implementation in Dashboard

### Delete Plate

```typescript
const handleDeletePlate = (plateId: string) => {
  setDeleteConfirmation({ isOpen: true, plateId });
};

const confirmDeletePlate = async () => {
  try {
    const updatedPlates = hybridStorage.deletePlate(plateId);
    setPlates(updatedPlates);
    addToast("Plate deleted successfully", "success");

    // Sync to Supabase
    await hybridStorage.deletePlateFromSupabase(plateId);
  } catch (error: any) {
    addToast(error.message || "Failed to delete plate", "error");
    throw error;
  }
};
```

### Clear All Plates

```typescript
const handleClearAllPlates = () => {
  setClearAllConfirmation(true);
};

const confirmClearAllPlates = async () => {
  try {
    hybridStorage.clearAllPlates();
    setPlates([]);
    addToast("All plates cleared successfully", "success");
  } catch (error: any) {
    addToast(error.message || "Failed to clear plates", "error");
    throw error;
  }
};
```

## Error Handling Best Practices

### 1. Always Use Try-Catch

```typescript
try {
  await operation();
  addToast("Success", "success");
} catch (error: any) {
  addToast(error.message || "Operation failed", "error");
}
```

### 2. Provide User-Friendly Messages

```typescript
// Bad
addToast("Error: ENOENT: no such file or directory", "error");

// Good
addToast("Failed to load plates. Please try again.", "error");
```

### 3. Use Confirmation for Destructive Actions

```typescript
// Bad - just delete
handleDelete();

// Good - confirm first
setDeleteConfirmation({ isOpen: true, id });
```

### 4. Handle Async Operations

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  try {
    setIsLoading(true);
    await operation();
    addToast("Success", "success");
  } catch (error: any) {
    addToast(error.message, "error");
  } finally {
    setIsLoading(false);
  }
};
```

### 5. Distinguish Between Local and Cloud Errors

```typescript
try {
  // Local operation
  const updated = hybridStorage.deletePlate(id);
  setPlates(updated);
  addToast("Plate deleted", "success");

  // Cloud operation (non-blocking)
  try {
    await hybridStorage.deletePlateFromSupabase(id);
  } catch (error) {
    addToast("Deleted locally but sync failed", "warning");
  }
} catch (error: any) {
  addToast(error.message, "error");
}
```

## Toast Duration

Default: 3000ms (3 seconds)

**Custom duration:**

```typescript
addToast("Message", "success", 5000); // 5 seconds
addToast("Message", "error", 0); // Never auto-dismiss
```

## Styling

### Toast Colors

- Success: Green (#10b981)
- Error: Red (#ef4444)
- Warning: Yellow (#eab308)
- Info: Blue (#3b82f6)

### Modal Styling

- Dangerous actions: Red button
- Normal actions: Blue button
- Loading state: Spinner + "Processing..."

## Testing Error Handling

### Test Toast

```typescript
const { addToast } = useToast();
addToast("Test message", "success");
```

### Test Modal

```typescript
const [isOpen, setIsOpen] = useState(true)
<ConfirmationModal
  isOpen={isOpen}
  title="Test"
  description="Test modal"
  onConfirm={() => console.log('Confirmed')}
  onCancel={() => setIsOpen(false)}
/>
```

### Test Error Boundary

```typescript
<ErrorBoundary>
  <ComponentThatThrows />
</ErrorBoundary>
```

## Future Enhancements

1. **Retry Logic** - Automatically retry failed operations
2. **Offline Detection** - Show warning when offline
3. **Error Logging** - Send errors to monitoring service
4. **Undo Functionality** - Allow undoing recent actions
5. **Batch Operations** - Handle multiple errors gracefully
