document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('schema-container');

    // Laad het schema in
    fetch('schema.json')
        .then(response => response.json())
        .then(data => {
            let huidigeDag = '';

            data.forEach(item => {
                // Maak een nieuw dag-kopje aan als de dag verandert
                if (item.dag !== huidigeDag) {
                    const dagKop = document.createElement('h2');
                    dagKop.className = 'dag-header';
                    dagKop.textContent = item.dag;
                    container.appendChild(dagKop);
                    huidigeDag = item.dag;
                }

                // Maak de activiteit-card
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

// Registreer de Service Worker voor offline support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker geregistreerd', reg))
        .catch(err => console.error('Service Worker fout', err));
}