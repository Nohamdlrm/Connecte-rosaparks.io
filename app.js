const ADMIN = "ce.0227235a@campus-rosaparks.fr";

let state = {
    services: JSON.parse(localStorage.getItem('RP_V3_SRV')) || [
        { ico: '🦋', name: 'Pronote', url: 'https://pronote.campus-rosaparks.fr/' },
        { ico: '✉️', name: 'Mail', url: 'https://mail.google.com' }
    ],
    logs: JSON.parse(localStorage.getItem('RP_V3_LOGS')) || [],
    cas: JSON.parse(localStorage.getItem('RP_V3_CAS')) || {}
};

function handleAuth(resp) {
    const user = JSON.parse(atob(resp.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if(!user.email.endsWith("@campus-rosaparks.fr")) return alert("ACCÈS REFUSÉ");

    saveLog(user.email, "AUTH_IN");
    showDash(user);
}

function showDash(user) {
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('user-greeting').innerText = `Bonjour, ${user.given_name}`;
    
    if(user.email === ADMIN) {
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('srv-grid').classList.add('admin-mode');
        renderLogs();
    }
    renderServices(user.email);
}

function renderServices(email) {
    const grid = document.getElementById('srv-grid');
    grid.innerHTML = '';
    
    state.services.forEach((s, index) => {
        const ticket = state.cas[email.toLowerCase()];
        const url = (s.name.toLowerCase() === 'pronote' && ticket) 
            ? `${s.url}?ticket=${ticket}&user=${btoa(email)}` 
            : s.url;

        grid.innerHTML += `
            <div class="cyber-card">
                ${email === ADMIN ? `<button class="del-btn" onclick="deleteService(${index})">SUPPR</button>` : ''}
                <a href="${url}" target="_blank" style="text-decoration:none; color:white;">
                    <span style="font-size:40px; display:block; margin-bottom:15px;">${s.ico}</span>
                    <span style="font-weight:700; font-size:12px; letter-spacing:1px;">${s.name.toUpperCase()}</span>
                </a>
            </div>
        `;
    });
}

function addService() {
    const ico = document.getElementById('new-ico').value || '💠';
    const name = document.getElementById('new-name').value;
    const url = document.getElementById('new-url').value;
    if(name && url) {
        state.services.push({ico, name, url});
        sync();
        renderServices(ADMIN);
    }
}

function deleteService(index) {
    if(confirm("Supprimer ce service pour tout le monde ?")) {
        state.services.splice(index, 1);
        sync();
        renderServices(ADMIN);
    }
}

function createTicket() {
    const m = document.getElementById('cas-mail').value.toLowerCase();
    if(!m.endsWith("@campus-rosaparks.fr")) return;
    state.cas[m] = "ST-" + Math.random().toString(36).substring(2,12).toUpperCase();
    sync();
    alert("Ticket CAS activé pour " + m);
}

function sync() {
    localStorage.setItem('RP_V3_SRV', JSON.stringify(state.services));
    localStorage.setItem('RP_V3_CAS', JSON.stringify(state.cas));
}

function saveLog(u, a) {
    state.logs.unshift({u, a, t: new Date().toLocaleTimeString()});
    localStorage.setItem('RP_V3_LOGS', JSON.stringify(state.logs));
}

function renderLogs() {
    document.getElementById('log-list').innerHTML = state.logs.slice(0,8).map(l => 
        `<tr><td>${l.u}</td><td>${l.t}</td><td>${l.a}</td></tr>`
    ).join('');
}

function logout() {
    google.accounts.id.disableAutoSelect();
    location.reload();
}
