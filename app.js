const ADMIN_MAIL = "ce.0227235a@campus-rosaparks.fr";

// Données partagées
let store = {
    services: JSON.parse(localStorage.getItem('RP_SRV')) || [
        { ico: '🦋', name: 'Pronote', url: 'https://pronote.campus-rosaparks.fr' }
    ],
    cas_vault: JSON.parse(localStorage.getItem('RP_CAS')) || {}
};

function handleAuth(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    if (!user.email.endsWith("@campus-rosaparks.fr")) {
        alert("ACCESS DENIED: Domaine invalide.");
        return;
    }

    // Switch Interface
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('logout-trigger').style.display = 'block';
    document.getElementById('sys-status').innerText = "// ONLINE: " + user.email;

    if (user.email === ADMIN_MAIL) document.getElementById('admin-zone').style.display = 'block';

    renderUI(user.email);
}

function renderUI(email) {
    const container = document.getElementById('grid-container');
    container.innerHTML = '';

    store.services.forEach(s => {
        const card = document.createElement('a');
        card.className = 'service-card';
        
        // --- LOGIQUE VRAI CAS PRONOTE ---
        if (s.name.toLowerCase() === 'pronote') {
            const ticket = store.cas_vault[email.toLowerCase()];
            if (ticket) {
                // Format officiel CAS : service + ticket
                card.href = `${s.url}/cas/login?service=${encodeURIComponent(s.url)}&ticket=${ticket}`;
            } else {
                card.href = s.url;
            }
        } else {
            card.href = s.url;
        }

        card.target = "_blank";
        card.innerHTML = `<span class="ico">${s.ico}</span><b>${s.name.toUpperCase()}</b>`;
        container.appendChild(card);
    });
}

// ADMIN : PUBLIER
function publishSrv() {
    const ico = document.getElementById('in-ico').value || '🔗';
    const name = document.getElementById('in-name').value;
    const url = document.getElementById('in-url').value;
    if(name && url) {
        store.services.push({ ico, name, url });
        localStorage.setItem('RP_SRV', JSON.stringify(store.services));
        renderUI(ADMIN_MAIL);
    }
}

// ADMIN : CRÉER TICKET
function bindCAS() {
    const mail = document.getElementById('cas-user').value.trim().toLowerCase();
    if (!mail.endsWith("@campus-rosaparks.fr")) return alert("Mail invalide");
    
    // Un ticket ST (Service Ticket) pour Pronote
    const ticket = "ST-" + Date.now() + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    store.cas_vault[mail] = ticket;
    localStorage.setItem('RP_CAS', JSON.stringify(store.cas_vault));
    alert("Ticket CAS généré pour " + mail);
}

// DÉCONNEXION
function logout() {
    // 1. Reset l'affichage
    document.getElementById('view-dash').classList.remove('active');
    document.getElementById('view-login').classList.add('active');
    document.getElementById('logout-trigger').style.display = 'none';
    document.getElementById('sys-status').innerText = "// SYSTEM_AWAITING_AUTH";
    
    // 2. Déconnexion Google (optionnel mais recommandé)
    google.accounts.id.disableAutoSelect();
    
    // 3. Recharger pour nettoyer la mémoire
    location.reload();
}
