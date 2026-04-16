let selectedEquipment = "";

// LOGOUT
function logout() {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
}
function loadDashboard() {

    const total = document.getElementById("totalBookings");

    if (!total) return;

    fetch("http://localhost:8080/api/bookings")
        .then(res => res.json())
        .then(data => {
            total.innerText = data.length;
        });
}
// OPEN MODAL
function openModal(equipment) {
    selectedEquipment = equipment;

    document.getElementById("bookingModal").style.display = "block";
    document.getElementById("equipmentName").innerText = "Booking: " + equipment;

    // clear old values
    document.getElementById("slotInfo").innerText = "";
    document.getElementById("date").value = "";
    document.getElementById("time").value = "";
}

// CLOSE MODAL
function closeModal() {
    document.getElementById("bookingModal").style.display = "none";
}

// CHECK REMAINING SLOTS
function updateSlots() {

    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    if (!date || !time) {
        document.getElementById("slotInfo").innerText = "";
        return;
    }

    fetch(`http://localhost:8080/api/bookings/remaining?equipment=${selectedEquipment}&date=${date}&time=${time}`)
        .then(res => res.text())
        .then(data => {

            let slots = parseInt(data);

            if (slots > 0) {
                document.getElementById("slotInfo").innerText =
                    "Remaining Slots: " + slots;
            } else {
                document.getElementById("slotInfo").innerText =
                    "❌ No slots available";
            }
        })
        .catch(() => {
            document.getElementById("slotInfo").innerText = "Error checking slots";
        });
}

// TRIGGER SLOT CHECK WHEN DATE/TIME CHANGE
document.addEventListener("change", function(e) {
    if (e.target.id === "date" || e.target.id === "time") {
        updateSlots();
    }
});

function confirmBooking() {

    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    if (!date || !time) {
        alert("Select date & time ❗");
        return;
    }

    fetch("http://localhost:8080/api/bookings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            equipment: selectedEquipment,
            date: date,
            time: time
        })
    })
    .then(async res => {
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text);
        }
        return res.json();
    })
    .then(() => {
        alert("Booking Successful ✅");
        updateSlots();
    })
    .catch(err => {
        alert("❌ " + err.message);
    });
}
function loadBookings() {

    const table = document.getElementById("bookingTable");

    if (!table) return;

    fetch("http://localhost:8080/api/bookings")
        .then(res => res.json())
        .then(data => {

            table.innerHTML = "";

            data.forEach((b, i) => {
                table.innerHTML += `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${b.equipment}</td>
                        <td>${b.date}</td>
                        <td>${b.time}</td>
                    </tr>
                `;
            });

        })
        .catch(() => {
            table.innerHTML = "<tr><td colspan='4'>Error loading bookings</td></tr>";
        });
}
function loadDashboard() {

    fetch("http://localhost:8080/api/bookings")
        .then(res => res.json())
        .then(data => {

            // TOTAL BOOKINGS
            document.getElementById("totalBookings").innerText = data.length;

            // TODAY BOOKINGS
            const today = new Date().toISOString().split("T")[0];
            const todayCount = data.filter(b => b.date === today).length;

            const todayElem = document.getElementById("todayBookings");
            if (todayElem) todayElem.innerText = todayCount;

            // GROUP BOOKINGS BY DATE
            let map = {};

            data.forEach(b => {
                map[b.date] = (map[b.date] || 0) + 1;
            });

            const labels = Object.keys(map);
            const values = Object.values(map);

            // DRAW CHART
            const ctx = document.getElementById("bookingChart");

            if (ctx) {
                new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: labels,
                        datasets: [{
                            label: "Bookings",
                            data: values,
                            borderWidth: 2,
                            tension: 0.4
                        }]
                    },
                    options: {
                        plugins: {
                            legend: {
                                labels: { color: "#fff" }
                            }
                        },
                        scales: {
                            x: { ticks: { color: "#fff" } },
                            y: { ticks: { color: "#fff" } }
                        }
                    }
                });
            }

        });
    // EQUIPMENT ANALYTICS (PIE CHART)
let equipmentMap = {};

data.forEach(b => {
    equipmentMap[b.equipment] = (equipmentMap[b.equipment] || 0) + 1;
});

const eqLabels = Object.keys(equipmentMap);
const eqValues = Object.values(equipmentMap);

const eqCtx = document.getElementById("equipmentChart");

if (eqCtx) {
    new Chart(eqCtx, {
        type: "pie",
        data: {
            labels: eqLabels,
            datasets: [{
                data: eqValues
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: "#fff" }
                }
            }
        }
    });
}    
}

window.onload = function () {
    loadBookings();
    loadDashboard();
};