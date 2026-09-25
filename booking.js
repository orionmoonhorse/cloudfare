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

/* ⭐ 3-hour slot duration */
function computeEndTime(start) {
  const [h, m] = start.split(":");
  return `${String(Number(h) + 3).padStart(2, "0")}:${m}`;
}

function showModal(title, message) {
  const modal = document.getElementById("popupModal");
  document.getElementById("popupTitle").textContent = title;
  document.getElementById("popupMessage").innerHTML = message;
  modal.classList.remove("hidden");
  document.getElementById("popupClose").onclick =
  document.getElementById("popupOkBtn").onclick =
    () => modal.classList.add("hidden");
}

function popup(msg) {
  showModal("Message", msg);
}

window.calYear = new Date().getFullYear();
window.calMonth = new Date().getMonth();
window.selectedDate = null;
window.selectedDateObj = null;
window.selectedSlot = null;
window.bookedSlot24 = null;
window.totalMin = 0;
window.totalMax = 0;

/* ⭐ Persistent summary AFTER booking */
function updatePersistentSummary(date, time) {
  const [y, m, d] = date.split("-").map(Number);
  const obj = new Date(y, m - 1, d);

  const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][obj.getDay()];
  const t24 = convertTo24Hour(time);
  const tStd = toStandardTime(t24);

  const longDate = obj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const box = document.getElementById("appointmentSummary");
  const txt = document.getElementById("summaryText");

  txt.innerHTML =
    `Day: <strong>${weekday}</strong><br>` +
    `Date: <strong>${longDate}</strong><br>` +
    `Time: <strong>${tStd}</strong><br>` +
    `Please save this information.`;

  box.style.display = "block";
}

function renderCalendar(year = window.calYear, month = window.calMonth) {
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

  const today = new Date();
  today.setHours(0,0,0,0);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell calendar-day";
    cell.textContent = day;

    const yyyy = year;
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const formatted = `${yyyy}-${mm}-${dd}`;

    const cellDate = new Date(year, month, day);
    cellDate.setHours(0,0,0,0);

    if (cellDate < today) {
      cell.classList.add("disabled-day");
      cell.style.opacity = "0.35";
      cell.style.pointerEvents = "none";
      grid.appendChild(cell);
      continue;
    }

    cell.onclick = () => {
      window.selectedDate = formatted;
      window.selectedDateObj = new Date(cellDate);
      window.selectedSlot = null;

      document.getElementById("slotError").style.display = "block";
      document.getElementById("bookingFormContainer").classList.add("hidden");

      document.querySelectorAll(".calendar-day").forEach(c => c.classList.remove("selected"));
      cell.classList.add("selected");

      fetchAvailability(formatted);
    };

    grid.appendChild(cell);
  }
}

async function fetchAvailability(date) {
  const output = document.getElementById("availability_output");
  const slotBox = document.getElementById("timeSlots");

  if (output) output.innerHTML = "<p class='text-sm text-gray-500 animate-pulse'>Checking open slots...</p>";
  slotBox.innerHTML = "";

  try {
    // ⭐ URL FIXED: Points to your active dynamic database endpoint
    const res = await fetch(`https://fastapi-production-d14c.up.railway.app/availability?date=${date}`);
    if (!res.ok) throw new Error("Could not download availability configurations.");


    
    const available24HourSlots = await res.json();
    if (output) output.innerHTML = "";

    if (available24HourSlots.length === 0) {
      slotBox.innerHTML = "<p class='text-sm text-red-500 font-semibold p-2'>No open slots available for this date.</p>";
      return;
    }

    const selectedDateObj = window.selectedDateObj;
    const now = new Date();
    const isToday =
      selectedDateObj.getFullYear() === now.getFullYear() &&
      selectedDateObj.getMonth() === now.getMonth() &&
      selectedDateObj.getDate() === now.getDate();

    const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    available24HourSlots.forEach(slot24 => {
      const slotStd = toStandardTime(slot24);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "time-slot-btn";
      btn.textContent = slotStd;

      const slotDateObj = new Date(selectedDateObj);
      const [slotH, slotM] = slot24.split(":").map(Number);
      slotDateObj.setHours(slotH, slotM, 0, 0);

      /* ⭐ Disable slot if it's less than 1 hour from now */
      if (isToday && slotDateObj < oneHourFromNow) {
        btn.classList.add("disabled-slot");
        btn.style.opacity = "0.35";
        btn.style.pointerEvents = "none";
        slotBox.appendChild(btn);
        return;
      }

      btn.onclick = () => {
        window.selectedSlot = slotStd;
        window.bookedSlot24 = slot24;

        document.getElementById("slotError").style.display = "none";

        document.querySelectorAll(".time-slot-btn")
          .forEach(b => b.classList.remove("time-slot-btn-selected"));

        btn.classList.add("time-slot-btn-selected");

        document.getElementById("bookingFormContainer").classList.remove("hidden");
      };

      slotBox.appendChild(btn);
    });
  } catch (err) {
    console.error("Availability mapping pipeline crash:", err);
    if (output) output.innerHTML = "<p class='text-sm text-red-500'>Failed to load schedule variations.</p>";
  }
}

function buildServicesPayload() {
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

  return services;
}

function buildFinalPayload() {
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
  renderCalendar(window.calYear, window.calMonth);

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

  const form = document.getElementById("booking-form");

  form.onsubmit = async e => {
    e.preventDefault();

    const anyService =
      document.getElementById("svc_gutter_cleaning").checked ||
      document.getElementById("svc_pressure_washing").checked ||
      document.getElementById("svc_gutter_brightening").checked ||
      document.getElementById("svc_soft_wash").checked;

    if (!anyService) return popup("Please select a service.");
    if (!window.selectedDate || !window.selectedSlot) return popup("Please select a date and time.");
    if (!form.name.value.trim() || !form.phone.value.trim() || !form.service_address.value.trim())
      return popup("Please fill out contact information.");

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Processing Booking...";
    }

    const payload = buildFinalPayload();

      try {
      // ⭐ URL FIXED: Directs request tracking metrics safely to your specific container routing endpoint
      const res = await fetch("https://fastapi-production-d14c.up.railway.app/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.detail && data.detail.includes("already been booked")) {
          popup("This time slot has already been booked.");
          await fetchAvailability(window.selectedDate);
          window.selectedSlot = null;
          document.getElementById("bookingFormContainer").classList.add("hidden");
          return;
        }
        popup("Error creating booking: " + data.detail);
        return;
      }

      popup("Booking created successfully!");

      updatePersistentSummary(window.selectedDate, window.selectedSlot);

      // Force calendar to download the fresh database slots configuration layout instantly
      await fetchAvailability(window.selectedDate);

    } catch (err) {
      popup("Network or server error — check console.");
    } finally {
      // Re-enable button control context parameters safely
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Book Appointment";
      }
    }
  };
});