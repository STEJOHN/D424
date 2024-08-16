import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { j } from "./firebase-config.js";

import {
  countTasksByManager,
  getResolvedTasks,
  findMostRecentDates,
} from "./task_processor.js";

const app = initializeApp(j);

const database = getDatabase(app);

export function getPeopleData() {
  const peopleRef = ref(database, "people");
  return get(peopleRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.log("No data available");
        return [];
      }
    })
    .catch((error) => {
      console.error("Error retrieving people data:", error);
      throw error;
    });
}

export function loadPeopleData() {
  return getPeopleData()
    .then((peopleData) => {
      people = peopleData;

      return get(ref(database, "managers"))
        .then((snapshot) => {
          const managersData = snapshot.val();
          managers = Object.keys(managersData || {}).map((key) => ({
            name: managersData[key].manager,
            shift: managersData[key].shift,
          }));

          return { people, managers };
        })
        .catch((error) => {
          console.error("Error loading managers data from Firebase:", error);
          return [];
        });
    })
    .catch((error) => {
      console.error("Error loading people data from Firebase:", error);
      return [];
    });
}

export class Task {
  constructor(data) {
    this._data = data;
  }

  get(key) {
    return this._data[key];
  }

  set(key, value) {
    this._data[key] = value;
  }

  isResolved() {
    return this.get("State") === "Resolved";
  }

  // Polymorphic method
  getDescription() {
    return `Task ${this.get("Id")}: ${this.get("Title")}`;
  }
}

// Inheritance: RMATask extends Task
export class RMATask extends Task {
  getDescription() {
    return `RMA Task ${this.get("Id")}: ${this.get("Title")} - ${this.get(
      "Fault Code"
    )}`;
  }
}

// Inheritance: StandardTask extends Task
export class StandardTask extends Task {
  getDescription() {
    return `Standard Task ${this.get("Id")}: ${this.get("Title")} - ${this.get(
      "Priority Bucket"
    )}`;
  }
}

// TaskFactory for creating appropriate Task instances
export class TaskFactory {
  static createTask(data) {
    if (data["Task Type"] === "RMA") {
      return new RMATask(data);
    } else {
      return new StandardTask(data);
    }
  }
}

// TaskManager class (demonstrates encapsulation)
export class TaskManager {
  constructor() {
    this._tasks = [];
    this._dc1 = [];
    this._dc2 = [];
    this._dc3 = [];
    this._dc4 = [];
    this._dc5 = [];
    this._dc6 = [];
    this._dc7 = [];
    this._dc8 = [];
  }

  addTask(taskData) {
    const task = TaskFactory.createTask(taskData);
    this._tasks.push(task);
    return task;
  }

  getResolvedTasks() {
    return this._tasks.filter((task) => task.isResolved());
  }

  getUnresolvedTasks() {
    return this._tasks.filter((task) => !task.isResolved());
  }

  get tasks() {
    return this._tasks.map((task) => task._data);
  }

  get dc1() {
    return this._dc1.map((task) => task._data);
  }

  get dc2() {
    return this._dc2.map((task) => task._data);
  }

  get dc3() {
    return this._dc3.map((task) => task._data);
  }

  get dc4() {
    return this._dc4.map((task) => task._data);
  }
  get dc5() {
    return this._dc5.map((task) => task._data);
  }
  get dc6() {
    return this._dc6.map((task) => task._data);
  }
  get dc7() {
    return this._dc7.map((task) => task._data);
  }
  get dc8() {
    return this._dc8.map((task) => task._data);
  }

  addToDc1(task) {
    this._dc1.push(task);
  }

  addToDc2(task) {
    this._dc2.push(task);
  }

  addToDc3(task) {
    this._dc3.push(task);
  }
  addToDc4(task) {
    this._dc4.push(task);
  }
  addToDc5(task) {
    this._dc5.push(task);
  }
  addToDc6(task) {
    this._dc6.push(task);
  }
  addToDc7(task) {
    this._dc7.push(task);
  }
  addToDc8(task) {
    this._dc8.push(task);
  }
}

// Initialize the TaskManager
export const taskManager = new TaskManager();

