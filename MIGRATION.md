# Migration Guide

This guide helps you migrate between major versions of tscd48.

## Migrating to v2.0.0

v2.0.0 is a complete TypeScript rewrite of the library.

### Breaking Changes

#### 1. Import Path Changes

The package now uses a single entry point. Individual module exports have been removed:

**Before (v1.x):**

```javascript
import CD48 from 'tscd48/cd48.js';
import { Statistics } from 'tscd48/analysis';
import { CD48Error } from 'tscd48/errors';
```

**After (v2.0):**

```typescript
import { CD48 } from 'tscd48';
// or
import CD48 from 'tscd48';

// All utilities are now exported from the main entry point
import {
  CD48,
  Statistics,
  Histogram,
  TimeSeries,
  CalibrationWizard,
  CD48Error,
  NotConnectedError,
  validateChannel,
  createVoltage,
} from 'tscd48';
```

#### 2. New Build Output Location

Built files are now in `dist/` directory instead of root:

- ESM: `dist/cd48.esm.js`
- UMD: `dist/cd48.umd.js`

#### 3. Branded Types for Type Safety

New branded types provide compile-time validation:

```typescript
import { createChannel, createVoltage, type Channel, type Voltage } from 'tscd48';

// Validated at runtime, typed at compile time
const ch: Channel = createChannel(3); // Throws if invalid (not 0-7)
const v: Voltage = createVoltage(2.5); // Throws if invalid (not 0-4.08V)
```

### Removed Features

- Individual module exports (`tscd48/errors`, `tscd48/validation`, `tscd48/analysis`, etc.)
- Root-level JavaScript files (now TypeScript in `src/`)

## Migrating to v1.0.0

### Breaking Changes

#### 1. Module Exports

The package uses ES module exports:

**CommonJS:**

```javascript
const CD48 = require('tscd48');
```

**ES Modules:**

```javascript
import CD48 from 'tscd48';
```

For CommonJS compatibility, use the UMD bundle:

```javascript
const CD48 = require('tscd48/dist/cd48.umd.js');
```

#### 2. measureRate() Returns Uncertainties

The `measureRate()` method now returns measurement uncertainties:

```javascript
const result = await cd48.measureRate(0, 1.0);
// {
//   counts: 1000,
//   duration: 1.0,
//   rate: 1000,
//   channel: 0,
//   uncertainty: {
//     counts: 31.62,      // sqrt(1000)
//     rate: 31.62,        // Poisson uncertainty
//     relative: 3.16      // Percentage
//   }
// }
```

#### 3. measureCoincidenceRate() Returns Uncertainties

The `measureCoincidenceRate()` method now includes full uncertainty propagation.

### New Features in v1.0.0

#### Auto-Reconnection

```javascript
const cd48 = new CD48({
  autoReconnect: true,
  reconnectAttempts: 3,
  reconnectDelay: 1000,
});
```

#### Rate Limiting

```javascript
const cd48 = new CD48({
  rateLimitMs: 100, // Minimum 100ms between commands
});
```

## TypeScript Support

Full TypeScript definitions are included and auto-generated from source:

```typescript
import CD48 from 'tscd48';
import type { CD48Options, RateMeasurement, CountData } from 'tscd48';

const options: CD48Options = {
  baudRate: 115200,
  autoReconnect: true,
};

const cd48 = new CD48(options);
const result: RateMeasurement = await cd48.measureRate(0, 1.0);
```

## Getting Help

If you encounter issues during migration:

1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review the [API Documentation](https://github.com/OpenPhysics/tscd48#api-reference)
3. Open an issue at https://github.com/OpenPhysics/tscd48/issues

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.
