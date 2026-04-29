'use strict';

const ITEMS_PER_PAGE = 10;

let tbody, filterInput, prevBtn, nextBtn, pageInfoSpan, sortIdTh, sortTitleTh;

function getFilteredPosts() {
    const searchValue = state.searchValue.trim().toLowerCase();

    return searchValue
        ? state.allPosts.filter(post =>
            post.title.toLowerCase().includes(searchValue) ||
            post.body.toLowerCase().includes(searchValue)
        )
        : state.allPosts;
}

function getCurrentPagePosts() {
    const pageSlice = getPageSlice(getFilteredPosts(), state.curPage, ITEMS_PER_PAGE);
    return sortPosts(pageSlice, state.sortField, state.sortMode);
}

function getAriaSort(field, sortField, sortMode) {
    if (field !== sortField) return 'none';
    return sortMode === 'asc' ? 'ascending' : 'descending';
}

function updateAriaSort() {
    sortIdTh.setAttribute('aria-sort', getAriaSort('id', state.sortField, state.sortMode));
    sortTitleTh.setAttribute('aria-sort', getAriaSort('title', state.sortField, state.sortMode));
}

function renderTableBody(posts) {
    tbody.innerHTML = '';
    if (posts.length === 0) {
        const emptyRow = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.textContent = 'No posts.';
        td.style.textAlign = 'center';
        td.style.padding = '40px';
        emptyRow.appendChild(td);
        tbody.appendChild(emptyRow);
        return;
    }
    for (const post of posts) {
        const row = document.createElement('tr');
        row.dataset.postId = post.id;

        const idCell = document.createElement('td');
        idCell.textContent = post.id;
        idCell.dataset.label = 'ID';

        const titleCell = document.createElement('td');
        titleCell.textContent = post.title;
        titleCell.dataset.label = 'Title';

        const bodyCell = document.createElement('td');
        bodyCell.textContent = post.body;
        bodyCell.dataset.label = 'Body';

        row.appendChild(idCell);
        row.appendChild(titleCell);
        row.appendChild(bodyCell);
        tbody.appendChild(row);
    }
}

function resetViewState() {
    state.curPage = 1;
    state.sortField = 'id';
    state.sortMode = 'asc';
    updateAriaSort();
}

function render() {
    renderTableBody(getCurrentPagePosts());
    updatePagination(state, pageInfoSpan, prevBtn, nextBtn, ITEMS_PER_PAGE, getFilteredPosts().length);
    highlightRows(tbody);
}

function applyFilter() {
    resetViewState();
    render();
}

async function changeSorting(field) {
    highlightRows(tbody);

    if (state.sortField === field) {
        state.sortMode = state.sortMode === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortField = field;
        state.sortMode = 'asc';
    }
    updateAriaSort();

    const rawPagePosts = getPageSlice(getFilteredPosts(), state.curPage, ITEMS_PER_PAGE);
    const newSortedPosts = sortPosts(rawPagePosts, state.sortField, state.sortMode);

    await reorderRowsWithFLIP(tbody, newSortedPosts);
    updatePagination(state, pageInfoSpan, prevBtn, nextBtn, ITEMS_PER_PAGE, getFilteredPosts().length);
}

function goToPage(page) {
    const totalPages = Math.ceil(getFilteredPosts().length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    state.curPage = page;
    render();
}

const debouncedApplyFilter = debounce(applyFilter);

function onFilterInput(e) {
    state.searchValue = e.target.value;
    debouncedApplyFilter();
}

function showLoadingState() {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>';
}

function showErrorState(message) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#ff0000;">${message}</td></tr>`;
    updatePagination(state, pageInfoSpan, prevBtn, nextBtn, ITEMS_PER_PAGE, getFilteredPosts().length);
}

(async function init() {
    tbody = document.getElementById('tableBody');
    filterInput = document.getElementById('filterInput');
    prevBtn = document.getElementById('prevPageBtn');
    nextBtn = document.getElementById('nextPageBtn');
    pageInfoSpan = document.getElementById('pageInfo');
    sortIdTh = document.getElementById('sortId');
    sortTitleTh = document.getElementById('sortTitle');

    showLoadingState();
    try {
        state.allPosts = await fetchPosts();
        state.curPage = 1;
        state.sortField = 'id';
        state.sortMode = 'asc';
        updateAriaSort();
        render();
    } catch (err) {
        console.error(err);
        showErrorState('Failed to load posts.');
    }

    filterInput.addEventListener('input', onFilterInput);
    prevBtn.addEventListener('click', () => goToPage(state.curPage - 1));
    nextBtn.addEventListener('click', () => goToPage(state.curPage + 1));
    sortIdTh.addEventListener('click', () => changeSorting('id'));
    sortTitleTh.addEventListener('click', () => changeSorting('title'));
})();
