// -------------------------------
// MULTI-MONTH CALENDAR STATE
// -------------------------------
window.calYear = new Date().getFullYear();
window.calMonth = new Date().getMonth(); // 0–11

// -------------------------------
// PURE BOOKING STATE
// -------------------------------
window.selectedDate = null;
window.selectedSlot = null;

window.totalMin = 0;
window.totalMax = 0;

// -------------------------------
// ALWAYS ENABLE BOOK BUTTON
// -------------------------------
function updateBookButtonState() {
  const btn = document.querySelector("#booking-form button[type='submit']");
  btn.disabled = !window.selectedSlot;
}

// -------------------------------
// TIME FUNCTIONS (REQUIRED)
// -------------------------------
function convertTo24Hour(timeStr) {
  if (!timeStr) return "00:00";

  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");

  if (modifier === "PM" && hours !== "12") {
    hours = String(Number(hours) + 12);
  }
  if (modifier === "AM" && hours === "12") {
    hours = "00";
  }

  return `${hours}:${minutes}`;
}

function computeEndTime(startTime24) {
  if (!startTime24) return "00:00";

  const [h, m] = startTime24.split(":");
  const endHour = String(Number(h) + 2).padStart(2, "0");
  return `${endHour}:${m}`;
}

// -------------------------------
// CALENDAR RENDERING
// -------------------------------
function renderCalendar(year = window.calYear, month = window.calMonth) {
  const grid = document.querySelector("#calendar .calendar-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const title = document.getElementById("calendarTitle");
  const monthNames = ["January","February","March","April","May","June","July",
                      "August","September","October","November","December"];
  title.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  weekdays.forEach(d => {
    const cell = document.createElement("div");
    cell.className = "calendar-cell calendar-header";
    cell.textContent = d;
    grid.appendChild(cell);
  });

  for (let i = 0; i < firstDay.getDay(); i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-cell empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell calendar-day";
    cell.textContent = day;

    const yyyy = year;
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const formatted = `${yyyy}-${mm}-${dd}`;

    cell.onclick = () => {
      window.selectedDate = formatted;

      window.selectedSlot = null;
      updateBookButtonState();

      document.getElementById("slotError").textContent = "Please select a time slot.";
      document.getElementById("slotError").style.display = "block";

      document.getElementById("bookingFormContainer").classList.add("hidden");

      document.querySelectorAll(".calendar-day").forEach(c =>
        c.classList.remove("selected")
      );

      cell.classList.add("selected");

      fetchAvailability(formatted);
      updateBookButtonState();
    };

    grid.appendChild(cell);
  }
}

// -------------------------------
// FETCH AVAILABILITY
// -------------------------------
async function fetchAvailability(date) {
  const output = document.getElementById("availability_output");
  const slotBox = document.getElementById("timeSlots");

  output.innerHTML = "";
  slotBox.innerHTML = "";

  let slots;

  try {
    const res = await fetch(`https://fastapi-production-d14c.up.railway.app/availability?date=${date}`);
    slots = await res.json();

    if (!res.ok) {
      output.innerText = slots.detail || "Error fetching availability.";
      return;
    }

  } catch (err) {
    output.innerText = "Network error fetching availability.";
    return;
  }

  slotBox.innerHTML = "";

  slots.forEach(slot => {
    const btn = document.createElement("button");
    btn.className = "time-slot-btn";
    btn.textContent = slot;

    btn.onclick = () => {
      window.selectedSlot = slot;

      document.getElementById("slotError").style.display = "none";

      document.querySelectorAll(".time-slot-btn").forEach(b =>
        b.classList.remove("time-slot-btn-selected")
      );

      btn.classList.add("time-slot-btn-selected");

      document.getElementById("bookingFormContainer").classList.remove("hidden");

      updateBookButtonState();
    };

    slotBox.appendChild(btn);
  });
}

// -------------------------------
// BUILD SERVICES PAYLOAD
// -------------------------------
function buildServicesPayload() {
  const services = [];

  if (document.getElementById("svc_gutter_cleaning").checked) {
    services.push({
      service_type_id: 1,
      service_name: "Gutter Cleaning",
      linear_feet: window.gcFeet || 0,
      min_price: 99,
      max_price: 149
    });
  }

  if (document.getElementById("svc_pressure_washing").checked) {
    services.push({
      service_type_id: 2,
      service_name: "Pressure Washing",
      square_feet: window.pwSqft || 0,
      min_price: 149,
      max_price: 249
    });
  }

  if (document.getElementById("svc_gutter_brightening").checked) {
    services.push({
      service_type_id: 3,
      service_name: "Gutter Brightening",
      min_price: 60,
      max_price: 120
    });
  }

  if (document.getElementById("svc_soft_wash").checked) {
    services.push({
      service_type_id: 4,
      service_name: "Soft Wash",
      min_price: 149,
      max_price: 299
    });
  }

  window.totalMin = services.reduce((sum, svc) => sum + (svc.min_price || 0), 0);
  window.totalMax = services.reduce((sum, svc) => sum + (svc.max_price || 0), 0);

  return services;
}

// -------------------------------
// BUILD FINAL PAYLOAD
// -------------------------------
function buildFinalPayload() {
  const form = document.getElementById("booking-form");

  return {
    client: {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      service_address: form.service_address.value.trim(),
      notes: form.notes.value.trim()
    },

    services: buildServicesPayload(),

    estimate: {
      total_min_price: window.totalMin,
      total_max_price: window.totalMax
    },

    appointment: {
      date: window.selectedDate,
      start_time: convertTo24Hour(window.selectedSlot),
      end_time: computeEndTime(convertTo24Hour(window.selectedSlot))
    }
  };
}

// -------------------------------
// SUBMIT BOOKING + MONTH NAVIGATION
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  renderCalendar(window.calYear, window.calMonth);
  updateBookButtonState();

  // ⭐ MONTH NAVIGATION — THIS WAS MISSING ⭐
  document.getElementById("prevMonthBtn").onclick = () => {
    window.calMonth--;
    if (window.calMonth < 0) {
      window.calMonth = 11;
      window.calYear--;
    }
    renderCalendar(window.calYear, window.calMonth);
  };

  document.getElementById("nextMonthBtn").onclick = () => {
    window.calMonth++;
    if (window.calMonth > 11) {
      window.calMonth = 0;
      window.calYear++;
    }
    renderCalendar(window.calYear, window.calMonth);
  };

  document.getElementById("svc_gutter_cleaning").onchange = updateBookButtonState;
  document.getElementById("svc_gutter_brightening").onchange = updateBookButtonState;
  document.getElementById("svc_pressure_washing").onchange = updateBookButtonState;
  document.getElementById("svc_soft_wash").onchange = updateBookButtonState;

  const form = document.getElementById("booking-form");

  form.onsubmit = async (e) => {
    e.preventDefault();

    if (!window.selectedSlot || window.selectedSlot.trim() === "") {
      alert("Please select a time slot before booking.");
      return;
    }

    const payload = buildFinalPayload();

    try {
      const res = await fetch("https://fastapi-production-d14c.up.railway.app/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();

        if (err.detail && err.detail.includes("already been booked")) {
          alert("This time slot has already been booked.");

          fetchAvailability(window.selectedDate);

          window.selectedSlot = null;
          updateBookButtonState();

          document.getElementById("bookingFormContainer").classList.add("hidden");

          return;
        }

        alert("Error creating booking: " + err.detail);
        return;
      }

      const data = await res.json();
      alert("Booking created successfully!");

      const updatedRes = await fetch(`https://fastapi-production-d14c.up.railway.app/availability?date=${window.selectedDate}`);
      const updatedSlots = await updatedRes.json();

      fetchAvailability(window.selectedDate);
      fetchAvailability(window.selectedDate);

    } catch (err) {
      alert("Network or server error — check console.");
    }
  };
});
