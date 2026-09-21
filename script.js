

let currentUser = null;
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let selectedDate = null;
let selectedTime = null;

const timeSlots = [

    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00"

];


const monthNames = [

    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre"

];

// ECHAPPEMENT HTML

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// FORMATER UNE DATE

function formatDate(dateString) {
    const date = new Date(
            dateString + "T00:00:00"
        );
    return date.toLocaleDateString(
        "fr-FR",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}

// CREER DATE YYYY-MM-DD

function createDateString(year,month,day) {
    return (
        year +"-" + String(month + 1).padStart(2, "0") +"-" +
        String(day).padStart(2, "0")
    );
}

// MENU MOBILE

function initMobileMenu() {
    const menuButton = document.getElementById("menuButton");
    const mobileMenu = document.getElementById("mobileMenu");
    if ( !menuButton ||!mobileMenu) {
        return;
    }
    menuButton.addEventListener("click",() => { mobileMenu.classList.toggle("hidden"); 
    });
    mobileMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener(
                "click",() => { mobileMenu.classList.add("hidden");
                }
            );
        });
}

// FILTRE ACTIVITES

function filterActivites( category,  event) {
    const cards = document.querySelectorAll(".activity-card");
    cards.forEach(card => {
        const cardCategory = card.dataset.category;
        if (category === "all" || cardCategory === category) {
            card.classList.remove("hidden");
        } else {
            card.classList.add("hidden");
        }
    });
    document.querySelectorAll(".filter-btn")
        .forEach(button => {
            button.classList.remove("bg-[#005383]","text-white");
            button.classList.add("bg-slate-100");
        });

    if (event) {
        const button = event.currentTarget || event.target;
        button.classList.remove("bg-slate-100");
        button.classList.add("bg-[#005383]","text-white");
    }
}
// AUTHENTIFICATION

const authModal = document.getElementById("authModal");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const switchAuth = document.getElementById("switchAuth");

const forgotPasswordButton = document.getElementById("forgotPasswordButton");

// AFFICHER AUTH

function showAuth() {
    if (!authModal) {
        return;
    }
    authModal.classList.remove("hidden");
    authModal.classList.add("flex");
    document.body.classList .add("overflow-hidden");

}

// CACHER AUTH

function hideAuth() {
    if (!authModal) { return; }

    authModal.classList .add("hidden");
    authModal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");

}

// MODE CONNEXION

function showLoginMode() {
    registerForm.classList .add("hidden");
    loginForm.classList.remove("hidden");
    forgotPasswordButton.classList.remove("hidden");
    const title = document.getElementById("authTitle");
    const description = document.getElementById( "authDescription");

    if (title) {
        title.textContent ="Connexion";
    }

    if (description) {
        description.textContent ="Connectez-vous pour accéder à votre espace.";
    }

    if (switchAuth) {
        switchAuth.textContent = "Je veux créer un compte";
    }

}

// MODE INSCRIPTION

function showRegisterMode() {
    loginForm.classList .add("hidden");
    registerForm.classList.remove("hidden");
    forgotPasswordButton.classList .add("hidden");

    const title = document.getElementById("authTitle");
    const description = document.getElementById("authDescription");

    if (title) {
        title.textContent = "Créer votre compte";
    }

    if (description) {
        description.textContent ="Créez votre compte pour accéder à CiteActive.";
    }

    if (switchAuth) {
        switchAuth.textContent = "J'ai déjà un compte";
    }

}

// INSCRIPTION

async function registerUser(event) {
    event.preventDefault();
    const name = document.getElementById( "registerName").value.trim();
    const phone = document.getElementById("registerPhone").value.trim();
    const email = document .getElementById("registerEmail").value.trim();
    const password =document.getElementById("registerPassword").value;

    if (!name ||!phone || !email ||!password) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    if ( password.length < 6) {
        alert("Le mot de passe doit contenir au moins 6 caractères.");
        return;
    }

    const { data, error} =await supabaseClient.auth.signUp({
        email,password,
        options: {data: {name, phone } }
            });

    if (error) {
        console.error(error);
        alert( "Erreur lors de l'inscription : " + error.message);
        return;
    }

    if (!data.session) {
        alert("Compte créé. Vérifiez votre adresse email puis connectez-vous.");
        showLoginMode();
        return;
    }
    await loadCurrentUser();
    alert(`Bienvenue ${name} !`);

}


// CONNEXION
// =====================================================
// CONNEXION
// =====================================================

