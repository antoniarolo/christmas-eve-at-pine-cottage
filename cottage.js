"use strict";

const find = (selector) => document.querySelector(selector);
const all = (selector) => [...document.querySelectorAll(selector)];
const svg = (tag, attributes, parent) => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  parent.append(element);
  return element;
};

const positions = [
  [436, 131], [420, 180], [470, 187], [386, 229], [448, 238], [502, 239],
  [345, 292], [411, 300], [481, 303], [548, 301], [375, 364], [509, 370]
];
const names = { cranberry: "Cranberry", gold: "Gold", cane: "Candy cane", snowflake: "Snowflake" };
const initial = () => ({ ornaments: positions.map(() => null), lights: false, star: false, fire: false, snow: true });
const key = "pine-cottage-v1";
let state = initial();
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved) {
    for (const name of ["lights", "star", "fire", "snow"]) {
      if (typeof saved[name] === "boolean") state[name] = saved[name];
    }
    if (Array.isArray(saved.ornaments)) {
      state.ornaments = positions.map((_, i) => Object.hasOwn(names, saved.ornaments[i]) ? saved.ornaments[i] : null);
    }
  }
} catch {
  // The cottage works in memory when browser storage is unavailable.
}

let selected = "cranberry";
const history = [];
const spots = positions.map(([x, y], index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "spot";
  button.style.left = (x / 9) + "%";
  button.style.top = (y / 5.55) + "%";
  button.addEventListener("click", () => {
    const previous = state.ornaments[index];
    history.push({ index, previous });
    state.ornaments[index] = previous ? null : selected;
    render();
    const full = state.ornaments.every(Boolean);
    say(previous ? names[previous] + " ornament taken down." :
      full ? "Every branch has a little Christmas. Your tree is fully decorated!" :
      names[selected] + " ornament hung on the tree.");
  });
  find("#spots").append(button);
  return button;
});

function drawRoomDetails() {
  const needles = find("#needles");
  for (let i = 0; i < 470; i++) {
    const x = 218 + (i * 79.31 % 448);
    const y = 75 + (i * 37.93 % 360);
    const direction = x < 441 ? -1 : 1;
    svg("path", {
      d: "M" + x + " " + y + "l" + (direction * (9 + i % 14)) + " " + (3 + i % 8),
      stroke: i % 3 === 0 ? "#a1a873" : "#0f3027",
      "stroke-width": 1 + i % 2,
      opacity: i % 3 === 0 ? .26 : .37
    }, needles);
  }

  const lights = find("#lights");
  const rows = [[397, 484, 148], [362, 520, 205], [320, 563, 265], [285, 604, 329], [247, 642, 391]];
  const colors = ["#ffcf75", "#ff9b85", "#fff2ad", "#a9dbb3"];
  rows.forEach(([left, right, height], row) => {
    svg("path", {
      d: "M" + left + " " + height + "Q442 " + (height + 34) + " " + right + " " + height,
      fill: "none", stroke: "#a0a770", opacity: .72, "stroke-width": 1.8
    }, lights);
    for (let i = 0; i <= row + 6; i++) {
      const t = i / (row + 6);
      const x = left + (right - left) * t;
      const y = height + 68 * t * (1 - t);
      const color = colors[(i + row) % colors.length];
      svg("circle", { cx: x, cy: y, r: 10, fill: color, opacity: .16 }, lights);
      svg("circle", { cx: x, cy: y, r: 3.3, fill: color }, lights);
    }
  });

  for (let i = 0; i < 31; i++) {
    const snow = svg("circle", {
      class: "snowflake", cx: 45 + i * 38.9 % 195, cy: 68 + i * 63.3 % 219,
      r: 1 + i % 4 * .5, fill: "#fff3dc", opacity: .37 + i % 5 * .12
    }, find("#snowflakes"));
    snow.style.setProperty("--speed", (12 + i % 9) + "s");
    snow.style.setProperty("--delay", (-i * 1.17) + "s");
  }
}

