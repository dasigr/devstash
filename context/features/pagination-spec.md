# Pagination

## Overview

Add pagination for items and collections listings with numbered page links.

## Requirements

- Add pagination to /items/[type] and /collections/[id] pages
- Pagination controls at bottom with page numbers and prev/next links
- Disable (grey out) prev/next when not available
- Use constants: ITEMS_PER_PAGE = 20, COLLECTIONS_PER_PAGE = 20
- Dashboard limits: DASHBOARD_COLLECTIONS_LIMIT = 8, DASHBOARD_RECENT_ITEMS_LIMIT = 8
- Do not fetch all resources at once. Only fetch the amount that a page requires
