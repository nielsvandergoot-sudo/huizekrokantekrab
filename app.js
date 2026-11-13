const WEEKEND_DATUM = new Date('2027-02-26T18:00:00');
const huisgenoten = ['Niels', 'Fay', 'Aimee', 'Minou', 'Aniek', 'Suus', 'Jesper', 'Mees', 'Felix', 'Caro', 'Timo', 'Teun', 'Nikki', 'Sean'];

let currentUser = null;
let anytimers = [];

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

// --- AUTHENTICATIE LOGICA ---
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        let emailNaam = user.email.split('@')[0];
        currentUser = emailNaam.charAt(0).toUpperCase() + emailNaam.slice(1).toLowerCase();
        
        openScherm('home');
        startDatabaseListener();
    } else {
        currentUser = null;
        openScherm('login');
    }
});

function login() {
    const email = document.getElementById('login-email').value.trim();
    const ww = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');
    
    firebase.auth().signInWithEmailAndPassword(email, ww)
        .then(() => errorMsg.textContent = '')
        .catch(() => errorMsg.textContent = 'Je hebt een typfout gemaakt randdebiel');
}

function uitloggen() {
    firebase.auth().signOut();
}

// --- NAVIGATIE ---
function openScherm(schermNaam) {
    if (schermNaam === 'programma' && !isWeekendOntgrendeld()) {
        alert('Nog ff wachten ongeduldig stuk vreten');
        return;
    }

    document.querySelectorAll('.view').forEach(s => s.classList.remove('active'));
    document.getElementById('view-' + schermNaam).classList.add('active');

    const titel = document.getElementById('app-title');
    if (schermNaam === 'login') titel.textContent = 'Inloggen bij de Krokante Krab';
    else if (schermNaam === 'home') titel.textContent = `Fakka, ${currentUser}! 🦀`;
    else if (schermNaam === 'programma') titel.textContent = 'Logboek';
    else if (schermNaam === 'anytimers') {
        titel.textContent = 'Anytimers';
        renderAnytimers();
    }
}

// --- HUISWEEKEND TIJDSLOT ---
function isWeekendOntgrendeld() {
    return (WEEKEND_DATUM - new Date()) / (1000 * 60 * 60 * 24) <= 7;
}

function updateWeekendKnop() {
    const btn = document.getElementById('btn-weekend');
    const status = document.getElementById('weekend-status');
    if (!btn || !status) return;
    
    if (isWeekendOntgrendeld()) {
        btn.classList.remove('locked');
        status.textContent = 'Open! 🏕️';
        status.style.backgroundColor = '#2a9d8f';
    } else {
        btn.classList.add('locked');
        status.textContent = 'Geheim 🔒';
        status.style.backgroundColor = '#d94141';
    }
}

// --- ANYTIMER LEDGER LOGICA ---
function startDatabaseListener() {
    db.collection("anytimers").onSnapshot((snapshot) => {
        anytimers = [];
        snapshot.forEach((doc) => anytimers.push({ id: doc.id, ...doc.data() }));
        if (document.getElementById('view-anytimers').classList.contains('active')) {
            renderAnytimers();
        }
    });
}

function renderAnytimers() {
    const container = document.getElementById('anytimer-container');
    container.innerHTML = '';

    const mijnAnytimers = anytimers.filter(at => at.van === currentUser || at.voor === currentUser);

    if (mijnAnytimers.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#5c4e3c; margin-top:20px; font-style: italic;">Je ligt momenteel met niemand in de clinch...</p>';
        return;
    }

    mijnAnytimers.forEach(at => {
        if ((at.aantal || 0) <= 0 && !at.inzet_actief) return;

        const card = document.createElement('div');
        card.className = `at-card ${at.inzet_actief ? 'inzet' : 'normaal'}`;
        
        let actieKnoppen = '';
        let tekst = '';

        if (at.inzet_actief) {
            tekst = `<div class="inzet-waarschuwing">🚨 ADRENALINE! ${at.van} zet er een in op ${at.voor}!</div>`;
            actieKnoppen = `
                <button onclick="resolveInzet('${at.id}', true)" class="btn-sm btn-groen">Getrokken! (Adt 'm) 🍺</button>
                <button onclick="resolveInzet('${at.id}', false)" class="btn-sm btn-rood">Weigering (+1 extra) ❌</button>
                <button onclick="cancelInzet('${at.id}')" class="btn-sm btn-outline">Laat maar</button>
            `;
        } else {
            tekst = `<strong>${at.van}</strong> heeft <strong>${at.aantal}</strong> openstaan bij <strong>${at.voor}</strong>`;
            actieKnoppen = `<button onclick="startInzet('${at.id}')" class="btn-sm btn-rood">Zet er een in! ⏱️</button>`;
        }

        card.innerHTML = `<div class="at-info">${tekst}</div><div class="at-acties">${actieKnoppen}</div>`;
        container.appendChild(card);
    });
}

function startInzet(id) { db.collection("anytimers").doc(id).update({ inzet_actief: true }); }
function cancelInzet(id) { db.collection("anytimers").doc(id).update({ inzet_actief: false }); }
function resolveInzet(id, getrokken) {
    db.collection("anytimers").doc(id).update({ 
        aantal: firebase.firestore.FieldValue.increment(getrokken ? -1 : 1),
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

    selectVan.value = currentUser;

    document.getElementById('anytimer-modal').classList.add('actief');
}

function sluitModal() { document.getElementById('anytimer-modal').classList.remove('actief'); }

function opslaanNieuwVerzoek() {
    const van = document.getElementById('select-van').value;
    const voor = document.getElementById('select-voor').value;
    const aantal = parseInt(document.getElementById('input-aantal').value, 10);

    if (van === voor) return alert("Waarom de fuck zou je jezelf een anytimer geven?");
    if (isNaN(aantal) || aantal <= 0) return alert("Krab, voer eens een fatsoenlijk aantal in!");

    const docId = `${van}_${voor}`;
    db.collection("anytimers").doc(docId).set({
        van: van,
        voor: voor,
        aantal: firebase.firestore.FieldValue.increment(aantal),
        inzet_actief: false
    }, { merge: true }).then(() => sluitModal());
}

// --- INITIALISATIE ---
document.addEventListener('DOMContentLoaded', () => {
    updateWeekendKnop();
    
    const container = document.getElementById('schema-container');
    if(container) {
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
                    card.innerHTML = `<div class="card-top"><span class="activiteit">${item.activiteit}</span><span class="tijd">${item.tijd}</span></div><div class="details">${item.details}</div>`;
                    container.appendChild(card);
                });
            }).catch(e => console.log('Fout bij schema laden:', e));
    }
});