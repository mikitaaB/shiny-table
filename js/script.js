(function () {
    const API_URL = 'https://jsonplaceholder.typicode.com/posts';
    const ITEMS_PER_PAGE = 10;
    const FLIP_TRANSITION_MS = 300;

    let tbody, filterInput, prevBtn, nextBtn, pageInfoSpan, sortIdTh, sortTitleTh;

    const state = {
        allPosts: [],
        filteredPosts: [],
        curPage: 1,
        sortField: 'id',
        sortMode: 'asc',
        searchValue: ''
    };

    function getCurrentPagePosts() {
        const start = (state.curPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageSlice = state.filteredPosts.slice(start, end);
        return sortPosts(pageSlice, state.sortField, state.sortMode);
    }

    function updateAriaSort() {
        const idSort = state.sortField === 'id'
            ? state.sortMode === 'asc' ? 'ascending' : 'descending'
            : 'none';
        const titleSort = state.sortField === 'title'
            ? state.sortMode === 'asc' ? 'ascending' : 'descending'
            : 'none';
        sortIdTh.setAttribute('aria-sort', idSort);
        sortTitleTh.setAttribute('aria-sort', titleSort);
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

    function reorderRowsWithFLIP(newSortedPosts) {
        return new Promise((resolve) => {
            const currentRows = Array.from(tbody.children);
            if (currentRows.length === 0) {
                resolve();
                return;
            }
            const rowMap = new Map();
            for (const row of currentRows) {
                const id = Number.parseInt(row.dataset.postId);
                if (!Number.isNaN(id)) rowMap.set(id, row);
            }
            const newOrderIds = newSortedPosts.map(p => p.id);
            const allPresent = newOrderIds.every(id => rowMap.has(id));
            if (!allPresent) {
                renderTableBody(newSortedPosts);
                resolve();
                return;
            }

            const oldRects = new Map();
            for (const [id, row] of rowMap.entries()) {
                oldRects.set(id, row.getBoundingClientRect());
            }

            for (let i = 0; i < newOrderIds.length; i++) {
                const id = newOrderIds[i];
                const row = rowMap.get(id);
                if (i === 0) {
                    tbody.appendChild(row);
                } else {
                    const prevRow = rowMap.get(newOrderIds[i - 1]);
                    if (prevRow && prevRow.nextSibling !== row) {
                        tbody.insertBefore(row, prevRow.nextSibling);
                    }
                }
            }
            for (let i = 0; i < newOrderIds.length; i++) {
                const expectedRow = rowMap.get(newOrderIds[i]);
                if (tbody.children[i] !== expectedRow) {
                    tbody.insertBefore(expectedRow, tbody.children[i]);
                }
            }

            const newRects = new Map();
            for (const [id, row] of rowMap.entries()) {
                newRects.set(id, row.getBoundingClientRect());
            }

            for (const [id, row] of rowMap.entries()) {
                const oldRect = oldRects.get(id);
                const newRect = newRects.get(id);
                if (!oldRect || !newRect) continue;
                const deltaX = oldRect.left - newRect.left;
                const deltaY = oldRect.top - newRect.top;
                if (deltaX === 0 && deltaY === 0) continue;
                row.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                row.style.transition = 'none';
            }

            tbody.offsetHeight;

            for (const [_, row] of rowMap.entries()) {
                row.classList.add('flip-animate');
                row.style.transform = '';
                row.style.transition = '';
            }

            let finished = 0;
            const total = rowMap.size;
            const onFinish = () => {
                for (const [_, row] of rowMap.entries()) {
                    row.classList.remove('flip-animate');
                    row.style.transform = '';
                    row.style.transition = '';
                }
                highlightRows(tbody);
                resolve();
            };
            const transitionEndHandler = (e) => {
                if (e.target?.classList?.contains('flip-animate')) {
                    finished++;
                    if (finished >= total) {
                        tbody.removeEventListener('transitionend', transitionEndHandler);
                        tbody.removeEventListener('webkitTransitionEnd', transitionEndHandler);
                        onFinish();
                    }
                }
            };
            tbody.addEventListener('transitionend', transitionEndHandler);
            tbody.addEventListener('webkitTransitionEnd', transitionEndHandler);
            setTimeout(() => {
                if (finished < total) {
                    tbody.removeEventListener('transitionend', transitionEndHandler);
                    tbody.removeEventListener('webkitTransitionEnd', transitionEndHandler);
                    onFinish();
                }
            }, FLIP_TRANSITION_MS + 50);
        });
    }

    function applyFilter() {
        const searchValue = state.searchValue.trim().toLowerCase();
        console.log(searchValue)
        state.filteredPosts = searchValue
            ? state.allPosts.filter(post =>
                post.title.toLowerCase().includes(searchValue) || post.body.toLowerCase().includes(searchValue)
            )
            : [...state.allPosts];
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

        await reorderRowsWithFLIP(newSortedPosts);
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
            state.filteredPosts = [...posts];
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