function setupEventListener() {
  const btn_upload = document.getElementById("upload-csv");

  if (btn_upload) {
    btn_upload.addEventListener("change", () => {
      if (btn_upload.files.length === 0) return;

      const file = btn_upload.files[0];

      localStorage.setItem(
        "fileData",
        new Date(file.lastModified).toLocaleString().replace(",", "")
      );

      Papa.parse(file, {
        header: true,
        complete: function (results) {
          tasks = results.data;
          results.data.forEach((data) => taskManager.addTask(data));

          loadPeopleData().then(() => {
            arr0 = taskManager.tasks.filter((taskData) => {
              const datacenterCode = taskData["Datacenter Code"];

              const isDc1 = datacenterCode.startsWith("DC1");
              const isDc2 = datacenterCode.startsWith("DC2");
              const isDc3 = datacenterCode.startsWith("DC3");
              const isDc4 = datacenterCode.startsWith("DC4");
              const isDc5 = datacenterCode.startsWith("DC5");
              const isDc6 = datacenterCode.startsWith("DC6");
              const isDc7 = datacenterCode.startsWith("DC7");
              const isDc8 = datacenterCode.startsWith("DC8");

              if (taskData["State"] === "Resolved") {
                const name = taskData["Assigned To"];
                const assignedToName = sanitizeName(name);
                const person = people.find((p) => p.name === assignedToName);
                const shouldInclude =
                  !person ||
                  person.name !== "" ||
                  people.name !== undefined ||
                  people.name !== null;

                if (shouldInclude && isDc1) {
                  taskManager.addToDc1(TaskFactory.createTask(taskData));
                } else if (shouldInclude && isDc2) {
                  taskManager.addToDc2(TaskFactory.createTask(taskData));
                } else if (shouldInclude && isDc3) {
                  taskManager.addToDc3(TaskFactory.createTask(taskData));
                } else if (shouldInclude && isDc4) {
                  taskManager.addToDc4(TaskFactory.createTask(taskData));
                } else if (shouldInclude && isDc5) {
                  taskManager.addToDc5(TaskFactory.createTask(taskData));
                } else if (shouldInclude && isDc6) {
                  taskManager.addToDc6(TaskFactory.createTask(taskData));
                } else if (shouldInclude && isDc7) {
                  taskManager.addToDc7(TaskFactory.createTask(taskData));
                } else if (shouldInclude && isDc8) {
                  taskManager.addToDc8(TaskFactory.createTask(taskData));
                }
                return shouldInclude;
              }

              return false;
            });

            arr = taskManager.getUnresolvedTasks().map((task) => task._data);
            metro = [
              ...taskManager.dc1,
              ...taskManager.dc2,
              ...taskManager.dc3,
              ...taskManager.dc4,
              ...taskManager.dc5,
              ...taskManager.dc6,
              ...taskManager.dc7,
              ...taskManager.dc8,
            ];
            DC_TX_Region1 = [
              ...taskManager.dc1,
              ...taskManager.dc2,
              ...taskManager.dc3,
              ...taskManager.dc4,
            ];
            DC_TX_Region2 = [
              ...taskManager.dc5,
              ...taskManager.dc6,
              ...taskManager.dc7,
              ...taskManager.dc8,
            ];
            tasksByManager = countTasksByManager(getResolvedTasks(tasks));
            taskManager.metro = metro;
            shift = findMostRecentDates(getResolvedTasks(tasks));
            analyzed_tasks = analyzeTasks(tasks);
            apex1(shift);
            apex2(tasksByManager);
            getAssigned(tasks, people, DC_TX_Region1, DC_TX_Region2);
            getInProgress(tasks, people, DC_TX_Region1, DC_TX_Region2);
            getHold(tasks, people, DC_TX_Region1, DC_TX_Region2);
            getResolved(tasks, people, DC_TX_Region1, DC_TX_Region2);
            getChart(getAllTasks()[`By Manager`]);
            updateEmployeeDetails(tasksByManager);
            initializePerformanceRanking(tasksByManager, people);
            initializeTimeTable(tasksByManager);
            initializeEmployeeRankingChart(tasksByManager);
          });
        },
      });
    });
  } else {
  }
}

setupEventListener();

export function sanitizeName(name) {
  return name.split(" <")[0].trim();
}

window.TaskProcessor = { taskManager, loadPeopleData, getPeopleData };
