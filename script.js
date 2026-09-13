/* =========================================================

CAFÉ RUSH

Three.js Game + Google Sheets API

========================================================= */

/* =========================================================

GOOGLE APPS SCRIPT URL

========================================================= */

const API_URL = "https://script.google.com/macros/s/AKfycbx2tSGF9sUVy9ffq53QK5yoqg41Q8LG-9AScYXjyi9DGAguujkICFonikw84h4kWOaryw/exec";

/* =========================================================
DOM
========================================================= */

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const usernameInput = document.getElementById("username");
const whatsappInput = document.getElementById("whatsapp");
const formError = document.getElementById("formError");

const playButton = document.getElementById("playButton");
const playAgainButton = document.getElementById("playAgainButton");
const menuButton = document.getElementById("menuButton");

const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");

const finalScoreElement = document.getElementById("finalScore");
const submitStatus = document.getElementById("submitStatus");

const leaderboardModal = document.getElementById("leaderboardModal");
const startLeaderboardButton =
document.getElementById("startLeaderboardButton");
const resultLeaderboardButton =
document.getElementById("resultLeaderboardButton");
const closeLeaderboard =
document.getElementById("closeLeaderboard");

const leaderboardLoading =
document.getElementById("leaderboardLoading");

const leaderboardError =
document.getElementById("leaderboardError");

const leaderboardContent =
document.getElementById("leaderboardContent");

const leaderboardRows =
document.getElementById("leaderboardRows");

/* =========================================================
GAME VARIABLES
========================================================= */

let scene;
let camera;
let renderer;

let player;
let playerBody;

let treats = [];
let effects = [];

let clock;

let score = 0;
let timeLeft = 60;

let gameRunning = false;
let animationId = null;

let lastSpawnTime = 0;

const keys = {};

let playerName = "";
let playerWhatsApp = "";

/* =========================================================
GAME SETTINGS
========================================================= */

const ARENA_SIZE = 26;

const PLAYER_SPEED = 7;

const TREAT_COUNT = 9;

const TREAT_SPAWN_INTERVAL = 900;

/* =========================================================
COLORS
========================================================= */

const COLORS = {
pink: 0xf58fb2,
pinkDark: 0xd45d83,
pinkLight: 0xffdce8,

cream: 0xfff7ef,   

white: 0xffffff,   

brown: 0x9b5f55,   

red: 0xe85d75,   

purple: 0xb68ad9,   

blue: 0x80cde8,   

green: 0x8dcf9c,   

yellow: 0xffd36e

};

/* =========================================================
SCREEN FUNCTIONS
========================================================= */

function showScreen(screen) {

startScreen.classList.remove("active");   
gameScreen.classList.remove("active");   
gameOverScreen.classList.remove("active");   

screen.classList.add("active");

}

/* =========================================================
INPUT VALIDATION
========================================================= */

function validateForm() {

const username = usernameInput.value.trim();   
const whatsapp = whatsappInput.value.trim();   

if (username.length < 2) {   

    formError.textContent =   
        "Please enter a username.";   

    return false;   
}   

if (!/^[0-9+\-\s()]{8,20}$/.test(whatsapp)) {   

    formError.textContent =   
        "Please enter a valid WhatsApp number.";   

    return false;   
}   

formError.textContent = "";   

playerName = username;   
playerWhatsApp = whatsapp;   

return true;

}

/* =========================================================
START GAME
========================================================= */

function startGame() {

if (!validateForm()) {   
    return;   
}   

showScreen(gameScreen);   

initializeGame();   

score = 0;   
timeLeft = 60;   

scoreElement.textContent = score;   
timerElement.textContent = timeLeft;   

gameRunning = true;   

lastSpawnTime = performance.now();   

clock.start();   

startCountdown();   

animate();

}

/* =========================================================
THREE.JS INITIALIZATION
========================================================= */

