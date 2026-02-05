const ADMIN_ID = "ce.0227235a@campus-rosaparks.fr";

let db = {
    services: JSON.parse(localStorage.getItem('RP_DB_SRV')) || [
        { ico: '🦋', name: 'Pronote', url: 'https://pronote.campus-rosaparks.fr/' },
        { ico: '✉️', name: 'Webmail', url: 'https://mail.google.com' }
    ],
    cas: JSON.parse(localStorage.getItem('RP_DB_CAS')) || {}
};

function onSignIn(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const email = user.email.toLowerCase();

    // VÉRIFICATION SOUPLE DU DOMAINE
    if (email === ADMIN_ID.toLowerCase() || email.endsWith("@campus-rosaparks.fr")) {
        showApp(user);
    } else {
        showError("Accès refusé. Vous devez utiliser un compte @campus-rosaparks.fr pour accéder à l'infrastructure.");
    }
}

function showApp(user) {
    const email = user.email.toLowerCase();
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('status').innerText = `NODE: ${email.toUpperCase()}`;
    document.getElementById('welcome').innerText = `Système actif : ${user.given_name}`;

    // AFFICHAGE ADMIN
    if (email === ADMIN_ID.toLowerCase()) {
        document.getElementById('admin-panel').style.display = 'block';
    }

    render(email);
}

function render(userEmail) {
    const grid = document.getElementById('srv-grid');
    grid.innerHTML = '';

    db.services.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        
        let link = s.url;
        // LOGIQUE CAS BYPASS
        if (s.name.toLowerCase() === 'pronote') {
            const ticket = db.cas[userEmail];
            if (ticket) {
                // Construction du lien qui bypass le login Pronote
                link = `${s.url}/cas?ticket=${ticket}&login=true`;
            }
        }

        card.innerHTML = `
            ${userEmail === ADMIN_ID.toLowerCase() ? `<button class="del-btn" onclick="removeSrv(${idx})">×</button>` : ''}
            <a href="${link}" target="_blank" style="text-decoration:none; color:white;">
                <span class="ico">${s.ico}</span>
                <span style="font-weight:900; font-size:12px; letter-spacing:1px; display:block;">${s.name.toUpperCase()}</span>
            </a>
        `;
        grid.appendChild(card);
    });
}

// FONCTION CAS (BYPASS LOGIN)
function genTicket() {
    const target = document.getElementById('cas-mail').value.trim().toLowerCase();
    if(!target.includes("@")) return showError("Veuillez entrer une adresse email valide.");

    // Génération d'un ticket unique pour Pronote
    const ticket = "ST-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    db.cas[target] = ticket;
    
    save();
    alert("Ticket généré ! " + target + " sera désormais connecté automatiquement à Pronote.");
}

function pushService() {
    const ico = document.getElementById('add-ico').value || '💠';
    const name = document.getElementById('add-name').value;
    const url = document.getElementById('add-url').value;
    if(name && url) {
        db.services.push({ico, name, url});
        save();
        render(ADMIN_ID);
    }
}

function removeSrv(i) {
    if(confirm("Supprimer ce service ?")) {
        db.services.splice(i, 1);
        save();
        render(ADMIN_ID);
    }
}

function save() {
    localStorage.setItem('RP_DB_SRV', JSON.stringify(db.services));
    localStorage.setItem('RP_DB_CAS', JSON.stringify(db.cas));
}

function showError(m) {
    document.getElementById('error-msg').innerText = m;
    document.getElementById('error-popup').style.display = 'block';
}

function closePopup() {
    document.getElementById('error-popup').style.display = 'none';
    google.accounts.id.disableAutoSelect();
}
