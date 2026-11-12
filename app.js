const WEEKEND_DATUM = new Date('2027-02-26T18:00:00');
const huisgenoten = ['Niels', 'Fay', 'Aimee', 'Minou', 'Aniek', 'Suus', 'Jesper', 'Mees', 'Felix', 'Caro', 'Timo', 'Teun', 'Nikki', 'Sean'];

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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let anytimers = [];

db.collection("anytimers").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    anytimers = [];
    snapshot.forEach((doc) => {
        anytimers.push({ id: doc.id, ...doc.data() });
    });
    
    if (document.getElementById('view-anytimers').classList.contains('active')) {
        renderAnytimers();
    }
});

// --- ANYTIMER LEDGER LOGICA ---
function renderAnytimers() {
    const container = document.getElementById('anytimer-container');
    container.innerHTML = '';

    anytimers.forEach(at => {
        // Verberg als de balans 0 is en er is geen inzet gaande
        if ((at.aantal || 0) <= 0 && !at.inzet_actief) return;

        const card = document.createElement('div');
        card.className = `at-card ${at.inzet_actief ? 'inzet' : 'normaal'}`;
        
        let actieKnoppen = '';
        let tekst = '';

        if (at.inzet_actief) {
            tekst = `<div class="inzet-waarschuwing">🚨 ${at.van} zet er één in op ${at.voor}!</div>`;
            actieKnoppen = `
                <button onclick="resolveInzet('${at.id}', true)" class="btn-sm btn-groen">Getrokken (-1)</button>
                <button onclick="resolveInzet('${at.id}', false)" class="btn-sm btn-rood">Geweigerd (+1)</button>
                <button onclick="cancelInzet('${at.id}')" class="btn-sm btn-outline">Annuleer</button>
            `;
        } else {
            tekst = `<strong>${at.van}</strong> heeft er <strong>${at.aantal}</strong> op <strong>${at.voor}</strong>`;
            actieKnoppen = `<button onclick="startInzet('${at.id}')" class="btn-sm btn-rood">Zet in!</button>`;
        }

        card.innerHTML = `
            <div class="at-info">${tekst}</div>
            <div class="at-acties">${actieKnoppen}</div>
        `;
        container.appendChild(card);
    });
}

function startInzet(id) {
    db.collection("anytimers").doc(id).update({ inzet_actief: true });
}

function cancelInzet(id) {
    db.collection("anytimers").doc(id).update({ inzet_actief: false });
}

function resolveInzet(id, getrokken) {
    // Getrokken = -1, Geweigerd = +1 (straf)
    const verandering = getrokken ? -1 : 1;
    db.collection("anytimers").doc(id).update({ 
        aantal: firebase.firestore.FieldValue.increment(verandering),
        inzet_actief: false
    });
}

// --- MODAL LOGICA ---
function nieuwVerzoek() {
    const selectVan = document.getElementById('select-van');
    const selectVoor = document.getElementById('select-voor');
    
    selectVan.innerHTML = '';
    selectVoor.innerHTML = '';
    document.getElementById('input-aantal').value = 1;
    
    huisgenoten.forEach(naam => {
        selectVan.innerHTML += `<option value="${naam}">${naam}</option>`;
        selectVoor.innerHTML += `<option value="${naam}">${naam}</option>`;
    });

    document.getElementById('anytimer-modal').classList.add('actief');
}

function sluitModal() {
    document.getElementById('anytimer-modal').classList.remove('actief');
}

function opslaanNieuwVerzoek() {
    const van = document.getElementById('select-van').value;
    const voor = document.getElementById('select-voor').value;
    const aantal = parseInt(document.getElementById('input-aantal').value, 10);

    if (van === voor) {
        alert("Je kunt geen anytimers op jezelf verdienen!");
        return;
    }
    if (isNaN(aantal) || aantal <= 0) {
        alert("Vul een geldig aantal in.");
        return;
    }

    // We gebruiken de combinatie van namen als ID, zodat ze altijd bij elkaar worden opgeteld
    const docId = `${van}_${voor}`;

    db.collection("anytimers").doc(docId).set({
        van: van,
        voor: voor,
        aantal: firebase.firestore.FieldValue.increment(aantal),
        inzet_actief: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => {
        sluitModal();
    }).catch(error => console.error("Fout bij toevoegen:", error));
}

// --- INITIALISATIE ---
document.addEventListener('DOMContentLoaded', () => {
    updateWeekendKnop();
    
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
        .catch(error => console.error('Fout bij laden schema:', error));
});