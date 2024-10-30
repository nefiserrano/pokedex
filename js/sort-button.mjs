import { renderPokemonCards } from './pokémon-card.mjs';

let isSortedAlphabetically = false;

// It creates the sort button to change between sorted alphabetically and sorted by ID.
export function createSortButton(validPokemonSpecies, container, generationOrTypeName) {
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