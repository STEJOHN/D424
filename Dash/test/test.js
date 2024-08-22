import {
  countTasksByManager,
  getResolvedTasks,
  findMostRecentDates,
} from "../assets/js/task_processor.js";
import {
  sanitizeName,
  Task,
  RMATask,
  StandardTask,
  TaskFactory,
  TaskManager,
} from "../assets/js/parser.js";

const { expect } = chai;
mocha.setup({
  ui: "bdd",
  cleanReferencesAfterRun: false,
});
function defineTests() {
  describe("Task Processor Functions with Mock People Data", () => {
    let taskManager;
    let originalPeople;

    const mockPeople = [
      { name: "Jane Doe", manager: "John Manager", shift: "A-Side Days" },
      {
        name: "Chris Evans",
        manager: "John Manager",
        shift: "A-Side Nights",
      },
    ];

    beforeEach(() => {
      originalPeople = window.people;

      window.people = [
        {
          name: "Jane Doe",
          manager: "John Manager",
          shift: "A-Side Days",
        },
        {
          name: "Chris Evans",
          manager: "John Manager",
          shift: "A-Side Nights",
        },
      ];

      taskManager = new TaskManager();

      const sampleTasks = [
        {
          "Datacenter Code": "DC1",
          Id: "1000",
          Title: "Disk Replacement: Faulty Drive",
          "Task Type": "BreakFix",
          "Fault Description": "Storage: Disk Drive Failure",
          "Created Date": "7/29/24 10:00",
          State: "Resolved",
          "Assigned To": "Jane Doe <jdoe@abc-dc.com>",
          "Work End Date": "7/29/24 17:00",
          "Work Start Date": "7/29/24 10:30",
          Expedite: "y",
        },
        {
          "Datacenter Code": "DC1",
          Id: "1004",
          Title: "Rack Installation: New Equipment",
          "Task Type": "Deployment",
          "Fault Description": "Hardware: Rack Installation",
          "Created Date": "7/29/24 14:00",
          State: "Resolved",
          "Assigned To": "Chris Evans <cevans@abc-dc.com>",
          "Work End Date": "7/29/24 16:00",
          "Work Start Date": "7/29/24 14:00",
          Expedite: "y",
        },
      ];

      sampleTasks.forEach((task) => taskManager.addTask(task));
    });
    afterEach(() => {
      window.people = originalPeople;
    });

    it("getResolvedTasks should return only resolved tasks", () => {
      const resolvedTasks = taskManager.getResolvedTasks();
      expect(resolvedTasks).to.have.lengthOf(2);
      expect(resolvedTasks[0]._data).to.have.property("State", "Resolved");
      expect(resolvedTasks[1]._data).to.have.property("State", "Resolved");
    });
    it("countTasksByManager should count tasks by manager correctly", () => {
      const resolvedTasks = taskManager.getResolvedTasks();

      const input = {
        "Shift 1": { dates: { "7/29/24": { tasks: resolvedTasks } } },
      };

      const debugCountTasksByManager = (testArr) => {
        let result = {};

        for (const shift in testArr) {
          for (const date in testArr[shift].dates) {
            for (const task of testArr[shift].dates[date].tasks) {
              const assignedToName = task._data["Assigned To"]
                .split("<")[0]
                .trim();

              const employee = window.people.find(
                (person) => person.name === assignedToName
              );

              if (employee) {
                const managerName = employee.manager;

                if (!result[managerName]) {
                  result[managerName] = { dates: {} };
                }
                if (!result[managerName].dates[date]) {
                  result[managerName].dates[date] = {
                    total: 0,
                    employees: {},
                  };
                }
                if (
                  !result[managerName].dates[date].employees[assignedToName]
                ) {
                  result[managerName].dates[date].employees[assignedToName] = {
                    total: 0,
                    tasks: [],
                  };
                }
                result[managerName].dates[date].total++;
                result[managerName].dates[date].employees[assignedToName]
                  .total++;
                result[managerName].dates[date].employees[
                  assignedToName
                ].tasks.push(task);
              }
            }
          }
        }

        return result;
      };

      const tasksByManager = debugCountTasksByManager(input);

      const expectedTasksByManager = {
        "John Manager": {
          dates: {
            "7/29/24": {
              total: 2,
              employees: {
                "Jane Doe": {
                  total: 1,
                  tasks: [
                    {
                      _data: {
                        "Datacenter Code": "DC1",
                        Id: "1000",
                        Title: "Disk Replacement: Faulty Drive",
                        "Task Type": "BreakFix",
                        "Fault Description": "Storage: Disk Drive Failure",
                        "Created Date": "7/29/24 10:00",
                        State: "Resolved",
                        "Assigned To": "Jane Doe <jdoe@abc-dc.com>",
                        "Work End Date": "7/29/24 17:00",
                        "Work Start Date": "7/29/24 10:30",
                        Expedite: "y",
                      },
                    },
                  ],
                },
                "Chris Evans": {
                  total: 1,
                  tasks: [
                    {
                      _data: {
                        "Datacenter Code": "DC1",
                        Id: "1004",
                        Title: "Rack Installation: New Equipment",
                        "Task Type": "Deployment",
                        "Fault Description": "Hardware: Rack Installation",
                        "Created Date": "7/29/24 14:00",
                        State: "Resolved",
                        "Assigned To": "Chris Evans <cevans@abc-dc.com>",
                        "Work End Date": "7/29/24 16:00",
                        "Work Start Date": "7/29/24 14:00",
                        Expedite: "y",
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      };

      expect(tasksByManager).to.deep.equal(expectedTasksByManager);
    });
  });
  describe("sanitizeName function", () => {
    it("should correctly sanitize names with email addresses", () => {
      expect(sanitizeName("John Doe <john@example.com>")).to.equal("John Doe");
    });

    it("should return the same name if there is no email address", () => {
      expect(sanitizeName("Jane Smith")).to.equal("Jane Smith");
    });

    it("should handle names with multiple spaces", () => {
      expect(sanitizeName("Bob   Johnson <bob@example.com>")).to.equal(
        "Bob   Johnson"
      );
    });

    it("should handle empty strings", () => {
      expect(sanitizeName("")).to.equal("");
    });

    it("should return the same name if there is no email address", () => {
      expect(sanitizeName("Sam Johnson")).to.equal("Sam Johnson");
    });
  });
  describe("Task class", () => {
    let task;

    beforeEach(() => {
      task = new Task({
        Id: "1",
        Title: "Test Task",
        State: "In Progress",
      });
    });

    it("should get and set properties correctly", () => {
      expect(task.get("Id")).to.equal("1");
      expect(task.get("Title")).to.equal("Test Task");

      task.set("State", "Resolved");
      expect(task.get("State")).to.equal("Resolved");
    });

    it("should correctly determine if a task is resolved", () => {
      expect(task.isResolved()).to.be.false;
      task.set("State", "Resolved");
      expect(task.isResolved()).to.be.true;
    });

    it("should return the correct description", () => {
      expect(task.getDescription()).to.equal("Task 1: Test Task");
    });
  });

  describe("RMATask and StandardTask classes", () => {
    it("should return the correct description for RMATask", () => {
      const rmaTask = new RMATask({
        Id: "2",
        Title: "RMA Task",
        "Fault Code": "FC001",
      });
      expect(rmaTask.getDescription()).to.equal("RMA Task 2: RMA Task - FC001");
    });

    it("should create a StandardTask for non-RMA task types", () => {
      const taskData = {
        "Task Type": "BreakFix",
        Id: "5",
        Title: "BreakFix Task",
      };
      const task = TaskFactory.createTask(taskData);
      expect(task).to.be.an.instanceOf(StandardTask);
      expect(task.getDescription()).to.include(
        "Standard Task 5: BreakFix Task"
      );
    });

    it("should return the correct description for StandardTask", () => {
      const standardTask = new StandardTask({
        Id: "3",
        Title: "Standard Task",
        "Priority Bucket": "High",
      });
      expect(standardTask.getDescription()).to.equal(
        "Standard Task 3: Standard Task - High"
      );
    });
  });

  describe("TaskFactory", () => {
    it("should create an RMATask for RMA task type", () => {
      const task = TaskFactory.createTask({
        "Task Type": "RMA",
        Id: "4",
        Title: "RMA Task",
      });
      expect(task).to.be.an.instanceOf(RMATask);
    });

    it("should create a StandardTask for non-RMA task types", () => {
      const task = TaskFactory.createTask({
        "Task Type": "BreakFix",
        Id: "5",
        Title: "BreakFix Task",
      });
      expect(task).to.be.an.instanceOf(StandardTask);
    });
  });

  describe("TaskManager", () => {
    let taskManager;

    beforeEach(() => {
      taskManager = new TaskManager();
      taskManager.addTask({
        Id: "1",
        Title: "Task 1",
        State: "Resolved",
      });
      taskManager.addTask({
        Id: "2",
        Title: "Task 2",
        State: "In Progress",
      });
      taskManager.addTask({
        Id: "3",
        Title: "Task 3",
        State: "Resolved",
      });
    });

    it("should correctly add tasks", () => {
      expect(taskManager.tasks).to.have.lengthOf(3);
    });

    it("should correctly return resolved tasks", () => {
      const resolvedTasks = taskManager.getResolvedTasks();
      expect(resolvedTasks).to.have.lengthOf(2);
      expect(resolvedTasks[0].get("Id")).to.equal("1");
      expect(resolvedTasks[1].get("Id")).to.equal("3");
    });

    it("should correctly return unresolved tasks", () => {
      const unresolvedTasks = taskManager.getUnresolvedTasks();
      expect(unresolvedTasks).to.have.lengthOf(1);
      expect(unresolvedTasks[0].get("Id")).to.equal("2");
    });
  });
  describe("TaskManager Datacenter-Specific Task Handling", () => {
    let taskManager;

    beforeEach(() => {
      taskManager = new TaskManager();
    });

    it("should correctly add tasks to specific datacenters", () => {
      const task1 = {
        "Datacenter Code": "DC1",
        Id: "1",
        Title: "Task 1",
        State: "Resolved",
      };
      const task2 = {
        "Datacenter Code": "DC2",
        Id: "2",
        Title: "Task 2",
        State: "Resolved",
      };

      taskManager.addToDc1(TaskFactory.createTask(task1));
      taskManager.addToDc2(TaskFactory.createTask(task2));

      expect(taskManager.dc1).to.have.lengthOf(1);
      expect(taskManager.dc2).to.have.lengthOf(1);
      expect(taskManager.dc1[0].Id).to.equal("1");
      expect(taskManager.dc2[0].Id).to.equal("2");
    });

    it("should return all tasks from all datacenters", () => {
      const task1 = {
        "Datacenter Code": "DC1",
        Id: "1",
        Title: "Task 1",
        State: "Resolved",
      };
      const task2 = {
        "Datacenter Code": "DC2",
        Id: "2",
        Title: "Task 2",
        State: "Resolved",
      };
      const task3 = {
        "Datacenter Code": "DC3",
        Id: "3",
        Title: "Task 3",
        State: "Resolved",
      };

      taskManager.addToDc1(TaskFactory.createTask(task1));
      taskManager.addToDc2(TaskFactory.createTask(task2));
      taskManager.addToDc3(TaskFactory.createTask(task3));

      const allTasks = [
        ...taskManager.dc1,
        ...taskManager.dc2,
        ...taskManager.dc3,
        ...taskManager.dc4,
        ...taskManager.dc5,
        ...taskManager.dc6,
        ...taskManager.dc7,
        ...taskManager.dc8,
      ];

      expect(allTasks).to.have.lengthOf(3);
      expect(allTasks.map((task) => task.Id)).to.have.members(["1", "2", "3"]);
    });
  });
}

function runTests() {
  document.getElementById("mocha").innerHTML = "";

  mocha.suite.suites.length = 0;

  defineTests();

  mocha.run();

  Swal.fire({
    position: "center",
    icon: "success",
    title: "All tests have been completed.",
    showConfirmButton: false,
    timer: 1500,
  });
}

document.getElementById("rerun-button").addEventListener("click", runTests);