function initializeGame() {

if (renderer) {   

    renderer.dispose();   

    const canvas = renderer.domElement;   

    if (canvas.parentNode) {   
        canvas.parentNode.removeChild(canvas);   
    }   
}   

treats = [];   
effects = [];   

scene = new THREE.Scene();   

scene.background = new THREE.Color(0xffdce8);   


/* Camera */   

camera = new THREE.PerspectiveCamera(   
    55,   
    window.innerWidth / window.innerHeight,   
    0.1,   
    100   
);   

camera.position.set(0, 17, 17);   

camera.lookAt(0, 0, 0);   


/* Renderer */   

renderer = new THREE.WebGLRenderer({   
    antialias: true,   
    powerPreference: "high-performance"   
});   

renderer.setPixelRatio(   
    Math.min(window.devicePixelRatio, 1.5)   
);   

renderer.setSize(   
    window.innerWidth,   
    window.innerHeight   
);   

renderer.shadowMap.enabled = true;   
renderer.shadowMap.type = THREE.PCFSoftShadowMap;   

document.getElementById("gameCanvas").appendChild(   
    renderer.domElement   
);   


/* Lighting */   

const ambientLight = new THREE.HemisphereLight(   
    0xffffff,   
    0xffb7ca,   
    2.3   
);   

scene.add(ambientLight);   


const directionalLight =   
    new THREE.DirectionalLight(   
        0xffffff,   
        2   
    );   

directionalLight.position.set(   
    5,   
    15,   
    8   
);   

directionalLight.castShadow = true;   

directionalLight.shadow.mapSize.width = 1024;   
directionalLight.shadow.mapSize.height = 1024;   

scene.add(directionalLight);   


createArena();   

createPlayer();   

createCafeDecorations();   

createInitialTreats();   


clock = new THREE.Clock();

}

/* =========================================================
ARENA
========================================================= */

function createArena() {

/* Floor */   

const floorGeometry =   
    new THREE.BoxGeometry(   
        ARENA_SIZE,   
        0.5,   
        ARENA_SIZE   
    );   

const floorMaterial =   
    new THREE.MeshStandardMaterial({   
        color: 0xffeef4,   
        roughness: 0.8   
    });   

const floor =   
    new THREE.Mesh(   
        floorGeometry,   
        floorMaterial   
    );   

floor.position.y = -0.25;   

floor.receiveShadow = true;   

scene.add(floor);   


/* Floor decoration tiles */   

const tileGeometry =   
    new THREE.PlaneGeometry(   
        2,   
        2   
    );   

const tileMaterial =   
    new THREE.MeshBasicMaterial({   
        color: 0xffdce8,   
        transparent: true,   
        opacity: 0.55   
    });   

for (   
    let x = -12;   
    x <= 12;   
    x += 4   
) {   

    for (   
        let z = -12;   
        z <= 12;   
        z += 4   
    ) {   

        const tile =   
            new THREE.Mesh(   
                tileGeometry,   
                tileMaterial   
            );   

        tile.rotation.x = -Math.PI / 2;   

        tile.position.set(   
            x,   
            0.012,   
            z   
        );   

        scene.add(tile);   
    }   
}   


/* Café walls */   

createWall(   
    0,   
    2,   
    -13,   
    26,   
    4,   
    0.5   
);   

createWall(   
    -13,   
    2,   
    0,   
    0.5,   
    4,   
    26   
);   

createWall(   
    13,   
    2,   
    0,   
    0.5,   
    4,   
    26   
);   


/* Back café sign */   

const signGeometry =   
    new THREE.BoxGeometry(   
        7,   
        1.5,   
        0.25   
    );   

const signMaterial =   
    new THREE.MeshStandardMaterial({   
        color: COLORS.pink   
    });   

const sign =   
    new THREE.Mesh(   
        signGeometry,   
        signMaterial   
    );   

sign.position.set(   
    0,   
    4.2,   
    -12.5   
);   

sign.castShadow = true;   

scene.add(sign);

}

function createWall(
x,
y,
z,
width,
height,
depth
) {

const geometry =   
    new THREE.BoxGeometry(   
        width,   
        height,   
        depth   
    );   

const material =   
    new THREE.MeshStandardMaterial({   
        color: 0xffe7ef   
    });   

const wall =   
    new THREE.Mesh(   
        geometry,   
        material   
    );   

wall.position.set(   
    x,   
    y,   
    z   
);   

wall.castShadow = true;   
wall.receiveShadow = true;   

scene.add(wall);

}

/* =========================================================
PLAYER
========================================================= */

