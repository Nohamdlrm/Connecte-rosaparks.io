// CONFIGURATION CRITIQUE
const ADMIN_ID = "ce.0227235a@campus-rosaparks.fr";
const PRONOTE_URL = "https://pronote.campus-rosaparks.fr/";

let state = {
    services: JSON.parse(localStorage.getItem('RP_SRVS')) || [
        { ico: '🦋', name: 'Pronote', url: PRONOTE_URL },
        { ico: '✉️', name: 'Webmail', url: 'https://mail.google.com' },
        { ico: '📂', name: 'Cloud', url: 'https://drive.google.com' }
    ],
    logs: JSON.parse(localStorage.getItem('RP_LOGS')) || [],
    cas: JSON.parse(localStorage.getItem('RP_CAS')) || {}
};

// 1. GESTION DE LA CONNEXION
function onGoogleAuth(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const email = user.email.toLowerCase();

    // Vérification : soit c'est l'admin, soit c'est le domaine campus
    if (email === ADMIN_ID.toLowerCase() || email.endsWith("@campus-rosaparks.fr")) {
        console.log("Accès validé pour :", email);
        saveLog(email, "CONNEXION");
        launchApp(user);
    } else {
        alert("ERREUR : Accès réservé au domaine @campus-rosaparks.fr");
    }
}

// 2. LANCEMENT DE L'INTERFACE
function launchApp(user) {
    const email = user.email.toLowerCase();
    
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('status').innerText = `NODE: ${email.toUpperCase()}`;
    document.getElementById('welcome').innerText = `Bonjour, ${user.given_name}`;

    // AFFICHAGE SI ADMIN
    if (email === ADMIN_ID.toLowerCase()) {
        document.getElementById('admin-panel').style.display = 'block';
        renderLogs();
    } else {
        document.getElementById('admin-panel').style.display = 'none';
    }

    renderServices(email);
}

// 3. AFFICHAGE DES SERVICES
function renderServices(userEmail) {
    const grid = document.getElementById('srv-grid');
    grid.innerHTML = '';

    state.services.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        
        let targetUrl = s.url;
        // LOGIQUE CAS : Si c'est Pronote et qu'un ticket existe
        if (s.name.toLowerCase() === 'pronote') {
            const ticket = state.cas[userEmail];
            if (ticket) {
                // Lien de bypass CAS réel
                targetUrl = `${s.url}/cas?ticket=${ticket}&login=true`;
            }
        }

        card.innerHTML = `
            ${userEmail === ADMIN_ID.toLowerCase() ? `<button class="del-btn" onclick="deleteService(${idx})">×</button>` : ''}
            <a href="${targetUrl}" target="_blank" style="text-decoration:none; color:white;">
                <span class="ico">${s.ico}</span>
                <span style="font-weight:700; font-size:13px; letter-spacing:1px; text-transform:uppercase;">${s.name}</span>
            </a>
        `;
        grid.appendChild(card);
    });
}

// 4. ACTIONS ADMIN
function generateCas() {
    const targetMail = document.getElementById('cas-mail').value.trim().toLowerCase();
    if (!targetMail.includes("@")) return alert("Email invalide");

    // Création d'un Service Ticket unique
    const ticket = "ST-" + Date.now() + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    state.cas[targetMail] = ticket;
    
    save();
    document.getElementById('cas-msg').innerText = `TICKET GÉNÉRÉ POUR ${targetMail}`;
    saveLog(ADMIN_ID, `CAS_LINK: ${targetMail}`);
}

function addService() {
    const ico = document.getElementById('add-ico').value || '🔹';
    const name = document.getElementById('add-name').value;
    const url = document.getElementById('add-url').value;

    if (name && url) {
        state.services.push({ ico, name, url });
        save();
        renderServices(ADMIN_ID);
        saveLog(ADMIN_ID, `ADD_SRV: ${name}`);
    }
}

function deleteService(index) {
    if(confirm("Supprimer ce service pour tous ?")) {
        state.services.splice(index, 1);
        save();
        renderServices(ADMIN_ID);
    }
}

// 5. UTILITAIRES
function logout() {
    google.accounts.id.disableAutoSelect();
    location.reload();
}

function save() {
    localStorage.setItem('RP_SRVS', JSON.stringify(state.services));
    localStorage.setItem('RP_LOGS', JSON.stringify(state.logs));
    localStorage.setItem('RP_CAS', JSON.stringify(state.cas));
}

function saveLog(user, action) {
    state.logs.unshift({ user, action, time: new Date().toLocaleTimeString() });
    save();
}

function renderLogs() {
    const list = document.getElementById('log-list');
    list.innerHTML = state.logs.slice(0, 5).map(l => `<tr><td>${l.user}</td><td>${l.action}</td><td>${l.time}</td></tr>`).join('');
}
