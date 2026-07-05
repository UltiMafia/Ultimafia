This PR fixes the O(N) transaction loading in the `/portfolio` endpoints and adds client-side pagination to the stock market UI to prevent massive DOM overloading on mobile devices.

### Changes:
1. **O(1) Cost Basis Tracking**: Migrated `costBasis` and `averageBuyPrice` to be incrementally calculated and stored on the `Shareholder` and `FamilyShareholder` schemas during buy/sell trades, allowing the portfolio API to avoid fetching all historical transactions.
2. **Client-Side Pagination**: Implemented an `@mui/material` `<Pagination />` widget in `StockMarket.jsx` to correctly paginate the sorted list of stocks.

### ⚠️ IMPORTANT: Migration Instructions
Because `costBasis` and `averageBuyPrice` are now read directly from the `Shareholder` collections, all existing holdings in the database will display a value of `$0.00` until they are backfilled.

Before or immediately after deploying this code, you **must** run the included migration script inside your backend Docker container. This script will iterate through all existing holdings, chronologically run the rolling math on their historical transactions, and permanently stamp the accurate values into the database.

**Run this command:**
```bash
docker-compose exec backend node scripts/migrate_cost_basis.js
```
