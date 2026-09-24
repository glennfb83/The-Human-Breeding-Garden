const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const keys = new Set();

let last = 0;
let step = 0;
let day = 1;
let mins = 480;
let selected = -1;

const player = { x: 500, y: 325, r: 13 };

const state = {
  seeds: 4,
  pollen: 3,
  fruit: 0,
  met: new Set(),
  genes: new Set(),
};

const notes = [
  'Walk toward a glowing signal. The garden reveals itself one step at a time.',
  'Stand close and press E (or Space) to open a conversation. Trust is a resource.',
  'Offer a sun seed to a gardener. Meet two people to unlock the breeding lab.',
  'The lab is awake. Cross-pollinate genes with R, then wander for more signals.'
];

const people = [
  { name: 'Big P', x: 150, y: 120, color: '#d2ef73', mood: 'laughing', trust: 12, gene: 'citrus', i: 0 },
  { name: 'Max', x: 340, y: 100, color: '#ed755d', mood: 'bright-eyed', trust: 8, gene: 'velvet', i: 1 },
  { name: 'Leif', x: 755, y: 125, color: '#70b7bd', mood: 'patient', trust: 18, gene: 'moss', i: 2 },
  { name: 'GlennFB', x: 875, y: 285, color: '#d2ef73', mood: 'broadcasting', trust: 5, gene: 'stately', i: 3 },
  { name: 'Cling22', x: 150, y: 475, color: '#70b7bd', mood: 'curious', trust: 14, gene: 'clover', i: 4 },
  { name: 'Benjamin Netanyahu', x: 385, y: 505, color: '#ed755d', mood: 'strategic', trust: 4, gene: 'ember', i: 5 },
  { name: 'Charlie Kirk', x: 665, y: 500, color: '#d2ef73', mood: 'restless', trust: 7, gene: 'honey', i: 6 },
  { name: 'IceMan', x: 920, y: 180, color: '#70b7bd', mood: 'cooling off', trust: 21, gene: 'frost', i: 7 },
  { name: 'FireMan', x: 810, y: 390, color: '#ed755d', mood: 'warm signal', trust: 10, gene: 'flame', i: 8 },
];

const terrain = [
  { x: 75, y: 245, w: 175, h: 38 },
  { x: 285, y: 205, w: 105, h: 25 },
  { x: 570, y: 245, w: 185, h: 34 },
  { x: 730, y: 70, w: 115, h: 22 },
  { x: 420, y: 390, w: 190, h: 28 },
  { x: 60, y: 360, w: 110, h: 25 },
  { x: 860, y: 180, w: 100, h: 24 },
];

const ui = {
  day: document.querySelector('#day'),
  time: document.querySelector('#time'),
  lesson: document.querySelector('#lesson'),
  lessonBar: document.querySelector('#lessonBar'),
  lessonCount: document.querySelector('#lessonCount'),
  contacts: document.querySelector('#contacts'),
  conversation: document.querySelector('#conversation'),
  seeds: document.querySelector('#seeds'),
  pollen: document.querySelector('#pollen'),
  fruit: document.querySelector('#fruit'),
  genePool: document.querySelector('#genePool'),
  labText: document.querySelector('#labText'),
  log: document.querySelector('#log'),
};

function logMessage(text) {
  const p = document.createElement('p');
  p.textContent = text;
  ui.log.prepend(p);
  while (ui.log.children.length > 5) {
    ui.log.lastChild.remove();
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearest() {
  let best = null;
  let bestDist = Infinity;
  for (const person of people) {
    const d = distance(player, person);
    if (d < bestDist) {
      bestDist = d;
      best = person;
    }
  }
  return best && bestDist < 65 ? best : null;
}

function tutorial(nextStep) {
  if (nextStep > step) {
    step = Math.min(nextStep, 3);
    ui.lesson.textContent = notes[step - 1] || notes[0];
    ui.lessonBar.style.width = `${(step + 1) * 25}%`;
    ui.lessonCount.textContent = `NOTE ${step + 1} OF 4`;
  }
}

function updateStats() {
  ui.seeds.textContent = state.seeds;
  ui.pollen.textContent = state.pollen;
  ui.fruit.textContent = state.fruit;
  ui.day.textContent = String(day).padStart(2, '0');
  ui.time.textContent = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

  const geneList = [...state.genes];
  if (!geneList.length) {
    ui.genePool.innerHTML = '<span class="gene">No gene samples yet</span>';
    return;
  }

  ui.genePool.innerHTML = geneList
    .map((gene) => `<span class="gene ready">${gene}</span>`)
    .join('');
}

function renderContacts() {
  ui.contacts.innerHTML = people
    .map((person) => `
      <button class="contact ${selected === person.i ? 'selected' : ''}" data-i="${person.i}">
        <i class="dot" style="border-color:${person.color}"></i>
        <span class="person">${person.name}</span>
        <br>
        <span class="mood">${state.met.has(person.i) ? person.mood : 'unmapped signal'}</span>
        <span class="trust">${state.met.has(person.i) ? person.trust : '—'}</span>
      </button>
    `)
    .join('');

  document.querySelectorAll('.contact').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.i);
      selected = index;
      const person = people[index];
      player.x = person.x - 45;
      player.y = person.y;
      ui.conversation.textContent = `${person.name} is nearby. Press E to speak.`;
      renderContacts();
    });
  });
}

