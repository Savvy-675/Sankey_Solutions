// -------------------- State --------------------
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// -------------------- DOM --------------------
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const progress = document.getElementById("progress");
const jokeBox = document.getElementById("joke");

// -------------------- Storage --------------------
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// -------------------- Render --------------------
function updateProgress() {
    const completed = tasks.filter(t => t.completed).length;
    progress.textContent = `Total: ${tasks.length} | Completed: ${completed}`;
}

function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");

        const text = document.createElement("span");
        text.textContent = task.text;
        text.className = `task-text ${task.completed ? "completed" : ""}`;

        const actions = document.createElement("div");
        actions.className = "actions";

        actions.append(
            createButton(task.completed ? "Undo" : "Complete", "complete-btn", () => toggleTask(index)),
            createButton("Edit", "edit-btn", () => editTask(index)),
            createButton("Delete", "delete-btn", () => deleteTask(index))
        );

        li.append(text, actions);
        taskList.appendChild(li);
    });

    updateProgress();
}

// -------------------- Helpers --------------------
function createButton(label, className, handler) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = className;
    btn.addEventListener("click", handler);
    return btn;
}

// -------------------- Actions --------------------
function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    tasks.push({ text, completed: false });
    taskInput.value = "";
    saveTasks();
    renderTasks();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

function editTask(index) {
    const updated = prompt("Edit task:", tasks[index].text);
    if (updated && updated.trim()) {
        tasks[index].text = updated.trim();
        saveTasks();
        renderTasks();
    }
}

function deleteTask(index) {
    if (confirm("Delete this task?")) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }
}

// -------------------- API --------------------
async function loadJoke() {
    try {
        const res = await fetch("https://api.chucknorris.io/jokes/random");
        const data = await res.json();
        jokeBox.textContent = data.value;
    } catch {
        jokeBox.textContent = "Joke unavailable.";
    }
}

// -------------------- Init --------------------
addTaskBtn.addEventListener("click", addTask);
loadJoke();
renderTasks();
