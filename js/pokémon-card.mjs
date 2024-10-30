function pokemonCardTemplate(pokemon, generationName) {
    const types = pokemon.types.map(type => type.type.name).join(', ');
    return `
    <div class="pokemon-card">
        <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" load="lazy">
        <button class="add-to-team" data-pokemon-id="${pokemon.id}">Add to team</button>
        <p>ID: ${pokemon.id}</p>
        <p>Generation: ${generationName}</p>
        <p>Types: ${types}</p>
        <p>Height: ${pokemon.height} dm</p>
        <p>Weight: ${pokemon.weight} hg</p>
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
    const generationCards = document.createElement('div');
    generationCards.classList.add('generation-cards');

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

        generationCards.appendChild(generationCard)
        mainElement.appendChild(generationCards);
    });
}

//window.addEventListener('popstate', (event) => {
//    const mainElement = document.querySelector('main');
//    if (event.state) {
//        if (event.state.view === 'search') {
//            createGenerationCards();
//        } else if (event.state.view === 'generation') {
//            loadGenerationPokemons(event.state.generationUrl);
//        } else if (event.state.view === 'type') {
//            createTypeCards();
//        }
//    } else {
//        mainElement.innerHTML = '';
//        createGenerationCards();
//    }
//});

createGenerationCards();

let isSortedAlphabetically = false;

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

                const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonData.id}`);
                const speciesData = await speciesResponse.json();
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

function createSortButton(validPokemonSpecies, container, generationOrTypeName) {
    const sortButton = document.createElement('button');
    sortButton.textContent = 'Sort Alphabetically';
    sortButton.classList.add('sort-button');

    sortButton.addEventListener('click', () => {
        isSortedAlphabetically = !isSortedAlphabetically;
        if (isSortedAlphabetically) {
            validPokemonSpecies.sort((a, b) => a.data.name.localeCompare(b.data.name));
            sortButton.textContent = 'Sort by ID';
        } else {
            validPokemonSpecies.sort((a, b) => a.id - b.id);
            sortButton.textContent = 'Sort Alphabetically';
        }

        container.querySelector('.pokemon-cards').innerHTML = '';
        renderPokemonCards(validPokemonSpecies, generationOrTypeName);
    });

    container.appendChild(sortButton);
}

function renderPokemonCards(pokemonList, generationName) {
    const cardsContainer = document.querySelector('.pokemon-cards');
    cardsContainer.innerHTML = '';

    pokemonList.forEach(pokemon => {
        const cardHTML = pokemonCardTemplate(pokemon.data, pokemon.generation || generationName);
        cardsContainer.insertAdjacentHTML('beforeend', cardHTML);
    })
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

//let currentView = 'generation';

document.getElementById('toggle-view').addEventListener('click', async () => {
    const mainElement = document.querySelector('main');
    mainElement.innerHTML = '<p>Loadin Pokémon...</p>';

    if ( mainElement.classList.contains('view-types')) {
        mainElement.classList.remove('view-types');
        await createGenerationCards();
        document.getElementById('toggle-view').textContent = 'View by Type';
    } else {
        mainElement.classList.add('view-types');
        await createTypeCards();
        document.getElementById('toggle-view').textContent = 'View by Generation';

        history.pushState({ view: 'type' }, '', `#type`);
    }
});

async function createTypeCards() {
    const response = await fetch('https://pokeapi.co/api/v2/type/');
    const data = await response.json();
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
        const response = await fetch(typeUrl);
        const typeData = await response.json();

        const validPokemonSpecies = await Promise.all(typeData.pokemon.map(async ({ pokemon }) => {
            const id = parseInt(pokemon.url.split('/').slice(-2, -1)[0]);
            try {
                const pokemonResponse = await fetch(pokemon.url);
                if (!pokemonResponse.ok) throw new Error("Pokemon not found");
                const pokemonData = await pokemonResponse.json();

                const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonData.id}`);
                const speciesData = await speciesResponse.json();
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

document.addEventListener('DOMContentLoaded', () => {
    const attackListLink = document.getElementById('attack-list-link');
    if (attackListLink) {
        attackListLink.addEventListener('click', (event) => {
            event.preventDefault();
            loadAttackList();
        });
    }
});

const LIMIT = 100; // Número de movimientos que deseas cargar
let offset = 0;    // Comienza desde el primer movimiento

async function loadAttackList() {
    const mainElement = document.querySelector('main');
    mainElement.innerHTML = '<p>Loading attack list...</p>';

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/move?limit=${LIMIT}&offset=${offset}`);
        const data = await response.json();

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
            <button id="load-more">Load More</button>
        `;

        const attackListBody = document.getElementById('attack-list-body');
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

        // Agrega el botón de "Load More" para cargar más movimientos cuando se hace clic
        document.getElementById('load-more').addEventListener('click', () => {
            offset += LIMIT; // Aumenta el desplazamiento para la siguiente carga
            loadAttackList(); // Carga el siguiente lote de movimientos
        });
    } catch (error) {
        console.error("Error loading attack list:", error);
        mainElement.innerHTML = '<p>Error loading attack list. Please try again later.</p>';
    }
}

document.getElementById('attack-list-link').addEventListener('click', (event) => {
    event.preventDefault();
    
    // Quitar "active" de cualquier enlace activo
    document.querySelectorAll('nav .active').forEach((el) => el.classList.remove('active'));
    
    // Añadir "active" solo al enlace de "Attack List"
    event.target.classList.add('active');

    loadAttackList();
});

// Evento para "List of Pokémon"
document.getElementById('pokemon-list-link').addEventListener('click', (event) => {
    event.preventDefault();
    
    // Quitar "active" de cualquier enlace activo
    document.querySelectorAll('nav .active').forEach((el) => el.classList.remove('active'));

    // Añadir "active" solo al enlace de "List of Pokémon"
    event.target.classList.add('active');

    createGenerationCards();
});

document.getElementById('image-gallery-link').addEventListener('click', (event) => {
    event.preventDefault();
    
    // Quitar "active" de cualquier enlace activo
    document.querySelectorAll('nav .active').forEach((el) => el.classList.remove('active'));

    // Añadir "active" solo al enlace de "List of Pokémon"
    event.target.classList.add('active');

    loadImageGallery();
});

async function loadImageGallery() {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${LIMIT}&offset=${offset}`); // Obtiene los primeros 100 Pokémon
    const data = await response.json();
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
        offset += LIMIT; // Incrementar el offset
        await loadImageGallery(); // Cargar más Pokémon
    });

    const main = document.querySelector('main');
    main.innerHTML = ''; // Limpia el contenido actual
    main.appendChild(galleryContainer);
    main.appendChild(loadMoreButton);
}

