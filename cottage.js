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
const initial = () => ({ journey: 0, ornaments: positions.map(() => null), lights: false, star: false, fire: false, snow: true });
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
    if (Number.isInteger(saved.journey) && saved.journey >= 0 && saved.journey <= 5) {
      state.journey = saved.journey;
    } else if (state.ornaments.some(Boolean) || state.lights || state.star || state.fire) {
      state.journey = 5;
    }
  }
} catch {
  // The cottage works in memory when browser storage is unavailable.
}

let selected = "cranberry";
const history = [];
const restX = 246;
const floorY = 484;
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let animationFrame = 0;
let carriedSpot = null;
let journeyRun = null;

const spots = positions.map(([x, y], index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "spot";
  button.style.left = (x / 9) + "%";
  button.style.top = (y / 5.55) + "%";
  button.addEventListener("click", () => {
    const previous = state.ornaments[index];
    stopDecorating();
    history.push({ index, previous });
    state.ornaments[index] = previous ? null : selected;
    if (!previous && !motionPreference.matches) hangOrnament(index, selected);
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

function poseDecorator(x, y, handX, handY) {
  find("#decorator").setAttribute("transform", "translate(" + x + " " + y + ")");
  const elbowX = (12 + handX) / 2 + 9;
  const elbowY = (-111 + handY) / 2 + 10;
  const sleeve = "M12 -111Q" + elbowX + " " + elbowY + " " + handX + " " + handY;
  find("#decorator-sleeve").setAttribute("d", sleeve);
  find("#decorator-arm").setAttribute("d", sleeve);
  find("#decorator-hand").setAttribute("cx", handX);
  find("#decorator-hand").setAttribute("cy", handY);
}

function stopDecorating() {
  cancelAnimationFrame(animationFrame);
  carriedSpot = null;
  poseDecorator(restX, floorY, 24, -78);
  find("#carried-ornament").replaceChildren();
  find("#step-ladder").replaceChildren();
}

function hangOrnament(index, kind) {
  const [targetX, targetY] = positions[index];
  const standingX = targetX - 50;
  const standingY = Math.min(floorY, targetY + 157);
  const ladder = find("#step-ladder");
  if (standingY < floorY) {
    const height = floorY - standingY;
    const rails = "M" + (standingX - 42) + " " + floorY + "l21 " + -height
      + "h43l22 " + height + "M" + (standingX + 22) + " " + standingY
      + "l38 " + height;
    svg("path", { d: rails, stroke: "#372820", "stroke-width": 10 }, ladder);
    svg("path", { d: rails, stroke: "#a87850", "stroke-width": 6 }, ladder);
    for (let step = 27; step < height - 9; step += 27) {
      const halfWidth = 22 + 21 * step / height;
      svg("path", {
        d: "M" + (standingX - halfWidth) + " " + (standingY + step) + "h" + 2 * halfWidth,
        stroke: "#c09465", "stroke-width": 5
      }, ladder);
    }
    ladder.setAttribute("opacity", 0);
  }

  carriedSpot = index;
  const held = find("#carried-ornament");
  drawOrnament(kind, 0, 0, held);
  const start = performance.now();
  const ease = (value) => {
    const t = Math.max(0, Math.min(value, 1));
    return t * t * (3 - 2 * t);
  };
  const animate = (now) => {
    const elapsed = now - start;
    const walk = ease(elapsed / 400) * (1 - ease((elapsed - 1130) / 420));
    const climb = ease((elapsed - 250) / 330) * (1 - ease((elapsed - 940) / 340));
    const reach = ease((elapsed - 530) / 260) * (1 - ease((elapsed - 830) / 180));
    const x = restX + (standingX - restX) * walk;
    const y = floorY + (standingY - floorY) * climb;
    const handX = 24 + (targetX - standingX - 24) * reach;
    const handY = -78 + (targetY - standingY + 78) * reach;
    poseDecorator(x, y, handX, handY);
    ladder.setAttribute("opacity", ease(elapsed / 200) * (1 - ease((elapsed - 1250) / 270)));
    if (carriedSpot !== null) {
      held.setAttribute("transform", "translate(" + (x + handX) + " " + (y + handY) + ")");
      if (elapsed >= 790) {
        carriedSpot = null;
        held.replaceChildren();
        render();
      }
    }
    if (elapsed < 1550) animationFrame = requestAnimationFrame(animate);
    else stopDecorating();
  };
  animationFrame = requestAnimationFrame(animate);
}

function render() {
  renderJourney();
  const artwork = find("#ornaments");
  artwork.replaceChildren();
  const count = state.ornaments.filter(Boolean).length;
  spots.forEach((button, index) => {
    const kind = state.ornaments[index];
    button.classList.toggle("filled", Boolean(kind));
    button.setAttribute("aria-label", kind
      ? "Remove " + names[kind] + " ornament from spot " + (index + 1)
      : "Hang " + names[selected] + " ornament at spot " + (index + 1));
    if (kind && index !== carriedSpot) drawOrnament(kind, ...positions[index], artwork);
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
  stopDecorating();
  const { index, previous } = history.pop();
  state.ornaments[index] = previous;
  render();
  say("Last ornament change undone.");
});

find("#reset").addEventListener("click", () => {
  const interrupted = journeyRun;
  journeyRun = null;
  if (interrupted) interrupted.forEach((animation) => animation.cancel());
  stopDecorating();
  state = initial();
  selected = "cranberry";
  history.length = 0;
  render();
  say("A fresh snowfall has covered the path to the grove.");
  find("#journey-action").focus({ preventScroll: true });
});

const journeyStages = [
  {
    id: "cut", scene: "THE PINE GROVE", chapter: "01 / THE PINE GROVE",
    title: "Find your tree", action: "Swing the axe",
    instruction: "There’s a little pine waiting in the clearing. Swing the axe three times to bring it down."
  },
  {
    id: "carry", scene: "THE PATH HOME", chapter: "02 / THE PATH HOME",
    title: "Bring it home", action: "Carry the tree inside",
    instruction: "Follow the snowy path to the glowing cottage with your freshly cut tree."
  },
  {
    id: "stand", scene: "INSIDE THE COTTAGE", chapter: "03 / INSIDE THE COTTAGE",
    title: "Stand it up", action: "Set up the tree",
    instruction: "The tree is inside. Lift it upright and settle the trunk into the stand."
  },
  { id: "decorate", scene: "INSIDE THE COTTAGE" }
];

const journeyMessages = ["A fresh snowfall has covered the path to the grove.", "One chop. The pine sways.", "Two chops. One more will do it.",
    "Timber! The tree is ready to carry.", "You made it inside. Time to set up the tree.",
    "The tree is in its stand. Pick an ornament to get started."];

function journeyStageIndex() {
  return Math.max(0, state.journey - 2);
}

function renderJourney() {
  const index = journeyStageIndex();
  const stage = journeyStages[index];
  const scene = find(".scene");
  scene.dataset.stage = stage.id;
  scene.setAttribute("aria-label", stage.scene);
  find("#scene-name").textContent = stage.scene;
  find("#notch").setAttribute("opacity", Math.min(state.journey / 2, 1));
  all("#journey-steps li").forEach((step, i) => {
    if (index === i) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });

  const decorating = stage.id === "decorate";
  find("#journey-panel").hidden = decorating;
  find("#decorate-panel").hidden = !decorating;
  const action = find("#journey-action");
  action.setAttribute("aria-disabled", journeyRun !== null);
  if (decorating) return;
  find("#journey-chapter").textContent = stage.chapter;
  find("#journey-title").textContent = stage.title;
  find("#journey-instruction").textContent = stage.instruction;
  action.textContent = stage.action;
  find("#chop-count").hidden = stage.id !== "cut";
  find("#chop-progress").hidden = stage.id !== "cut";
  find("#chop-count").textContent = state.journey + " / 3 chops";
  find("#chop-progress").value = state.journey;
}

function drawGrove() {
  const grove = find("#grove");
  for (let i = 0; i < 28; i++) {
    const height = 75 + i * 29 % 135;
    svg("use", {
      href: "#fir", x: -18 + i * 43 % 918, y: 389 - height + i % 5 * 5,
      width: height / 2, height, color: ["#3a6063", "#4d7275", "#294e54"][i % 3]
    }, grove);
  }
  for (let i = 0; i < 75; i++) {
    const snow = svg("circle", {
      class: "snowflake", cx: 3 + i * 67.3 % 895, cy: 7 + i * 79.1 % 528,
      r: 1 + i % 5 * .48, fill: "#f9f4df", opacity: .35 + i % 5 * .12
    }, find("#forest-snow"));
    snow.style.setProperty("--speed", (15 + i % 9) + "s");
    snow.style.setProperty("--delay", (-i * 1.27) + "s");
  }
}

find("#journey-action").addEventListener("click", async () => {
  if (journeyRun || state.journey === 5) return;
  const index = journeyStageIndex();
  const run = [];
  journeyRun = run;
  renderJourney();
  const animate = (selector, frames, duration, delay = 0) => {
    if (motionPreference.matches) return;
    run.push(find(selector).animate(frames, { duration, delay, fill: "both", easing: "ease-in-out" }));
  };

  if (index === 0) {
    animate("#axe-swing", [{ transform: "rotate(0deg)" }, { transform: "rotate(-108deg)" },
      { transform: "rotate(14deg)", offset: .72 }, { transform: "rotate(0deg)" }], 510);
    animate("#forest-walker", [{ transform: "translateX(0)" }, { transform: "translateX(-10px)" },
      { transform: "translateX(9px)", offset: .72 }, { transform: "translateX(0)" }], 510);
    animate("#chips", [{ opacity: 0 }, { opacity: 1 }, { opacity: 0, transform: "translate(15px,-24px)" }], 350, 360);
    const angle = state.journey === 2 ? 76 : 3 + state.journey * 3;
    animate("#forest-fall", [{ transform: "rotate(0deg)" }, { transform: "rotate(" + angle + "deg)" },
      { transform: state.journey === 2 ? "rotate(76deg)" : "rotate(0deg)" }], state.journey === 2 ? 960 : 300, 365);
  } else if (index === 1) {
    animate("#forest-fall", [{ transform: "rotate(76deg)" }, { transform: "translate(-63px,-51px) rotate(72deg)" }], 590);
    animate("#forest-trip", [{ transform: "translate(0,0)" }, { transform: "translate(140px,-6px)" },
      { transform: "translate(255px,-26px)" }, { transform: "translate(447px,-48px)", opacity: .3 }], 1500, 510);
    animate("#forest-walker", Array.from({ length: 13 }, (_, step) =>
      ({ transform: "translateY(" + (step % 2 ? -8 : 0) + "px)" })), 1470, 540);
  } else {
    animate("#cottage-tree", [{ transform: "translate(-12px,-30px) rotate(-39deg)" },
      { transform: "translate(-4px,-18px) rotate(5deg)", offset: .8 }, { transform: "rotate(0deg)" }], 1070);
    animate("#cottage-person", [{ transform: "translateX(83px)" }, { transform: "translateX(104px)", offset: .55 },
      { transform: "translateX(0)" }], 1220);
  }

  await Promise.allSettled(run.map((animation) => animation.finished));
  if (journeyRun !== run) return;
  run.forEach((animation) => animation.cancel());
  journeyRun = null;
  state.journey += 1;
  render();
  say(journeyMessages[state.journey]);
  if (state.journey === 5) find("[data-kind]").focus({ preventScroll: true });
});

drawRoomDetails();
drawGrove();
render();
say(journeyMessages[state.journey]);

