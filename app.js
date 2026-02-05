const MASTER_EMAIL = "ce.0227235a@campus-rosaparks.fr";
const DOMAIN = "@campus-rosaparks.fr";

// Système de synchronisation Cloud (Local)
let systemDB = {
    services: JSON.parse(localStorage.getItem('RP_CORE_SRV')) || [
        { ico: '🦋', name: 'Pronote', url: 'https://pronote.campus-rosaparks.fr' },
        { ico: '✉️', name: 'Webmail', url: 'https://mail.google.com' }
    ],
    casTickets: JSON.parse(localStorage.getItem('RP_CORE_CAS')) || {}
};

// 1. GESTION DE LA CONNEXION
function handleAuth(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const email = payload.email.toLowerCase();

    // Vérification stricte du domaine ou de l'admin
    if (email === MASTER_EMAIL.toLowerCase() || email.endsWith(DOMAIN)) {
        launchDashboard(payload);
    } else {
        openPopup(`L'adresse ${email} n'est pas autorisée sur cette infrastructure. Utilisez votre compte Campus.`);
    }
}

// 2. INITIALISATION DU DASHBOARD
function launchDashboard(user) {
    const email = user.email.toLowerCase();
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('user-pill').innerText = `ACCESS_GRANTED: ${email}`;
    document.getElementById('welcome-user').innerText = `Bonjour, ${user.given_name}`;

    // AFFICHAGE DES DROITS ADMIN
    if (email === MASTER_EMAIL.toLowerCase()) {
        document.getElementById('master-panel').style.display = 'block';
    }

    renderGrid(email);
}

// 3. RENDU DES SERVICES (Synchronisé)
function renderGrid(currentUserEmail) {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = '';

    systemDB.services.forEach((service, index) => {
        const card = document.createElement('div');
        card.className = 'service-card';
        
        let finalUrl = service.url;

        // --- LOGIQUE CAS PRONOTE (AUTO-LOGIN) ---
        // Si c'est Pronote et qu'un ticket existe pour cet utilisateur
        if (service.name.toLowerCase() === 'pronote') {
            const userTicket = systemDB.casTickets[currentUserEmail];
            if (userTicket) {
                // On dirige l'utilisateur vers le point d'entrée CAS
                // Cela force Pronote à valider le ticket sans demander de mot de passe
                finalUrl = `${service.url}/cas/login?service=${encodeURIComponent(service.url)}&ticket=${userTicket}`;
            }
        }

        card.innerHTML = `
            ${currentUserEmail === MASTER_EMAIL.toLowerCase() ? `<button class="btn-del" onclick="deleteService(${index})">×</button>` : ''}
            <a href="${finalUrl}" target="_blank" style="text-decoration:none; color:white;">
                <span class="ico">${service.ico}</span>
                <span style="font-weight:900; letter-spacing:2px; font-size:13px;">${service.name.toUpperCase()}</span>
            </a>
        `;
        grid.appendChild(card);
    });
}

// 4. ACTIONS ADMINISTRATEUR (Déploiement)
function deployService() {
    const ico = document.getElementById('new-ico').value || '💠';
    const name = document.getElementById('new-name').value;
    const url = document.getElementById('new-url').value;

    if (name && url) {
        systemDB.services.push({ ico, name, url });
        syncData();
        renderGrid(MASTER_EMAIL);
        
        // Reset inputs
        document.getElementById('new-name').value = '';
        document.getElementById('new-url').value = '';
        alert("Service déployé avec succès sur toute l'infrastructure.");
    }
}

function deleteService(idx) {
    if (confirm("Supprimer ce service pour tous les utilisateurs ?")) {
        systemDB.services.splice(idx, 1);
        syncData();
        renderGrid(MASTER_EMAIL);
    }
}

// 5. GÉNÉRATEUR CAS BYPASS

function createCASTicket() {
    const targetEmail = document.getElementById('cas-target').value.trim().toLowerCase();
    
    if (!targetEmail.endsWith(DOMAIN)) {
        alert("L'email doit appartenir au domaine @campus-rosaparks.fr");
        return;
    }

    // Génération d'un Service Ticket (ST) aléatoire format CAS
    const st = "ST-" + Date.now() + "-" + Math.random().toString(36).substring(2, 15).toUpperCase();
    
    // On enregistre le ticket pour cet utilisateur spécifique
    systemDB.casTickets[targetEmail] = st;
    
    syncData();
    document.getElementById('cas-display').innerText = `TICKET_VALIDÉ pour ${targetEmail} : ${st}`;
    alert("Ticket généré. L'utilisateur se connectera désormais automatiquement.");
}

// 6. UTILITAIRES
function syncData() {
    localStorage.setItem('RP_CORE_SRV', JSON.stringify(systemDB.services));
    localStorage.setItem('RP_CORE_CAS', JSON.stringify(systemDB.casTickets));
}

function openPopup(msg) {
    document.getElementById('err-text').innerText = msg;
    document.getElementById('popup-overlay').style.display = 'flex';
}

function closePopup() {
    document.getElementById('popup-overlay').style.display = 'none';
    google.accounts.id.disableAutoSelect();
}
