function pokemonCardTemplate(pokemon, generationName) {
    const types = pokemon.types.map(type => type.type.name).join(', ');
    return `
    <div>
        <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <p>ID: ${pokemon.id}</p>
        <p>Generation: ${generationName}</p>
        <p>Types: ${types}</p>
        <p>Height: ${pokemon.height}</p>
        <p>Weight: ${pokemon.weight}</p>
        <div>
            ${pokemon.stats.map(stat => `
                <p>${stat.stat.name.charAt(0).toUpperCase() + stat.stat.name.slice(1)}: ${stat.base_stat}</p>`).join('')
            }
        </div>
        <div>
            <strong>Moves:</strong>
            ${pokemon.moves.slice(0, 5).map(move => `
                <p>${move.move.name}</p>`).join('')
            }
        </div>
        <div>
            <strong>Abilities:</strong>
            ${pokemon.abilities.map(ability => `
                <p>${ability.ability.name}</p>`).join('')
            }
        </div>
    </div>`;
}

async function createPokemonCard(pokemon) {
    const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`);
    const speciesData = await speciesResponse.json();
    const generationName = speciesData.generation.name;
    const cardHTML = pokemonCardTemplate(pokemon, generationName);
    document.querySelector('main').insertAdjacentHTML('beforeend', cardHTML);
}

async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return await response.json();
    };

async function createGenerationCards() {
    const response = await fetch('https://pokeapi.co/api/v2/generation/');
    const data = await response.json();
    const mainElement = document.querySelector('main');

    mainElement.innerHTML = '';

    data.results.forEach((generation, index) => {
        const generationCard = document.createElement('div');
        generationCard.classList.add('generation-card');
        generationCard.innerHTML = `
        <h2>Generation: ${index + 1}</h2>
        <p>${generation.name.charAt(0).toUpperCase() + generation.name.slice(1)}</p>`;

        generationCard.addEventListener('click', () => {
            history.pushState({ view: 'generation', generationUrl: generation.url }, '', `#${generation.name}`);
            loadGenerationPokemons(generation.url);
        });
        mainElement.appendChild(generationCard);
    });
}

window.addEventListener('popstate', (event) => {
    const mainElement = document.querySelector('main');
    if (event.state) {
        if (event.state.view === 'search') {
            createGenerationCards();
        } else if (event.state.view === 'generation') {
            loadGenerationPokemons(event.state.generationUrl);
        }
    } else {
        mainElement.innerHTML = '';
        createGenerationCards();
    }
});

createGenerationCards();

async function loadGenerationPokemons(generationUrl) {
    const mainElement = document.querySelector('main');
    mainElement.innerHTML = '<p>Loading Pokémon...</p>';

    try {
        const response = await fetch(generationUrl);
        const generationData = await response.json();

        const sortedPokemonSpecies = await Promise.all(generationData.pokemon_species.map(async (species) => {
            const id = parseInt(species.url.split('/').slice(-2, -1)[0]);
            try {
                const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${species.name}`);
                if (!pokemonResponse.ok) throw new Error("Pokemon not found");
                const pokemonData = await pokemonResponse.json();
                return { id, data: pokemonData };
            } catch (error) {
                console.warn(`Skipping ${species.name}: ${error.message}`);
                return null;
            }
        }));

        const validPokemonSpecies = sortedPokemonSpecies.filter(pokemon => pokemon !== null);
        validPokemonSpecies.sort((a, b) => a.id - b.id);

        mainElement.innerHTML = `<h2>Pokémon ${generationData.name.charAt(0).toUpperCase() + generationData.name.slice(1)}</h2>`;

        validPokemonSpecies.forEach(pokemon => {
            mainElement.insertAdjacentHTML('beforeend', pokemonCardTemplate(pokemon.data, generationData.name));
        })

    } catch (error) {
        console.error("There was an error loading the Pokémon:", error);
        mainElement.innerHTML = '<p>There was an error loading the Pokémon. Try again later.</p>';
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

async function searchPokemon(pokemonName) {
    const mainElement = document.querySelector('main');
    mainElement.innerHTML = '<p>Searching...</p>';

    history.pushState({ view: 'search', pokemonName }, '', `#search-${pokemonName.toLowerCase()}`);

    try {
        let pokemonData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);

        const speciesData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon-species/${pokemonData.id}`);
        const generationName = speciesData.generation.name;

        mainElement.innerHTML = '';
        mainElement.insertAdjacentHTML('beforeend', pokemonCardTemplate(pokemonData, generationName));
    }  catch (error) {
        try {
            const speciesList = await fetchJSON('https://pokeapi.co/api/v2/pokemon-species/?limit=10000');
            const species = speciesList.results.find(species => species.name === pokemonName.toLowerCase());

            if (species) {
                const speciesData = await fetchJSON(species.url);
                const pokemonData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${speciesData.id}`);
                const generationName = speciesData.generation.name;

                mainElement.innerHTML = '';
                mainElement.insertAdjacentHTML('beforeend', pokemonCardTemplate(pokemonData, generationName));
            } else {
                throw new Error(`Pokémon "${pokemonName}" not found`);
            }
        } catch (innerError) {
            console.error("Pokémon not found:", innerError);
            mainElement.innerHTML = `<p>Pokémon "${pokemonName}" not found. Please try again.</p>`;
        }
    }
}