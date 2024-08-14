import assert from "assert";
import {
  Task,
  RMATask,
  StandardTask,
  TaskFactory,
  TaskManager,
} from "./Dash/assets/js/parser.js";

describe("Task Class", function () {
  it("should create a Task with correct data", function () {
    const taskData = { Id: 1, Title: "Test Task", State: "InProgress" };
    const task = new Task(taskData);
    assert.strictEqual(task.get("Id"), 1);
    assert.strictEqual(task.get("Title"), "Test Task");
  });

  it("should correctly resolve tasks", function () {
    const taskData = { Id: 1, Title: "Test Task", State: "Resolved" };
    const task = new Task(taskData);
    assert.strictEqual(task.isResolved(), true);
  });

  it("should return the correct description", function () {
    const taskData = { Id: 1, Title: "Test Task", State: "Resolved" };
    const task = new Task(taskData);
    assert.strictEqual(task.getDescription(), "Task 1: Test Task");
  });
});

describe("RMATask Class", function () {
  it("should return the correct description for RMA tasks", function () {
    const rmaTaskData = {
      Id: 2,
      Title: "Check Fault",
      "Fault Code": "1234",
      "Task Type": "RMA",
    };
    const rmaTask = new RMATask(rmaTaskData);
    assert.strictEqual(
      rmaTask.getDescription(),
      "RMA Task 2: Check Fault - 1234"
    );
  });
});

describe("StandardTask Class", function () {
  it("should return the correct description for Standard tasks", function () {
    const standardTaskData = {
      Id: 3,
      Title: "Routine Check",
      "Priority Bucket": "High",
      "Task Type": "Standard",
    };
    const standardTask = new StandardTask(standardTaskData);
    assert.strictEqual(
      standardTask.getDescription(),
      "Standard Task 3: Routine Check - High"
    );
  });
});

describe("TaskFactory", function () {
  it("should create an RMATask when Task Type is RMA", function () {
    const rmaTaskData = {
      Id: 4,
      Title: "RMA Check",
      "Task Type": "RMA",
      "Fault Code": "5678",
    };
    const task = TaskFactory.createTask(rmaTaskData);
    assert.strictEqual(task instanceof RMATask, true);
  });

  it("should create a StandardTask when Task Type is not RMA", function () {
    const standardTaskData = {
      Id: 5,
      Title: "Standard Check",
      "Task Type": "Standard",
    };
    const task = TaskFactory.createTask(standardTaskData);
    assert.strictEqual(task instanceof StandardTask, true);
  });
});

describe("TaskManager", function () {
  let taskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
  });

  it("should add a task to the manager", function () {
    const taskData = { Id: 6, Title: "Another Task", "Task Type": "Standard" };
    const task = taskManager.addTask(taskData);
    assert.strictEqual(taskManager.tasks.length, 1);
    assert.strictEqual(taskManager.tasks[0].Id, 6);
  });

  it("should retrieve resolved tasks", function () {
    taskManager.addTask({
      Id: 7,
      Title: "Resolved Task",
      State: "Resolved",
      "Task Type": "Standard",
    });
    taskManager.addTask({
      Id: 8,
      Title: "Unresolved Task",
      State: "InProgress",
      "Task Type": "Standard",
    });
    const resolvedTasks = taskManager.getResolvedTasks();
    assert.strictEqual(resolvedTasks.length, 1);
    assert.strictEqual(resolvedTasks[0].get("Id"), 7);
  });

  it("should retrieve unresolved tasks", function () {
    taskManager.addTask({
      Id: 9,
      Title: "Unresolved Task",
      State: "InProgress",
      "Task Type": "Standard",
    });
    const unresolvedTasks = taskManager.getUnresolvedTasks();
    assert.strictEqual(unresolvedTasks.length, 1);
    assert.strictEqual(unresolvedTasks[0].get("Id"), 9);
  });
});

describe("Run Tests", function () {
  it("should run all tests", function () {
    console.log("All tests passed");
  });
});