function speak(person = nearest()) {
  if (!person) {
    ui.conversation.textContent = 'No one is close enough. Follow a glowing signal and try again.';
    return;
  }

  selected = person.i;
  state.met.add(person.i);
  state.genes.add(person.gene);

  const words = {
    laughing: 'Hey there! Your timing is excellent. Want to trade a little sunshine?',
    'bright-eyed': 'I noticed you from across the garden. Curiosity is a fine introduction.',
    patient: 'Take your time. The quiet paths usually lead to the best discoveries.',
    'broadcasting': 'Signal received. I have a story, a seed, and a very strange hypothesis.',
    curious: 'You look like someone who asks good questions. What are you growing?',
    strategic: 'A thoughtful exchange is worth more than a crowded harvest.',
    restless: 'The shade is lovely today. Sit a while and listen to the leaves.',
    'cooling off': 'There you are! Every garden needs a little heat and a friendly hello.',
    'warm signal': 'The air is alive today. I can share this spark before I move on.'
  };

  const line = words[person.mood] || 'Hello, traveller. Welcome to the garden.';
  const offered = state.seeds > 0;

  if (offered) {
    state.seeds -= 1;
    person.trust += 7;
    logMessage(`You spoke with ${person.name} and offered a sun seed.`);
  } else {
    logMessage(`${person.name} shared a quiet moment with you.`);
  }

  ui.conversation.innerHTML = `${person.name}: “${line}”`;
  tutorial(2);
  updateStats();
  renderContacts();
}

function breed() {
  if (state.genes.size < 2) {
    logMessage('The lab needs two different gene samples. Speak to more gardeners.');
    ui.labText.textContent = 'Meet two gardeners, then press R to cross-pollinate their plants.';
    return;
  }

  if (state.pollen < 1) {
    logMessage('The pollen drawer is empty. Find another signal.');
    ui.labText.textContent = 'The pollen drawer is empty. Find another signal to refill your lab.';
    return;
  }

  const genes = [...state.genes];
  const left = genes[0];
  const right = genes[1] || left;

  state.pollen -= 1;
  state.fruit += 1;

  const hybrid = `${left}-${right}`;
  state.genes.clear();
  state.genes.add(hybrid);

  logMessage(`BREED COMPLETE: ${left} and ${right} became a hybrid fruit.`);
  ui.labText.textContent = `Hybridized ${left} and ${right}. Your greenhouse now holds ${hybrid}.`;
  tutorial(3);
  updateStats();
}

function drawBackground(t) {
  ctx.fillStyle = '#213732';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2c4a41';
  for (let x = 0; x < W; x += 46) {
    for (let y = 0; y < H; y += 43) {
      ctx.beginPath();
      ctx.arc(x + Math.sin((y + t * 0.0002) * 2) * 3, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = '#416055';
  ctx.setLineDash([2, 11]);
  ctx.strokeRect(22, 22, W - 44, H - 44);
  ctx.setLineDash([]);
}

function drawPerson(person, t) {
  const near = distance(player, person) < 65;
  ctx.save();
  ctx.shadowColor = person.color;
  ctx.shadowBlur = near ? 14 : 4;
  ctx.fillStyle = person.color;
  ctx.beginPath();
  ctx.arc(person.x, person.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#dfe6c6';
  ctx.font = '11px DM Mono';
  ctx.textAlign = 'center';
  ctx.fillText(person.name, person.x, person.y - 18);

  if (near) {
    ctx.strokeStyle = person.color;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(person.x, person.y, 27 + Math.sin(t * 0.006) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function draw() {
  drawBackground(performance.now());
  terrain.forEach((r) => {
    ctx.fillStyle = '#31554a';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  });

  people.forEach((person) => drawPerson(person, performance.now()));

  ctx.fillStyle = '#ed755d';
  ctx.shadowColor = '#ed755d';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f8d6ae';
  ctx.font = '10px DM Mono';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', player.x, player.y + 31);
}

function move(dt) {
  let ax = 0;
  let ay = 0;

  if (keys.has('w') || keys.has('arrowup')) ay -= 1;
  if (keys.has('s') || keys.has('arrowdown')) ay += 1;
  if (keys.has('a') || keys.has('arrowleft')) ax -= 1;
  if (keys.has('d') || keys.has('arrowright')) ax += 1;

  if (ax || ay) {
    const n = Math.hypot(ax, ay) || 1;
    player.x = Math.max(35, Math.min(W - 35, player.x + (ax / n) * 2.7 * dt));
    player.y = Math.max(35, Math.min(H - 35, player.y + (ay / n) * 2.7 * dt));
    mins += dt * 0.2;

    if (mins >= 1440) {
      mins -= 1440;
      day += 1;
    }

    if (step < 1) tutorial(1);

    const close = nearest();
    if (close) {
      ui.conversation.textContent = `${close.name} is nearby. Press E to speak.`;
    }
  }
}

function loop(timestamp) {
  const dt = Math.min((timestamp - last) / 16.67, 3) || 1;
  last = timestamp;
  move(dt);
  draw();
  requestAnimationFrame(loop);
}

function handleKeyEvent(event) {
  const key = event.key.toLowerCase();
  keys.add(key);

  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    event.preventDefault();
  }

  if (key === 'e' || key === ' ') {
    const dear = nearest();
    if (dear) {
      speak(dear);
    }
  }

  if (key === 'r') {
    breed();
  }
}

document.addEventListener('keydown', handleKeyEvent);
document.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

ui.lesson.textContent = notes[0];
ui.lessonBar.style.width = '25%';
ui.lessonCount.textContent = 'NOTE 1 OF 4';
updateStats();
renderContacts();
logMessage('The garden is listening. Speak kindly; trust grows slowly.');
logMessage('Speak kindly; trust grows slowly.');
requestAnimationFrame(loop);
