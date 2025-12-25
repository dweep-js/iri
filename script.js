let char = document.getElementsByClassName("character")[0];
let tiles = document.getElementsByClassName("tiles");
let tileStatus = [false, false, false];
let hearts = document.getElementsByClassName("hearts");
let gameEndMessages = ["YOU ARE THE BLUE TO MY RED", "twinnn"];
let heartGrowMessages = [
  "YOU ARE AWESOME",
  "I'M PROUD OF YOU",
  "LOVE YOU",
  "YOU ARE SPECIAL",
  "YOU'RE MY BESTEST FRIEND",
  "YOU MATTER",
];
let flashIndex = 0;
let lives = 3;
let opacity = 1;
let currentTile = 0;
let currentY = -2;
let currentX = -56;
let frame = 1;
let h = 7;
let b = 7;
let state = 1;
let gameEnd = false;

// --- NEW ELEMENTS & STATE ---
let sharkFrame = 1;
let sharkX = 100;
let sharkY = 45;
let oceanDiv;
let sharkContainer;
let sharkElement;
let giftspileElement;
let letterContainer;
let lastSurpriseButton;
let sharkArrivalX = 35;
const mainBody = document.getElementsByClassName("main_body")[0];
let sharkInterval;
let isCharacterOnShark = false;
let sharkStopTime = 0;
let sceneStarted = false;
let hasHeartGrown = false;

// --- Character position on shark ---
let characterOnSharkX = 0;
let characterOnSharkY = -11;

// --- IMAGE PRELOADING SYSTEM ---
let imageCache = {};
let allImagesLoaded = false;

// Store animation intervals for proper cleanup
let animationIntervals = {
  idle: null,
  run: null,
  jump: null,
  walk: null,
  death: null,
  shark: null,
  flash: null,
  waves: null,
  giftPile: null,
  snow: null,
  lights: null,
  gift: null,
  sparkles: null,
};

/* ---------------------- IMAGE PRELOADER ---------------------- */
function preloadImages() {
  console.log("Preloading all game images...");

  const imageManifest = {
    character: {
      idle: 15, // Only 15 idle frames exist
      run: 20, // Only 20 run frames exist
      jump: 30, // Only 30 jump frames exist
      walk: 20, // Only 20 walk frames exist
      dead: 15, // Only 15 dead frames exist (not 24!)
    },
    shark: {
      frames: 8,
    },
    other: ["./resources/giftspile.png"],
  };

  let totalImages = 0;
  let loadedImages = 0;
  let failedImages = [];

  // Function to load a single image
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      totalImages++;
      const img = new Image();
      img.onload = () => {
        loadedImages++;
        imageCache[src] = img;
        console.log(`✓ Loaded: ${src}`);
        resolve(img);
      };
      img.onerror = (err) => {
        failedImages.push(src);
        console.warn(`✗ Failed to load: ${src}`);
        // Don't reject, just continue
        resolve(null);
      };
      img.src = src;
    });
  }

  // Load character images
  const characterPromises = [];
  for (let anim in imageManifest.character) {
    for (let i = 1; i <= imageManifest.character[anim]; i++) {
      const src = `./resources/char/${anim.charAt(0).toUpperCase() + anim.slice(1)} (${i}).png`;
      characterPromises.push(loadImage(src));
    }
  }

  // Load shark images
  for (let i = 1; i <= imageManifest.shark.frames; i++) {
    const src = `./resources/shark/Shark${i}.png`;
    loadImage(src);
  }

  // Load other images
  imageManifest.other.forEach((src) => loadImage(src));

  // Set a timeout to continue even if some images fail
  setTimeout(() => {
    console.log(`Preloaded ${loadedImages}/${totalImages} images`);
    if (failedImages.length > 0) {
      console.warn(`Failed images: ${failedImages.join(", ")}`);
    }
    allImagesLoaded = true;
    // Start idle animation
    IdleAnim();
  }, 2000);
}

/* ---------------------- OPTIMIZED IMAGE GETTER ---------------------- */
function getImage(src) {
  // Return cached image or fallback to path
  if (imageCache[src] && imageCache[src].complete) {
    return imageCache[src].src;
  }
  return src; // Fallback to original path
}

/* ---------------------- SAFE IMAGE LOADER ---------------------- */
function loadCharacterImage(animation, frameNum) {
  // Safety check: don't try to load frames that don't exist
  const maxFrames = {
    Idle: 15,
    Run: 20,
    Jump: 30,
    Walk: 20,
    Dead: 15, // NOT 24!
  };

  if (frameNum > maxFrames[animation]) {
    frameNum = ((frameNum - 1) % maxFrames[animation]) + 1; // Loop back to valid range
  }

  const src = `./resources/char/${animation} (${frameNum}).png`;
  return getImage(src);
}

/* ---------------------- TILE CHECK ---------------------- */
function checkValues() {
  for (let i = 0; i <= currentTile; i++) {
    tileStatus[i] = true;
  }
}

function resetTiles() {
  for (let i = 0; i < tileStatus.length; i++) {
    tileStatus[i] = false;
    tiles[i].style.opacity = 1;
  }
  currentTile = 0;
}

/* ---------------------- HEART LOSS ---------------------- */
function loseHeart() {
  if (lives <= 0) return;

  let heart = hearts[lives - 1];

  heart.style.transition = "none";
  heart.style.backgroundColor = "#f38ba8";

  setTimeout(() => {
    heart.style.backgroundColor = "transparent";
    setTimeout(() => {
      heart.style.backgroundColor = "#f38ba8";
      setTimeout(() => {
        heart.style.transition = "background-color 0.4s linear";
        heart.style.backgroundColor = "transparent";
      }, 150);
    }, 150);
  }, 150);

  lives--;

  console.log(`Heart lost. Lives remaining: ${lives}`);
}

