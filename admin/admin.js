let adminUser = null;
let adminProfile = null;
let allReservations = [];
let allUsers = [];

const activities = [
    {
        name:"PS5",
        category:"Jeux",
        icon:"bi-controller",
        description:"2 séances de 30 minutespar mois"
    },{
        name:"Jeux de société",
        category : "Jeux",
        icon:"bi-dice-5",
        description:"Echecs, domino, katro et bien plus."
    },{
        name:"Coin lecture",
        category:"Lecture",
        icon:"bi-book",
        description:"Découvrez nos livres et choisissez votre lecture."
    },
    {
        name:"Coloriage",
        category:"Créatif",
        icon:"bi-palette",
        description:"Une activités  créative pour petitq et grands."
    },{
        name:"Espace numérique",
        category:"Numérique",
        icon:"bi-display",
        description:"Coworking, visio, réunion et impression."
    },{
        name:"Puzzle",
        category:"Créatif",
        icon:"bi-puzzle",
        description:"Une animation permanente accessible aux membres."
    }
];

function escapeHtml(value){
    return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;")
}

function formatDate(dateString){
    if(!dateString){
        return "";
    }
    const date = new Date(dateString + "T00:00:00");
    return  date.toLocaleDateString("fr-FR",{
        day:"2-digit",
        month:"2-digit",
        year:"numeric"
    });
}

/*VERIFICATION ADMIN*/