function createPlayer() {

player = new THREE.Group();   

player.position.set(   
    0,   
    0,   
    5   
);   


/* Body */   

const bodyGeometry =   
    new THREE.CapsuleGeometry(   
        0.65,   
        0.8,   
        4,   
        8   
    );   

const bodyMaterial =   
    new THREE.MeshStandardMaterial({   
        color: COLORS.pink   
    });   

playerBody =   
    new THREE.Mesh(   
        bodyGeometry,   
        bodyMaterial   
    );   

playerBody.position.y = 1;   

playerBody.castShadow = true;   

player.add(playerBody);   


/* Head */   

const headGeometry =   
    new THREE.SphereGeometry(   
        0.72,   
        16,   
        12   
    );   

const headMaterial =   
    new THREE.MeshStandardMaterial({   
        color: 0xffeadf   
    });   

const head =   
    new THREE.Mesh(   
        headGeometry,   
        headMaterial   
    );   

head.position.y = 2.1;   

head.castShadow = true;   

player.add(head);   


/* Hair */   

const hairGeometry =   
    new THREE.SphereGeometry(   
        0.77,   
        16,   
        8,   
        0,   
        Math.PI * 2,   
        0,   
        Math.PI * 0.55   
    );   

const hairMaterial =   
    new THREE.MeshStandardMaterial({   
        color: 0x8d5361   
    });   

const hair =   
    new THREE.Mesh(   
        hairGeometry,   
        hairMaterial   
    );   

hair.position.y = 2.3;   

player.add(hair);   


/* Eyes */   

createEye(   
    -0.25,   
    2.18,   
    0.58   
);   

createEye(   
    0.25,   
    2.18,   
    0.58   
);   


/* Bow */   

const bowMaterial =   
    new THREE.MeshStandardMaterial({   
        color: COLORS.red   
    });   

const bowLeft =   
    new THREE.Mesh(   
        new THREE.SphereGeometry(   
            0.28,   
            8,   
            6   
        ),   
        bowMaterial   
    );   

bowLeft.scale.set(   
    1.3,   
    0.65,   
    0.5   
);   

bowLeft.position.set(   
    -0.55,   
    2.55,   
    0   
);   

player.add(bowLeft);   


const bowRight =   
    bowLeft.clone();   

bowRight.position.x = 0.55;   

player.add(bowRight);   


/* Shadow */   

const shadow =   
    new THREE.Mesh(   
        new THREE.CircleGeometry(   
            0.85,   
            20   
        ),   
        new THREE.MeshBasicMaterial({   
            color: 0xb96d83,   
            transparent: true,   
            opacity: 0.2   
        })   
    );   

shadow.rotation.x = -Math.PI / 2;   

shadow.position.y = 0.01;   

player.add(shadow);   


scene.add(player);

}

function createEye(
x,
y,
z
) {

const geometry =   
    new THREE.SphereGeometry(   
        0.08,   
        8,   
        8   
    );   

const material =   
    new THREE.MeshBasicMaterial({   
        color: 0x54313a   
    });   

const eye =   
    new THREE.Mesh(   
        geometry,   
        material   
    );   

eye.position.set(   
    x,   
    y,   
    z   
);   

player.add(eye);

}

/* =========================================================
CAFÉ DECORATIONS
========================================================= */

function createCafeDecorations() {

/* Tables */   

createTable(-8, -7);   
createTable(8, -7);   

/* Counter */   

const counter =   
    new THREE.Mesh(   
        new THREE.BoxGeometry(   
            6,   
            2,   
            1.6   
        ),   
        new THREE.MeshStandardMaterial({   
            color: 0xffb7cb   
        })   
    );   

counter.position.set(   
    0,   
    1,   
    -10   
);   

counter.castShadow = true;   

scene.add(counter);   


/* Café cups on counter */   

for (   
    let i = -2;   
    i <= 2;   
    i++   
) {   

    createCup(   
        i * 1.1,   
        2.25,   
        -10   
    );   
}

}

function createTable(
x,
z
) {

const group =   
    new THREE.Group();   


const top =   
    new THREE.Mesh(   
        new THREE.CylinderGeometry(   
            1.7,   
            1.7,   
            0.25,   
            20   
        ),   
        new THREE.MeshStandardMaterial({   
            color: 0xffc3d4   
        })   
    );   

top.position.y = 1.5;   

top.castShadow = true;   

group.add(top);   


const leg =   
    new THREE.Mesh(   
        new THREE.CylinderGeometry(   
            0.18,   
            0.3,   
            1.5,   
            10   
        ),   
        new THREE.MeshStandardMaterial({   
            color: 0xf0a0b9   
        })   
    );   

leg.position.y = 0.75;   

leg.castShadow = true;   

group.add(leg);   

group.position.set(   
    x,   
    0,   
    z   
);   

scene.add(group);

}