/* ---------------------- GAME RESET ---------------------- */
function resetGame() {
  console.log("=== RESETTING GAME ===");

  // Clear ALL intervals and timeouts FIRST
  clearAllIntervals();

  // RESET ALL VARIABLES TO INITIAL STATE
  lives = 3;
  gameEnd = false;
  state = 1;
  opacity = 1;
  frame = 1;
  currentY = -2;
  currentX = -56;
  currentTile = 0;
  sharkFrame = 1;
  sharkX = 100;
  sharkY = 45;
  isCharacterOnShark = false;
  sharkStopTime = 0;
  sceneStarted = false;
  characterOnSharkX = 0;
  characterOnSharkY = 15;
  flashIndex = 0;
  hasHeartGrown = false;

  // Reset hearts - make them PINK filled SQUARE with correct vw size
  // 2vw gap between hearts
  for (let i = 0; i < hearts.length; i++) {
    const heart = hearts[i];

    // Reset all styles to initial state
    heart.style.cssText = "";

    // Set basic heart styles - PINK FILLED SQUARE with vw units
    // Each heart is 7vw wide, with 2vw gap between them
    // First heart at 2vw, second at 11vw (2 + 7 + 2), third at 20vw (11 + 7 + 2)
    const heartLeft = i * 9 + 2; // 7vw width + 2vw gap = 9vw

    heart.style.cssText = `
      opacity: 1;
      background-color: #f38ba8;
      border-color: #f38ba8;
      transition: all 0.5s ease-in-out;
      position: absolute;
      transform: none;
      z-index: auto;
      width: 7vw;
      height: 7vw;
      border-radius: 0% !important;
      margin: 0;
      display: block;
      visibility: visible;
      border-width: 1vw;
      left: ${heartLeft}vw;
      top: 2vh;
      border-style: solid;
      border-radius: 0% !important;
    `;

    const flashText = heart.querySelector("#flash-message");
    if (flashText) flashText.remove();
  }

  reanimateHearts();
  resetTiles();

  // Reset character
  if (char) {
    char.style.transition = "all 0.5s ease-in-out";
    char.style.transform = "scaleX(-1) translateY(-2vh) translateX(-56vw)";
    char.style.width = "15vh";
    char.style.filter = "none";
    char.style.zIndex = "";
    char.style.opacity = "1";
    char.style.display = "block";
    char.style.position = "absolute";
    char.style.left = "";
    char.style.top = "";

    // Use preloaded image if available
    char.src = loadCharacterImage("Idle", 1);

    if (sharkContainer && sharkContainer.contains(char)) {
      sharkContainer.removeChild(char);
    }
    if (!mainBody.contains(char)) {
      mainBody.appendChild(char);
    }
  }

  // Remove ALL created elements
  const elementsToRemove = [
    "ocean-layer",
    "shark-container",
    "shark-element",
    "giftpile",
    "flash-message",
    "waves-container",
    "water-bubbles",
    "letter-container",
    "snow-container",
    "christmas-lights",
    "northern-lights",
    "fireplace",
    "last-surprise-button",
    "christmas-sparkles",
    ...Array.from({ length: 10 }, (_, i) => "gift-" + i),
  ];

  elementsToRemove.forEach((id) => {
    const element = document.getElementById(id);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  // Remove any remaining gifts
  const allGifts = document.querySelectorAll(
    'img[src*="gift"], img[src*="hat"], img[alt*="Christmas"], img[alt*="Present"]',
  );
  allGifts.forEach((g) => g.remove());

  // Remove all LAST SURPRISE buttons
  const allButtons = document.querySelectorAll(".last-surprise-btn");
  allButtons.forEach((button) => {
    if (button.parentNode) {
      button.parentNode.removeChild(button);
    }
  });

  // Remove style elements
  const styleElements = document.querySelectorAll("style");
  styleElements.forEach((style) => {
    if (
      style.textContent.includes("waveAnimation") ||
      style.textContent.includes("bubbleRise") ||
      style.textContent.includes("lightFlicker") ||
      style.textContent.includes("snowFall") ||
      style.textContent.includes("giftGlow") ||
      style.textContent.includes("lightTwinkle") ||
      style.textContent.includes("northernLights") ||
      style.textContent.includes("fireGlow") ||
      style.textContent.includes("giftFloat") ||
      style.textContent.includes("giftArrive") ||
      style.textContent.includes("sparkle") ||
      style.textContent.includes("christmasSparkle")
    ) {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }
  });

  // Reset tiles
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].style.transition = "all 0.5s ease-in-out";
    tiles[i].style.opacity = "1";
    tiles[i].style.display = "block";
    tiles[i].style.visibility = "visible";
    tiles[i].style.transform = "scale(1)";
  }

  // Reset main body
  mainBody.style.background = "";
  mainBody.style.transition = "";

  console.log("=== GAME RESET COMPLETE ===");

  // Start Christmas sparkles
  createChristmasSparkles();

  // Restart idle animation
  setTimeout(() => {
    if (state === 1 && !gameEnd) {
      IdleAnim();
    }
  }, 500);
}

/* ---------------------- REANIMATE HEARTS ---------------------- */
function reanimateHearts() {
  for (let i = 0; i < hearts.length; i++) {
    const heart = hearts[i];

    // Set to PINK filled SQUARE with vw units
    heart.style.borderColor = "#f38ba8";
    heart.style.backgroundColor = "#f38ba8";
    heart.style.transition = "all 0.6s ease-in-out";
    heart.style.opacity = "0";
    heart.style.transform = "scale(0.8)";
    heart.style.borderRadius = "0%";
    heart.style.width = "7vw";
    heart.style.height = "7vw";
    heart.style.borderWidth = "1vw";

    setTimeout(() => {
      heart.style.opacity = "1";
      heart.style.transform = "scale(1)";
      heart.style.backgroundColor = "#f38ba8";
      heart.style.borderColor = "#f38ba8";
      heart.style.borderRadius = "0%";

      setTimeout(() => {
        heart.style.transform = "scale(1.15)";
        setTimeout(() => {
          heart.style.transform = "scale(1)";
        }, 150);
      }, 300);
    }, i * 200);
  }
}

