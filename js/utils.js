function sortPosts(posts, field, direction) {
    return posts.sort((a, b) => {
        if (field === 'id') {
            return direction === 'asc' ? a.id - b.id : b.id - a.id;
        } else {
            const comparison = a.title.localeCompare(b.title);
            return direction === 'asc' ? comparison : -comparison;
        }
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
        }
        );
    });
}

function updatePagination(state, pageInfoSpan, prevBtn, nextBtn, ITEMS_PER_PAGE) {
    const totalPages = Math.ceil(state.filteredPosts.length / ITEMS_PER_PAGE) || 1;
    pageInfoSpan.textContent = `${state.curPage} of ${totalPages} pages`;
    prevBtn.disabled = state.curPage <= 1;
    nextBtn.disabled = state.curPage >= totalPages;
}