function createCup(
x,
y,
z
) {

const cup =   
    new THREE.Mesh(   
        new THREE.CylinderGeometry(   
            0.3,   
            0.25,   
            0.6,   
            12   
        ),   
        new THREE.MeshStandardMaterial({   
            color: 0xffffff   
        })   
    );   

cup.position.set(   
    x,   
    y,   
    z   
);   

scene.add(cup);

}

/* =========================================================
TREATS
========================================================= */

const treatTypes = [

{   
    type: "strawberry",   
    points: 10   
},   

{   
    type: "cupcake",   
    points: 10   
},   

{   
    type: "donut",   
    points: 10   
},   

{   
    type: "macaron",   
    points: 10   
},   

{   
    type: "cake",   
    points: 20   
},   

{   
    type: "milk",   
    points: 10   
},   

{   
    type: "bubbletea",   
    points: 20   
}

];

function createInitialTreats() {

for (   
    let i = 0;   
    i < TREAT_COUNT;   
    i++   
) {   

    spawnTreat();   
}

}

function spawnTreat() {

const data =   
    treatTypes[   
        Math.floor(   
            Math.random() *   
            treatTypes.length   
        )   
    ];   


const treat =   
    createTreatMesh(   
        data.type   
    );   


let x;   
let z;   

let validPosition = false;   


while (!validPosition) {   

    x =   
        THREE.MathUtils.randFloat(   
            -11,   
            11   
        );   

    z =   
        THREE.MathUtils.randFloat(   
            -9,   
            10   
        );   

    validPosition = true;   


    /* Don't spawn too close to player */   

    if (   
        player &&   
        Math.hypot(   
            x - player.position.x,   
            z - player.position.z   
        ) < 2.5   
    ) {   

        validPosition = false;   
    }   
}   


treat.position.set(   
    x,   
    0.7,   
    z   
);   

treat.userData = {   
    type: data.type,   
    points: data.points,   
    baseY: 0.7,   
    phase: Math.random() * Math.PI * 2   
};   

scene.add(treat);   

treats.push(treat);

}

