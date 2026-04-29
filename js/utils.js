'use strict';

function sortPosts(posts, field, direction) {
    const dir = direction === 'asc' ? 1 : -1;
    return [...posts].sort((a, b) => {
        if (field === 'id') {
            return (a.id - b.id) * dir;
        }
        return a.title.localeCompare(b.title) * dir;
    });
}

function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function highlightRows(tbody) {
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        row.classList.add('row-highlight');
        row.addEventListener('animationend', () =>
            row.classList.remove('row-highlight'), {
            once: true
        });
    });
}

function updatePagination(state, pageInfoSpan, prevBtn, nextBtn, ITEMS_PER_PAGE, totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    pageInfoSpan.textContent = `${state.curPage} of ${totalPages} pages`;
    prevBtn.disabled = state.curPage <= 1;
    nextBtn.disabled = state.curPage >= totalPages;
}

function getPageSlice(items, page, perPage) {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
}
