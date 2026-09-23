
let adminUser = null;
let adminProfile = null;

let allReservations = [];
let allUsers = [];
let allActivities = [];


/* =========================================================
   OUTILS
========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


/* =========================================================
   COULEURS DES ACTIVITÉS
========================================================= */

function getActivityColor(color) {

    const allowedColors = {

        "bg-gradient-to-br from-orange-500 to-red-500":
            "bg-gradient-to-br from-orange-500 to-red-500",

        "bg-gradient-to-br from-blue-500 to-cyan-500":
            "bg-gradient-to-br from-blue-500 to-cyan-500",

        "bg-gradient-to-br from-green-500 to-emerald-500":
            "bg-gradient-to-br from-green-500 to-emerald-500",

        "bg-gradient-to-br from-purple-500 to-pink-500":
            "bg-gradient-to-br from-purple-500 to-pink-500",

        "bg-gradient-to-br from-indigo-500 to-blue-500":
            "bg-gradient-to-br from-indigo-500 to-blue-500",

        "bg-gradient-to-br from-yellow-500 to-orange-500":
            "bg-gradient-to-br from-yellow-500 to-orange-500",

        "bg-gradient-to-br from-red-500 to-pink-500":
            "bg-gradient-to-br from-red-500 to-pink-500"
    };

    return allowedColors[color]
        || "bg-gradient-to-br from-blue-500 to-cyan-500";
}


/* =========================================================
   VÉRIFICATION ADMIN
========================================================= */

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

            console.error(
                "❌ Erreur récupération profil :",
                profileError
            );

            alert(
                "Erreur récupération profil : " +
                profileError.message
            );

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

            console.log(
                "❌ L'utilisateur n'est pas administrateur"
            );

            alert(
                "Accès refusé.\nRôle actuel : " +
                adminProfile.role
            );

            window.location.href = "../index.html";

            return false;
        }


        console.log(
            "✅ ACCÈS ADMINISTRATEUR AUTORISÉ"
        );


        const adminName =
            document.getElementById("adminName");

        const adminEmail =
            document.getElementById("adminEmail");


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

        console.error(
            "❌ Erreur vérification admin :",
            error
        );

        alert("Erreur : " + error.message);

        return false;
    }
}


/* =========================================================
   NAVIGATION ADMIN
========================================================= */

function showSection(sectionName) {

    document
        .querySelectorAll(".admin-section")
        .forEach(section => {

            section.classList.add("hidden");
        });


    const section =
        document.getElementById(
            `section-${sectionName}`
        );


    if (section) {

        section.classList.remove("hidden");
    }


    document
        .querySelectorAll(".admin-menu")
        .forEach(button => {

            button.classList.remove(
                "bg-white/10"
            );
        });


    const activeButton =
        document.querySelector(
            `.admin-menu[data-section="${sectionName}"]`
        );


    if (activeButton) {

        activeButton.classList.add(
            "bg-white/10"
        );
    }


    const titles = {

        dashboard: "Tableau de bord",
        reservations: "Réservations",
        users: "Membres",
        activities: "Activités",
        spaces: "Espaces"
    };


    const pageTitle =
        document.getElementById("pageTitle");


    if (pageTitle) {

        pageTitle.textContent =
            titles[sectionName] ||
            "Administration";
    }


    /* Chargement des données */

    if (sectionName === "reservations") {

        loadReservations();
    }


    if (sectionName === "users") {

        loadUsers();
    }


    if (sectionName === "activities") {

        loadActivities();
    }


    closeMobileSidebar();
}


/* =========================================================
   ACTIVITÉS
========================================================= */

async function loadActivities() {

    const grid =
        document.getElementById("activitiesGrid");


    if (!grid) {
        return;
    }


    grid.innerHTML = `
        <div class="col-span-full text-center py-10">

            <div
                class="w-10 h-10 border-4 border-slate-200
                border-t-purple-600 rounded-full
                animate-spin mx-auto">
            </div>

            <p class="text-slate-500 mt-3">
                Chargement des activités...
            </p>

        </div>
    `;


    const { data, error } =
        await supabaseClient
            .from("activities")
            .select(
                "id,name,category,description,icon,color,created_at"
            )
            .order("created_at", {
                ascending: true
            });


    if (error) {

        console.error(
            "Erreur activités :",
            error
        );

        grid.innerHTML = `
            <div
                class="col-span-full text-center
                py-10 text-red-500">

                Impossible de récupérer
                les activités.

            </div>
        `;

        return;
    }


    allActivities = data || [];

    renderActivities(allActivities);

    updateDashboardStats();
}


