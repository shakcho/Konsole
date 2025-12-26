# Namespaces

Namespaces allow you to organize logs by component, feature, or module. Each namespace maintains its own log history.

## Creating Namespaced Loggers

```typescript
import { Konsole } from 'konsole-logger';

// Create loggers for different parts of your app
const authLogger = new Konsole({ namespace: 'Auth' });
const apiLogger = new Konsole({ namespace: 'API' });
const uiLogger = new Konsole({ namespace: 'UI' });

// Each logger maintains its own namespace
authLogger.log('User logged in');  // [Auth] User logged in
apiLogger.log('Request sent');     // [API] Request sent
uiLogger.log('Modal opened');      // [UI] Modal opened
```

## Retrieving Loggers

Once a logger is created, you can retrieve it from anywhere:

```typescript
// In another file
import { Konsole } from 'konsole-logger';

// Get existing logger
const auth = Konsole.getLogger('Auth');
auth.log('Password changed');

// If namespace doesn't exist, a new logger is created
const newLogger = Konsole.getLogger('NewFeature');
```

## Listing Namespaces

View all registered namespaces:

```typescript
const namespaces = Konsole.getNamespaces();
console.log(namespaces); // ['Auth', 'API', 'UI', 'NewFeature']
```

## Best Practices

### Use Descriptive Names

```typescript
// ✅ Good - clear and descriptive
new Konsole({ namespace: 'PaymentGateway' });
new Konsole({ namespace: 'UserAuthentication' });
new Konsole({ namespace: 'ShoppingCart' });

// ❌ Avoid - too vague or short
new Konsole({ namespace: 'pg' });
new Konsole({ namespace: 'misc' });
```

### Namespace Hierarchy

Use a consistent naming pattern for related features:

```typescript
// Feature-based hierarchy
new Konsole({ namespace: 'Auth.Login' });
new Konsole({ namespace: 'Auth.Register' });
new Konsole({ namespace: 'Auth.Password' });

// Layer-based hierarchy  
new Konsole({ namespace: 'API.Users' });
new Konsole({ namespace: 'API.Products' });
new Konsole({ namespace: 'Store.Users' });
new Konsole({ namespace: 'Store.Products' });
```

### Create Loggers at Module Level

```typescript
// auth.ts
import { Konsole } from 'konsole-logger';

const logger = new Konsole({ namespace: 'Auth' });

export function login(user: string) {
  logger.log('Login attempt', { user });
  // ...
}

export function logout() {
  logger.log('User logged out');
  // ...
}
```


