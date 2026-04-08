## shiny-table

**Objective:** Display data from an [JSONPlaceholder API](https://jsonplaceholder.typicode.com/posts) with sorting/filtering.

**Functionality:**
 - Sort by title, id (asc/desc);
 - Filter by keyword (client-side);
 - Pagination.

Sorting, filtering and pagination are performed on client‑side. The API itself supports server‑side operations, for example:
`https://jsonplaceholder.typicode.com/posts?_start=0&_limit=10&_sort=title&_order=desc&q=volu`.

**Animations:**
 - Row highlight on sort/filter.
 - Smooth reordering (FLIP technique).

**Responsive:**

Desktop: Full table. \
Mobile: Collapsible cards (hide less important columns).

**Semantics:**

`<table> <th scope="col"> aria-sort.`