'use strict';

const FLIP_TRANSITION_MS = 300;

function reorderRowsWithFLIP(tbody, newSortedPosts) {
    return new Promise((resolve) => {
        const currentRows = Array.from(tbody.children);
        if (currentRows.length === 0) return resolve();

        const rowMap = buildRowMap(currentRows);
        const newOrderIds = newSortedPosts.map(p => p.id);

        if (!allRowsPresent(rowMap, newOrderIds)) {
            renderTableBody(newSortedPosts);
            return resolve();
        }

        const oldRects = measureRects(rowMap);

        reorderDOM(tbody, rowMap, newOrderIds);
        fixFinalOrder(tbody, rowMap, newOrderIds);

        const newRects = measureRects(rowMap);

        applyInverseTransforms(rowMap, oldRects, newRects);
        forceReflow(tbody);
        startAnimation(rowMap);

        waitForAnimationEnd(tbody, rowMap, () => {
            cleanupStyles(rowMap);
            highlightRows(tbody);
            resolve();
        });
    });
}

function buildRowMap(rows) {
    const map = new Map();
    for (const row of rows) {
        const id = Number.parseInt(row.dataset.postId);
        if (!Number.isNaN(id)) map.set(id, row);
    }
    return map;
}

function allRowsPresent(rowMap, ids) {
    return ids.every(id => rowMap.has(id));
}

function measureRects(rowMap) {
    const rects = new Map();
    for (const [id, row] of rowMap.entries()) {
        rects.set(id, row.getBoundingClientRect());
    }
    return rects;
}

function reorderDOM(tbody, rowMap, orderIds) {
    for (let i = 0; i < orderIds.length; i++) {
        const row = rowMap.get(orderIds[i]);
        if (i === 0) {
            tbody.appendChild(row);
        } else {
            const prev = rowMap.get(orderIds[i - 1]);
            if (prev && prev.nextSibling !== row) {
                tbody.insertBefore(row, prev.nextSibling);
            }
        }
    }
}

function fixFinalOrder(tbody, rowMap, orderIds) {
    for (let i = 0; i < orderIds.length; i++) {
        const expected = rowMap.get(orderIds[i]);
        if (tbody.children[i] !== expected) {
            tbody.insertBefore(expected, tbody.children[i]);
        }
    }
}

function applyInverseTransforms(rowMap, oldRects, newRects) {
    for (const [id, row] of rowMap.entries()) {
        const oldR = oldRects.get(id);
        const newR = newRects.get(id);
        if (!oldR || !newR) continue;

        const dx = oldR.left - newR.left;
        const dy = oldR.top - newR.top;
        if (dx === 0 && dy === 0) continue;

        row.style.transition = 'none';
        row.style.transform = `translate(${dx}px, ${dy}px)`;
    }
}

function forceReflow(tbody) {
    void tbody.offsetHeight;
}

function startAnimation(rowMap) {
    for (const [, row] of rowMap.entries()) {
        row.classList.add('flip-animate');
        row.style.transform = '';
        row.style.transition = '';
    }
}

function cleanupStyles(rowMap) {
    for (const [, row] of rowMap.entries()) {
        row.classList.remove('flip-animate');
        row.style.transform = '';
        row.style.transition = '';
    }
}

function waitForAnimationEnd(tbody, rowMap, callback) {
    let finished = 0;
    const total = rowMap.size;

    const transitionEndHandler = (e) => {
        if (!e.target?.classList?.contains('flip-animate')) return;
        if (++finished >= total) {
            removeListeners();
            callback();
        }
    };

    const removeListeners = () => {
        tbody.removeEventListener('transitionend', transitionEndHandler);
        tbody.removeEventListener('webkitTransitionEnd', transitionEndHandler);
    };

    tbody.addEventListener('transitionend', transitionEndHandler);
    tbody.addEventListener('webkitTransitionEnd', transitionEndHandler);

    setTimeout(() => {
        if (finished < total) {
            removeListeners();
            callback();
        }
    }, FLIP_TRANSITION_MS + 50);
}