document.getElementById('image-gallery-link').addEventListener('click', (event) => {
    event.preventDefault();
    loadImageGallery();
});

async function loadTeam() {
    const team = JSON.parse(localStorage.getItem('pokemonTeam')) || [];
    const mainContainer = document.querySelector('main');

    mainContainer.innerHTML = ''; // Limpiar contenido anterior

    if (team.length === 0) {
        mainContainer.innerHTML = '<p>No Pokémon in team.</p>';
        return;
    }

    const teamCardsContainer = document.createElement('div');
    teamCardsContainer.id = 'team-cards';
    teamCardsContainer.className = 'pokemon-cards';

    mainContainer.insertAdjacentHTML('afterbegin', '<button id="clear-team">Clear Team</button>');
    
    for (const id of team) {
        try {
            const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            if (!pokemonData.ok) throw new Error(`Pokemon not found: ${id}`);
            const pokemonJSON = await pokemonData.json();

            const speciesData = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
            const generationName = (await speciesData.json()).generation.name;

            const cardHTML = pokemonCardTemplate(pokemonJSON, generationName);
            teamCardsContainer.insertAdjacentHTML('beforeend', cardHTML);
        } catch (error) {
            console.error("Error loading Pokémon:", error);
            teamCardsContainer.innerHTML += `<p>Error loading Pokémon with ID: ${id}</p>`;
        }
    }

    mainContainer.appendChild(teamCardsContainer);
    document.getElementById('clear-team').addEventListener('click', clearTeam);
}

// Llama a la función cuando se hace clic en el botón "My Team"
document.getElementById('view-team-button').addEventListener('click', (event) => {
    event.preventDefault();
    loadTeam();
});

document.addEventListener('click', (event) => {
    if (event.target.classList.contains('add-to-team')) {
        const pokemonId = event.target.getAttribute('data-pokemon-id');
        addToTeam(pokemonId);
    }
});

function addToTeam(pokemonId) {
    const team = JSON.parse(localStorage.getItem('pokemonTeam')) || [];

    if (team.length < 6 && !team.includes(pokemonId)) {
        team.push(pokemonId);
        localStorage.setItem('pokemonTeam', JSON.stringify(team));
    } else if (team.length >= 6) {
        alert('You can only have up to 6 Pokémon in your team.');
    } else {
        alert('This Pokémon is already in your team.');
    }
}

function clearTeam() {
    localStorage.removeItem('pokemonTeam');
    loadTeam(); // Recargar para mostrar mensaje de equipo vacío
}