async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Veuillez saisir votre email et votre mot de passe.");
        return;
    }

    // Connexion avec Supabase Auth
    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        console.error("Erreur de connexion :", error);

        alert("Connexion impossible : " + error.message);

        return;
    }

    // Vérifier que Supabase nous a bien donné un utilisateur
    if (!data || !data.user) {
        alert("Impossible de récupérer l'utilisateur connecté.");
        return;
    }

    // Utilisateur connecté
    currentUser = data.user;

    console.log("Utilisateur connecté :", currentUser);

    // Récupérer son profil dans public.profiles
    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("id, name, phone, role")
            .eq("id", currentUser.id)
            .maybeSingle();

    if (profileError) {
        console.error(
            "Erreur récupération profil :",
            profileError
        );

        alert("Impossible de récupérer votre profil.");

        return;
    }

    if (!profile) {
        alert("Votre profil est introuvable.");

        return;
    }

    console.log("Profil utilisateur :", profile);
    console.log("Rôle :", profile.role);

    // ==========================================
    // CAS ADMINISTRATEUR
    // ==========================================

    if (profile.role === "admin") {

        alert("Connexion administrateur réussie !");

        window.location.href = "admin/admin.html";

        return;
    }

    // ==========================================
    // CAS UTILISATEUR NORMAL
    // ==========================================

    await loadCurrentUser();

    alert("Connexion réussie !");
}



// async function loginUser(event) {
//     event.preventDefault();

//     const email = document.getElementById("loginEmail").value.trim();
//     const password = document.getElementById("loginPassword").value;

//     if (!email ||!password) {
//         alert("Veuillez saisir votre email et votre mot de passe.");
//         return;
//     }

//     const {error} = await supabaseClient.auth.signInWithPassword({
//                 email,
//                 password
//             });

//     if (error) {
//         console.error(error);
//         alert("Connexion impossible :" +error.message );
//         return;
//     }
//     await loadCurrentUser();
//     alert("Connexion réussie !");
// }

// DECONNEXION

async function logoutUser() {
    const {error} = await supabaseClient.auth.signOut();
    if (error) {
        console.error(error);
        alert("Erreur lors de la déconnexion : "+error.message);
        return;
    }
    currentUser = null;
    const displayName =document.getElementById("userDisplayName");
    if (displayName) {displayName.textContent ="";}
    showAuth();
    showLoginMode();
}

// MOT DE PASSE OUBLIE

async function resetPassword() {
    const email =document.getElementById("loginEmail").value.trim();
    if (!email) {
        alert("Saisissez d'abord votre adresse email.");
        return;
    }

    const {error} =
        await supabaseClient.auth.resetPasswordForEmail(email,{
                    redirectTo:
                        window.location.origin +
                        window.location.pathname
                }
            );

    if (error) {
        console.error(error);
        alert("Impossible d'envoyer le lien : " + error.message);
        return;
    }
    alert("Un lien de réinitialisation a été envoyé.");
}

// RECUPERER PROFIL
async function getMyProfile() {
    if (!currentUser) {
        return null;
    }
    const {data,error} =
        await supabaseClient.from("profiles").select("id, name, phone")
            .eq("id",currentUser.id)
            .maybeSingle();

    if (error) {console.error("Erreur profil :", error);
        return null;
    }
    return data;
}

// UTILISATEUR ACTUEL

async function loadCurrentUser() {
    const {data,error} = await supabaseClient.auth.getUser();
    if (error || !data.user) {
        currentUser = null;
        showAuth();
        return null;
    }
    currentUser = data.user;
    const profile = await getMyProfile();

    const displayName = document.getElementById("userDisplayName");

    if (displayName) {
        displayName.textContent = profile?.name || currentUser.user_metadata?.name || currentUser.email ||"";
    }
    hideAuth();
    return currentUser;
}

// OUVRIR RESERVATION

async function openReservation(activity = "") {
    if (!currentUser) {
        showAuth();
        return;
    }
    const modal = document.getElementById("reservationModal");
    if (!modal) {
        return;
    }

    const activityInput = document.getElementById("activity");

    if ( activityInput && activity) {
        activityInput.value = activity;
    }
    selectedDate = null;
    selectedTime = null;
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    if (dateInput) {dateInput.value = "";
    }

    if (timeInput) {
        timeInput.value = "";
    }
    resetSubmitButton();
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
    renderCalendar();
    renderTimeSlots();
}

// FERMER RESERVATION

function closeReservation() {
    const modal = document.getElementById("reservationModal");
    if (!modal) {
        return;
    }
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");

}
// CALENDRIER - INITIALISATION

