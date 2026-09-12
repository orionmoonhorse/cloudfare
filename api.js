// api.js — unified booking API

// -------------------------------
// SUBMIT UNIFIED BOOKING
// -------------------------------
async function submitUnifiedBooking(payload) {
  const res = await fetch("https://fastapi-production-d14c.up.railway.app/booking/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    alert("Error creating booking: " + err);
    return null;
  }

  return await res.json();
}