/* ---------------------- CLEAR ALL INTERVALS ---------------------- */
function clearAllIntervals() {
  console.log("Clearing all intervals...");

  Object.values(animationIntervals).forEach((interval) => {
    if (interval) {
      clearTimeout(interval);
      clearInterval(interval);
    }
  });

  if (sharkInterval) {
    clearTimeout(sharkInterval);
    clearInterval(sharkInterval);
    sharkInterval = null;
  }

  // Clear any remaining intervals
  const highestId = setTimeout(() => {}, 0);
  for (let i = highestId; i >= 0; i--) {
    clearTimeout(i);
    clearInterval(i);
  }

  animationIntervals = {
    idle: null,
    run: null,
    jump: null,
    walk: null,
    death: null,
    shark: null,
    flash: null,
    waves: null,
    giftPile: null,
    snow: null,
    lights: null,
    gift: null,
    sparkles: null,
  };
}

/* ---------------------- CREATE CHRISTMAS SNOW ---------------------- */
function createSnow() {
  const existingSnow = document.getElementById("snow-container");
  if (existingSnow) existingSnow.remove();

  const snowContainer = document.createElement("div");
  snowContainer.id = "snow-container";
  snowContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 100;
    overflow: hidden;
  `;
  mainBody.appendChild(snowContainer);

  const snowStyle = document.createElement("style");
  snowStyle.textContent = `
    @keyframes snowFall {
      0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    .snowflake {
      position: absolute;
      background: white;
      border-radius: 50%;
      pointer-events: none;
      animation: snowFall linear infinite;
      filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
    }
  `;
  document.head.appendChild(snowStyle);

  function generateSnow() {
    for (let i = 0; i < 15; i++) {
      const snowflake = document.createElement("div");
      snowflake.className = "snowflake";
      const size = Math.random() * 4 + 2;
      const left = Math.random() * 100;
      const duration = Math.random() * 8 + 4;
      snowflake.style.cssText = `
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${duration}s;
        animation-delay: ${Math.random() * 3}s;
        opacity: ${Math.random() * 0.5 + 0.3};
      `;
      snowContainer.appendChild(snowflake);

      setTimeout(
        () => {
          if (snowflake.parentNode) snowflake.remove();
        },
        duration * 1000 + 3000,
      );
    }
  }

  generateSnow();
  animationIntervals.snow = setInterval(generateSnow, 3000);
}

/* ---------------------- CREATE CHRISTMAS SPARKLES THROUGHOUT GAME ---------------------- */
function createChristmasSparkles() {
  const existingSparkles = document.getElementById("christmas-sparkles");
  if (existingSparkles) existingSparkles.remove();

  const sparklesContainer = document.createElement("div");
  sparklesContainer.id = "christmas-sparkles";
  sparklesContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 5;
    overflow: hidden;
  `;
  mainBody.appendChild(sparklesContainer);

  const sparkleStyle = document.createElement("style");
  sparkleStyle.textContent = `
    @keyframes christmasSparkle {
      0%, 100% {
        transform: translateY(0) scale(1);
        opacity: 0;
      }
      20% {
        opacity: 0.8;
        transform: translateY(-5px) scale(1.2);
      }
      40% {
        opacity: 0.3;
        transform: translateY(-10px) scale(0.8);
      }
      60% {
        opacity: 0.9;
        transform: translateY(-15px) scale(1.3);
      }
      80% {
        opacity: 0.4;
        transform: translateY(-20px) scale(0.9);
      }
    }

    .christmas-sparkle {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      animation: christmasSparkle 2s ease-in-out infinite;
      filter: blur(0.5px);
    }
  `;
  document.head.appendChild(sparkleStyle);

  function generateSparkle() {
    const sparkle = document.createElement("div");
    sparkle.className = "christmas-sparkle";

    const colors = [
      "#f38ba8",
      "#89b4fa",
      "#a6e3a1",
      "#f9e2af",
      "#cba6f7",
      "#fab387",
      "#f2cdcd",
      "#94e2d5",
    ];

    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = Math.random() * 2;

    sparkle.style.cssText = `
      left: ${left}%;
      top: ${top}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      box-shadow: 0 0 6px ${color}, 0 0 12px ${color}40;
      animation-delay: ${delay}s;
      opacity: 0;
    `;

    sparklesContainer.appendChild(sparkle);

    setTimeout(
      () => {
        if (sparkle.parentNode) {
          sparkle.remove();
        }
      },
      2000 + delay * 1000,
    );
  }

  // Generate initial sparkles
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      generateSparkle();
    }, i * 150);
  }

  // Continue generating sparkles
  animationIntervals.sparkles = setInterval(() => {
    generateSparkle();
  }, 500);
}

