'use strict';

const API_URL = 'https://jsonplaceholder.typicode.com/posts';

async function fetchPosts() {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}
