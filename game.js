const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const player = {
    x: 50,
    y: 500,
    width: 30,
    height: 30,
    speed: 5,
    dx: 0,
    dy: 0,
    gravity: 0.5,
    gravityDirection: 1,
    isOnGround: false,
    startX: 50,
    startY: 500
};

const doors = {
    1: { x: 750, y: 270, width: 40, height: 60, visible: true },
    2: { x: 750, y: 240, width: 40, height: 60, visible: true },
    3: { x: 390, y: 519, width: 40, height: 60, visible: true },
    4: { x: 350, y: 450, width: 40, height: 60, visible: true },
    5: { x: 750, y: 300, width: 40, height: 60, visible: true },
    6: { x: 750, y: 270, width: 40, height: 60, visible: false }
};

const movingEnemy = {
    x: 350,
    y: 400,
    width: 50,
    height: 50,
    speed: 2,
    direction: 1,
    minX: 350,
    maxX: 500,
};

let currentLevel = 1;
let deathCount = 0;
let doorOpenMessage = "";

const levels = {
    1: [
        { x: 0, y: 580, width: 800, height: 20 },
        { x: 200, y: 400, width: 150, height: 20 },
        { x: 500, y: 300, width: 150, height: 20 }
    ],
    2: [
        { x: 0, y: 580, width: 800, height: 20 },
        { x: 300, y: 450, width: 200, height: 20 },
        { x: 100, y: 200, width: 150, height: 20 },
        { x: 600, y: 300, width: 150, height: 20 }
    ],
    3: [
        { x: 0, y: 580, width: 800, height: 20 },
        { x: 350, y: 300, width: 100, height: 20 },
        { x: 450, y: 300, width: 100, height: 20 }
    ],
    4: [
        { x: 0, y: 580, width: 800, height: 20 },
        { x: 300, y: 450, width: 200, height: 20 }
    ],
    5: [
        { x: 0, y: 580, width: 800, height: 20 },
        { x: 700, y: 100, width: 20, height: 450 },
        { x: 100, y: 450, width: 20, height: 150 },
        { x: 200, y: 400, width: 200, height: 20 },
        { x: 300, y: 250, width: 120, height: 20 },
        { x: 200, y: 100, width: 20, height: 200 },
        { x: 400, y: 300, width: 20, height: 100 },
        { x: 500, y: 200, width: 200, height: 20 },
    ],
    6: []
};

const deadlyObjects = {
    3: [
        { x: 350, y: 500, width: 20, height: 100 },
        { x: 450, y: 500, width: 20, height: 100 },
        { x: 420, y: 389, width: 80, height: 20 }
    ],
    4: [
        { x: 300, y: 500, width: 50, height: 20 },
        { x: 600, y: 500, width: 50, height: 20 }
    ],
    5: [
        { x: 40, y: 450, width: 60, height: 30 },
        { x: 600, y: 450, width: 100, height: 20 },
        { x: 700, y: 100, width: 20, height: 450 },
        { x: 100, y: 450, width: 20, height: 150 },
    ],
    6: [
        { x: 0, y: 580, width: 800, height: 20 },
    ]
};

let platforms = levels[currentLevel];
let currentDeadlyObjects = deadlyObjects[currentLevel] || [];

let timer = 15;
let timerInterval;
let gameActive = false;

function drawPlayer() {
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawPlatforms() {
    ctx.fillStyle = "#696969";
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
}

function drawDoor() {
    const door = doors[currentLevel];
    if (door.visible) {
        ctx.fillStyle = "purple";
        ctx.fillRect(door.x, door.y, door.width, door.height);
    }
}

function drawInstructions() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    if (currentLevel === 1) {
        ctx.fillText("Shift/Space - Change Gravity, Enter - Use Door", 150, 50);
    } else if (currentLevel === 3) {
        ctx.fillText("Warning: Purple Objects Kill You!", 250, 50);
        ctx.fillText("Enter - Use Door", 300, 80);
    } else if (currentLevel === 6) {
        ctx.fillText(doorOpenMessage || "Survive for 15 seconds!", 250, 50);
    }
}

function drawDeadlyObjects() {
    ctx.fillStyle = "red";
    currentDeadlyObjects.forEach(obj => {
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    });
}

