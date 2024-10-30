import { fetchJSON } from "./utils.mjs";

const limit = 50;
let offset = 0;

// It loads different sprites of the pokémons. It uses a template.
export async function loadImageGallery() {
    const data = await fetchJSON(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    const pokemonList = data.results;
    const galleryContainer = document.createElement('div');
    galleryContainer.classList.add('table-container')
    galleryContainer.innerHTML = '<h2>Image Gallery</h2><table><thead><tr><th>ID</th><th>Name</th><th>Normal Sprite</th><th>Shiny Sprite</th></th><th>Dream World</th></tr></thead><tbody></tbody></table>';
    
    const tbody = galleryContainer.querySelector('tbody');
    
    for (const pokemon of pokemonList) {
        const pokemonData = await fetch(pokemon.url);
        const pokemonInfo = await pokemonData.json();
        
        const id = pokemonInfo.id;
        const name = pokemonInfo.name;
        const normalSprite = pokemonInfo.sprites.front_default;
        const shinySprite = pokemonInfo.sprites.front_shiny;
        const dreamWorldSprite = pokemonInfo.sprites.other.dream_world.front_default;

        const row = `<tr>
            <td>${id}</td>
            <td>${name}</td>
            <td><img src="${normalSprite}" alt="${name} normal" width="100" loading="lazy"></td>
            <td><img src="${shinySprite}" alt="${name} shiny" width="100" loading="lazy"></td>
            <td><img src="${dreamWorldSprite}" alt="${name} shiny" width="70" loading="lazy"></td>
        </tr>`;
        
        tbody.insertAdjacentHTML('beforeend', row);
    }

    const loadMoreButton = document.createElement('button');
    loadMoreButton.textContent = 'Load More';
    loadMoreButton.id = 'load-more-button';
    
    loadMoreButton.addEventListener('click', async () => {
        offset += limit;
        await loadImageGallery();
    });

    const main = document.querySelector('main');
    main.innerHTML = '';
    main.appendChild(galleryContainer);
    main.appendChild(loadMoreButton);
}

document.getElementById('image-gallery-link').addEventListener('click', (event) => {
    event.preventDefault();
    loadImageGallery();
});