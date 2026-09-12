// -------------------------------
// GLOBAL ESTIMATOR STATE
// -------------------------------
const estimatorState = {
  gutter_cleaning: { ran: false, min: 0, max: 0 },
  gutter_brightening: { ran: false, min: 0, max: 0 },
  pressure_washing: { ran: false, min: 0, max: 0 },
  soft_wash: { ran: false, min: 0, max: 0 }
};

// -------------------------------
// CHECKBOX DEFAULT PRICE HANDLERS
// -------------------------------
function handleCheckboxDefaults() {

  // Gutter Cleaning
  if (document.getElementById("svc_gutter_cleaning").checked) {
    estimatorState.gutter_cleaning.min = 99;
    estimatorState.gutter_cleaning.max = 149;
    document.getElementById("range_gutter_cleaning").innerText = "$99–$149";
  } else {
    estimatorState.gutter_cleaning.min = 0;
    estimatorState.gutter_cleaning.max = 0;
    estimatorState.gutter_cleaning.ran = false;
    document.getElementById("range_gutter_cleaning").innerText = "";
  }

  // Pressure Washing
  if (document.getElementById("svc_pressure_washing").checked) {
    estimatorState.pressure_washing.min = 149;
    estimatorState.pressure_washing.max = 249;
    document.getElementById("range_pressure_washing").innerText = "$149–$249";
  } else {
    estimatorState.pressure_washing.min = 0;
    estimatorState.pressure_washing.max = 0;
    estimatorState.pressure_washing.ran = false;
    document.getElementById("range_pressure_washing").innerText = "";
  }

  // Gutter Brightening
  if (document.getElementById("svc_gutter_brightening").checked) {
    estimatorState.gutter_brightening.min = 60;
    estimatorState.gutter_brightening.max = 120;
    document.getElementById("range_gutter_brightening").innerText = "$60–$120";
    document.getElementById("brightening_card").style.display = "block";
  } else {
    estimatorState.gutter_brightening.min = 0;
    estimatorState.gutter_brightening.max = 0;
    estimatorState.gutter_brightening.ran = false;
    document.getElementById("range_gutter_brightening").innerText = "";
    document.getElementById("brightening_card").style.display = "none";
  }

  // Soft Wash
  if (document.getElementById("svc_soft_wash").checked) {
    estimatorState.soft_wash.min = 149;
    estimatorState.soft_wash.max = 299;
    document.getElementById("range_soft_wash").innerText = "$149–$299";
    document.getElementById("softwash_card").style.display = "block";
  } else {
    estimatorState.soft_wash.min = 0;
    estimatorState.soft_wash.max = 0;
    estimatorState.soft_wash.ran = false;
    document.getElementById("range_soft_wash").innerText = "";
    document.getElementById("softwash_card").style.display = "none";
  }

  updateTotalDisplay();
}

// -------------------------------
// GUTTER CLEANING ESTIMATOR
// -------------------------------
function calculateEstimate() {
  if (!document.getElementById("svc_gutter_cleaning").checked) {
    alert("Please check the Gutter Cleaning box before running the estimate.");
    return;
  }

  const stories = document.getElementById("stories_est").value;
  const debris = document.getElementById("debris_est").value;
  const lfInput = document.getElementById("feet_est").value;

  let min, max;

  if (!lfInput) {
    min = 99;
    max = 199;
    document.getElementById("estimateResult_est").innerText =
      "Estimated Price: $99–$199";
  } else {
    const feet = Number(lfInput);
    let base = stories === "1" ? 99 : 149;

    if (debris === "medium") base += 40;
    if (debris === "heavy") base += 80;
    if (feet > 120) base += (feet - 120) * 0.5;

    const exact = Math.round(base);
    min = exact;
    max = exact;

    document.getElementById("estimateResult_est").innerText =
      `Estimated Price: $${exact}`;
  }

  estimatorState.gutter_cleaning.ran = true;
  estimatorState.gutter_cleaning.min = min;
  estimatorState.gutter_cleaning.max = max;

  updateTotalDisplay();
}

// -------------------------------
// PRESSURE WASHING ESTIMATOR
// -------------------------------
function calculatePWEstimate() {
  if (!document.getElementById("svc_pressure_washing").checked) {
    alert("Please check the Pressure Washing box before running the estimate.");
    return;
  }

  const surface = document.getElementById("pw_surface").value;
  const sqftInput = document.getElementById("pw_sqft").value;
  const buildup = document.getElementById("pw_buildup").value;

  let min, max;

  if (!sqftInput) {
    min = 99;
    max = 149;
    document.getElementById("pw_estimateResult").innerText =
      "Estimated Price: $99–$149";
  } else {
    const sqft = Number(sqftInput);

    let baseRate = {
      driveway: 0.12,
      sidewalk: 0.10,
      patio: 0.14,
      pooldeck: 0.16
    }[surface];

    if (buildup === "medium") baseRate += 0.03;
    if (buildup === "heavy") baseRate += 0.06;

    let estimate = sqft * baseRate;
    if (estimate < 99) estimate = 99;

    const exact = Math.round(estimate);
    min = exact;
    max = exact;

    document.getElementById("pw_estimateResult").innerText =
      `Estimated Price: $${exact}`;
  }

  estimatorState.pressure_washing.ran = true;
  estimatorState.pressure_washing.min = min;
  estimatorState.pressure_washing.max = max;

  updateTotalDisplay();
}

