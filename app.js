const ADMIN_ID = "ce.0227235a@campus-rosaparks.fr";
const PRONOTE_URL = "https://pronote.campus-rosaparks.fr/";

// Base de données locale
let data = {
    services: JSON.parse(localStorage.getItem('RP_CORE_SRV')) || [
        { ico: '🦋', name: 'Pronote', url: PRONOTE_URL },
        { ico: '✉️', name: 'Webmail', url: 'https://mail.google.com' },
        { ico: '☁️', name: 'Cloud', url: 'https://drive.google.com' }
    ],
    logs: JSON.parse(localStorage.getItem('RP_CORE_LOGS')) || [],
    cas_tokens: JSON.parse(localStorage.getItem('RP_CORE_CAS')) || {}
};

// FONCTION DE CONNEXION (Appelée par Google)
function onSignIn(response) {
    // Décodage du jeton Google
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const user = JSON.parse(window.atob(base64));
    
    console.log("Tentative de connexion :", user.email);

    // VÉRIFICATION DE SÉCURITÉ
    const isCampusEmail = user.email.toLowerCase().endsWith("@campus-rosaparks.fr");
    const isAdmin = user.email.toLowerCase() === ADMIN_ID.toLowerCase();

    if (isCampusEmail || isAdmin) {
        logEvent(user.email, "NODE_CONNECTED");
        startSession(user);
    } else {
        alert("ACCÈS REFUSÉ : Votre compte n'appartient pas au domaine @campus-rosaparks.fr");
        console.error("Domaine invalide :", user.email);
    }
}

function startSession(user) {
    const userEmail = user.email.toLowerCase();
    
    // Changement de vue
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-dash').classList.add('active');
    
    // Affichage des infos
    document.getElementById('user-status').innerText = `NODE: ${userEmail.toUpperCase()}`;
    document.getElementById('welcome-msg').innerText = `Système actif : ${user.given_name}`;

    // AFFICHAGE DU PANNEAU ADMIN
    if (userEmail === ADMIN_ID.toLowerCase()) {
        console.log("Accès Admin accordé");
        document.getElementById('admin-zone').style.display = 'block';
        updateLogView();
    } else {
        document.getElementById('admin-zone').style.display = 'none';
    }
    
    renderServices(userEmail);
}

function renderServices(userEmail) {
    const grid = document.getElementById('srv-grid');
    grid.innerHTML = '';

    data.services.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = 'service-card';
        
        let link = s.url;
        // Si c'est Pronote, on injecte le ticket CAS généré par l'admin
        if (s.name.toLowerCase() === 'pronote') {
            const ticket = data.cas_tokens[userEmail];
            if (ticket) {
                // Lien direct vers l'espace Pronote sans login
                link = `${s.url}/cas?ticket=${ticket}&login=true`;
            }
        }

        card.innerHTML = `
            ${userEmail === ADMIN_ID.toLowerCase() ? `<button class="btn-del" onclick="removeService(${idx})">×</button>` : ''}
            <a href="${link}" target="_blank" style="text-decoration:none; color:white;">
                <span class="icon">${s.ico}</span>
                <span style="font-weight:700; letter-spacing:1px; text-transform:uppercase; font-size:13px;">${s.name}</span>
            </a>
        `;
        grid.appendChild(card);
    });
}

// --- ACTIONS ADMINISTRATEUR ---

function bindCAS() {
    const target = document.getElementById('cas-mail').value.trim().toLowerCase();
    if (!target.includes("@")) return alert("Entrez un email valide");

    // Génération du ticket unique pour Pronote
    const ticket = "ST-" + Date.now() + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    data.cas_tokens[target] = ticket;
    
    sync();
    document.getElementById('cas-log').innerText = `TICKET GÉNÉRÉ POUR ${target}`;
    logEvent(ADMIN_ID, `BYPASS_CREATED_FOR: ${target}`);
    alert("Le compte de l'élève est maintenant relié. Il n'aura plus besoin de mot de passe Pronote.");
}

function createNewService() {
    const ico = document.getElementById('add-ico').value || '🔗';
    const name = document.getElementById('add-name').value;
    const url = document.getElementById('add-url').value;

    if (name && url) {
        data.services.push({ ico, name, url });
        sync();
        renderServices(ADMIN_ID);
        logEvent(ADMIN_ID, `SERVICE_ADDED: ${name}`);
    }
}

function removeService(index) {
    if(confirm("Supprimer ce service pour TOUT LE MONDE ?")) {
        data.services.splice(index, 1);
        sync();
        renderServices(ADMIN_ID);
    }
}

// --- UTILITAIRES ---

function signOut() {
    google.accounts.id.disableAutoSelect();
    location.reload();
}

function sync() {
    localStorage.setItem('RP_CORE_SRV', JSON.stringify(data.services));
    localStorage.setItem('RP_CORE_LOGS', JSON.stringify(data.logs));
    localStorage.setItem('RP_CORE_CAS', JSON.stringify(data.cas_tokens));
}

function logEvent(user, action) {
    data.logs.unshift({ user, action, time: new Date().toLocaleTimeString() });
    sync();
}

function updateLogView() {
    const table = document.getElementById('log-display');
    if(table) {
        table.innerHTML = data.logs.slice(0, 5).map(l => `<tr><td>${l.user}</td><td>${l.action}</td><td>${l.time}</td></tr>`).join('');
    }
}