/* =========================================================
   AFFICHER ACTIVITÉS
========================================================= */

function renderActivities(activitiesList = []) {

    const grid = document.getElementById("activitiesGrid");
    if (!grid) {
        return;
    }

    if (activitiesList.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-10 text-slate-400">
                Aucune activité.
            </div>
        `;

        return;
    }


    grid.innerHTML =
        activitiesList.map(activity => {

            const color =
                getActivityColor(activity.color);


            return `
                <div
                    class="bg-white rounded-2xl
                    overflow-hidden border border-slate-200
                    shadow-sm">

                    <div
                        class="${color}
                        h-32 p-5 text-white">

                        <div
                            class="w-12 h-12 rounded-xl
                            bg-white/20
                            flex items-center
                            justify-center">

                            <i
                                class="bi ${escapeHtml(
                                    activity.icon
                                )} text-2xl">
                            </i>

                        </div>

                    </div>


                    <div class="p-5">

                        <span
                            class="inline-block px-3 py-1
                            rounded-full bg-slate-100
                            text-xs font-bold">

                            ${escapeHtml(
                                activity.category
                            )}

                        </span>


                        <h3
                            class="font-black text-xl mt-3">

                            ${escapeHtml(
                                activity.name
                            )}

                        </h3>


                        <p
                            class="text-slate-500
                            text-sm mt-2
                            min-h-[40px]">

                            ${escapeHtml(
                                activity.description
                            )}

                        </p>


                        <div
                            class="flex gap-2 mt-5">

                            <button
                                class="edit-activity flex-1
                                px-3 py-2 rounded-xl
                                bg-slate-100
                                hover:bg-slate-200
                                font-bold text-sm"
                                data-id="${activity.id}">

                                <i class="bi bi-pencil"></i>
                                Modifier

                            </button>


                            <button
                                class="delete-activity
                                px-3 py-2 rounded-xl
                                bg-red-50 text-red-600
                                hover:bg-red-100"
                                data-id="${activity.id}">

                                <i class="bi bi-trash"></i>

                            </button>

                        </div>

                    </div>

                </div>
            `;

        }).join("");


    /* BOUTON MODIFIER */

    document
        .querySelectorAll(".edit-activity")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    openEditActivity(id);
                }
            );
        });


    /* BOUTON SUPPRIMER */

    document
        .querySelectorAll(".delete-activity")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    deleteActivity(id);
                }
            );
        });
}


/* =========================================================
   AJOUTER ACTIVITÉ
========================================================= */

function openActivities() {

    const form =
        document.getElementById("activityForm");

    if (form) {
        form.reset();
    }


    const id =
        document.getElementById("activityId");

    const title =
        document.getElementById(
            "activityModalTitle"
        );

    const modal =
        document.getElementById(
            "activityModal"
        );


    if (id) {
        id.value = "";
    }


    if (title) {
        title.textContent =
            "Ajouter une activité";
    }


    if (modal) {
        modal.classList.remove("hidden");
    }
}


/* =========================================================
   MODIFIER ACTIVITÉ
========================================================= */

function openEditActivity(id) {

    const activity =
        allActivities.find(
            item =>
                String(item.id) === String(id)
        );


    if (!activity) {

        alert("Activité introuvable.");

        return;
    }


    document.getElementById(
        "activityId"
    ).value = activity.id;


    document.getElementById(
        "activityName"
    ).value = activity.name || "";


    document.getElementById(
        "activityCategory"
    ).value = activity.category || "";


    document.getElementById(
        "activityDescription"
    ).value = activity.description || "";


    document.getElementById(
        "activityIcon"
    ).value =
        activity.icon || "bi-calendar-event";


    document.getElementById(
        "activityColor"
    ).value =
        activity.color ||
        "bg-gradient-to-br from-blue-500 to-cyan-500";


    document.getElementById(
        "activityModalTitle"
    ).textContent =
        "Modifier l'activité";


    document.getElementById(
        "activityModal"
    ).classList.remove("hidden");
}


/* =========================================================
   FERMER MODAL
========================================================= */

function closeActivityModal() {

    const modal =
        document.getElementById(
            "activityModal"
        );


    if (modal) {

        modal.classList.add("hidden");
    }
}


/* =========================================================
   ENREGISTRER ACTIVITÉ
========================================================= */

async function saveActivity(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "activityId"
        ).value;


    const name =
        document.getElementById(
            "activityName"
        ).value.trim();


    const category =
        document.getElementById(
            "activityCategory"
        ).value.trim();


    const description =
        document.getElementById(
            "activityDescription"
        ).value.trim();


    const icon =
        document.getElementById(
            "activityIcon"
        ).value.trim();


    const color =
        document.getElementById(
            "activityColor"
        ).value;


    if (!name || !category) {

        alert(
            "Remplissez le nom et la catégorie."
        );

        return;
    }


    const saveButton =
        document.getElementById(
            "saveActivityButton"
        );


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "Enregistrement...";
    }


    try {

        if (id) {const { error } =await supabaseClient.from("activities")
                    .update({
                        name,
                        category,
                        description,
                        icon,
                        color,
                        updated_at: new Date().toISOString()})
                    .eq("id", id);
            if (error) {
                throw error;
            }

            alert("Activité bien modifiée !");
        } else {

                const { error } = await supabaseClient.from("activities").insert({
                        name,
                        category,
                        description,
                        icon,
                        color
                    });


            if (error) {
                throw error;
            }


            alert(
                "Activité bien ajoutée !"
            );
        }


        closeActivityModal();

        await loadActivities();

        await updateDashboardStats();


    } catch (error) {

        console.error(
            "Erreur d'enregistrement :",
            error
        );

        alert(
            "Impossible d'enregistrer l'activité :\n" +
            error.message
        );


    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "Enregistrer";
        }
    }
}


/* =========================================================
   SUPPRIMER ACTIVITÉ
========================================================= */

async function deleteActivity(id) {

    const activity = allActivities.find(item => String(item.id) === String(id));
    if (!activity) {
        return;
    }


    const confirmation =confirm(`Voulez-vous vraiment supprimer "${activity.name}" ?`);

    if (!confirmation) {
        return;
    }


    try {

        const { error } = await supabaseClient.from("activities").delete()
                .eq("id",String(id));
        if (error) {
            throw error;
        }


        alert("Activité supprimée avec succès.");

        await loadActivities();
        await updateDashboardStats();


    } catch (error) {

        console.error(
            "Erreur de suppression :",
            error
        );

        alert(
            "Impossible de supprimer l'activité :\n" +
            error.message
        );
    }
}


/* =========================================================
   RÉSERVATIONS
========================================================= */

async function loadReservations() {
    const table =document.getElementById("reservationsTable");
    if (!table) {
        return;
    }

    table.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-10 text-slate-400">
                Chargement...
            </td>
        </tr>
    `;

    const { data, error } = await supabaseClient
            .from("reservations")
            .select(
                "id,user_id,activity,date,time,is_started,validated,created_at,profiles(name)"
            )
            .order("date", {
                ascending: true
            })
            .order("time", {
                ascending: true
            });


    if (error) {

        console.error(
            "Erreur réservations :",
            error
        );


        table.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center py-10
                    text-red-500">

                    Impossible de récupérer
                    les réservations.

                </td>
            </tr>
        `;

        return;
    }
    const reservations = data.map(reservation =>({
        ...reservation,
        user_name:reservation.profiles?.name || "Inconnu"
    }));
    allReservations = reservations;

    renderReservations(
        allReservations
    );

    updateDashboardStats();
}


async function toggleReservationValidation(reservationId,validated){
    try{
        const {error} = await supabaseClient.from("reservations").update({validated:validated}).eq("id",reservationId);
        if(error){
            throw error;
        }
        console.log(validated ?"Réservation validée.":"Validation rétirée.");
        await loadReservations();
        
    }catch(error){
        console.error("Erreur de validation réservation:",error);
        alert("Impossible de modifier la validation de la réservation.");
        
    }
}



async function deleteReservation(reservationId) {
    const confirmation = confirm("Voulez-vous vraiment supprimer cette réservation terminée?");
    if(!confirmation){return;}
    try {
        const {error} = await supabaseClient.from("reservations").delete().eq("id",reservationId);
        if(error){
            throw error;
        }
        console.log("Réservation supprimé:",reservationId);
        await loadReservations();
        
    } catch (error) {
        console.error("Erreur de la suppression de réservation:",error);
        alert("Impossible de supprimer cette réservation.");
        
    }
}

/* =========================================================
   AFFICHER RÉSERVATIONS
========================================================= */

function renderReservations(reservations = []) {
    const table =document.getElementById("reservationsTable");
    if (!table) {
        return;
    }

    if (reservations.length === 0) {
        table.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center py-10
                    text-slate-400">

                    Aucune réservation.

                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        reservations.map(
            reservation => {const started = reservation.is_started === true;
                const reservationDateTime = new Date(`${reservation.date}T${reservation.time}`);
                const isFinished = reservationDateTime < new Date();

                let statusHtml = "";
                if(isFinished){
                    statusHtml = `
                    <span class = "inline-flex px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                        Terminé
                    </span>
                    `;
                }else if(started){
                    statusHtml = `
                        <span class = "inline-flex px-3 py-1 rounded-full bg-green-700 text-xs font-bold">
                            En cours
                        </span>
                    `;
                }else{
                    statusHtml = `
                        <span class = "inline-flex px-3 py-1 rounded-full bg-slate-100 text-xs font-bold">
                            Réservée
                        </span>
                    `;
                }

                const validationHtml = reservation.validated?`
                <div class = "flex items-center gap-2">
                    <input type = "checkbox" checked onchage = "toggleReservationValidation('${reservation.id}',this.checked)
                                class = "w-5 h-5 accent-[#A71D78] cursor-pointer">
                    <span class = "text-green-600 text-sm font-semibold">Validée</span>
                    
                </div>
                `:`
                <div class = "flex items-center gap-2">
                    <input type = "checkbox" onchange = "toggleReservationValidation('${reservation.id}',this.checked)"
                        class = "w-5 h-5 accent-[A71D78] cursor-pointer">
                    <span class = "text-slate-400 text-sm">Non validée</span>
                </div>
                `;

                const deleteHtml = isFinished?`
                    <button type = "button" onclick = "deleteReservation('${reservation.id}')"
                           class = "inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 transition" >
                        <i class = bi bi-trash></i>
                        Supprimer
                    </button>
                `:`

                <span class = "text-xs text-slate-400">-</span>
                `;

                return `
                    <tr
                        class="border-t border-slate-100
                        hover:bg-slate-50">

                        <td class="px-5 py-4">

                            <p class="font-semibold">

                                ${escapeHtml(
                                    reservation.activity
                                )}

                            </p>

                        </td>


                        <td
                            class="px-5 py-4 text-sm">

                            ${escapeHtml(
                                formatDate(
                                    reservation.date
                                )
                            )}

                        </td>

                        <td
                            class="px-5 py-4 text-sm">

                            ${escapeHtml(
                                String(
                                    reservation.time || ""
                                ).slice(0, 5)
                            )}

                        </td>


                        <td class = "px-5 py-4">
                            ${statusHtml}
                        </td>
                        


                        <td class="px-5 py-4">

                            <span
                                class="text-xs text-slate-400">

                                ${escapeHtml(
                                    reservation.user_id
                                )}

                            </span>

                        </td>
                        <td class = "px-5 py-4">
                                <span class = "text-xs text-[#A71D78] font-bold">
                                ${escapeHtml(reservation.user_name)}
                                </span>
                        </td>

                        <td class = "px-5 py-4">
                                ${validationHtml}
                        </td>

                        <td class = "px-5 py-4">${deleteHtml}</td>
                    </tr>
                `;
            }
        ).join("");
}


/* =========================================================
   MEMBRES
========================================================= */

async function loadUsers() {

    const table =
        document.getElementById(
            "usersTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = `
        <tr>

            <td
                colspan="3"
                class="text-center py-10
                text-slate-400">

                Chargement des membres...

            </td>

        </tr>
    `;


    const { data, error } =
        await supabaseClient
            .from("profiles")
            .select("id,name,phone,role")
            .order("name", {
                ascending: true
            });


    if (error) {

        console.error(
            "Erreur utilisateurs :",
            error
        );


        table.innerHTML = `
            <tr>

                <td
                    colspan="3"
                    class="text-center py-10
                    text-red-500">

                    Impossible de récupérer
                    les membres.

                </td>

            </tr>
        `;

        return;
    }


    allUsers = data || [];

    renderUsers(allUsers);

    updateDashboardStats();
}


/* =========================================================
   AFFICHER MEMBRES
========================================================= */

function renderUsers(users = []) {

    const table =
        document.getElementById(
            "usersTable"
        );


    if (!table) {
        return;
    }


    if (users.length === 0) {

        table.innerHTML = `
            <tr>

                <td
                    colspan="3"
                    class="text-center py-10
                    text-slate-400">

                    Aucun membre

                </td>

            </tr>
        `;

        return;
    }


    table.innerHTML =
        users.map(
            user => `

                <tr
                    class="border-t border-slate-100
                    hover:bg-slate-50">

                    <td class="px-5 py-4">

                        <p class="font-semibold">

                            ${escapeHtml(
                                user.name ||
                                "Sans nom"
                            )}

                        </p>


                        <p
                            class="text-xs text-slate-400
                            mt-1">

                            ${escapeHtml(
                                user.id
                            )}

                        </p>

                    </td>


                    <td
                        class="px-5 py-4 text-sm">

                        ${escapeHtml(
                            user.phone || "-"
                        )}

                    </td>


                    <td class="px-5 py-4">

                        ${
                            user.role === "admin"

                            ? `
                                <span
                                    class="px-4 py-1
                                    rounded-full
                                    bg-purple-100
                                    text-purple-700
                                    text-xs font-bold">

                                    Administrateur

                                </span>
                            `

                            : `

                                <span
                                    class="px-3 py-1
                                    rounded-full
                                    bg-slate-100
                                    text-slate-600
                                    text-xs font-bold">

                                    Membre

                                </span>
                            `
                        }

                    </td>

                </tr>

            `
        ).join("");
}


/* =========================================================
   STATISTIQUES
========================================================= */

async function updateDashboardStats() {

    const {
        count: usersCount
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            );


    const {
        count: reservationsCount
    } =
        await supabaseClient
            .from("reservations")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            );


    const {
        count: startedCount
    } =
        await supabaseClient
            .from("reservations")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "is_started",
                true
            );


    const usersElement =
        document.getElementById(
            "dashboardUsersCount"
        );


    const reservationsElement =
        document.getElementById(
            "dashboardReservationsCount"
        );


    const activitiesElement =
        document.getElementById(
            "dashboardActivitiesCount"
        );


    const startedElement =
        document.getElementById(
            "dashboardStartedCount"
        );


    if (usersElement) {

        usersElement.textContent =
            usersCount ?? 0;
    }


    if (reservationsElement) {

        reservationsElement.textContent =
            reservationsCount ?? 0;
    }


    if (activitiesElement) {

        activitiesElement.textContent =
            allActivities.length;
    }


    if (startedElement) {

        startedElement.textContent =
            startedCount ?? 0;
    }
}


/* =========================================================
   RÉSERVATIONS RÉCENTES
========================================================= */

async function loadRecentReservations() {

    const container =
        document.getElementById(
            "recentReservations"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("reservations")
            .select(
                "id,user_id,activity,date,time,is_started,created_at"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(5);


    if (error) {

        console.error(
            "Erreur de récupération récente :",
            error
        );


        container.innerHTML = `
            <p
                class="text-center text-red-500 py-5">

                Impossible de récupérer
                les réservations.

            </p>
        `;

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML = `
            <p
                class="text-center text-slate-400 py-8">

                Aucune réservation pour le moment.

            </p>
        `;

        return;
    }


    container.innerHTML =
        data.map(
            reservation => `

                <div
                    class="flex flex-col sm:flex-row
                    sm:items-center
                    justify-between gap-3
                    py-4 border-b
                    border-slate-100
                    last:border-0">

                    <div>

                        <p class="font-bold">

                            ${escapeHtml(
                                reservation.activity
                            )}

                        </p>


                        <p
                            class="text-sm text-slate-500
                            mt-1">

                            ${escapeHtml(
                                formatDate(
                                    reservation.date
                                )
                            )}

                            •

                            ${escapeHtml(
                                String(
                                    reservation.time || ""
                                ).slice(0, 5)
                            )}

                        </p>

                    </div>


                    ${
                        reservation.is_started

                        ? `
                            <span
                                class="self-start
                                sm:self-auto
                                px-3 py-1
                                rounded-full
                                bg-green-100
                                text-green-700
                                text-xs font-bold">

                                En cours

                            </span>
                        `

                        : `

                            <span
                                class="self-start
                                sm:self-auto
                                px-3 py-1
                                rounded-full
                                bg-slate-100
                                text-slate-600
                                text-xs font-bold">

                                Réservée

                            </span>
                        `
                    }

                </div>

            `
        ).join("");
}


/* =========================================================
   RECHERCHE RÉSERVATIONS
========================================================= */

function searchReservations(value) {

    const search =
        value.trim().toLowerCase();


    if (!search) {

        renderReservations(
            allReservations
        );

        return;
    }


    const filtered =
        allReservations.filter(
            reservation =>
                String(
                    reservation.activity || ""
                )
                    .toLowerCase()
                    .includes(search)
        );


    renderReservations(filtered);
}


/* =========================================================
   RECHERCHE MEMBRES
========================================================= */

function searchUsers(value) {

    const search = value.trim().toLowerCase();
    if (!search) {
        renderUsers(allUsers);
        return;
    }


    const filtered = allUsers.filter( user => String(user.name || "").toLowerCase().includes(search) || String(user.phone || "").toLowerCase().includes(search));

    renderUsers(filtered);
}


/* =========================================================
   SIDEBAR MOBILE
========================================================= */

function openMobileSidebar() {

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    sidebar?.classList.remove("-translate-x-full");
    overlay?.classList.remove("hidden");
}


function closeMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (window.innerWidth < 1024) {
        sidebar?.classList.add("-translate-x-full");
        overlay?.classList.add("hidden");
    }
}


/* =========================================================
   DÉCONNEXION
========================================================= */

async function logoutAdmin() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Erreur de déconnexion :",error);
        alert("Erreur lors de la déconnexion");
        return;
    }
    window.location.href ="../index.html";
}


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",async () => {const isAdmin = await checkAdminAccess();

        if (!isAdmin) {
            return;
        }
        /* MENU */

        document.querySelectorAll(".admin-menu").forEach(button => {
                button.addEventListener("click",() => {
                        showSection(button.dataset.section);
                    }
                );
            });


        /* SIDEBAR */

        document.getElementById("menuButton").addEventListener("click",openMobileSidebar);
        document.getElementById("sidebarOverlay").addEventListener("click",closeMobileSidebar);

        /* LOGOUT */

        document.getElementById("logoutButton" ).addEventListener( "click",logoutAdmin);

        /* ACTIVITÉ */

        document.getElementById("addActivityButton" ).addEventListener("click", openActivities);
        document.getElementById( "closeActivityModal").addEventListener("click",closeActivityModal);
        document.getElementById("cancelActivityButton").addEventListener("click",closeActivityModal);
        document.getElementById("activityForm").addEventListener("submit",saveActivity );
        /* RECHERCHE RÉSERVATIONS */
        document.getElementById("reservationSearch").addEventListener("input",event => {
                    searchReservations(event.target.value);
                }
            );
        /* RECHERCHE MEMBRES */
        document.getElementById("userSearch").addEventListener("input",event => {
                    searchUsers(event.target.value);
                }
            );

        /* RAFRAÎCHIR RÉSERVATIONS */
        document.getElementById("refreshReservations").addEventListener("click",async () => {
                    await loadReservations();
                    await loadRecentReservations();
                    await updateDashboardStats();
                }
            );

        /* CHARGEMENT INITIAL */

        await loadActivities();
        await loadReservations();
        await loadUsers();
        await loadRecentReservations();
        await updateDashboardStats();


        /* SURVEILLANCE SESSION */

        supabaseClient.auth.onAuthStateChange(
            async (_event, session) => {

                if (!session?.user) {

                    window.location.href ="../index.html";
                }
            }
        );

    }
);

