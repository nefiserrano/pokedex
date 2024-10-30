import { createGenerationCards } from './generation-card.mjs';
import { loadImageGallery } from './image-gallery.mjs';
import { loadAttackList } from './attack-list.mjs';

// It creates the template for the pokémon cards.
export function pokemonCardTemplate(pokemon, generationName) {
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

// It loads the Pokémon Cards.
export function renderPokemonCards(pokemonList, generationName) {
    const cardsContainer = document.querySelector('.pokemon-cards');
    cardsContainer.innerHTML = '';

    pokemonList.forEach(pokemon => {
        const cardHTML = pokemonCardTemplate(pokemon.data, pokemon.generation || generationName);
        cardsContainer.insertAdjacentHTML('beforeend', cardHTML);
    })
}

document.getElementById('attack-list-link').addEventListener('click', (event) => {
    event.preventDefault();

    document.querySelectorAll('nav .active').forEach((el) => el.classList.remove('active'));

    event.target.classList.add('active');

    loadAttackList();
});

document.getElementById('pokemon-list-link').addEventListener('click', (event) => {
    event.preventDefault();

    document.querySelectorAll('nav .active').forEach((el) => el.classList.remove('active'));

    event.target.classList.add('active');

    createGenerationCards();
});

document.getElementById('image-gallery-link').addEventListener('click', (event) => {
    event.preventDefault();

    document.querySelectorAll('nav .active').forEach((el) => el.classList.remove('active'));

    event.target.classList.add('active');

    loadImageGallery();
});