function initCalendarButtons() {
    document.getElementById("previousMonthButton").addEventListener("click",previousMonth);
    document.getElementById("nextMonthButton").addEventListener("click",nextMonth);

}

// MOIS PRECEDENT

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

// MOIS SUIVANT

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// RESERVATIONS D'UN MOIS

async function getReservationsForActivityMonth( activity) {
    if (!activity) {
        return [];
    }
    const firstDate =createDateString( currentYear, currentMonth, 1 );
    const lastDay = new Date( currentYear, currentMonth + 1, 0).getDate();
    const lastDate = createDateString( currentYear, currentMonth, lastDay);

    const { data,error} =await supabaseClient .from("reservations") .select("date, time, activity")
            .eq( "activity", activity )
            .gte("date",firstDate)
            .lte("date",lastDate);
    if (error) {
        console.error("Erreur calendrier :",error);
        return [];
    }
    return data || [];
}

// AFFICHER CALENDRIER
async function renderCalendar() {
    const calendar = document.getElementById("calendar");
    const title = document.getElementById("calendarTitle");
    if (!calendar ||!title) {
        return;
    }
    calendar.innerHTML ="";
    title.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    const firstDay = new Date(currentYear,currentMonth,1);
    const daysInMonth = new Date(currentYear,currentMonth + 1,0).getDate();
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) {
        startDay = 6;
    }

    for (let i = 0;i < startDay;i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className ="calendar-day min-h-12 border-b border-r border-slate-100";
        calendar.appendChild(emptyCell);
    }


    const activity = document.getElementById("activity").value ||"";

    const reservations = await getReservationsForActivityMonth(activity);


    for (let day = 1;day <= daysInMonth;day++) {

        const dateString = createDateString(currentYear,currentMonth,day);
        const button = document.createElement("button");
        button.type ="button";
        button.className ="calendar-day relative min-h-12 border-b border-r border-slate-100 flex items-center justify-center font-semibold hover:bg-sky-100 transition";
        button.textContent = day;

        if (dateString === selectedDate) {
            button.classList.add( "bg-sky-600","text-white");
        }
        const reservationsForDay = reservations.filter(reservation => reservation.date === dateString);

        if (reservationsForDay.length >= timeSlots.length) {
            button.classList.add("bg-red-50", "text-red-600");
            button.title = "Journée complète"; }

        if (reservationsForDay.length > 0 && 
            reservationsForDay.length < timeSlots.length && dateString !== selectedDate) {
            const dot = document.createElement("span");
            dot.className = "absolute bottom-1 w-1.5 h-1.5 bg-red-500 rounded-full";
            button.appendChild(dot);

        }
        button.addEventListener("click",() => selectDate(dateString));
        calendar.appendChild(
            button
        );
    }

}

function updateAgenda() {
    const activityInput = document.getElementById("activity");

    if (!activityInput) {
        console.warn("Le champ #activity est introuvable.");
        return;
    }

    const activity = activityInput.value.trim();

    // Réinitialiser la sélection
    selectedDate = null;
    selectedTime = null;

    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");

    if (dateInput) {
        dateInput.value = "";
    }

    if (timeInput) {
        timeInput.value = "";
    }

    // Désactiver le bouton réservation
    resetSubmitButton();

    // Recharger le calendrier et les créneaux
    renderCalendar();
    renderTimeSlots();

    console.log("Activité sélectionnée :", activity);
}


// =====================================================
// SELECTION DATE
// =====================================================

async function selectDate(
    dateString
) {

    selectedDate =
        dateString;


    selectedTime =
        null;


    const dateInput =
        document.getElementById(
            "date"
        );


    const timeInput =
        document.getElementById(
            "time"
        );


    if (dateInput) {

        dateInput.value =
            dateString;

    }


    if (timeInput) {

        timeInput.value =
            "";

    }


    resetSubmitButton();


    renderCalendar();


    await renderTimeSlots();

}


// =====================================================
// AFFICHER CRENEAUX
// =====================================================

