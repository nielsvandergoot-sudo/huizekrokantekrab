// Navigatie functie: wisselt tussen de schermen
function openScherm(schermNaam) {
    // 1. Zoek alle elementen met de class 'view' en verberg ze
    const schermen = document.querySelectorAll('.view');
    schermen.forEach(scherm => {
        scherm.classList.remove('active');
    });

    // 2. Zoek het scherm dat we willen openen en maak het zichtbaar
    const doelScherm = document.getElementById('view-' + schermNaam);
    if (doelScherm) {
        doelScherm.classList.add('active');
    }

    // 3. Pas de titel bovenin aan
    const titel = document.getElementById('app-title');
    if (schermNaam === 'home') {
        titel.textContent = 'Huisweekend';
    } else if (schermNaam === 'programma') {
        titel.textContent = 'Programma';
    }
}

// Data inladen voor het programma (dit gebeurt 1x als de app start)
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('schema-container');

    fetch('schema.json')
        .then(response => response.json())
        .then(data => {
            let huidigeDag = '';

            data.forEach(item => {
                if (item.dag !== huidigeDag) {
                    const dagKop = document.createElement('h2');
                    dagKop.className = 'dag-header';
                    dagKop.textContent = item.dag;
                    container.appendChild(dagKop);
                    huidigeDag = item.dag;
                }

                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-top">
                        <span class="activiteit">${item.activiteit}</span>
                        <span class="tijd">${item.tijd}</span>
                    </div>
                    <div class="details">${item.details}</div>
                `;
                container.appendChild(card);
            });
        })
        .catch(error => console.error('Fout bij het laden van het schema:', error));
});

// Registreer de Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker geregistreerd', reg))
        .catch(err => console.error('Service Worker fout', err));
}