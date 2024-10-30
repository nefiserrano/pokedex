import { renderPokemonCards } from './pokémon-card.mjs';
import { createSortButton } from './sort-button.mjs';
import { fetchJSON } from './utils.mjs';


// It creates the generation cards.
export async function createGenerationCards() {
    const data = await fetchJSON('https://pokeapi.co/api/v2/generation/');
    const mainElement = document.querySelector('main');

    mainElement.innerHTML = '';
    const generationCards = document.createElement('div');
    generationCards.classList.add('generation-cards');

    data.results.forEach((generation, index) => {
        const generationCard = document.createElement('div');
        generationCard.classList.add('generation-card');
        generationCard.innerHTML = `
        <h2>Generation: ${index + 1}</h2>
        <p>${generation.name.charAt(0).toUpperCase() + generation.name.slice(1)}</p>`;

        generationCard.addEventListener('click', () => {
            loadGenerationPokemons(generation.url);
        });

        generationCards.appendChild(generationCard)
        mainElement.appendChild(generationCards);
    });
}

// It loads the Pokémon from the generation view.
async function loadGenerationPokemons(generationUrl) {
    const mainElement = document.querySelector('main');
    mainElement.innerHTML = '<p>Loading Pokémon...</p>';

    try {
        const generationData = await fetchJSON(generationUrl);

        const sortedPokemonSpecies = await Promise.all(generationData.pokemon_species.map(async (species) => {
            const id = parseInt(species.url.split('/').slice(-2, -1)[0]);
            try {
                const pokemonData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${species.name}`);
                const speciesData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon-species/${pokemonData.id}`);
                const generationName = speciesData.generation.name;

                return { id, data: pokemonData, generation: generationName };
            } catch (error) {
                console.warn(`Skipping ${species.name}: ${error.message}`);
                return null;
            }
        }));

        const validPokemonSpecies = sortedPokemonSpecies.filter(pokemon => pokemon !== null);
        validPokemonSpecies.sort((a, b) => a.id - b.id);

        mainElement.innerHTML = `<h2>Pokémon ${generationData.name.charAt(0).toUpperCase() + generationData.name.slice(1)}</h2>`;

        createSortButton(validPokemonSpecies, mainElement, generationData.name);
    
        const cardsContainer = document.createElement('div');
        cardsContainer.classList.add('pokemon-cards');
        mainElement.appendChild(cardsContainer);

        renderPokemonCards(validPokemonSpecies, generationData.name);
    } catch (error) {
        console.error("There was an error loading the Pokémon:", error);
        mainElement.innerHTML = '<p>There was an error loading the Pokémon. Try again later.</p>';
    }
}

createGenerationCards();