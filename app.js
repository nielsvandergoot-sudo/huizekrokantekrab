// --- CONFIGURATIE ---
const WEEKEND_DATUM = new Date('2027-02-26T18:00:00'); // Vul hier de startdatum in


// --- NAVIGATIE ---
function openScherm(schermNaam) {
    if (schermNaam === 'programma') {
        if (!isWeekendOntgrendeld()) {
            alert('Het programma is pas 7 dagen van tevoren zichtbaar!');
            return;
        }
    }

    document.querySelectorAll('.view').forEach(s => s.classList.remove('active'));
    document.getElementById('view-' + schermNaam).classList.add('active');

    const titel = document.getElementById('app-title');
    if (schermNaam === 'home') titel.textContent = 'Huize Krokante Krab';
    else if (schermNaam === 'programma') titel.textContent = 'Programma';
    else if (schermNaam === 'anytimers') {
        titel.textContent = 'Anytimers';
        renderAnytimers();
    }
}

// --- HUISWEEKEND TIJDSLOT ---
function isWeekendOntgrendeld() {
    const nu = new Date();
    const verschilInMs = WEEKEND_DATUM - nu;
    const dagenTotWeekend = verschilInMs / (1000 * 60 * 60 * 24);
    return dagenTotWeekend <= 7;
}

function updateWeekendKnop() {
    const btn = document.getElementById('btn-weekend');
    const status = document.getElementById('weekend-status');
    
    if (isWeekendOntgrendeld()) {
        btn.classList.remove('locked');
        status.textContent = 'Geopend!';
        status.style.backgroundColor = '#4caf50';
    } else {
        btn.classList.add('locked');
        status.textContent = 'Nog geheim';
        status.style.backgroundColor = '#999';
    }
}

// --- FIREBASE CONFIGURATIE ---
const firebaseConfig = {
    apiKey: "AIzaSyA9G3hu-1R1hBVQ0Y_VqG0Ea9P_D58rr_s",
    authDomain: "huize-krokante-krab.firebaseapp.com",
    projectId: "huize-krokante-krab",
    storageBucket: "huize-krokante-krab.firebasestorage.app",
    messagingSenderId: "175111862980",
    appId: "1:175111862980:web:4b4b3e0a81c3a35ba1a791"
};

// Initialiseer Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let anytimers = [];

// --- REALTIME DATABASE LISTENER ---
// Dit blokje vuurt automatisch af zodra de app opent én elke keer als er data verandert in de cloud.
db.collection("anytimers").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    anytimers = [];
    snapshot.forEach((doc) => {
        anytimers.push({ id: doc.id, ...doc.data() });
    });
    
    // Alleen renderen als we daadwerkelijk op het anytimer-scherm zitten
    if (document.getElementById('view-anytimers').classList.contains('active')) {
        renderAnytimers();
    }
});

// --- ANYTIMER LOGICA ---
function renderAnytimers() {
    const container = document.getElementById('anytimer-container');
    container.innerHTML = '';

    anytimers.forEach(at => {
        const card = document.createElement('div');
        card.className = `at-card ${at.status}`;
        
        let actieKnoppen = '';
        let tekst = '';

        if (at.status === 'actief') {
            tekst = `<strong>${at.van}</strong> heeft er één op <strong>${at.voor}</strong>`;
            actieKnoppen = `<button onclick="verzoekVerwijderen('${at.id}')" class="btn-sm btn-outline">Trek in</button>`;
        } 
        else if (at.status === 'pending_add') {
            tekst = `Nieuw verzoek: <strong>${at.van}</strong> op <strong>${at.voor}</strong>`;
            actieKnoppen = `
                <button onclick="updateStatus('${at.id}', 'actief')" class="btn-sm btn-groen">Accepteer</button>
                <button onclick="verwijderItem('${at.id}')" class="btn-sm btn-rood">Weiger</button>
            `;
        }
        else if (at.status === 'pending_remove') {
            tekst = `Verwijder verzoek: <strong>${at.van}</strong> op <strong>${at.voor}</strong>`;
            actieKnoppen = `
                <button onclick="verwijderItem('${at.id}')" class="btn-sm btn-groen">Accepteer (is getrokken)</button>
                <button onclick="updateStatus('${at.id}', 'actief')" class="btn-sm btn-rood">Weiger</button>
            `;
        }

        card.innerHTML = `
            <div class="at-info">${tekst}</div>
            <div class="at-acties">${actieKnoppen}</div>
        `;
        container.appendChild(card);
    });
}

// Database Mutaties
function updateStatus(id, nieuweStatus) {
    db.collection("anytimers").doc(id).update({ 
        status: nieuweStatus 
    }).catch(error => console.error("Fout bij updaten:", error));
}

function verwijderItem(id) {
    db.collection("anytimers").doc(id).delete()
        .catch(error => console.error("Fout bij verwijderen:", error));
}

function verzoekVerwijderen(id) {
    updateStatus(id, 'pending_remove');
}

function nieuwVerzoek() {
    // Om te testen pakken we twee willekeurige namen uit de groep. 
    // In een latere iteratie kun je hier een HTML formulier voor maken.
    const huisgenoten = ['Niels', 'Fay', 'Aimee', 'Minou', 'Aniek', 'Suus'];
    const van = huisgenoten[Math.floor(Math.random() * huisgenoten.length)];
    let voor = huisgenoten[Math.floor(Math.random() * huisgenoten.length)];
    while(voor === van) voor = huisgenoten[Math.floor(Math.random() * huisgenoten.length)]; // Voorkom zelf-anytimers

    db.collection("anytimers").add({
        van: van,
        voor: voor,
        status: 'pending_add',
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // Sorteert alles chronologisch
    }).catch(error => console.error("Fout bij toevoegen:", error));
}
// Tijdelijke mock-functies om de UI te testen
function updateStatus(id, nieuweStatus) {
    const at = anytimers.find(a => a.id === id);
    if(at) at.status = nieuweStatus;
    renderAnytimers();
}
function verwijderItem(id) {
    anytimers = anytimers.filter(a => a.id !== id);
    renderAnytimers();
}
function verzoekVerwijderen(id) {
    updateStatus(id, 'pending_remove');
}
function nieuwVerzoek() {
    // Later bouw je hier een dropdown menu om huisgenoten te selecteren
    anytimers.push({ id: Date.now(), van: 'Jij', voor: 'Huisgenoot', status: 'pending_add' });
    renderAnytimers();
}

// Initialisatie bij opstarten
document.addEventListener('DOMContentLoaded', () => {
    updateWeekendKnop();
    // Programma JSON laden code staat hier (idem als vorige versie)
});