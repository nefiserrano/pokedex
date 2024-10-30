import { pokemonCardTemplate, renderPokemonCards} from './pokémon-card.mjs';
import { fetchJSON } from './utils.mjs';

// It searches for a specific pokémon.
async function searchPokemon(pokemonName) {
    const mainElement = document.querySelector('main');
    mainElement.innerHTML = '<p>Searching...</p>';

    try {
        let pokemonData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);

        const speciesData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon-species/${pokemonData.id}`);
        const generationName = speciesData.generation.name;

        renderPokemonCards(pokemonData, generationName);
    }  catch (error) {
        try {
            const speciesList = await fetchJSON('https://pokeapi.co/api/v2/pokemon-species/?limit=10000');
            const species = speciesList.results.find(species => species.name === pokemonName.toLowerCase());

            if (species) {
                const speciesData = await fetchJSON(species.url);
                const pokemonData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${speciesData.id}`);
                const generationName = speciesData.generation.name;

                mainElement.innerHTML = '';
                const mainDiv = document.createElement('div');
                mainDiv.classList.add('pokemon-cards');
                mainDiv.insertAdjacentHTML('beforeend', pokemonCardTemplate(pokemonData, generationName));
                mainElement.appendChild(mainDiv);
            } else {
                throw new Error(`Pokémon "${pokemonName}" not found`);
            }
        } catch (innerError) {
            console.error("Pokémon not found:", innerError);
            mainElement.innerHTML = `<p>Pokémon "${pokemonName}" not found. Please try again.</p>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');

    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const pokemonName = document.getElementById('pokemon-search').value.toLowerCase();
        await searchPokemon(pokemonName);
    });
});