async function renderTimeSlots() {

    const container =
        document.getElementById(
            "timeSlots"
        );


    const selectedDateText =
        document.getElementById(
            "selectedDateText"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (!selectedDate) {

        if (
            selectedDateText
        ) {

            selectedDateText.textContent =
                "Sélectionnez une date dans le calendrier.";

        }


        container.innerHTML = `

            <div class="sm:col-span-2 p-5 rounded-xl bg-slate-50 text-center">

                <div class="text-slate-400 mb-2">

                    <i class="bi bi-calendar-day text-2xl"></i>

                </div>

                <p class="text-sm text-slate-400">

                    Sélectionnez une date pour voir les créneaux.

                </p>

            </div>

        `;


        return;

    }


    if (
        selectedDateText
    ) {

        selectedDateText.textContent =
            formatDate(
                selectedDate
            );

    }


    const activity =
        document
            .getElementById(
                "activity"
            )
            ?.value ||
        "";


    if (!activity) {

        container.innerHTML = `

            <div class="sm:col-span-2 p-5 rounded-xl bg-yellow-50 border border-yellow-200 text-center">

                <p class="text-sm text-yellow-700">

                    Sélectionnez une activité pour voir les disponibilités.

                </p>

            </div>

        `;


        return;

    }


    const {
        data: reservations,
        error
    } =
        await supabaseClient

            .from("reservations")

            .select(
                "id, time"
            )

            .eq(
                "activity",
                activity
            )

            .eq(
                "date",
                selectedDate
            );


    if (error) {

        console.error(error);


        container.innerHTML = `

            <div class="sm:col-span-2 p-5 rounded-xl bg-red-50 border border-red-200 text-center">

                <p class="text-sm text-red-700">

                    Impossible de récupérer les disponibilités.

                </p>

            </div>

        `;


        return;

    }


    const reservedTimes =
        (reservations || [])
            .map(
                reservation =>
                    String(
                        reservation.time
                    )
                    .slice(0, 5)
            );


    timeSlots.forEach(
        time => {

            const existingReservation =
                reservedTimes
                    .includes(
                        time
                    );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            if (
                existingReservation
            ) {

                button.disabled =
                    true;


                button.className =
                    "flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 cursor-not-allowed";


                button.innerHTML = `

                    <span class="font-bold">

                        ${time}

                    </span>

                    <span class="flex items-center gap-2 text-sm">

                        <span class="w-2 h-2 bg-red-500 rounded-full"></span>

                        Réservé

                    </span>

                `;

            }

            else {

                button.className =
                    "time-slot flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 hover:bg-green-500 hover:text-white transition";


                if (
                    selectedTime ===
                    time
                ) {

                    button.classList.add(
                        "bg-sky-600",
                        "text-white",
                        "border-sky-600"
                    );

                }


                button.innerHTML = `

                    <span class="font-bold">

                        ${time}

                    </span>

                    <span class="flex items-center gap-2 text-sm">

                        <span class="w-2 h-2 bg-green-500 rounded-full"></span>

                        Disponible

                    </span>

                `;


                button.addEventListener(
                    "click",
                    () =>
                        selectTime(
                            time
                        )
                );

            }


            container.appendChild(
                button
            );

        }
    );

}


// =====================================================
// SELECTION CRENEAU
// =====================================================

function selectTime(
    time
) {

    selectedTime =
        time;


    const timeInput =
        document.getElementById(
            "time"
        );


    if (timeInput) {

        timeInput.value =
            time;

    }


    const submitButton =
        document.getElementById(
            "submitReservation"
        );


    if (!submitButton) {

        return;

    }


    submitButton.disabled =
        false;


    submitButton.className =
        "w-full bg-sky-600 hover:bg-sky-700 text-white py-3.5 rounded-xl font-bold transition";


    submitButton.textContent =
        `Réserver à ${time}`;


    renderTimeSlots();

}


// =====================================================
// RESET BOUTON RESERVATION
// =====================================================

function resetSubmitButton() {

    const submitButton =
        document.getElementById(
            "submitReservation"
        );


    if (!submitButton) {

        return;

    }


    submitButton.disabled =
        true;


    submitButton.className =
        "w-full bg-slate-300 text-slate-500 py-3.5 rounded-xl font-bold cursor-not-allowed";


    submitButton.textContent =
        "Sélectionnez un créneau";

}


// =====================================================
// CREER RESERVATION
// =====================================================

async function createReservation(
    activity,
    date,
    time
) {

    if (!currentUser) {

        showAuth();

        return null;

    }


    const {
        data,
        error
    } =
        await supabaseClient

            .from("reservations")

            .insert({

                user_id:
                    currentUser.id,

                activity:
                    activity,

                date:
                    date,

                time:
                    time

            })

            .select()

            .single();


    if (error) {

        console.error(
            "Erreur réservation :",
            error
        );


        if (
            error.code ===
            "23505"
        ) {

            alert(
                "Ce créneau vient d'être réservé par quelqu'un d'autre."
            );

        }

        else {

            alert(
                "Impossible d'enregistrer la réservation : " +
                error.message
            );

        }


        return null;

    }


    return data;

}


// =====================================================
// SOUMISSION RESERVATION
// =====================================================

async function handleReservationSubmit(
    event
) {

    event.preventDefault();


    if (!currentUser) {

        showAuth();

        return;

    }


    const activity =
        document
            .getElementById(
                "activity"
            )
            ?.value
            .trim();


    const date =
        document
            .getElementById(
                "date"
            )
            ?.value
            .trim();


    const time =
        document
            .getElementById(
                "time"
            )
            ?.value
            .trim();


    if (
        !activity ||
        !date ||
        !time
    ) {

        alert(
            "Veuillez sélectionner une activité, une date et un créneau."
        );

        return;

    }


    const reservation =
        await createReservation(
            activity,
            date,
            time
        );


    if (!reservation) {

        return;

    }


    alert(
        "Votre réservation a été enregistrée avec succès !"
    );


    document
        .getElementById(
            "reservationForm"
        )
        ?.reset();


    selectedDate =
        null;


    selectedTime =
        null;


    resetSubmitButton();


    closeReservation();

}


// =====================================================
// VOS ACTIVITES
// =====================================================

async function getMyReservations() {

    if (!currentUser) {
        return [];
    }

    const { data, error } =await supabaseClient
            .from("reservations")
            .select("id,user_id, activity, date, time,is_started, created_at")
            .eq(
                "user_id",
                currentUser.id
            )
            .order("date", { ascending: true})

            .order(
                "time",
                {
                    ascending: true
            });


    if (error) {
        console.error(
            "Erreur récupération activités :", error
        );
        return [];
    }
    return data || [];
}


// =====================================================
// OUVRIR VOS ACTIVITES
// =====================================================

async function openActivities() {

    if (!currentUser) {

        showAuth();

        return;

    }


    const modal =
        document.getElementById(
            "activitiesModal"
        );


    if (!modal) {

        return;

    }


    const profile =
        await getMyProfile();


    const clientNameElement =
        document.getElementById(
            "currentClientName"
        );


    if (
        clientNameElement
    ) {

        clientNameElement.textContent =

            profile?.name ||

            currentUser
                .user_metadata
                ?.name ||

            currentUser.email ||

            "";

    }


    await renderActivities();


    modal
        .classList
        .remove("hidden");


    modal
        .classList
        .add("flex");


    document.body
        .classList
        .add(
            "overflow-hidden"
        );

}


// =====================================================
// FERMER VOS ACTIVITES
// =====================================================

function closeActivities() {

    const modal =
        document.getElementById(
            "activitiesModal"
        );


    if (!modal) {

        return;

    }


    modal
        .classList
        .add("hidden");


    modal
        .classList
        .remove("flex");


    document.body
        .classList
        .remove(
            "overflow-hidden"
        );

}


// =====================================================
// AFFICHER VOS ACTIVITES
// =====================================================

async function renderActivities() {

    const activitiesList =
        document.getElementById(
            "activitiesList"
        );


    const noActivities =
        document.getElementById(
            "noActivities"
        );


    if (
        !activitiesList ||
        !noActivities
    ) {

        return;

    }


    activitiesList.innerHTML =
        "";


    const reservations =
        await getMyReservations();


    if (
        reservations.length ===
        0
    ) {

        noActivities
            .classList
            .remove("hidden");

        return;

    }
     noActivities.classList.add("hidden");

    reservations.forEach(
        reservation => {
            const isChecked = reservation.is_started === true;
            const item = document.createElement("label");

            item.className = "flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-sky-300 hover:bg-sky-50/50 transition";

            item.innerHTML =`
        
                <input type="checkbox" class="activity-checkbox w-5 h-5 accent-sky-600 cursor-pointer shrink-0"
                    data-reservation-id="${escapeHtml(reservation.id)}"
                    ${isChecked ? "checked" : ""}>
                <div class="flex-1 min-w-0">

                    <h3 class="font-bold text-slate-800 truncate">
                        ${escapeHtml(reservation.activity)}
                    </h3>


                    <p class="text-sm text-slate-500 mt-1">

                        <i class="bi bi-calendar3 mr-1"></i>
                        ${escapeHtml(formatDate(reservation.date))}
                        <span class="mx-1">•</span>
                        <i class="bi bi-clock mr-1"></i>

                        ${escapeHtml(String( reservation.time).slice(0, 5))}
                    </p>
                </div>
                <span class="activity-status text-xs font-bold px-3 py-1.5 rounded-full ${
                    isChecked ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }">
                        ${isChecked ? "En cours" : "Réservée"}
                </span>
                `;
                 const checkbox = item.querySelector(".activity-checkbox");
                const status = item.querySelector(".activity-status");

                checkbox.addEventListener("change", async () => {

                    const newStatus = checkbox.checked;

                    // Changement visuel immédiat
                    if (newStatus) {

                        status.textContent = "En cours";

                        status.className = "activity-status text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700";

                    } else {

                        status.textContent = "Réservée";
                        status.className ="activity-status text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500";
                    }

                    // Mise à jour dans Supabase
                    const { error } = await supabaseClient
                        .from("reservations")
                        .update({
                            is_started: newStatus
                        })
                        .eq("id", reservation.id);

                    // Si Supabase rencontre une erreur
                    if (error) {

                        console.error(
                            "Erreur lors de la mise à jour :",
                            error
                        );

                        // On annule le changement visuel
                        checkbox.checked = !newStatus;

                        if (checkbox.checked) {

                            status.textContent = "En cours";

                            status.className =
                                "activity-status text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700";

                        } else {

                            status.textContent = "Réservée";

                            status.className =
                                "activity-status text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500";
                        }

                        alert("Impossible de modifier le statut de cette activité.");

                        return;
                    }

                    // Mise à jour de l'objet local
                    reservation.is_started = newStatus;

                    console.log("Statut enregistré dans Supabase.");

                });
            activitiesList.appendChild( item );
        });

}


// =====================================================
// TOUCHE ESCAPE
// =====================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeReservation();

            closeActivities();

        }

    }
);


