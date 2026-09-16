async function getMyReservations() {

    if (!currentUser) {
        return [];
    }

    const { data, error } = await supabaseClient
        .from("reservations")
        .select(`
            id,
            user_id,
            activity,
            date,
            time,
            is_started,
            created_at
        `)
        .eq("user_id", currentUser.id)
        .order("date", {
            ascending: true
        })
        .order("time", {
            ascending: true
        });

    if (error) {
        console.error(
            "Erreur récupération activités :",
            error
        );

        return [];
    }

    return data || [];
}