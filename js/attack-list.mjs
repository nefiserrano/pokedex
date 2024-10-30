import { fetchJSON } from "./utils.mjs";

const limit = 50;
let offset = 0; 


// It loads all of the attacks.
export async function loadAttackList() {
    const mainElement = document.querySelector('main');
    mainElement.innerHTML = '<p>Loading attack list...</p>';

    try {
        await loadAndRenderAttacks();

        if (!document.getElementById('load-more')) {

            const loadMoreButton = document.createElement('button');
            loadMoreButton.id = 'load-more';
            loadMoreButton.textContent = 'Load More';
            mainElement.appendChild(loadMoreButton);
    
            loadMoreButton.addEventListener('click', async () => {
                offset += limit;
                await loadAndRenderAttacks();
            });
        }
    } catch (error) {
        console.error("Error loading attack list:", error);
        mainElement.innerHTML = '<p>Error loading attack list. Please try again later.</p>';
    }
}

// It uses a template to show the attacks and their info.
async function loadAndRenderAttacks() {
    const mainElement = document.querySelector('main');

    if (offset === 0) {
        mainElement.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Attack Name</th>
                        <th>Type</th>
                        <th>Power</th>
                        <th>Accuracy</th>
                    </tr>
                </thead>
                <tbody id="attack-list-body">
                    <!-- Los movimientos se irán añadiendo aquí -->
                </tbody>
            </table>
        `;
    }
    
    const attackListBody = document.getElementById('attack-list-body');
    
    const data = await fetchJSON(`https://pokeapi.co/api/v2/move?limit=${limit}&offset=${offset}`);
    
    for (const move of data.results) {
        const moveData = await fetch(move.url).then(res => res.json());
        const row = `
            <tr>
                <td>${moveData.id}</td>
                <td>${moveData.name.charAt(0).toUpperCase() + moveData.name.slice(1)}</td>
                <td>${moveData.type.name.charAt(0).toUpperCase() + moveData.type.name.slice(1)}</td>
                <td>${moveData.power || 'N/A'}</td>
                <td>${moveData.accuracy || 'N/A'}</td>
            </tr>
        `;
        attackListBody.insertAdjacentHTML('beforeend', row);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const attackListLink = document.getElementById('attack-list-link');
    if (attackListLink) {
        attackListLink.addEventListener('click', (event) => {
            event.preventDefault();
            offset = 0;
            loadAttackList();
        });
    }
});