function drawMovingEnemy() {
    if (currentLevel === 4) {
        ctx.fillStyle = "red";
        ctx.fillRect(movingEnemy.x, movingEnemy.y, movingEnemy.width, movingEnemy.height);
    }
}

function updateMovingEnemy() {
    if (currentLevel === 4) {
        movingEnemy.x += movingEnemy.speed * movingEnemy.direction;
        if (movingEnemy.x + movingEnemy.width > movingEnemy.maxX || movingEnemy.x < movingEnemy.minX) {
            movingEnemy.direction *= -1;
        }
    }
}

function checkCollisionWithDeadlyObjects() {
    for (let obj of currentDeadlyObjects) {
        if (player.x < obj.x + obj.width &&
            player.x + player.width > obj.x &&
            player.y < obj.y + obj.height &&
            player.y + player.height > obj.y) {
            respawnPlayer();
            break;
        }
    }
}

function updatePlayer() {
    player.dy += player.gravity * player.gravityDirection;
    player.x += player.dx;
    player.isOnGround = false;
    platforms.forEach(platform => {
        if (player.dy > 0 &&
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height <= platform.y &&
            player.y + player.height + player.dy >= platform.y) {
            player.dy = 0;
            player.isOnGround = true;
            player.y = platform.y - player.height;
        }

        if (player.dy < 0 &&
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y >= platform.y + platform.height &&
            player.y + player.dy <= platform.y + platform.height) {
            player.dy = 0;
            player.isOnGround = true;
            player.y = platform.y + platform.height;
        }
    });

    player.y += player.dy;

    if (player.y > canvas.height || player.x < 0 || player.x + player.width > canvas.width) {
        respawnPlayer();
    }
    if (player.y < 0) {
        respawnPlayer();
    }

    checkCollisionWithDeadlyObjects();
}

function respawnPlayer() {
    player.x = player.startX;
    player.y = player.startY;
    player.dx = 0;
    player.dy = 0;
    deathCount++;
    updateDeathCounter();
    if (currentLevel === 6) {
        timer = 15;
        doorOpenMessage = "";
    }
}

function goToNextLevel() {
    currentLevel++;
    if (levels[currentLevel]) {
        player.x = 50;
        player.y = 500;
        player.dy = 0;
        player.dx = 0;
        platforms = levels[currentLevel];
        currentDeadlyObjects = deadlyObjects[currentLevel] || [];
        if (currentLevel === 6) {
            startTimer();
        }
    } else {
        alert("Win!");
    }
}

function checkForDoor() {
    const door = doors[currentLevel];
    if (player.x + player.width > door.x &&
        player.x < door.x + door.width &&
        player.y + player.height > door.y &&
        player.y < door.y + door.height) {
        return true;
    }
    return false;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function moveRight() {
    player.dx = player.speed;
}

function moveLeft() {
    player.dx = -player.speed;
}

function stopMove() {
    player.dx = 0;
}

function toggleGravity() {
    player.gravityDirection *= -1;
}

document.addEventListener("keydown", (e) => {
    if (e.code === "ArrowRight") {
        moveRight();
    } else if (e.code === "ArrowLeft") {
        moveLeft();
    } else if (e.code === "Space" || e.code === "ShiftLeft") {
        toggleGravity();
    } else if (e.code === "Enter" && checkForDoor()) {
        goToNextLevel();
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowRight" || e.code === "ArrowLeft") {
        stopMove();
    }
});

function startTimer() {
    gameActive = true;
    timerInterval = setInterval(() => {
        if (timer > 0) {
            timer--;
        } else {
            clearInterval(timerInterval);
            doorOpenMessage = "The door is now open!";
            doors[6].visible = true;
            timer = null;
        }
    }, 1000);
}

function updateDeathCounter() {
    document.getElementById('deathCounter').innerText = `Deaths: ${deathCount}`;
}

function gameLoop() {
    clearCanvas();
    drawPlatforms();
    drawPlayer();
    drawDoor();
    drawDeadlyObjects();
    drawMovingEnemy();
    drawInstructions();
    updatePlayer();
    updateMovingEnemy();
    if (currentLevel === 6 && timer === null) {
        ctx.fillStyle = "purple";
        const door = doors[currentLevel];
        ctx.fillRect(door.x, door.y, door.width, door.height);
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();