function createTreatMesh(type) {

const group =   
    new THREE.Group();   


switch (type) {   

    case "strawberry": {   

        const body =   
            new THREE.Mesh(   
                new THREE.SphereGeometry(   
                    0.55,   
                    12,   
                    12   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: COLORS.red   
                })   
            );   

        body.scale.set(   
            0.9,   
            1.1,   
            0.9   
        );   

        group.add(body);   


        const leaf =   
            new THREE.Mesh(   
                new THREE.ConeGeometry(   
                    0.25,   
                    0.35,   
                    5   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: COLORS.green   
                })   
            );   

        leaf.position.y = 0.55;   

        group.add(leaf);   

        break;   
    }   


    case "cupcake": {   

        const cake =   
            new THREE.Mesh(   
                new THREE.CylinderGeometry(   
                    0.5,   
                    0.6,   
                    0.55,   
                    12   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: 0xf0a16f   
                })   
            );   

        group.add(cake);   


        const cream =   
            new THREE.Mesh(   
                new THREE.SphereGeometry(   
                    0.55,   
                    12,   
                    8   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: 0xfff6f7   
                })   
            );   

        cream.position.y = 0.45;   

        cream.scale.y = 0.7;   

        group.add(cream);   

        break;   
    }   


    case "donut": {   

        const donut =   
            new THREE.Mesh(   
                new THREE.TorusGeometry(   
                    0.5,   
                    0.2,   
                    10,   
                    18   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: 0xc98262   
                })   
            );   

        donut.rotation.x =   
            Math.PI / 2;   

        group.add(donut);   


        const icing =   
            new THREE.Mesh(   
                new THREE.TorusGeometry(   
                    0.5,   
                    0.08,   
                    8,   
                    18   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: COLORS.pink   
                })   
            );   

        icing.rotation.x =   
            Math.PI / 2;   

        icing.position.y = 0.08;   

        group.add(icing);   

        break;   
    }   


    case "macaron": {   

        const bottom =   
            new THREE.Mesh(   
                new THREE.CylinderGeometry(   
                    0.55,   
                    0.55,   
                    0.22,   
                    16   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: COLORS.purple   
                })   
            );   

        bottom.position.y = 0.1;   

        group.add(bottom);   


        const top =   
            bottom.clone();   

        top.position.y = 0.4;   

        group.add(top);   


        const cream =   
            new THREE.Mesh(   
                new THREE.CylinderGeometry(   
                    0.53,   
                    0.53,   
                    0.12,   
                    16   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: 0xfff8f5   
                })   
            );   

        cream.position.y = 0.25;   

        group.add(cream);   

        break;   
    }   


    case "cake": {   

        const base =   
            new THREE.Mesh(   
                new THREE.BoxGeometry(   
                    1.0,   
                    0.55,   
                    0.85   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: 0xffb1c7   
                })   
            );   

        group.add(base);   


        const frosting =   
            new THREE.Mesh(   
                new THREE.BoxGeometry(   
                    1.05,   
                    0.22,   
                    0.9   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: 0xfff8fa   
                })   
            );   

        frosting.position.y = 0.38;   

        group.add(frosting);   

        break;   
    }   


    case "milk": {   

        const cup =   
            new THREE.Mesh(   
                new THREE.CylinderGeometry(   
                    0.42,   
                    0.35,   
                    0.85,   
                    12   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: 0xfff5f7   
                })   
            );   

        group.add(cup);   


        const straw =   
            new THREE.Mesh(   
                new THREE.CylinderGeometry(   
                    0.055,   
                    0.055,   
                    1.2,   
                    8   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: COLORS.red   
                })   
            );   

        straw.rotation.z = -0.15;   

        straw.position.set(   
            0.15,   
            0.65,   
            0   
        );   

        group.add(straw);   

        break;   
    }   


    case "bubbletea": {   

        const cup =   
            new THREE.Mesh(   
                new THREE.CylinderGeometry(   
                    0.45,   
                    0.38,   
                    0.9,   
                    12   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: 0xb8e7f0   
                })   
            );   

        group.add(cup);   


        const straw =   
            new THREE.Mesh(   
                new THREE.CylinderGeometry(   
                    0.06,   
                    0.06,   
                    1.3,   
                    8   
                ),   
                new THREE.MeshStandardMaterial({   
                    color: COLORS.purple   
                })   
            );   

        straw.rotation.z = 0.12;   

        straw.position.y = 0.7;   

        group.add(straw);   


        /* Boba */   

        for (   
            let i = 0;   
            i < 4;   
            i++   
        ) {   

            const boba =   
                new THREE.Mesh(   
                    new THREE.SphereGeometry(   
                        0.09,   
                        7,   
                        7   
                    ),   
                    new THREE.MeshStandardMaterial({   
                        color: 0x65453f   
                    })   
                );   

            boba.position.set(   
                (i - 1.5) * 0.16,   
                -0.3,   
                0.3   
            );   

            group.add(boba);   
        }   

        break;   
    }   

}   


return group;

}

/* =========================================================
CAFÉ TREATS UPDATE
========================================================= */

function updateTreats(delta) {

const now = performance.now();   


/* Spawn new treats */   

if (   
    now - lastSpawnTime >   
    TREAT_SPAWN_INTERVAL   
) {   

    if (   
        treats.length <   
        TREAT_COUNT   
    ) {   

        spawnTreat();   
    }   

    lastSpawnTime = now;   
}   


/* Animate treats */   

treats.forEach(   
    (treat, index) => {   

        if (!treat.parent) {   
            return;   
        }   

        const data =   
            treat.userData;   

        data.phase += delta * 3;   

        treat.position.y =   
            data.baseY +   
            Math.sin(data.phase) *   
            0.15;   

        treat.rotation.y +=   
            delta * 1.5;   


        /* Collision */   

        if (   
            player &&   
            player.position.distanceTo(   
                treat.position   
            ) < 1.35   
        ) {   

            collectTreat(   
                treat,   
                index   
            );   
        }   
    }   
);

}

/* =========================================================
COLLECT TREAT
========================================================= */

function collectTreat(
treat,
index
) {

const points =   
    treat.userData.points;   


score += points;   

scoreElement.textContent =   
    score;   


createCollectEffect(   
    treat.position.clone()   
);   


scene.remove(treat);   

treats.splice(   
    index,   
    1   
);

}

