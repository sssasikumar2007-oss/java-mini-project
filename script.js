
const rows = 12;
const cols = 20;

const warehouse = document.getElementById("warehouse");
const statusText = document.getElementById("status");
const pathLength = document.getElementById("pathLength");
const simStatus = document.getElementById("simStatus");

const goals = {
    pick: { x: 18, y: 1 },
    drop: { x: 18, y: 10 },
    charge: { x: 1, y: 10 }
};

const robots = [
    { x: 1, y: 1, color: "R1" },
    { x: 1, y: 5, color: "R2" },
    { x: 1, y: 10, color: "R3" }
];

let obstacles = new Set();
let paths = [[], [], []];
let running = true;
let selectedRobot = 0;

function key(x, y) {
    return `${x},${y}`;
}

function inside(x, y) {
    return x >= 0 && x < cols && y >= 0 && y < rows;
}

function isRobotCell(x, y) {
    return robots.some(r => r.x === x && r.y === y);
}

function createShelves() {
    for (let y = 2; y < 10; y++) {
        if (y !== 5) {
            obstacles.add(key(5, y));
            obstacles.add(key(10, y));
            obstacles.add(key(15, y));
        }
    }

    for (let x = 7; x < 10; x++) {
        obstacles.add(key(x, 3));
        obstacles.add(key(x, 8));
    }

    for (let x = 12; x < 15; x++) {
        obstacles.add(key(x, 5));
    }
}

function drawWarehouse() {
    warehouse.innerHTML = "";

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.x = x;
            cell.dataset.y = y;

            if (obstacles.has(key(x, y))) {
                cell.classList.add("shelf");
            }

            paths.forEach((path, index) => {
                if (path.some(p => p.x === x && p.y === y)) {
                    cell.classList.add("path");
                }
            });

            robots.forEach((robot, index) => {
                if (robot.x === x && robot.y === y) {
                    cell.classList.remove("path");
                    cell.classList.remove("shelf");
                    cell.classList.add("robot");
                    cell.textContent = index + 1;
                }
            });

            if (robots[selectedRobot].x === x &&
                robots[selectedRobot].y === y) {
                cell.classList.add("start");
            }

            const selectedGoal = goals[
                document.getElementById("goal").value
            ];

            if (selectedGoal.x === x && selectedGoal.y === y) {
                cell.classList.add("goal");
            }

            cell.addEventListener("click", () => {
                const k = key(x, y);

                if (isRobotCell(x, y)) {
                    statusText.textContent =
                        "Cannot place an obstacle on a robot.";
                    return;
                }

                if (obstacles.has(k)) {
                    obstacles.delete(k);
                } else {
                    obstacles.add(k);
                }

                paths = [[], [], []];
                pathLength.textContent = "0";
                drawWarehouse();
            });

            warehouse.appendChild(cell);
        }
    }
}

function findShortestPath(start, goal) {
    const queue = [[start.x, start.y]];
    const visited = new Set([key(start.x, start.y)]);
    const previous = new Map();

    const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1]
    ];

    while (queue.length > 0) {
        const [x, y] = queue.shift();

        if (x === goal.x && y === goal.y) {
            const path = [];
            let current = key(x, y);

            while (current) {
                const [px, py] = current.split(",").map(Number);
                path.unshift({ x: px, y: py });
                current = previous.get(current);
            }

            return path;
        }

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const next = key(nx, ny);

            if (!inside(nx, ny) ||
                obstacles.has(next) ||
                visited.has(next)) {
                continue;
            }

            visited.add(next);
            previous.set(next, key(x, y));
            queue.push([nx, ny]);
        }
    }

    return [];
}

document.getElementById("findPath").addEventListener("click", () => {
    selectedRobot = Number(
        document.getElementById("robot").value
    );

    const goal = goals[document.getElementById("goal").value];
    const robot = robots[selectedRobot];

    paths[selectedRobot] = findShortestPath(robot, goal);

    if (paths[selectedRobot].length === 0) {
        statusText.textContent =
            "No path found. Try another destination.";
        pathLength.textContent = "0";
    } else {
        const steps = paths[selectedRobot].length - 1;
        statusText.textContent =
            `Robot ${selectedRobot + 1}: path found successfully!`;
        pathLength.textContent = steps;
    }

    drawWarehouse();
});

document.getElementById("robot").addEventListener("change", () => {
    selectedRobot = Number(
        document.getElementById("robot").value
    );
    drawWarehouse();
});

document.getElementById("goal").addEventListener("change", drawWarehouse);

document.getElementById("addObstacle").addEventListener("click", () => {
    statusText.textContent =
        "Click an empty grid cell to add an obstacle.";
});

document.getElementById("clearObstacles").addEventListener("click", () => {
    obstacles.clear();
    paths = [[], [], []];
    pathLength.textContent = "0";
    statusText.textContent = "All obstacles cleared.";
    drawWarehouse();
});

document.getElementById("toggleSim").addEventListener("click", () => {
    running = !running;

    document.getElementById("toggleSim").textContent =
        running ? "Pause Simulation" : "Resume Simulation";

    simStatus.textContent = running ? "Running" : "Paused";
    statusText.textContent = running
        ? "Simulation resumed."
        : "Simulation paused.";
});

function moveRobots() {
    if (!running) return;

    robots.forEach((robot, index) => {
        const path = paths[index];

        if (path.length > 1) {
            const next = path[1];

            const occupied = robots.some((other, otherIndex) =>
                otherIndex !== index &&
                other.x === next.x &&
                other.y === next.y
            );

            if (!occupied) {
                robot.x = next.x;
                robot.y = next.y;
                path.shift();
            }
        }
    });

    drawWarehouse();
}

createShelves();
drawWarehouse();
setInterval(moveRobots, 500);