async function checkAdminAccess() {
    try {
        console.log("1. Vérification de l'utilisateur...");

        const { data, error } =
            await supabaseClient.auth.getUser();

        console.log("Auth data :", data);
        console.log("Auth error :", error);

        if (error || !data.user) {
            console.log("❌ Aucun utilisateur connecté");
            window.location.href = "../index.html";
            return false;
        }

        adminUser = data.user;

        console.log("2. Utilisateur connecté :", adminUser);
        console.log("ID utilisateur :", adminUser.id);
        console.log("Email :", adminUser.email);

        const { data: profil, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("id, name, phone, role")
                .eq("id", adminUser.id)
                .maybeSingle();

        console.log("3. Profil :", profil);
        console.log("Erreur profil :", profileError);

        if (profileError) {
            console.error("❌ Erreur récupération profil :", profileError);
            alert("Erreur récupération profil : " + profileError.message);
            return false;
        }

        if (!profil) {
            console.error("❌ Profil introuvable");
            alert("Votre profil est introuvable.");
            return false;
        }

        adminProfile = profil;

        console.log("4. Rôle :", adminProfile.role);

        if (adminProfile.role !== "admin") {
            console.log("❌ L'utilisateur n'est pas administrateur");
            alert(
                "Accès refusé.\nRôle actuel : " +
                adminProfile.role
            );
            return false;
        }

        console.log("✅ ACCÈS ADMINISTRATEUR AUTORISÉ");

        const adminName = document.getElementById("adminName");
        const adminEmail = document.getElementById("adminEmail");

        if (adminName) {
            adminName.textContent =
                adminProfile.name ||
                adminUser.email ||
                "Administrateur";
        }

        if (adminEmail) {
            adminEmail.textContent =
                adminUser.email || "";
        }

        const loadingScreen =
            document.getElementById("loadingScreen");

        const adminApp =
            document.getElementById("adminApp");

        if (loadingScreen) {
            loadingScreen.classList.add("hidden");
        }

        if (adminApp) {
            adminApp.classList.remove("hidden");
        }

        return true;

    } catch (error) {
        console.error("❌ Erreur vérification admin :", error);
        alert("Erreur : " + error.message);
        return false;
    }
}

// async function checkAdminAccess(){
//     try{
//         const {data,error} = await supabaseClient.auth.getUser();
//         if(error || !data.user){
//             window.location.href = "../index.html";
//             return false;
//         }
//         adminUser = data.user;
//         const {data:profil, error:profileError} = await supabaseClient.from("profiles")
//         .select("id,name,phone,role")
//         .eq("id",adminUser.id)
//         .maybeSingle();
//         if(profileError || !profile){
//             console.error("Erreur profil:",profileError);
//             alert("Votre profil est introuvable.");
//             window.location.href = "../index.html";
//             return false;
//         }
//         adminProfile = profil;

//         /*Vérification rôle*/

//         if(adminProfile.role !=="admin"){
//             alert("Accès refusé. Cette page est réservée à l'administrateur.");
//             window.location.href = "../index.html";
//             return false;
//         }
//         /*Afficher les infos admin */

//         const adminName = document.getElementById("adminName");
//         const adminEmail = document.getElementById("adminEmail");
//         if(adminName){
//             adminName.textContent = adminProfile.name || adminUser.adminemail ||"Administrateur"
//         }
//         if(adminEmail){
//             adminEmail.textContent = adminUser.email || "";
//         }

//     /*Back-office*/
//     document.getElementById("loadinScreen").classList.add("hidden");
//     document.getElementById("adminApp").classList.remove("hidden");
//     return true;
//     }catch(error){
//         console.error("Erreur vérification admin:",error);
//         window.location.href = "../index.html";
//         return false;
//     }
// }

function showSection(sectionName){
    document.querySelectorAll(".admin-section")
    .forEach(section =>{
        section.classList.add("hidden");
    });
    const section = document.getElementById(`section-${sectionName}`);
    if(section){
        section.classList.remove("hidden");
    }

    document.querySelectorAll(".admin-menu").forEach(button=>{
        button.classList.remove("bg-white/10");
    });

    const activeButton = document.querySelector(`.admin-menu[data-section="${sectionName}"]`);
    if(activeButton){
        activeButton.classList.add("bg-white/10");
    }

    const titles = {
        dashboard:"Tableau de bord",
        reservations:"Réservations",
        users:"Membres",
        activities:"Activités",
        spaces:"Espaces"
    };

    const pageTitle = document.getElementById("pageTitle");

    if(pageTitle){
        pageTitle.textContent = titles[sectionName]||"Administration";
    }

    /* Chargement */

    if(sectionName === "reservations"){
        loadReservations()
    }
    if(sectionName === "users"){
        loadUsers();
    }
    if(sectionName === "activities"){
        renderActivities();
    }
    closeMobileSidebar();
}


/*-------RESERVATIONS--------*/

async function loadReservations() {
    const table = document.getElementById("reservationsTable");
    if(!table){
        return;
    }
    table.innerHTML = `
    <tr>
        <td colspan="5" class = " text-center py-10 text-slate-400">Chargement...</td>
    </tr>`;

    const {data,error} = await supabaseClient.from("reservations")
        .select("id,user_id,activity,date,time,is_started, created_at")
        .order("date",{ascending:true})
        .order("time",{ascending:true});
        if(error){
            console.error("Erreur réservations :",error);
            table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-10 text-red-500">Impossible de récupérer les réservations.</td>
            </tr>`;
            return;
        }
        allReservations = data || [];
        renderReservations(allReservations);
        updateDashboardStats();
}

/*---AFFICHER RESERVATIONS----------*/

function renderReservations(reservations){
    const table = document.getElementById("reservationsTable");
    if(!table){
        return;
    }
    if(reservations.length === 0){
        table.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-10 text-slate-400">
                Aucune réservation.
            </td>
        </tr>`;
        return;
    }
    table.innerHTML = reservations.map(reservation =>{
        const started = reservation.is_started === true;
        return `
            <tr class="border-t border-slate-100 hover:bg-slate-500">
                <td class="px-5 py-4">
                    <p class="font-semibold">
                        ${escapeHtml(reservation.activity)}
                    </p>
                </td>
                <td class="px-5 py-4 text-sm">
                    ${escapeHtml(formatDate(
                        reservation.date
                    ))}
                </td>
                <td class="px-5 py-4 text-sm">
                    ${escapeHtml(String(
                        reservation.time || ""
                    ).slice(0,5))}
                </td>
                <td class=px-5 py-4>
                    ${
                        started? `
                        <span class="inline-flex px-3 py-1 rounded-full bg-green-100 text-xs font-bold">En cours</span>`:
                        `<span class="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">Réservée</span>`
                    }
                </td>
                <td class="px-5 py-4">
                    <span class="text-xs text-slate-400">
                        ${escapeHtml(
                            reservation.user_id
                        )}
                    </span>
                </td>

            </tr>`;
    }).join("")
}

/*------MEMBRES----------*/

async function loadUsers(){
    const table = document.getElementById("usersTable");
    if(!table){
        return;
    }
    table.innerHTML = `
        <tr>
            <td colspan="3 class="text-center py-10 text-slate-400">
                Chargement des membres...
            </td>
        </tr>`;
    const {data,error} = await supabaseClient.from("profiles")
    .select("id,name,phone,role").order("name",{
        ascending:true
    });
    if(error){
        console.error("Erreur utilisateur :",error);
        table.innerHTML = `
            <tr>
                <td colspan ="3" classe="text-center py-10 text-red-500">Impossible de récupérer les membres.</td>
            </tr>`;
            return;
    }
    allUsers = data || [];
    renderUsers(allUsers);
    updateDashboardStats();
}

/*---------AFFICHER MEMBRES---------*/

function renderUsers(users){
    const table = document.getElementById("usersTable");

if(!table){
    return;
}
if(users.length === 0){
    table.innerHTML = `
        <tr>
            <td colspan="3" class="text-center py-10 text-slate-400">
                Aucun membre
            </td>
        </tr>`;
        return;
}
table.innerHTML = users.map(user =>`
        <tr class="border-t border-slate-100 hover:bg-slate-500">
            <td class="px-5 py-4">
                <p class="font-semibold">
                    ${escapeHtml(
                        user.name || "Sans nom"
                    )}
                </p>
                <p class="text-xs text-slate-400 mt-1">
                    ${escapeHtml(user.id)}
                </p>
            </td>
            <td class="px-5 py-4 text-sm">
            ${escapeHtml(user.phone || "-")}
            </td>
            <td class="px-5 py-4">
                    ${user.role==="admin"?
                        `<span class="px-4 py-1 rounded-full bg-purple-100 text-purple-100 text-xs font-bold">
                            Administrateur
                        </span>`:`
                        <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                            Membre
                        </span>`
                    }
            </td>
        </tr>`).join()
}

/*ACTIVITES*/
function renderActivities(){
    const grid = document.getElementById("activitiesGrid");
    // if(!grid){
    //     return;
    // }
    grid.innerHTML = activities.map(activity=>`
        <div class = "bg-white rounded-2xl p-6 border border-slate-200">
            <div class = "w-12 h-12 rounded-xl bg-[#a71d78]/10 flex items-center justify-center">
                <i class="bi ${escapeHtml(activity.icon)} text-xl"></i>
            </div>
            <span class="inline-block mt-5 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold">
                ${escapeHtml(activity.category)}
            </span>
            <h3 class="font-black text-xl mt-3">
                ${escapeHtml(activity.name)}
            </h3>
            <p class="text-slate-500 text-sm mt-2">
                ${escapeHtml(activity.description)}
            </p>
        </div>
        `).join("");
}

/*STATISTIQUES*/

async function updateDashboardStats(){
    const {count:usersCount} = await supabaseClient.from("profiles").select("id",{count:"exact",head:true});

    const {count:reservationsCount} = await supabaseClient.from("reservations").select("id",{count:"exact",head:true});

    const{count:startedCount} = await supabaseClient.from("reservations").select("id",{count:"exact",head:true})
                                .eq("is_started",true);
    const usersElement = document.getElementById("dashboardUsersCount");
    const reservationsElement = document.getElementById("dashboardReservationsCount");
    const activitiesElement = document.getElementById("dashboardActivitiesCount");
    const startedElement = document.getElementById("dashboardStartedCount");

    if(usersElement){
        usersElement.textContent = usersCount ?? 0;
    }
    if(reservationsElement){
        usersElement.textContent = usersCount ?? 0;
    }
    if(reservationsElement){
        reservationsElement.textContent = reservationsCount ?? 0;
    }
    if(activitiesElement){
        activitiesElement.textContent = activities.length;
    }
    if(startedElement){
        startedElement.textContent = startedCount ?? 0;
    }
}

/*RESERVATIONS RECENTES*/

async function loadRecentReservations(){
    const container = document.getElementById("recentReservations");
    if(!container){
        return;
    }
    const{data,error} = await supabaseClient.from("reservations").select("id,user_id,activity,date,time,is_started").order("created_at",{ascending:false}).limit(5);
    if(error){
        console.error("Erreur de récupération récente:",error);
        container.innerHTML = `
            <p class = "text-center text-red-500 py-5">Impossible de récupérer les réservations.</p>`;
            return;
    }
    if(!data || data.length === 0){
        container.innerHTML = `
            <p class = "text-center text-slate-400 py-8">Aucune réservation pour le moment.</p>`;
            return;
    }
    container.innerHTML = data.map(
        reservation =>`
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-slate-100 last:border-0">
            <div>
                <p class = "font-bold">${escapeHtml(reservation.activity)}</p>
                <p class = "text-sm text-slate-500 mt-1">
                    ${escapeHtml(formatDate(reservation.date))}•${escapeHtml(String(reservation.time || "").slice(0,5))}
                </p>
            </div>
            ${reservation.is_started?`
                <span class = "self-start sm:self-auto px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                    En cours
                </span>`: 
                `<span class = "self-start sm:self-auto px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                    Réservée
                </span>`}
        </div>`
    ).join("");
}

/*RECHERCHES RESERVATIONS*/

function searchReservations(value){
    const search = value.trim().toLowerCase();
    if(!search){
        renderReservations(allReservations);
        return;
    }
    const filtered = allReservations.filter(reservation =>String(reservation.activity || "").toLowerCase().includes(search));
    renderReservations(filtered);
}

/*RECHERCHES MEMBRES*/

function searchUsers(value){
    const search = value.trim().toLowerCase();
    if(!search){
        renderUsers(allUsers);
        return;
    }
    const filtered = allUsers.filter(user=>String(user.name || "").toLowerCase().includes(search)|| String(user.phone || "").toLowerCase().includes(search));
    renderUsers(filtered);
}

/*SIDEBAR MOBILE*/

function openMobileSidebar(){
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    sidebar?.classList.remove("-translate-x-full");
    overlay?.classList.remove("hidden");
}

function closeMobileSidebar(){
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if(window.innerWidth<1024){
        sidebar?.classList.add("-translate-x-full");
        overlay?.classList.add("hidden");
    }
}

/*DECONNEXION*/

async function  logoutAdmin(){
    const {error} = await supabaseClient.auth.signOut();
    if(error){
        console.error("Erreur de déconnexion:",error);
        alert("Erreur lors de la déconnexion");
        return;
    }
    window.location.href = "../index.html";
}

document.addEventListener("DOMContentLoaded",async ()=>{
    const isAdmin = await checkAdminAccess();

    if(!isAdmin){
        return;
    }
    document.querySelectorAll(".admin-menu").forEach(button=>{
        button.addEventListener("click",()=>{
            showSection(button.dataset.section)
        })
    });
    document.getElementById("menuButton")?.addEventListener("click",openMobileSidebar);
    document.getElementById("sidebarOverlay")?.addEventListener("click",closeMobileSidebar);
    document.getElementById("logoutButton")?.addEventListener("click",logoutAdmin);
    document.getElementById("reservationSearch")?.addEventListener("input",event=>{
        searchReservations(event.target.value);
    });
    document.getElementById("userSearch")?.addEventListener("input",event=>{
        searchUsers(event.target.value);
    });

    document.getElementById("refreshReservations")?.addEventListener("click",async()=>{
        await loadReservations();
        await loadRecentReservations();
        await updateDashboardStats();
    });
    renderActivities();
    await loadReservations();
    await loadUsers();
    await loadRecentReservations();
    await updateDashboardStats();


    supabaseClient.auth.onAuthStateChange(async(_event,session)=>{
        if(!session?.user){
            window.location.href = "../index.html";
        }
    })

});