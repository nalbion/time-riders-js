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
  container.style.maxWidth = '100vw';
  container.style.maxHeight = '100vh';
  container.style.overflowY = 'auto'; // allow scroll on mobile
  container.style.background = 'rgba(174, 230, 245, 0.95)';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.zIndex = '1000';
  container.style.fontFamily = 'sans-serif';

  const title = document.createElement('h1');
  title.innerText = 'Time Riders';
  title.style.fontSize = '2.2rem';
  title.style.marginBottom = '0.6rem';
  title.style.textAlign = 'center';
  title.style.wordBreak = 'break-word';
  container.appendChild(title);

  const nameLabel = document.createElement('label');
  nameLabel.innerText = 'Enter your name:';
  nameLabel.style.fontSize = '1.1rem';
  nameLabel.style.marginBottom = '0.3rem';
  nameLabel.style.textAlign = 'center';
  nameLabel.htmlFor = 'player-name';
  container.appendChild(nameLabel);

  const nameInput = document.createElement('input');
  nameInput.id = 'player-name';
  nameInput.type = 'text';
  nameInput.style.fontSize = '1.1rem';
  nameInput.style.marginBottom = '0.7rem';
  nameInput.style.padding = '0.5rem 0.7rem';
  nameInput.style.borderRadius = '8px';
  nameInput.style.border = '1px solid #ccc';
  nameInput.style.width = 'min(90vw, 350px)';
  nameInput.style.boxSizing = 'border-box';
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
  charLabel.style.fontSize = '1.1rem';
  charLabel.style.marginBottom = '0.3rem';
  charLabel.style.textAlign = 'center';
  container.appendChild(charLabel);

  const charGrid = document.createElement('div');
  charGrid.style.display = 'flex';
  charGrid.style.flexWrap = 'wrap';
  charGrid.style.justifyContent = 'center';
  charGrid.style.gap = '1.1rem';
  charGrid.style.marginBottom = '0.7rem';
  charGrid.style.width = '100%';

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
    btn.style.width = 'min(28vw, 120px)';
    btn.style.height = 'min(36vw, 160px)';
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
    img.style.width = 'min(16vw, 70px)';
    img.style.height = 'min(16vw, 70px)';
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
  startBtn.style.fontSize = '1.1rem';
  startBtn.style.padding = '0.6rem 1.2rem';
  startBtn.style.borderRadius = '9px';
  startBtn.style.background = '#2196f3';
  startBtn.style.color = '#fff';
  startBtn.style.border = 'none';
  startBtn.style.cursor = 'pointer';
  startBtn.style.marginTop = '0.7rem';
  startBtn.style.width = 'min(80vw, 320px)';
  startBtn.style.boxSizing = 'border-box';
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