// -------------------------------
// GUTTER BRIGHTENING ESTIMATOR
// -------------------------------
function calculateBrightening() {
  if (!document.getElementById("svc_gutter_brightening").checked) {
    alert("Please check the Gutter Brightening box before running the estimate.");
    return;
  }

  const height = document.getElementById("bright_height").value;
  const lfInput = document.getElementById("bright_feet").value;

  let min, max;

  if (!lfInput) {
    min = 60;
    max = 120;
    document.getElementById("bright_result").innerText =
      "Estimated Price: $60–$120";
  } else {
    const feet = Number(lfInput);
    let base = height === "1" ? 60 : 80;

    if (feet > 120) base += (feet - 120) * 0.25;

    const exact = Math.round(base);
    min = exact;
    max = exact;

    document.getElementById("bright_result").innerText =
      `Estimated Price: $${exact}`;
  }

  estimatorState.gutter_brightening.ran = true;
  estimatorState.gutter_brightening.min = min;
  estimatorState.gutter_brightening.max = max;

  updateTotalDisplay();
}

// -------------------------------
// SOFT WASH ESTIMATOR
// -------------------------------
function calculateSoftWash() {
  if (!document.getElementById("svc_soft_wash").checked) {
    alert("Please check the Soft Wash box before running the estimate.");
    return;
  }

  const sqftInput = document.getElementById("soft_sqft").value;
  const buildup = document.getElementById("soft_buildup").value;

  let min, max;

  if (!sqftInput) {
    min = 149;
    max = 299;
    document.getElementById("soft_result").innerText =
      "Estimated Price: $149–$299";
  } else {
    let rate = 0.12;
    if (buildup === "medium") rate += 0.03;
    if (buildup === "heavy") rate += 0.06;

    let estimate = Number(sqftInput) * rate;
    if (estimate < 149) estimate = 149;

    const exact = Math.round(estimate);
    min = exact;
    max = exact;

    document.getElementById("soft_result").innerText =
      `Estimated Price: $${exact}`;
  }

  estimatorState.soft_wash.ran = true;
  estimatorState.soft_wash.min = min;
  estimatorState.soft_wash.max = max;

  updateTotalDisplay();
}

// -------------------------------
// TOTAL ESTIMATE CALCULATOR
// -------------------------------
function calculateTotalEstimate() {
  let totalMin = 0;
  let totalMax = 0;

  if (document.getElementById("svc_gutter_cleaning").checked) {
    totalMin += estimatorState.gutter_cleaning.min;
    totalMax += estimatorState.gutter_cleaning.max;
  }

  if (document.getElementById("svc_gutter_brightening").checked) {
    totalMin += estimatorState.gutter_brightening.min;
    totalMax += estimatorState.gutter_brightening.max;
  }

  if (document.getElementById("svc_pressure_washing").checked) {
    totalMin += estimatorState.pressure_washing.min;
    totalMax += estimatorState.pressure_washing.max;
  }

  if (document.getElementById("svc_soft_wash").checked) {
    totalMin += estimatorState.soft_wash.min;
    totalMax += estimatorState.soft_wash.max;
  }

  return { totalMin, totalMax };
}

// -------------------------------
// UPDATE TOTAL DISPLAY (ALWAYS SHOW TOTALS)
// -------------------------------
function updateTotalDisplay() {
  const output = document.getElementById("total_result");
  const { totalMin, totalMax } = calculateTotalEstimate();

  if (totalMin === 0 && totalMax === 0) {
    output.innerText = "Select services to see your total.";
    return;
  }

  output.innerText = `Total Estimated Price: $${totalMin}–$${totalMax}`;
}

// -------------------------------
// ATTACH CHECKBOX LISTENERS
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("svc_gutter_cleaning").onchange = handleCheckboxDefaults;
  document.getElementById("svc_gutter_brightening").onchange = handleCheckboxDefaults;
  document.getElementById("svc_pressure_washing").onchange = handleCheckboxDefaults;
  document.getElementById("svc_soft_wash").onchange = handleCheckboxDefaults;
});