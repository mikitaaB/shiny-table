(function () {
    'use strict';

    const API_URL = 'https://jsonplaceholder.typicode.com/posts';
    const ITEMS_PER_PAGE = 10;

    let tbody, filterInput, prevBtn, nextBtn, pageInfoSpan, sortIdTh, sortTitleTh;

    const state = {
        allPosts: [],
        filteredPosts: [],
        curPage: 1,
        sortField: 'id',
        sortMode: 'asc',
        searchValue: '',
    };

    function getCurrentPagePosts() {
        const start = (state.curPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageSlice = state.filteredPosts.slice(start, end);
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

    function applyFilter() {
        const searchValue = state.searchValue.trim().toLowerCase();
        state.filteredPosts = searchValue
            ? state.allPosts.filter(post =>
                post.title.toLowerCase().includes(searchValue) || post.body.toLowerCase().includes(searchValue)
            )
            : state.allPosts;
        state.curPage = 1;
        state.sortField = 'id';
        state.sortMode = 'asc';
        updateAriaSort();
        renderTableBody(getCurrentPagePosts());
        updatePagination(state, pageInfoSpan, prevBtn, nextBtn, ITEMS_PER_PAGE);
        highlightRows(tbody);
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

        const start = (state.curPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const rawPagePosts = state.filteredPosts.slice(start, end);
        const newSortedPosts = sortPosts(rawPagePosts, state.sortField, state.sortMode);

        await reorderRowsWithFLIP(tbody, newSortedPosts);
        updatePagination(state, pageInfoSpan, prevBtn, nextBtn, ITEMS_PER_PAGE);
    }

    function goToPage(page) {
        const totalPages = Math.ceil(state.filteredPosts.length / ITEMS_PER_PAGE);
        if (page < 1 || page > totalPages) return;
        state.curPage = page;
        renderTableBody(getCurrentPagePosts());
        updatePagination(state, pageInfoSpan, prevBtn, nextBtn, ITEMS_PER_PAGE);
        highlightRows(tbody);
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
        updatePagination(state, pageInfoSpan, prevBtn, nextBtn, ITEMS_PER_PAGE);
    }

    async function init() {
        tbody = document.getElementById('tableBody');
        filterInput = document.getElementById('filterInput');
        prevBtn = document.getElementById('prevPageBtn');
        nextBtn = document.getElementById('nextPageBtn');
        pageInfoSpan = document.getElementById('pageInfo');
        sortIdTh = document.getElementById('sortId');
        sortTitleTh = document.getElementById('sortTitle');

        showLoadingState();
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const posts = await response.json();
            state.allPosts = posts;
            state.filteredPosts = posts;
            state.curPage = 1;
            state.sortField = 'id';
            state.sortMode = 'asc';
            updateAriaSort();
            renderTableBody(getCurrentPagePosts());
            updatePagination(state, pageInfoSpan, prevBtn, nextBtn, ITEMS_PER_PAGE);
            highlightRows(tbody);
        } catch (err) {
            console.error(err);
            showErrorState('Failed to load posts.');
        }

        filterInput.addEventListener('input', onFilterInput);
        prevBtn.addEventListener('click', () => goToPage(state.curPage - 1));
        nextBtn.addEventListener('click', () => goToPage(state.curPage + 1));
        sortIdTh.addEventListener('click', () => changeSorting('id'));
        sortTitleTh.addEventListener('click', () => changeSorting('title'));
    }

    init();
})();