// =====================================================
// INITIALISATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initMobileMenu();

        initCalendarButtons();


        // -----------------------------
        // INSCRIPTION
        // -----------------------------

        if (
            registerForm
        ) {

            registerForm
                .addEventListener(
                    "submit",
                    registerUser
                );

        }


        // -----------------------------
        // CONNEXION
        // -----------------------------

        if (
            loginForm
        ) {

            loginForm
                .addEventListener(
                    "submit",
                    loginUser
                );

        }


        // -----------------------------
        // CHANGEMENT AUTH
        // -----------------------------

        if (
            switchAuth
        ) {

            switchAuth
                .addEventListener(
                    "click",
                    () => {

                        const registerVisible =

                            !registerForm
                                .classList
                                .contains(
                                    "hidden"
                                );


                        if (
                            registerVisible
                        ) {

                            showLoginMode();

                        }

                        else {

                            showRegisterMode();

                        }

                    }
                );

        }


        // -----------------------------
        // MOT DE PASSE OUBLIE
        // -----------------------------

        if (
            forgotPasswordButton
        ) {

            forgotPasswordButton
                .addEventListener(
                    "click",
                    resetPassword
                );

        }


        // -----------------------------
        // DECONNEXION DESKTOP
        // -----------------------------

        document
            .getElementById(
                "logoutButton"
            )
            ?.addEventListener(
                "click",
                logoutUser
            );


        // -----------------------------
        // DECONNEXION MOBILE
        // -----------------------------

        document
            .getElementById(
                "mobileLogoutButton"
            )
            ?.addEventListener(
                "click",
                logoutUser
            );


        // -----------------------------
        // RESERVATION
        // -----------------------------

        document
            .getElementById(
                "reservationForm"
            )
            ?.addEventListener(
                "submit",
                handleReservationSubmit
            );


        // -----------------------------
        // SURVEILLER AUTH
        // -----------------------------

        supabaseClient
            .auth
            .onAuthStateChange(
                async (
                    _event,
                    session
                ) => {

                    if (
                        session?.user
                    ) {

                        currentUser =
                            session.user;


                        const displayName =
                            document
                                .getElementById(
                                    "userDisplayName"
                                );


                        const profile =
                            await getMyProfile();


                        if (
                            displayName
                        ) {

                            displayName.textContent =

                                profile?.name ||

                                currentUser
                                    .user_metadata
                                    ?.name ||

                                currentUser.email ||

                                "";

                        }


                        hideAuth();

                    }

                    else {

                        currentUser =
                            null;

                        showAuth();

                    }

                }
            );


        // -----------------------------
        // VERIFIER SESSION
        // -----------------------------

        await loadCurrentUser();

    }
);