/* =========================================================
COLLECT EFFECT
========================================================= */

function createCollectEffect(
position
) {

const group =   
    new THREE.Group();   

group.position.copy(position);   


const material =   
    new THREE.MeshBasicMaterial({   
        color: 0xffffff,   
        transparent: true,   
        opacity: 1   
    });   


for (   
    let i = 0;   
    i < 7;   
    i++   
) {   

    const particle =   
        new THREE.Mesh(   
            new THREE.SphereGeometry(   
                0.07,   
                6,   
                6   
            ),   
            material.clone()   
        );   

    const angle =   
        (Math.PI * 2 * i) / 7;   

    particle.userData.velocity =   
        new THREE.Vector3(   
            Math.cos(angle),   
            Math.random() * 1.2,   
            Math.sin(angle)   
        ).multiplyScalar(2);   

    group.add(particle);   
}   


scene.add(group);   

effects.push({   
    object: group,   
    life: 0   
});

}

/* =========================================================
EFFECT UPDATE
========================================================= */

function updateEffects(delta) {

for (   
    let i = effects.length - 1;   
    i >= 0;   
    i--   
) {   

    const effect =   
        effects[i];   

    effect.life += delta;   

    effect.object.children.forEach(   
        particle => {   

            particle.position.addScaledVector(   
                particle.userData.velocity,   
                delta   
            );   

            particle.userData.velocity.y -=   
                2 * delta;   

            particle.material.opacity =   
                Math.max(   
                    0,   
                    1 - effect.life * 2   
                );   
        }   
    );   


    if (   
        effect.life > 0.5   
    ) {   

        scene.remove(   
            effect.object   
        );   

        effects.splice(   
            i,   
            1   
        );   
    }   
}

}

/* =========================================================
PLAYER MOVEMENT
========================================================= */

function updatePlayer(delta) {

if (!player) {   
    return;   
}   


let x = 0;   
let z = 0;   


if (   
    keys["KeyW"] ||   
    keys["ArrowUp"]   
) {   

    z -= 1;   
}   


if (   
    keys["KeyS"] ||   
    keys["ArrowDown"]   
) {   

    z += 1;   
}   


if (   
    keys["KeyA"] ||   
    keys["ArrowLeft"]   
) {   

    x -= 1;   
}   


if (   
    keys["KeyD"] ||   
    keys["ArrowRight"]   
) {   

    x += 1;   
}   


const direction =   
    new THREE.Vector3(   
        x,   
        0,   
        z   
    );   


if (   
    direction.length() > 0   
) {   

    direction.normalize();   


    player.position.x +=   
        direction.x *   
        PLAYER_SPEED *   
        delta;   

    player.position.z +=   
        direction.z *   
        PLAYER_SPEED *   
        delta;   


    /* Rotate player */   

    const targetRotation =   
        Math.atan2(   
            direction.x,   
            direction.z   
        );   

    player.rotation.y =   
        THREE.MathUtils.lerp(   
            player.rotation.y,   
            targetRotation,   
            0.2   
        );   


    /* Cute bounce */   

    playerBody.position.y =   
        1 +   
        Math.sin(   
            performance.now() * 0.015   
        ) * 0.06;   
}   


/* Keep player inside arena */   

player.position.x =   
    THREE.MathUtils.clamp(   
        player.position.x,   
        -11.5,   
        11.5   
    );   

player.position.z =   
    THREE.MathUtils.clamp(   
        player.position.z,   
        -11,   
        10.5   
    );

}

/* =========================================================
CAMERA
========================================================= */

function updateCamera() {

if (!player) {   
    return;   
}   

const target =   
    new THREE.Vector3(   
        player.position.x,   
        0,   
        player.position.z   
    );   

const desired =   
    new THREE.Vector3(   
        player.position.x,   
        17,   
        player.position.z + 17   
    );   


camera.position.lerp(   
    desired,   
    0.08   
);   

camera.lookAt(target);

}

/* =========================================================
COUNTDOWN
========================================================= */

let countdownInterval;

function startCountdown() {

clearInterval(   
    countdownInterval   
);   


countdownInterval =   
    setInterval(   
        () => {   

            if (!gameRunning) {   
                return;   
            }   


            timeLeft--;   

            timerElement.textContent =   
                timeLeft;   


            if (   
                timeLeft <= 0   
            ) {   

                endGame();   
            }   

        },   
        1000   
    );

}

