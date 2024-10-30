import { pokemonCardTemplate, renderPokemonCards } from './pokémon-card.mjs';
import { fetchJSON } from './utils.mjs';

// It gets the pokémon from local storage and loads the pokémon cards of the pokémon team  
async function loadTeam() {
    const team = JSON.parse(localStorage.getItem('pokemonTeam')) || [];
    const mainContainer = document.querySelector('main');

    mainContainer.innerHTML = '';

    if (team.length === 0) {
        mainContainer.innerHTML = '<p>No Pokémon in team.</p>';
        return;
    }

    const teamCardsContainer = document.createElement('div');
    teamCardsContainer.id = 'team-cards';
    teamCardsContainer.className = 'pokemon-cards';

    mainContainer.insertAdjacentHTML('afterbegin', '<button id="clear-team">Clear Team</button>');
    mainContainer.insertAdjacentHTML('afterbegin', '<button id="download-team">Download Team</button>');

    document.getElementById('download-team').addEventListener('click', downloadTeamInfo);
    
    for (const id of team) {
        try {
            const pokemonJSON = await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${id}`);
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

// It saves the pokémon chosen in local storage to retrieve it later.
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

// It eliminites all pokémon of the pokémon team
function clearTeam() {
    localStorage.removeItem('pokemonTeam');
    loadTeam();
}

// It downloads the info of the pokémon team to a .txt file
function downloadTeamInfo() {
    const team = JSON.parse(localStorage.getItem('pokemonTeam')) || [];

    let teamInfo = 'Pokémon Team Information:\n\n';

    team.forEach(async (id, index) => {
        const pokemon = await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${id}`);
        
        teamInfo += `#${pokemon.id} ${pokemon.name.toUpperCase()}\n`;
        teamInfo += `Type(s): ${pokemon.types.map(type => type.type.name).join(', ')}\n`;
        teamInfo += `Height: ${pokemon.height / 10} m\n`;
        teamInfo += `Weight: ${pokemon.weight / 10} kg\n\n`;

        if (index === team.length - 1) {
            const blob = new Blob([teamInfo], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Pokemon_Team.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    });
}

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