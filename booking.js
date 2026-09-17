function nextDayCutoff(dateObj) {
  const now = new Date();
  console.log("DEBUG cutoff check:", { now, dateObj });

  if (now.getHours() < 20) return false;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isCutoff = dateObj.toDateString() === tomorrow.toDateString();
  console.log("DEBUG nextDayCutoff result:", isCutoff);

  return isCutoff;
}

window.calYear = new Date().getFullYear();
window.calMonth = new Date().getMonth();

window.selectedDate = null;
window.selectedDateObj = null;
window.selectedSlot = null;
window.bookedSlot24 = null;
window.totalMin = 0;
window.totalMax = 0;

function showModal(title, message) {
  console.log("DEBUG showModal:", { title, message });
  const modal = document.getElementById("popupModal");
  document.getElementById("popupTitle").textContent = title;
  document.getElementById("popupMessage").innerHTML = message;
  modal.classList.remove("hidden");
  document.getElementById("popupClose").onclick =
  document.getElementById("popupOkBtn").onclick =
    () => modal.classList.add("hidden");
}

function popup(msg) {
  console.log("DEBUG popup:", msg);
  showModal("Message", msg);
}

function toStandardTime(t) {
  let [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function convertTo24Hour(t) {
  if (!t.includes("AM") && !t.includes("PM")) return t;
  const [time, mod] = t.split(" ");
  let [h, m] = time.split(":");
  if (mod === "PM" && h !== "12") h = String(Number(h) + 12);
  if (mod === "AM" && h === "12") h = "00";
  return `${h}:${m}`;
}

function computeEndTime(start) {
  const [h, m] = start.split(":");
  return `${String(Number(h) + 2).padStart(2, "0")}:${m}`;
}

function formatLongDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function popupFinalConfirmation(date, time) {
  console.log("DEBUG final confirmation:", { date, time });
  const [y, m, d] = date.split("-").map(Number);
  const obj = new Date(y, m - 1, d);
  const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][obj.getDay()];
  const t24 = convertTo24Hour(time);
  const tStd = toStandardTime(t24);
  const longDate = formatLongDate(date);
  const msg = `Day: ${weekday}<br>Date: ${longDate}<br>Time: ${tStd}<br><br>Please save this information.`;
  showModal("Appointment Details", msg);
  const box = document.getElementById("appointmentSummary");
  const txt = document.getElementById("summaryText");
  txt.innerHTML = `Day: <strong>${weekday}</strong><br>Date: <strong>${longDate}</strong><br>Time: <strong>${tStd}</strong><br><br>Please save this information.`;
  box.style.display = "block";
}

function updateBookButtonState() {
  const btn = document.querySelector("#booking-form button[type='submit']");
  if (btn) btn.disabled = false;
}

function renderCalendar(year = window.calYear, month = window.calMonth) {
  console.log("DEBUG renderCalendar:", { year, month });

  const grid = document.querySelector("#calendar .calendar-grid");
  grid.innerHTML = "";
  const title = document.getElementById("calendarTitle");
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  title.textContent = `${monthNames[month]} ${year}`;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => {
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

    const today = new Date();
    today.setHours(0,0,0,0);

    const cellDate = new Date(year, month, day);
    cellDate.setHours(0,0,0,0);

    if (cellDate <= today || nextDayCutoff(cellDate)) {
      cell.classList.add("disabled-day");
      cell.style.opacity = "0.35";
      cell.style.pointerEvents = "none";
      grid.appendChild(cell);
      continue;
    }

    cell.onclick = () => {
      console.log("DEBUG calendar click:", { formatted, cellDate });

      window.selectedDate = formatted;
      window.selectedDateObj = new Date(cellDate);
      window.selectedSlot = null;

      window.calYear = cellDate.getFullYear();
      window.calMonth = cellDate.getMonth();

      document.getElementById("slotError").style.display = "block";
      document.getElementById("bookingFormContainer").classList.add("hidden");

      document.querySelectorAll(".calendar-day").forEach(c => c.classList.remove("selected"));
      cell.classList.add("selected");

      fetchAvailability(formatted);
      updateBookButtonState();
    };

    grid.appendChild(cell);
  }
}

async function fetchAvailability(date) {
  console.log("DEBUG fetchAvailability:", date);

  const output = document.getElementById("availability_output");
  const slotBox = document.getElementById("timeSlots");

  output.innerHTML = "";
  slotBox.innerHTML = "";

  let slots;

  try {
    const res = await fetch(`https://fastapi-production-d14c.up.railway.app/availability?date=${date}`);
    slots = await res.json();
    console.log("DEBUG availability response:", slots);

    if (!res.ok) {
      output.innerText = slots.detail || "Error fetching availability.";
      return;
    }
  } catch (err) {
    console.error("ERROR availability fetch:", err);
    output.innerText = "Network error fetching availability.";
    return;
  }

  slotBox.innerHTML = "";

  slots.forEach(slot => {
    const slot24 = convertTo24Hour(slot);
    const slotStd = toStandardTime(slot24);

    const selectedDateObj = window.selectedDateObj;
    console.log("DEBUG slot render:", { slot, slot24, slotStd, selectedDateObj });

    if (nextDayCutoff(selectedDateObj)) {
      const grey = document.createElement("div");
      grey.className = "time-slot-btn disabled-slot";
      grey.textContent = slotStd;
      grey.style.opacity = "0.35";
      grey.style.pointerEvents = "none";
      slotBox.appendChild(grey);
      return;
    }

    const btn = document.createElement("button");
    btn.className = "time-slot-btn";
    btn.textContent = slotStd;

    btn.onclick = () => {
      const selectedDateObjInner = window.selectedDateObj;
      console.log("DEBUG slot click:", { slotStd, selectedDateObjInner });

      if (nextDayCutoff(selectedDateObjInner)) {
        popup("Next-day appointments close at 8 PM. Please choose another date.");
        return;
      }

      window.selectedSlot = slotStd;
      window.bookedSlot24 = slot24;

      document.getElementById("slotError").style.display = "none";

      document.querySelectorAll(".time-slot-btn").forEach(b => b.classList.remove("time-slot-btn-selected"));
      btn.classList.add("time-slot-btn-selected");

      document.getElementById("bookingFormContainer").classList.remove("hidden");

      updateBookButtonState();
    };

    slotBox.appendChild(btn);
  });
}

function buildServicesPayload() {
  console.log("DEBUG buildServicesPayload");
  const services = [];
  if (document.getElementById("svc_gutter_cleaning").checked)
    services.push({ service_type_id: 1, service_name: "Gutter Cleaning", linear_feet: window.gcFeet || 0, min_price: 99, max_price: 149 });
  if (document.getElementById("svc_pressure_washing").checked)
    services.push({ service_type_id: 2, service_name: "Pressure Washing", square_feet: window.pwSqft || 0, min_price: 149, max_price: 249 });
  if (document.getElementById("svc_gutter_brightening").checked)
    services.push({ service_type_id: 3, service_name: "Gutter Brightening", min_price: 60, max_price: 120 });
  if (document.getElementById("svc_soft_wash").checked)
    services.push({ service_type_id: 4, service_name: "Soft Wash", min_price: 149, max_price: 299 });
  window.totalMin = services.reduce((s, x) => s + x.min_price, 0);
  window.totalMax = services.reduce((s, x) => s + x.max_price, 0);
  console.log("DEBUG service totals:", { totalMin: window.totalMin, totalMax: window.totalMax });
  return services;
}

function buildFinalPayload() {
  console.log("DEBUG buildFinalPayload");
  const f = document.getElementById("booking-form");
  return {
    client: {
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      email: f.email.value.trim(),
      service_address: f.service_address.value.trim(),
      notes: f.notes.value.trim()
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

document.addEventListener("DOMContentLoaded", () => {
  console.log("DEBUG DOMContentLoaded");
  renderCalendar(window.calYear, window.calMonth);
  updateBookButtonState();

  document.getElementById("prevMonthBtn").onclick = () => {
    console.log("DEBUG prevMonth");
    window.calMonth--;
    if (window.calMonth < 0) {
      window.calMonth = 11;
      window.calYear--;
    }
    renderCalendar(window.calYear, window.calMonth);
  };

  document.getElementById("nextMonthBtn").onclick = () => {
    console.log("DEBUG nextMonth");
    window.calMonth++;
    if (window.calMonth > 11) {
      window.calMonth = 0;
      window.calYear++;
    }
    renderCalendar(window.calYear, window.calMonth);
  };

  const form = document.getElementById("booking-form");

  form.onsubmit = async e => {
    e.preventDefault();
    console.log("DEBUG form submit");

    const anyService =
      document.getElementById("svc_gutter_cleaning").checked ||
      document.getElementById("svc_pressure_washing").checked ||
      document.getElementById("svc_gutter_brightening").checked ||
      document.getElementById("svc_soft_wash").checked;

    if (!anyService) return popup("Please select a service.");
    if (!window.selectedDate || !window.selectedSlot) return popup("Please select a date and time.");
    if (!form.name.value.trim() || !form.phone.value.trim() || !form.service_address.value.trim())
      return popup("Please fill out contact information.");

    const finalDateObj = window.selectedDateObj;
    console.log("DEBUG final cutoff check:", finalDateObj);

    if (nextDayCutoff(finalDateObj)) {
      popup("Next-day appointments close at 8 PM. Please choose another date.");
      return;
    }

    popupFinalConfirmation(window.selectedDate, window.selectedSlot);

    const payload = buildFinalPayload();
    console.log("DEBUG booking payload:", payload);

    try {
      const res = await fetch("https://fastapi-production-d14c.up.railway.app/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log("DEBUG booking response:", data);

      if (!res.ok) {
        if (data.detail && data.detail.includes("already been booked")) {
          popup("This time slot has already been booked.");
          fetchAvailability(window.selectedDate);
          window.selectedSlot = null;
          document.getElementById("bookingFormContainer").classList.add("hidden");
          return;
        }
        popup("Error creating booking: " + data.detail);
        return;
      }

      popup("Booking created successfully!");

      if (window.bookedSlot24) {
        const bookedNorm = window.bookedSlot24.trim().toLowerCase();
        document.querySelectorAll(".time-slot-btn").forEach(btn => {
          const btn24 = convertTo24Hour(btn.textContent).trim().toLowerCase();
          if (btn24 === bookedNorm) btn.remove();
        });
      }

      fetchAvailability(window.selectedDate);

    } catch (err) {
      console.error("ERROR booking submit:", err);
      popup("Network or server error — check console.");
    }
  };
});