/* =========================================================
END GAME
========================================================= */

function endGame() {

if (!gameRunning) {   
    return;   
}   


gameRunning = false;   

clearInterval(   
    countdownInterval   
);   


if (animationId) {   

    cancelAnimationFrame(   
        animationId   
    );   

    animationId = null;   
}   


finalScoreElement.textContent =   
    score;   


showScreen(   
    gameOverScreen   
);   


submitScore();

}

/* =========================================================
ANIMATION LOOP
========================================================= */

function animate() {

if (!gameRunning) {   
    return;   
}   


animationId =   
    requestAnimationFrame(   
        animate   
    );   


const delta =   
    Math.min(   
        clock.getDelta(),   
        0.05   
    );   


updatePlayer(delta);   

updateTreats(delta);   

updateEffects(delta);   

updateCamera();   

renderer.render(   
    scene,   
    camera   
);

}

/* =========================================================
KEYBOARD
========================================================= */

window.addEventListener(
"keydown",
event => {

keys[event.code] = true;   

    if (   
        [   
            "ArrowUp",   
            "ArrowDown",   
            "ArrowLeft",   
            "ArrowRight",   
            "Space"   
        ].includes(event.code)   
    ) {   

        event.preventDefault();   
    }   
}

);

window.addEventListener(
"keyup",
event => {

keys[event.code] = false;   
}

);

/* =========================================================
MOBILE CONTROLS
========================================================= */

document.querySelectorAll(
".control"
).forEach(button => {

const key =   
    button.dataset.key;   


const start =   
    event => {   

        event.preventDefault();   

        keys[key] = true;   
    };   


const stop =   
    event => {   

        event.preventDefault();   

        keys[key] = false;   
    };   


button.addEventListener(   
    "touchstart",   
    start,   
    { passive: false }   
);   

button.addEventListener(   
    "touchend",   
    stop,   
    { passive: false }   
);   

button.addEventListener(   
    "touchcancel",   
    stop,   
    { passive: false }   
);   


button.addEventListener(   
    "mousedown",   
    start   
);   

button.addEventListener(   
    "mouseup",   
    stop   
);   

button.addEventListener(   
    "mouseleave",   
    stop   
);

});

/* =========================================================
WINDOW RESIZE
========================================================= */

window.addEventListener(
"resize",
() => {

if (!camera || !renderer) {   
        return;   
    }   

    camera.aspect =   
        window.innerWidth /   
        window.innerHeight;   

    camera.updateProjectionMatrix();   

    renderer.setSize(   
        window.innerWidth,   
        window.innerHeight   
    );   
}

);

/* =========================================================
GOOGLE SHEETS - SUBMIT SCORE
========================================================= */

async function submitScore() {

if (   
    !API_URL ||   
    API_URL.includes(   
        "PASTE_YOUR"   
    )   
) {   

    submitStatus.textContent =   
        "Score saved locally for this session. Connect Google Sheets to submit online.";   

    return;   
}   


submitStatus.textContent =   
    "Saving your score...";   


const data = {   

    username: playerName,   

    whatsapp: playerWhatsApp,   

    score: score,   

    playedAt:   
        new Date().toISOString()   
};   


try {   

    const response =   
        await fetch(   
            API_URL,   
            {   
                method: "POST",   

                headers: {   
                    "Content-Type":   
                        "text/plain;charset=utf-8"   
                },   

                body:   
                    JSON.stringify(data)   
            }   
        );   


    const result =   
        await response.json();   


    if (   
        result.success   
    ) {   

        submitStatus.textContent =   
            "Score saved successfully! ✨";   

    } else {   

        throw new Error(   
            result.message ||   
            "Failed to save score."   
        );   
    }   

} catch (error) {   

    console.error(   
        "Submit score error:",   
        error   
    );   

    submitStatus.textContent =   
        "Couldn't save the score. Check your connection/API.";   
}

}

/* =========================================================
LEADERBOARD
========================================================= */

