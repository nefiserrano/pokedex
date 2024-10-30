import { createGenerationCards } from './generation-card.mjs';
import { createSortButton } from './sort-button.mjs';
import { renderPokemonCards } from './pokémon-card.mjs';
import { fetchJSON } from './utils.mjs';

async function createTypeCards() {
    const data = await fetchJSON('https://pokeapi.co/api/v2/type/');
    const mainElement = document.querySelector('main');
    mainElement.innerHTML = '';
    const typeCards = document.createElement('div');
    typeCards.classList.add('type-cards');

    data.results.forEach(type => {
        const typeCard = document.createElement('div');
        typeCard.classList.add('type-card');
        typeCard.innerHTML = `<h2>Type: ${type.name.charAt(0).toUpperCase() + type.name.slice(1)}</h2>`;

        typeCard.addEventListener('click', () => loadTypePokemons(type.url));

        typeCards.appendChild(typeCard)
        mainElement.appendChild(typeCards);
    });
}

async function loadTypePokemons(typeUrl) {
    const mainElement = document.querySelector('main');
    mainElement.innerHTML = '<p>Loading Pokémon...</p>';

    try {
        const typeData = await fetchJSON(typeUrl);

        const validPokemonSpecies = await Promise.all(typeData.pokemon.map(async ({ pokemon }) => {
            const id = parseInt(pokemon.url.split('/').slice(-2, -1)[0]);
            try {
                const pokemonResponse = await fetch(pokemon.url);
                if (!pokemonResponse.ok) throw new Error("Pokemon not found");
                const pokemonData = await pokemonResponse.json();

                const speciesData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon-species/${pokemonData.id}`);
                const generationName = speciesData.generation.name;

                return { id, data: pokemonData, generation : generationName };
            } catch (error) {
                console.warn(`Skipping ${pokemon.name}: ${error.message}`);
                return null;
            }
        }));

        const filteredPokemonSpecies = validPokemonSpecies.filter(pokemon => pokemon !== null);
        filteredPokemonSpecies.sort((a, b) => a.id - b.id);

        mainElement.innerHTML = `<h2>Pokémon Type: ${typeData.name.charAt(0).toUpperCase() + typeData.name.slice(1)}</h2>`;

        createSortButton(filteredPokemonSpecies, mainElement, typeData.name);

        const cardsContainer = document.createElement('div');
        cardsContainer.classList.add('pokemon-cards');
        mainElement.appendChild(cardsContainer);

        renderPokemonCards(filteredPokemonSpecies, typeData.name);
    } catch (error) {
        console.error("There was an error loading the Pokémon:", error);
        mainElement.innerHTML = '<p>There was an error loading the Pokémon. Try again later.</p>';
    }
}

document.getElementById('toggle-view').addEventListener('click', async () => {
    const mainElement = document.querySelector('main');
    mainElement.innerHTML = '<p>Loadin Pokémon...</p>';

    if (mainElement.classList.contains('view-types')) {
        mainElement.classList.remove('view-types');
        await createGenerationCards();
        document.getElementById('toggle-view').textContent = 'View by Type';
    } else {
        mainElement.classList.add('view-types');
        await createTypeCards();
        document.getElementById('toggle-view').textContent = 'View by Generation';
    }
});