function drawOrnament(kind, x, y, parent) {
  const group = svg("g", { transform: "translate(" + x + " " + y + ")" }, parent);
  if (kind === "cane") {
    const path = "M-3 10L5-7C10-17-3-20-7-11";
    svg("path", { d: path, fill: "none", stroke: "#fff0d5", "stroke-width": 7, "stroke-linecap": "round" }, group);
    svg("path", { d: path, fill: "none", stroke: "#bd5558", "stroke-width": 7, "stroke-dasharray": "4 4" }, group);
    return;
  }
  if (kind === "snowflake") {
    for (const angle of [0, 60, 120, 180, 240, 300]) {
      svg("path", {
        d: "M0 0V-13M-4-8 0-5 4-8", transform: "rotate(" + angle + ")",
        stroke: "#d9edf0", "stroke-width": 1.9, "stroke-linecap": "round", fill: "none"
      }, group);
    }
    return;
  }
  const gold = kind === "gold";
  svg("path", { d: "M0-15v-6", stroke: "#d3b585", "stroke-width": 1.4 }, group);
  svg("circle", { cy: 2, r: 12.5, fill: gold ? "#c38a37" : "#9d4051", opacity: .8, transform: "translate(1 2)" }, group);
  svg("circle", { r: 12, fill: gold ? "#ddac58" : "#be5e6c", stroke: gold ? "#f3cf84" : "#e98b90", "stroke-width": 1.2 }, group);
  svg("rect", { x: -4, y: -15, width: 8, height: 5, rx: 1, fill: "#eac278" }, group);
  svg("ellipse", { cx: -4.3, cy: -4.1, rx: 3.5, ry: 2.4, fill: "#fff2d3", opacity: .73, transform: "rotate(-23)" }, group);
  svg("path", { d: "M-9 4q9 6 18 0", stroke: "#ffdfac", "stroke-width": 1.3, fill: "none", opacity: .66 }, group);
}

function render() {
  const artwork = find("#ornaments");
  artwork.replaceChildren();
  const count = state.ornaments.filter(Boolean).length;
  spots.forEach((button, index) => {
    const kind = state.ornaments[index];
    button.classList.toggle("filled", Boolean(kind));
    button.setAttribute("aria-label", kind
      ? "Remove " + names[kind] + " ornament from spot " + (index + 1)
      : "Hang " + names[selected] + " ornament at spot " + (index + 1));
    if (kind) drawOrnament(kind, ...positions[index], artwork);
  });
  if (state.star) {
    svg("circle", { cx: 441, cy: 62, r: 66, fill: "url(#glow)" }, artwork);
    svg("path", {
      d: "M441 29l8 19 21 1-16 14 5 21-18-11-18 11 5-21-16-14 21-1Z",
      fill: "#f2c56d", stroke: "#fff1af", "stroke-width": 2.6, "stroke-linejoin": "round"
    }, artwork);
  }
  find("#count").textContent = count + " / " + positions.length + " ornaments";
  find("#progress").value = count;
  find("#undo").disabled = history.length === 0;
  find("#lights").classList.toggle("off", !state.lights);
  find("#snowflakes").classList.toggle("off", !state.snow);
  find("#flames").classList.toggle("off", !state.fire);
  find("#flames").classList.toggle("active", state.fire);
  find("#fireglow").classList.toggle("active", state.fire);

  for (const button of all("[data-kind]")) {
    button.setAttribute("aria-pressed", button.dataset.kind === selected);
  }
  for (const button of all("[data-action][aria-pressed]")) {
    button.setAttribute("aria-pressed", state[button.dataset.action]);
  }
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // A blocked or full storage area should not interrupt decorating.
  }
}

function say(message) {
  find("#status").textContent = message;
}

for (const button of all("[data-kind]")) {
  button.addEventListener("click", () => {
    selected = button.dataset.kind;
    render();
    say(names[selected] + " selected. Choose a gold dot on the tree.");
  });
}

const announcements = {
  lights: ["The tree lights are off.", "The tree lights are twinkling."],
  star: ["The star is back in its box.", "A golden star crowns the tree."],
  fire: ["The fireplace has gone dark.", "The fire is crackling in the hearth."],
  snow: ["The snowfall has paused.", "Snow drifts past the window."]
};

for (const button of all("[data-action]")) {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "gift") {
      find("#gift-dialog").showModal();
      return;
    }
    state[action] = !state[action];
    render();
    say(announcements[action][Number(state[action])]);
  });
}

find("#undo").addEventListener("click", () => {
  const { index, previous } = history.pop();
  state.ornaments[index] = previous;
  render();
  say("Last ornament change undone.");
});

find("#reset").addEventListener("click", () => {
  state = initial();
  selected = "cranberry";
  history.length = 0;
  render();
  say("The cottage is ready for a fresh Christmas Eve.");
});

drawRoomDetails();
render();