async function openLeaderboard() {

leaderboardModal.classList.add(   
    "active"   
);   


leaderboardLoading.style.display =   
    "block";   

leaderboardError.style.display =   
    "none";   

leaderboardContent.style.display =   
    "none";   

leaderboardRows.innerHTML = "";   


if (   
    !API_URL ||   
    API_URL.includes(   
        "PASTE_YOUR"   
    )   
) {   

    showLeaderboardError(   
        "Google Sheets API is not connected yet."   
    );   

    return;   
}   


try {   

    const response =   
        await fetch(   
            API_URL + "?action=leaderboard",   
            {   
                method: "GET"   
            }   
        );   


    const result =   
        await response.json();   


    if (   
        !result.success   
    ) {   

        throw new Error(   
            result.message ||   
            "Could not load leaderboard."   
        );   
    }   


    renderLeaderboard(   
        result.data || []   
    );   


} catch (error) {   

    console.error(   
        "Leaderboard error:",   
        error   
    );   

    showLeaderboardError(   
        "Couldn't load the leaderboard. Please try again."   
    );   
}

}

/* =========================================================
RENDER LEADERBOARD
========================================================= */

function renderLeaderboard(
players
) {

leaderboardLoading.style.display =   
    "none";   

leaderboardError.style.display =   
    "none";   

leaderboardContent.style.display =   
    "block";   


leaderboardRows.innerHTML = "";   


if (   
    players.length === 0   
) {   

    leaderboardRows.innerHTML = `   
        <div class="leaderboard-row">   
            <span>—</span>   
            <span>No scores yet!</span>   
            <span>—</span>   
        </div>   
    `;   

    return;   
}   


players   
    .slice(0, 10)   
    .forEach(   
        (player, index) => {   

            const row =   
                document.createElement(   
                    "div"   
                );   

            row.className =   
                "leaderboard-row";   


            let rankIcon =   
                index + 1;   

            if (index === 0) {   
                rankIcon = "👑";   
            } else if (index === 1) {   
                rankIcon = "🥈";   
            } else if (index === 2) {   
                rankIcon = "🥉";   
            }   


            row.innerHTML = `   
                <span class="rank">   
                    ${rankIcon}   
                </span>   

                <span class="player">   
                    ${escapeHTML(player.username)}   
                </span>   

                <span class="points">   
                    ${Number(player.score) || 0}   
                </span>   
            `;   


            leaderboardRows.appendChild(   
                row   
            );   
        }   
    );

}

/* =========================================================
ERROR
========================================================= */

function showLeaderboardError(
message
) {

leaderboardLoading.style.display =   
    "none";   

leaderboardContent.style.display =   
    "none";   

leaderboardError.style.display =   
    "block";   

leaderboardError.textContent =   
    message;

}

/* =========================================================
HTML ESCAPE
========================================================= */

function escapeHTML(
value
) {

return String(value)   
    .replaceAll("&", "&amp;")   
    .replaceAll("<", "&lt;")   
    .replaceAll(">", "&gt;")   
    .replaceAll('"', "&quot;")   
    .replaceAll("'", "&#039;");

}

/* =========================================================
LEADERBOARD EVENTS
========================================================= */

startLeaderboardButton.addEventListener(
"click",
openLeaderboard
);

resultLeaderboardButton.addEventListener(
"click",
openLeaderboard
);

closeLeaderboard.addEventListener(
"click",
() => {

leaderboardModal.classList.remove(   
        "active"   
    );   
}

);

leaderboardModal.addEventListener(
"click",
event => {

if (   
        event.target ===   
        leaderboardModal   
    ) {   

        leaderboardModal.classList.remove(   
            "active"   
        );   
    }   
}

);

/* =========================================================
BUTTON EVENTS
========================================================= */

playButton.addEventListener(
"click",
startGame
);

playAgainButton.addEventListener(
"click",
startGame
);

menuButton.addEventListener(
"click",
() => {

gameRunning = false;   

    clearInterval(   
        countdownInterval   
    );   

    if (animationId) {   

        cancelAnimationFrame(   
            animationId   
        );   

        animationId = null;   
    }   

    showScreen(   
        startScreen   
    );   
}

);

/* =========================================================
ENTER KEY
========================================================= */

usernameInput.addEventListener(
"keydown",
event => {

if (event.key === "Enter") {   
        playButton.click();   
    }   
}

);

whatsappInput.addEventListener(
"keydown",
event => {

if (event.key === "Enter") {   
        playButton.click();   
    }   
}

);                                                                                                                                                                                      ini, bener ga ini codingannya?
