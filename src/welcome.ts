import { CHARACTERS, Character } from './characterData';

export function createWelcomeScreen(onStart: (playerName: string, character: Character) => void) {
  // Remove any existing welcome screen
  const existing = document.getElementById('welcome-screen');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'welcome-screen';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.background = 'rgba(174, 230, 245, 0.95)';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.zIndex = '1000';
  container.style.fontFamily = 'sans-serif';

  const title = document.createElement('h1');
  title.innerText = 'Time Riders';
  title.style.fontSize = '3rem';
  title.style.marginBottom = '1rem';
  container.appendChild(title);

  const nameLabel = document.createElement('label');
  nameLabel.innerText = 'Enter your name:';
  nameLabel.style.fontSize = '1.2rem';
  nameLabel.style.marginBottom = '0.5rem';
  nameLabel.htmlFor = 'player-name';
  container.appendChild(nameLabel);

  const nameInput = document.createElement('input');
  nameInput.id = 'player-name';
  nameInput.type = 'text';
  nameInput.style.fontSize = '1.2rem';
  nameInput.style.marginBottom = '1rem';
  nameInput.style.padding = '0.5rem';
  nameInput.style.borderRadius = '8px';
  nameInput.style.border = '1px solid #ccc';
  nameInput.setAttribute('aria-label', 'Player Name');

  // Load player name from localStorage or use default
  const savedName = localStorage.getItem('playerName');
  nameInput.value = savedName || 'Time Rider';
  container.appendChild(nameInput);

  // Helper to check if Start Game should be enabled
  function checkReady() {
    startBtn.disabled = !nameInput.value.trim() || !selectedChar;
    startBtn.setAttribute('aria-disabled', startBtn.disabled ? 'true' : 'false');
  }

  const charLabel = document.createElement('div');
  charLabel.innerText = 'Choose your character:';
  charLabel.style.fontSize = '1.2rem';
  charLabel.style.marginBottom = '0.5rem';
  container.appendChild(charLabel);

  const charGrid = document.createElement('div');
  charGrid.style.display = 'flex';
  charGrid.style.flexWrap = 'wrap';
  charGrid.style.justifyContent = 'center';
  charGrid.style.gap = '1.5rem';
  charGrid.style.marginBottom = '1rem';

  // Load selected character from localStorage or use default (first character)
  let selectedChar: Character | null = null;
  const savedCharName = localStorage.getItem('playerCharacter');
  if (savedCharName) {
    selectedChar = CHARACTERS.find(c => c.name === savedCharName) || CHARACTERS[0];
  } else {
    selectedChar = CHARACTERS[0];
  }

  CHARACTERS.forEach((char) => {
    const btn = document.createElement('button');
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.width = '120px';
    btn.style.height = '160px';
    btn.style.background = '#fff';
    btn.style.border = '2px solid #6fc276';
    btn.style.borderRadius = '12px';
    btn.style.cursor = 'pointer';
    btn.style.outline = 'none';
    btn.style.transition = 'border 0.2s';
    btn.setAttribute('aria-label', char.name);
    btn.tabIndex = 0;

    const img = document.createElement('img');
    img.src = char.img;
    img.alt = char.name;
    img.style.width = '80px';
    img.style.height = '80px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    img.style.marginBottom = '0.5rem';
    btn.appendChild(img);

    const name = document.createElement('span');
    name.innerText = char.name;
    name.style.fontWeight = 'bold';
    name.style.fontSize = '1rem';
    btn.appendChild(name);

    btn.onclick = () => {
      selectedChar = char;
      Array.from(charGrid.children).forEach((b) => (b as HTMLElement).style.border = '2px solid #6fc276');
      btn.style.border = '3px solid #2196f3';
      checkReady();
    };

    // Highlight default/selected button
    if (selectedChar && selectedChar.name === char.name) {
      btn.style.border = '3px solid #2196f3';
    }

    charGrid.appendChild(btn);
  });

  container.appendChild(charGrid);

  const startBtn = document.createElement('button');
  startBtn.innerText = 'Start Game';
  startBtn.style.fontSize = '1.3rem';
  startBtn.style.padding = '0.7rem 2rem';
  startBtn.style.borderRadius = '10px';
  startBtn.style.background = '#2196f3';
  startBtn.style.color = '#fff';
  startBtn.style.border = 'none';
  startBtn.style.cursor = 'pointer';
  startBtn.style.marginTop = '1rem';
  startBtn.disabled = true;
  startBtn.setAttribute('aria-disabled', 'true');

  nameInput.addEventListener('input', checkReady);
  charGrid.addEventListener('click', checkReady);

  // Check initial state (defaults)
  checkReady();

  startBtn.onclick = () => {
    if (nameInput.value.trim() && selectedChar) {
      // Save to localStorage
      localStorage.setItem('playerName', nameInput.value.trim());
      localStorage.setItem('playerCharacter', selectedChar.name);
      container.remove();
      onStart(nameInput.value.trim(), selectedChar);
    }
  };

  container.appendChild(startBtn);
  document.body.appendChild(container);
}