/* ---------------------- CREATE OCEAN ---------------------- */
function createOcean() {
  const existingOcean = document.getElementById("ocean-layer");
  if (existingOcean && existingOcean.parentNode) {
    existingOcean.remove();
  }

  oceanDiv = document.createElement("div");
  oceanDiv.id = "ocean-layer";
  oceanDiv.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 50%;
        background: linear-gradient(to bottom,
            #0d47a1,
            #1565c0,
            #1976d2,
            #42a5f5
        );
        opacity: 0;
        z-index: 50;
        transition: opacity 2s ease-in;
        overflow: hidden;
    `;
  mainBody.appendChild(oceanDiv);

  const wavesContainer = document.createElement("div");
  wavesContainer.id = "waves-container";
  wavesContainer.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 30%;
        z-index: 51;
        overflow: hidden;
    `;
  oceanDiv.appendChild(wavesContainer);

  const waveLayers = [
    {
      height: "25%",
      speed: "25s",
      color: "rgba(33, 150, 243, 0.7)",
      offset: "0px",
    },
    {
      height: "20%",
      speed: "20s",
      color: "rgba(66, 165, 245, 0.5)",
      offset: "5px",
    },
    {
      height: "15%",
      speed: "15s",
      color: "rgba(100, 181, 246, 0.4)",
      offset: "10px",
    },
  ];

  waveLayers.forEach((wave, index) => {
    const waveLayer = document.createElement("div");
    waveLayer.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 300%;
            height: ${wave.height};
            background: ${wave.color};
            border-radius: 50% 50% 0 0;
            animation: waveAnimation${index} ${wave.speed} linear infinite;
            z-index: ${51 + index};
            transform: translateY(${wave.offset});
        `;

    const style = document.createElement("style");
    style.textContent = `
            @keyframes waveAnimation${index} {
                0% { transform: translateX(0) translateY(${wave.offset}); }
                100% { transform: translateX(-100%) translateY(${wave.offset}); }
            }
        `;
    document.head.appendChild(style);

    wavesContainer.appendChild(waveLayer);
  });

  const foam = document.createElement("div");
  foam.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 15%;
        background: linear-gradient(to bottom,
            rgba(255, 255, 255, 0.8) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%
        );
        z-index: 54;
        animation: foamMove 10s ease-in-out infinite;
    `;

  const foamStyle = document.createElement("style");
  foamStyle.textContent = `
        @keyframes foamMove {
            0%, 100% { transform: translateY(0); opacity: 0.8; }
            50% { transform: translateY(-5px); opacity: 0.6; }
        }
    `;
  document.head.appendChild(foamStyle);

  wavesContainer.appendChild(foam);

  const bubblesContainer = document.createElement("div");
  bubblesContainer.id = "water-bubbles";
  bubblesContainer.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 52;
        pointer-events: none;
    `;
  oceanDiv.appendChild(bubblesContainer);

  function createBubbles() {
    for (let i = 0; i < 6; i++) {
      const bubble = document.createElement("div");
      const size = Math.random() * 8 + 3;
      const left = Math.random() * 100;
      const duration = Math.random() * 6 + 3;

      bubble.style.cssText = `
                    position: absolute;
                    bottom: -10px;
                    left: ${left}%;
                    width: ${size}px;
                    height: ${size}px;
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    animation: bubbleRise ${duration}s linear infinite;
                    z-index: 52;
                `;

      const bubbleStyle = document.createElement("style");
      bubbleStyle.textContent = `
                    @keyframes bubbleRise {
                        0% {
                            transform: translateY(0) scale(1) translateX(0);
                            opacity: 0.6;
                        }
                        50% {
                            transform: translateY(-50%) scale(1.1) translateX(${Math.random() * 15 - 7.5}px);
                            opacity: 0.3;
                        }
                        100% {
                            transform: translateY(-100vh) scale(0.5) translateX(${Math.random() * 15 - 7.5}px);
                            opacity: 0;
                        }
                    }
                `;
      document.head.appendChild(bubbleStyle);

      bubblesContainer.appendChild(bubble);

      setTimeout(() => {
        if (bubble.parentNode) {
          bubble.parentNode.removeChild(bubble);
        }
      }, duration * 1000);
    }
  }

  animationIntervals.waves = setInterval(createBubbles, 5000);
  createBubbles();

  setTimeout(() => {
    oceanDiv.style.opacity = "0.95";
  }, 100);
}

/* ---------------------- SHARK ANIMATION ---------------------- */
function SharkAnim() {
  if (!gameEnd || !sharkElement) return;

  // Use preloaded image if available
  const sharkSrc = getImage(`./resources/shark/Shark${sharkFrame}.png`);
  sharkElement.src = sharkSrc;
  sharkFrame = sharkFrame < 8 ? sharkFrame + 1 : 1;

  if (sharkX > sharkArrivalX) {
    sharkX -= 1.5;
    sharkY -= 0.1;

    sharkContainer.style.transform = `translateY(${sharkY}vh) translateX(${sharkX}vw)`;

    if (char.parentNode === sharkContainer) {
      char.style.transform = `scaleX(-1) translateY(${characterOnSharkY}vh) translateX(${characterOnSharkX}vw)`;
    }
  } else {
    sharkContainer.style.transform = `translateY(${sharkY}vh) translateX(${sharkX}vw)`;

    if (char.parentNode === sharkContainer) {
      // Use preloaded idle image with safety check
      char.src = loadCharacterImage("Idle", frame);
      char.style.transform = `scaleX(-1) translateY(${characterOnSharkY}vh) translateX(${characterOnSharkX}vw)`;
      frame = frame < 15 ? frame + 1 : 1;
    }

    if (sharkStopTime === 0) {
      sharkStopTime = Date.now();
    }

    if (
      Date.now() - sharkStopTime >= 1500 &&
      !document.getElementById("giftpile")
    ) {
      createGiftPile();
    }
  }

  sharkInterval = setTimeout(SharkAnim, 100);
}

/* ---------------------- CREATE GIFT PILE ---------------------- */
function createGiftPile() {
  console.log("Creating gift pile in front of shark (drifting from left)...");

  const existingGift = document.getElementById("giftpile");
  if (existingGift) {
    existingGift.remove();
  }

  giftspileElement = document.createElement("img");
  giftspileElement.id = "giftpile";
  giftspileElement.alt = "Christmas Gift Pile - Click to Open";

  // Use preloaded image if available
  if (imageCache["./resources/giftspile.png"]) {
    giftspileElement.src = imageCache["./resources/giftspile.png"].src;
  } else {
    giftspileElement.src = "./resources/giftspile.png";
  }

  giftspileElement.style.cssText = `
        position: absolute;
        width: 20vh;
        height: 20vh;
        min-width: 150px;
        min-height: 150px;
        left: -30%;
        top: 5vh;
        opacity: 0;
        z-index: 60;
        cursor: pointer;
        transform: scale(1) rotate(-10deg);
        transition: opacity 1s ease-in-out;
        background-color: transparent;
        object-fit: contain;
        filter: none;
    `;

  // Preload image
  const giftImage = new Image();
  giftImage.onload = function () {
    console.log("giftspile.png loaded successfully");
    if (sharkContainer) {
      sharkContainer.appendChild(giftspileElement);
      console.log("Gift pile added to shark container");
      startGiftAnimation();
    }
  };

  giftImage.onerror = function () {
    console.error("Failed to load giftspile.png. Using fallback...");
    giftspileElement.style.cssText = `
      position: absolute;
      width: 20vh;
      height: 20vh;
      left: -30%;
      top: 5vh;
      background: linear-gradient(45deg, #f38ba8, #89b4fa, #a6e3a1);
      border: 6px solid #cba6f7;
      border-radius: 15px;
      z-index: 60;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
      font-weight: bold;
      text-align: center;
      opacity: 0;
      transform: scale(1) rotate(-10deg);
      filter: none;
    `;
    giftspileElement.textContent = "🎁";

    if (sharkContainer) {
      sharkContainer.appendChild(giftspileElement);
      console.log("Fallback gift created");
      startGiftAnimation();
    }
  };

  giftImage.src = "./resources/giftspile.png";
}

/* ---------------------- START GIFT ANIMATION ---------------------- */
function startGiftAnimation() {
  if (!giftspileElement) return;

  setTimeout(() => {
    giftspileElement.style.opacity = "1";

    let giftX = -30;
    const targetX = 40;
    const giftSpeed = 0.8;

    function driftGift() {
      if (giftX < targetX) {
        giftX += giftSpeed;
        giftspileElement.style.left = giftX + "%";

        const floatY = Math.sin(giftX * 0.05) * 1.5;
        giftspileElement.style.top = 5 + floatY + "vh";

        const rotation = -10 + Math.sin(giftX * 0.03) * 3;
        giftspileElement.style.transform = `scale(1) rotate(${rotation}deg)`;

        animationIntervals.gift = setTimeout(driftGift, 40);
      } else {
        giftspileElement.style.transition = "all 0.5s ease";
        giftspileElement.style.left = "40%";
        giftspileElement.style.top = "5vh";
        giftspileElement.style.transform = "scale(1) rotate(0deg)";

        const floatStyle = document.createElement("style");
        floatStyle.textContent = `
          @keyframes gentleFloat {
            0%, 100% { transform: scale(1) translateY(0) translateX(0); }
            33% { transform: scale(1.02) translateY(-3px) translateX(-2px); }
            66% { transform: scale(0.98) translateY(2px) translateX(2px); }
          }
        `;
        document.head.appendChild(floatStyle);
        giftspileElement.style.animation =
          "gentleFloat 4s ease-in-out infinite";
      }
    }

    driftGift();
  }, 300);

  setupGiftClick(giftspileElement);
}

/* ---------------------- SETUP GIFT CLICK ---------------------- */
function setupGiftClick(element) {
  element.addEventListener("click", function () {
    console.log("Gift pile clicked!");

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const sparkle = document.createElement("div");
        sparkle.style.cssText = `
          position: absolute;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          pointer-events: none;
          z-index: 61;
          animation: sparkle 0.7s linear forwards;
        `;
        const sparkleStyle = document.createElement("style");
        sparkleStyle.textContent = `
          @keyframes sparkle {
            0% { transform: scale(0); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.7; }
            100% { transform: scale(0); opacity: 0; }
        `;
        document.head.appendChild(sparkleStyle);
        sharkContainer.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 700);
      }, i * 100);
    }

    element.style.animation = "none";
    element.style.transition = "all 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
    element.style.opacity = "0.9";
    element.style.transform = "scale(1.3) rotate(15deg)";
    element.style.filter = "brightness(1.3)";

    setTimeout(() => {
      element.style.opacity = "0";
      element.style.transform = "scale(0.2) rotate(180deg)";
      element.style.filter = "brightness(2)";

      setTimeout(() => {
        if (element.parentNode) {
          element.remove();
        }
        showLetter();
      }, 500);
    }, 500);
  });

  element.addEventListener("mouseover", function () {
    this.style.filter = "brightness(1.2)";
    this.style.cursor = "pointer";
    this.style.transform = "scale(1.1)";
    this.style.transition = "all 0.3s ease";
  });

  element.addEventListener("mouseout", function () {
    if (!this.style.animation) {
      this.style.filter = "none";
      this.style.transform = "scale(1)";
    }
  });
}

/* ---------------------- SHOW LETTER ---------------------- */
function showLetter() {
  if (giftspileElement && giftspileElement.parentNode) {
    giftspileElement.remove();
  }

  createSnow();

  mainBody.style.background = "#1e1e2e";
  mainBody.style.transition = "background 1.5s ease";

  const existingLetter = document.getElementById("letter-container");
  if (existingLetter) existingLetter.remove();

  letterContainer = document.createElement("div");
  letterContainer.id = "letter-container";
  letterContainer.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #1e1e2e;
          z-index: 200;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-family: "Yeseva One", serif;
          color: #cdd6f4;
          text-align: center;
          opacity: 0;
          transition: opacity 1s ease-in;
      `;

  const letterContentWrapper = document.createElement("div");
  letterContentWrapper.style.cssText = `
          width: 70%;
          max-width: 500px;
          padding: 40px;
          background: #181825;
          border: 8px solid #89b4fa;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          color: #cdd6f4;
      `;

  letterContentWrapper.innerHTML = `
          <h1 style="color: #89b4fa; margin-bottom: 20px; text-align: center; font-size: 2rem;">MY BEST FRIEND,,</h1>
          <h1 style="font-size: 1.3rem; line-height: 1.6; text-align: center; margin: 15px 0; font-weight: normal;">
              Merry christmas, I hope another year is much greater for you and I can get to share our happiness, I hope we continue to be friends forever

              Thank you
              <span style="color: #a6e3a1; display: block; margin-top: 10px;">Merry Christmas! 🎄</span>
          </h1>
          <h1 style="margin-top: 30px; color: #fab387; font-style: italic; text-align: center; font-size: 1.2rem; font-weight: normal;">— Dweep.</h1>
      `;

  letterContainer.appendChild(letterContentWrapper);
  mainBody.appendChild(letterContainer);

  setTimeout(() => {
    letterContainer.style.opacity = "1";
  }, 100);

  // Create Last Surprise Button instead of Play Again
  createLastSurpriseButton();
}

/* ---------------------- CREATE LAST SURPRISE BUTTON ---------------------- */
function createLastSurpriseButton() {
  const existingButton = document.getElementById("last-surprise-button");
  if (existingButton) existingButton.remove();

  lastSurpriseButton = document.createElement("a");
  lastSurpriseButton.id = "last-surprise-button";
  lastSurpriseButton.className = "last-surprise-btn";
  lastSurpriseButton.textContent = "🎁 LAST SURPRISE 🎁";
  lastSurpriseButton.href = "https://youtu.be/dQw4w9WgXcQ?si=RXpaqGsqczAaMwjU";
  lastSurpriseButton.target = "_blank";
  lastSurpriseButton.rel = "noopener noreferrer";

  // Add VISIBLE styling to the button - FULLY RED
  lastSurpriseButton.style.cssText = `
    display: inline-block;
    margin-top: 30px;
    padding: 15px 30px;
    background: #f38ba8; /* SOLID RED */
    color: white;
    font-family: "Yeseva One", serif;
    font-size: 1.5rem;
    font-weight: bold;
    text-decoration: none;
    border-radius: 12px;
    border: 4px solid #d87093; /* Darker red border */
    box-shadow: 0 6px 0 #d87093, 0 0 20px rgba(243, 139, 168, 0.7); /* Red shadow */
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    z-index: 1000;
    position: relative;
    overflow: hidden;
    letter-spacing: 1px;
  `;

  // Add hover effects - ALL RED
  lastSurpriseButton.addEventListener("mouseover", function () {
    this.style.transform = "translateY(-3px) scale(1.05)";
    this.style.boxShadow = "0 9px 0 #d87093, 0 0 30px rgba(243, 139, 168, 0.9)";
    this.style.background = "#f59ab0";
  });

  lastSurpriseButton.addEventListener("mouseout", function () {
    this.style.transform = "translateY(0) scale(1)";
    this.style.boxShadow = "0 6px 0 #d87093, 0 0 20px rgba(243, 139, 168, 0.7)";
    this.style.background = "#f38ba8";
  });

  lastSurpriseButton.addEventListener("mousedown", function () {
    this.style.transform = "translateY(3px)";
    this.style.boxShadow = "0 3px 0 #d87093, 0 0 20px rgba(243, 139, 168, 0.7)";
    this.style.background = "#e67997";
  });

  letterContainer.appendChild(lastSurpriseButton);
}

/* ---------------------- FINAL SCENE START ---------------------- */
function startGameEndScene() {
  if (sceneStarted) return;
  sceneStarted = true;

  gameEnd = true;

  mainBody.style.background = "#1e1e2e";

  for (let t of tiles) {
    t.style.opacity = 0;
  }

  char.style.zIndex = "65";
  char.style.transition = "none";
  char.style.opacity = "1";
  char.style.display = "block";
  char.style.position = "absolute";
  char.style.width = "15vh";

  const existingSharkContainer = document.getElementById("shark-container");
  const existingSharkElement = document.getElementById("shark-element");
  if (existingSharkContainer && existingSharkContainer.parentNode)
    existingSharkContainer.remove();
  if (existingSharkElement && existingSharkElement.parentNode)
    existingSharkElement.remove();

  sharkContainer = document.createElement("div");
  sharkContainer.id = "shark-container";
  sharkContainer.style.cssText = `
        position: absolute;
        left: 0;
        z-index: 55;
        transition: none;
    `;
  mainBody.appendChild(sharkContainer);

  sharkElement = document.createElement("img");
  const sharkImgSrc = getImage(`./resources/shark/Shark1.png`);
  sharkElement.src = sharkImgSrc;
  sharkElement.id = "shark-element";
  sharkElement.style.cssText = `
        position: relative;
        width: 30vw;
        filter: drop-shadow(2px 2px 6px rgba(0,0,0,0.4));
        z-index: 55;
    `;
  sharkContainer.appendChild(sharkElement);

  if (mainBody.contains(char)) {
    mainBody.removeChild(char);
    sharkContainer.appendChild(char);
    isCharacterOnShark = true;

    char.style.transform = `scaleX(-1) translateY(${characterOnSharkY}vh) translateX(${characterOnSharkX}vw)`;
    char.style.position = "absolute";
    char.style.left = "0";
    char.style.top = "0";
    char.style.zIndex = "56";
  }

  sharkX = 100;
  sharkY = 45;
  sharkStopTime = 0;
  SharkAnim();
}

/* ---------------------- HEART GROW - IMPROVED ANIMATION ---------------------- */
function heartgrow() {
  if (hasHeartGrown) return;
  hasHeartGrown = true;

  console.log("Starting heart grow animation (improved)");

  let finalHeart = hearts[0];
  let otherHeart1 = hearts[1];
  let otherHeart2 = hearts[2];

  flashIndex = 0;

  if (otherHeart1) otherHeart1.style.opacity = "0";
  if (otherHeart2) otherHeart2.style.opacity = "0";

  // Get the original position and size in vw units
  const originalLeft = "2vw";
  const originalTop = "2vh";
  const originalSize = "7vw";
  const originalBorder = "1vw";

  // Save original styles
  const originalStyle = {
    position: finalHeart.style.position,
    left: finalHeart.style.left,
    top: finalHeart.style.top,
    width: finalHeart.style.width,
    height: finalHeart.style.height,
    borderRadius: finalHeart.style.borderRadius,
    backgroundColor: finalHeart.style.backgroundColor,
    borderColor: finalHeart.style.borderColor,
    borderWidth: finalHeart.style.borderWidth,
    transition: finalHeart.style.transition,
    transform: finalHeart.style.transform,
    zIndex: finalHeart.style.zIndex,
    margin: finalHeart.style.margin,
  };

  // Get current position for animation start
  const currentRect = finalHeart.getBoundingClientRect();

  // Step 1: Enhanced grow animation
  finalHeart.style.transition = "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)";
  finalHeart.style.position = "fixed";
  finalHeart.style.zIndex = "10000";
  finalHeart.style.borderColor = "#89b4fa";
  finalHeart.style.backgroundColor = "#89b4fa";
  finalHeart.style.left = currentRect.left + "px";
  finalHeart.style.top = currentRect.top + "px";
  finalHeart.style.width = currentRect.width + "px";
  finalHeart.style.height = currentRect.height + "px";
  finalHeart.style.margin = "0";
  finalHeart.style.transform = "translate(0, 0)";
  finalHeart.style.borderWidth = originalBorder;
  finalHeart.style.borderRadius = "0%";
  finalHeart.style.animation = "none";

  setTimeout(() => {
    finalHeart.style.transition =
      "all 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
    const centerX = window.innerWidth / 2 - currentRect.width / 2;
    const centerY = window.innerHeight / 2 - currentRect.height / 2;
    finalHeart.style.left = centerX + "px";
    finalHeart.style.top = centerY + "px";
    finalHeart.style.borderRadius = "0%";
    finalHeart.style.transform = "scale(1.3)";
  }, 100);

  setTimeout(() => {
    finalHeart.style.transition =
      "all 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    finalHeart.style.left = "0px";
    finalHeart.style.top = "0px";
    finalHeart.style.width = "100vw";
    finalHeart.style.height = "100vh";
    finalHeart.style.borderRadius = "0%";
    finalHeart.style.borderWidth = "0";
    finalHeart.style.background = "#89b4fa";
    finalHeart.style.backgroundColor = "#89b4fa";
    finalHeart.style.transform = "scale(1)";
  }, 1200);

  setTimeout(() => {
    let flashText = document.createElement("div");
    flashText.id = "flash-message";
    flashText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            font-size: 4.5vw;
            font-weight: bold;
            font-family: 'Yeseva One', serif;
            line-height: 1.4;
            width: 90%;
            margin: 0;
            padding: 0;
            opacity: 0;
            transition: opacity 0.4s ease-in-out;
            z-index: 10001;
            text-shadow:
                3px 3px 0 #000,
                -3px -3px 0 #000,
                3px -3px 0 #000,
                -3px 3px 0 #000,
                3px 0px 0 #000,
                0px 3px 0 #000,
                -3px 0px 0 #000,
                0px -3px 0 #000,
                0 0 20px rgba(0, 0, 0, 0.7);
        `;

    finalHeart.appendChild(flashText);

    function flashMessage() {
      if (flashIndex >= heartGrowMessages.length) {
        flashText.style.opacity = "1";

        setTimeout(() => {
          flashText.style.opacity = "0";

          setTimeout(() => {
            let textElement = document.getElementById("flash-message");
            if (textElement) textElement.remove();

            // Step 2: Enhanced shrink back animation
            finalHeart.style.transition =
              "all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            finalHeart.style.position = "absolute";
            finalHeart.style.left = originalLeft;
            finalHeart.style.top = originalTop;
            finalHeart.style.width = originalSize;
            finalHeart.style.height = originalSize;
            finalHeart.style.borderRadius = "0%";
            finalHeart.style.borderWidth = originalBorder;
            finalHeart.style.background = "#89b4fa";
            finalHeart.style.backgroundColor = "#89b4fa";

            finalHeart.style.zIndex = "auto";

            setTimeout(() => {
              // Step 3: Show other hearts with BLUE border and 2vw gap
              // First blue heart at 11vw (2 + 7 + 2), second at 20vw (11 + 7 + 2)
              if (otherHeart1) {
                otherHeart1.style.cssText = `
                  opacity: 1;
                  background-color: transparent;
                  border-color: #89b4fa;
                  transition: all 0.5s ease;
                  position: absolute;
                  transform: none;
                  z-index: auto;
                  width: 7vw;
                  height: 7vw;
                  border-radius: 0%;
                  margin: 0;
                  display: block;
                  visibility: visible;
                  border-width: 1vw;
                  left: 11vw;  /* 2vw + 7vw + 2vw gap */
                  top: 2vh;
                  border-style: solid;
                  border-radius: 0%;
                `;
              }
              if (otherHeart2) {
                otherHeart2.style.cssText = `
                  opacity: 1;
                  background-color: transparent;
                  border-color: #89b4fa;
                  transition: all 0.5s ease;
                  position: absolute;
                  transform: none;
                  z-index: auto;
                  width: 7vw;
                  height: 7vw;
                  border-radius: 0%;
                  margin: 0;
                  display: block;
                  visibility: visible;
                  border-width: 1vw;
                  left: 20vw;  /* 11vw + 7vw + 2vw gap */
                  top: 2vh;
                  border-style: solid;
                  border-radius: 0%;
                `;
              }

              // Start shark animation
              startGameEndScene();
            }, 800);
          }, 800);
        }, 1500);
        return;
      }

      let message = heartGrowMessages[flashIndex];
      let colors = ["#ffffff", "#89b4fa", "#a6e3a1", "#f9e2af", "#cba6f7"];
      let colorIndex = flashIndex % colors.length;

      flashText.innerHTML = `<div style="color: ${colors[colorIndex]}; font-size: 1.2em; text-shadow: 0 0 15px ${colors[colorIndex]}80;">${message}</div>`;

      flashText.style.opacity = "1";

      setTimeout(() => {
        if (flashIndex < heartGrowMessages.length - 1) {
          flashText.style.opacity = "0";
        }
        flashIndex++;
      }, 1200);
    }

    if (animationIntervals.flash) {
      clearInterval(animationIntervals.flash);
    }

    animationIntervals.flash = setInterval(flashMessage, 1400);
    flashMessage();
  }, 2300);
}

/* ---------------------- DEATH ANIMATION ---------------------- */
function DeathAnim() {
  if (state != 5 || gameEnd) return;

  // Use safe image loader with loop back for Dead frames (only 15 exist)
  let deadFrameNum = frame;
  if (deadFrameNum > 15) {
    deadFrameNum = ((deadFrameNum - 1) % 15) + 1; // Loop back to 1-15 range
  }

  char.src = loadCharacterImage("Dead", deadFrameNum);
  char.style.width = "22.5vh";
  char.style.transform =
    "scaleX(1) translateY(" +
    currentY +
    "vh) translateX(" +
    (currentX + 10) +
    "vw)";

  currentY += 0.8;
  frame++;
  opacity -= 0.05;

  for (let t of tiles) {
    t.style.transition = "opacity 0.4s linear";
    t.style.opacity = opacity;
  }

  if (currentY >= 65) {
    char.style.opacity = "0";

    createOcean();

    if (lives === 1) {
      console.log("LAST HEART - Triggering heartgrow sequence");
      loseHeart();

      setTimeout(() => {
        char.style.opacity = "1";
        char.style.width = "15vh";
        char.src = loadCharacterImage("Idle", 1);
        char.style.transform =
          "scaleX(1) translateY(65vh) translateX(" + (currentX + 10) + "vw)";

        setTimeout(() => {
          heartgrow();
        }, 1000);
      }, 1000);
    } else {
      setTimeout(() => {
        loseHeart();
        state = 1;
        opacity = 1;
        char.style.opacity = "1";
        char.style.transform = "scaleX(-1) translateY(-2vh) translateX(-56vw)";
        currentY = -2;
        currentX = -56;
        frame = 1;
        char.style.width = "15vh";
        resetTiles();

        const ocean = document.getElementById("ocean-layer");
        if (ocean && ocean.parentNode) {
          ocean.remove();
        }

        for (let t of tiles) {
          t.style.transition = "";
          t.style.opacity = 1;
        }

        IdleAnim();
      }, 1000);
    }
    return;
  }

  animationIntervals.death = setTimeout(DeathAnim, 100);
}

/* ---------------------- JUMP ANIMATION ---------------------- */
function JumpAnim() {
  if (state != 3 || gameEnd) return;

  // Use safe image loader
  char.src = loadCharacterImage("Jump", frame);

  // Loop frame within 1-30 range
  frame = frame < 30 ? frame + 1 : 1;

  if (currentTile == 1) {
    char.style.transform =
      "scaleX(1) translateY(" +
      currentY +
      "vh) translateX(" +
      (currentX + 10) +
      "vw)";
    currentY += 0.8;
    currentX += 0.8;

    if (currentY > 45) {
      state = 5;
      frame = 1;
      currentTile++;
      DeathAnim();
      return;
    }
  } else if (currentTile == 0) {
    char.style.transform =
      "scaleX(-1) translateY(" +
      currentY +
      "vh) translateX(" +
      currentX +
      "vw)";
    currentY += 0.8;
    currentX += 0.8;

    if (currentY > 20) {
      state = 4;
      frame = 1;
      currentTile++;
      WalkAnim();
      return;
    }
  }

  animationIntervals.jump = setTimeout(JumpAnim, 100);
}

/* ---------------------- WALK ANIMATION ---------------------- */
function WalkAnim() {
  if (state != 4 || gameEnd) return;

  // Use safe image loader
  char.src = loadCharacterImage("Walk", frame);

  // Loop frame within 1-20 range
  frame = frame < 20 ? frame + 1 : 1;

  char.style.transform =
    "scaleX(1) translateY(" +
    currentY +
    "vh) translateX(" +
    (currentX + 10) +
    "vw)";

  currentX += 0.8;
  if (currentX >= 10) {
    state = 1;
    frame = 1;
    IdleAnim();
    return;
  }

  animationIntervals.walk = setTimeout(WalkAnim, 100);
}

/* ---------------------- RUN ANIMATION ---------------------- */
function RunAnim() {
  if (state != 2 || gameEnd) return;

  // Use safe image loader
  char.src = loadCharacterImage("Run", frame);

  // Loop frame within 1-20 range
  frame = frame < 20 ? frame + 1 : 1;

  if (currentTile == 1) {
    char.style.transform =
      "scaleX(1) translateY(" +
      currentY +
      "vh) translateX(" +
      (currentX + 10) +
      "vw)";
    currentX += 0.8;

    if (currentX >= 26) {
      state = 3;
      frame = 1;
      JumpAnim();
      return;
    }
  } else if (currentTile == 0) {
    char.style.transform =
      "scaleX(-1) translateY(" +
      currentY +
      "vh) translateX(" +
      currentX +
      "vw)";
    currentX += 0.8;

    if (currentX >= -32) {
      state = 3;
      frame = 1;
      JumpAnim();
      return;
    }
  }

  animationIntervals.run = setTimeout(RunAnim, 100);
}

/* ---------------------- IDLE ANIMATION ---------------------- */
function IdleAnim() {
  if (state != 1 || gameEnd) return;

  // Use safe image loader
  char.src = loadCharacterImage("Idle", frame);

  // Loop frame within 1-15 range
  frame = frame < 15 ? frame + 1 : 1;

  if (!gameEnd) {
    if (currentTile == 1) {
      char.style.transform =
        "scaleX(1) translateY(" +
        currentY +
        "vh) translateX(" +
        (currentX + 10) +
        "vw)";
    } else {
      char.style.transform =
        "scaleX(-1) translateY(" +
        currentY +
        "vh) translateX(" +
        currentX +
        "vw)";
    }
  }

  char.style.width = "15vh";

  animationIntervals.idle = setTimeout(IdleAnim, 100);
}

/* ---------------------- TILE CLICK ---------------------- */
for (let i = 0; i < tiles.length; i++) {
  tiles[i].addEventListener("click", function () {
    if (tileStatus[i] || gameEnd) return;

    checkValues();
    if (i === currentTile + 1) {
      state = 2;
      frame = 1;
      RunAnim();
    }
  });
}

/* ---------------------- START ---------------------- */
// Preload images first, then start animations
preloadImages();
createChristmasSparkles();
