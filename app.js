const ADMIN_EMAIL = "ce.0227235a@campus-rosaparks.fr";
const PRONOTE_URL = "https://pronote.campus-rosaparks.fr/";

let state = {
    services: JSON.parse(localStorage.getItem('rp_srv')) || [
        { emoji: '🦋', title: 'Pronote', link: PRONOTE_URL },
        { emoji: '✉️', title: 'Gmail', link: 'https://mail.google.com' }
    ],
    logs: JSON.parse(localStorage.getItem('rp_log')) || [],
    cas_vault: JSON.parse(localStorage.getItem('rp_cas')) || {} // Stocke { mail: ticket }
};

function onAuth(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    if (!user.email.endsWith("@campus-rosaparks.fr")) {
        document.getElementById('error-box').style.display = 'block';
        return;
    }

    logAction(user.email, "AUTH_SUCCESS");
    initApp(user);
}

function initApp(user) {
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('user-pill').innerText = user.email.toUpperCase();

    if (user.email === ADMIN_EMAIL) {
        document.getElementById('admin-zone').style.display = 'block';
        renderLogs();
    }
    renderServices(user.email);
}

function renderServices(userEmail) {
    const grid = document.getElementById('srv-grid');
    grid.innerHTML = '';

    state.services.forEach(s => {
        const card = document.createElement('a');
        card.className = 'card';
        
        // LOGIQUE CAS PRONOTE
        if (s.title.toLowerCase() === 'pronote') {
            const userTicket = state.cas_vault[userEmail];
            card.href = userTicket ? `${s.link}?ticket=${userTicket}&user=${userEmail}` : s.link;
        } else {
            card.href = s.link;
        }

        card.target = "_blank";
        card.innerHTML = `<span class="emoji">${s.emoji}</span><span style="font-weight:500">${s.title}</span>`;
        grid.appendChild(card);
    });
}

// LOGIQUE ADMIN : GÉNÉRER CAS
function generateCAS() {
    const targetMail = document.getElementById('cas-mail').value;
    if (!targetMail.endsWith("@campus-rosaparks.fr")) {
        alert("Mail invalide");
        return;
    }

    // Création d'un ticket CAS "Vrai" (Simulé par un hash unique)
    const ticket = "ST-" + Math.random().toString(36).substring(2, 15).toUpperCase();
    state.cas_vault[targetMail] = ticket;
    
    localStorage.setItem('rp_cas', JSON.stringify(state.cas_vault));
    document.getElementById('cas-result').innerText = `TICKET GÉNÉRÉ : ${ticket} pour ${targetMail}`;
    logAction(ADMIN_EMAIL, `GEN_CAS_FOR_${targetMail}`);
    renderServices(ADMIN_EMAIL);
}

function addNewService() {
    const s = {
        emoji: document.getElementById('new-emoji').value,
        title: document.getElementById('new-title').value,
        link: document.getElementById('new-link').value
    };
    if (s.title && s.link) {
        state.services.push(s);
        localStorage.setItem('rp_srv', JSON.stringify(state.services));
        renderServices(ADMIN_EMAIL);
    }
}

function logAction(user, action) {
    state.logs.unshift({ user, action, time: new Date().toLocaleTimeString() });
    localStorage.setItem('rp_log', JSON.stringify(state.logs));
}

function renderLogs() {
    const list = document.getElementById('log-list');
    list.innerHTML = state.logs.slice(0, 10).map(l => 
        `<tr><td>${l.user}</td><td>${l.time}</td><td>${l.action}</td></tr>`
    ).join('');
}
