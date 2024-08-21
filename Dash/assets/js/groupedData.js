function getAllTasks() {
  let data = tasks;
  const tasksClosedByManager = {};
  const tasksClosedByShift = {};

  const region1Set = new Set(
    DC_TX_Region1.map((site) => site["Datacenter Code"].toLowerCase())
  );
  const region2Set = new Set(
    DC_TX_Region2.map((site) => site["Datacenter Code"].toLowerCase())
  );
  const peopleMap = new Map(people.map((p) => [p["name"], p["manager"]]));

  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  const tasksByManager = data.reduce((acc, task) => {
    const assignedToName = task["Assigned To"]
      ? task["Assigned To"].split("<")[0].trim()
      : "";
    const person = peopleMap.get(assignedToName);
    const isResolved = task["State"] === "Resolved";
    const workEndDate = task["Work End Date"]
      ? new Date(task["Work End Date"])
      : null;
    const dc = task["Datacenter Code"].toLowerCase();

    if (person) {
      const manager = person;
      const shift =
        people.find((p) => p["name"] === assignedToName)?.shift || "";

      if (
        (region1Set.has(dc) || region2Set.has(dc)) &&
        (isResolved ? workEndDate >= twelveHoursAgo : true)
      ) {
        if (!acc[manager]) acc[manager] = {};
        if (!acc[manager][assignedToName]) acc[manager][assignedToName] = [];
        acc[manager][assignedToName].push({ ...task, shift });
      }
    }
    return acc;
  }, {});

  Object.keys(tasksByManager).forEach((manager) => {
    const tasksByTech = tasksByManager[manager];

    Object.keys(tasksByTech).forEach((tech) => {
      const tasks = tasksByTech[tech];
      const tasksClosedByDate = {};
      const now = new Date();

      tasks.forEach((task) => {
        const workEndDate = task["Work End Date"]
          ? new Date(task["Work End Date"])
          : null;
        const isNightShift = people
          .find((p) => p.name === tech)
          ?.shift.toLowerCase()
          .includes("night");
        const currentHour = now.getHours();
        const lastShiftStart = new Date(now);

        if (isNightShift) {
          lastShiftStart.setDate(now.getDate() - (currentHour >= 19 ? 1 : 2));
          lastShiftStart.setHours(19, 0, 0, 0);
        } else {
          lastShiftStart.setDate(now.getDate() - (currentHour < 7 ? 2 : 1));
          lastShiftStart.setHours(7, 0, 0, 0);
        }

        const gracePeriod = 4;
        if (
          (workEndDate &&
            ((isNightShift &&
              (workEndDate.getHours() >= 19 ||
                workEndDate.getHours() <= 6 + gracePeriod)) ||
              (!isNightShift &&
                workEndDate.getHours() >= 7 &&
                workEndDate.getHours() <= 18 + gracePeriod)) &&
            workEndDate >= lastShiftStart) ||
          ["InProgress", "Hold", "Created"].includes(task["State"])
        ) {
          if (isNightShift && workEndDate && workEndDate.getHours() < 7) {
            workEndDate.setDate(workEndDate.getDate() - 1);
          }

          const dateString = workEndDate
            ? workEndDate.toISOString().split("T")[0] +
              ` (${isNightShift ? "Night" : "Day"} Shift)`
            : `State: ${task["State"]}`;

          if (!tasksClosedByDate[dateString]) {
            tasksClosedByDate[dateString] = {
              total: 0,
              tasks: [],
            };
          }

          tasksClosedByDate[dateString].total++;
          tasksClosedByDate[dateString].tasks.push(task);
        }
      });

      const latestShiftKey = Object.keys(tasksClosedByDate).sort(
        (a, b) => new Date(b.split("(")[0]) - new Date(a.split("(")[0])
      )[0];

      const sortedTasksClosedByDate = {
        [latestShiftKey]: tasksClosedByDate[latestShiftKey],
      };

      const tasksByState = sortedTasksClosedByDate[
        latestShiftKey
      ]?.tasks.reduce((acc, task) => {
        const state = task["State"];
        if (!acc[state]) {
          acc[state] = [];
        }
        acc[state].push(task);
        return acc;
      }, {});

      if (tasksByState) {
        tasksClosedByManager[manager] = tasksClosedByManager[manager] || {};
        tasksClosedByManager[manager][tech] = tasksByState;
      }
    });
  });

  const tasksByShift = {};

  Object.keys(tasksClosedByManager).forEach((manager) => {
    Object.keys(tasksClosedByManager[manager]).forEach((tech) => {
      const tasksByState = tasksClosedByManager[manager][tech];

      Object.keys(tasksByState).forEach((state) => {
        tasksByState[state].forEach((task) => {
          const shift = task.shift;
          tasksByShift[shift] = tasksByShift[shift] || {};
          tasksByShift[shift][manager] = tasksByShift[shift][manager] || {};
          tasksByShift[shift][manager][tech] =
            tasksByShift[shift][manager][tech] || {};
          tasksByShift[shift][manager][tech][state] =
            tasksByShift[shift][manager][tech][state] || [];
          tasksByShift[shift][manager][tech][state].push(task);
        });
      });
    });
  });

  return {
    "By Manager": tasksClosedByManager,
    "By Shift": tasksByShift,
  };
}

let t = [];
function getChart(managerTasksData) {
  const managers = Object.keys(managerTasksData);

  const dropdownOptions = managers.map((manager) => {
    return `<option value="${manager}">${manager}</option>`;
  });

  const dropdownMenu = `
    <select id="managerDropdown_new" multiple="multiple" >
      ${dropdownOptions.join("")}
    </select>
  `;

  document.getElementById("dropdownContainer").innerHTML = dropdownMenu;

  if (managers.length > 0) {
    updateChart([managers[0]]);
  }

  $("#managerDropdown_new")
    .select2()
    .on("change", function () {
      const selectedManagers = $(this)
        .select2("data")
        .map((item) => item.text);

      updateChart(selectedManagers);
    });

  setDefaultManagersBasedOnDayAndTime("managerDropdown_new");

  function updateChart(selectedManagers) {
    if (window.chart && window.chart instanceof ApexCharts) {
      window.chart.destroy();
    }

    const technicians = {};
    selectedManagers.forEach((manager) => {
      const managerData = managerTasksData[manager];
      Object.keys(managerData).forEach((technician) => {
        if (!technicians[technician]) {
          technicians[technician] = {
            Created: [],
            InProgress: [],
            Hold: [],
            Resolved: [],
          };
        }
        Object.keys(managerData[technician]).forEach((state) => {
          if (!technicians[technician][state]) {
            technicians[technician][state] = [];
          }
          technicians[technician][state] = technicians[technician][
            state
          ].concat(managerData[technician][state] || []);
        });
      });
    });

    const states = ["Created", "InProgress", "Hold", "Resolved"];
    const seriesData = states.map((state) => {
      return {
        name: state,
        data: Object.keys(technicians).map(
          (technician) => technicians[technician][state].length
        ),
      };
    });

    const totalTasks = Object.keys(technicians).map((technician) => {
      return states.reduce(
        (sum, state) => sum + technicians[technician][state].length,
        0
      );
    });

    const stateColors = {
      Created: "rgba(19,216,170,1)",
      InProgress: "rgba(51,178,223,1)",
      Hold: "rgba(165,151,139,1)",
      Resolved: "rgba(212,82,110,1)",
    };

    var options = {
      chart: {
        type: "bar",
        height: 500,
        stacked: true,
      },
      theme: {
        palette: "palette3",
      },
      annotations: {
        xaxis: [
          {
            x: 8,
            borderColor: "#00E396",
            label: {
              borderColor: "#00E396",
              style: {
                color: "#fff",
                background: "#00E396",
              },
            },
          },
        ],
      },
      plotOptions: {
        bar: {
          horizontal: true,
          dataLabels: {
            total: {
              enabled: false,
              formatter: function (val, opts) {
                return totalTasks[opts.dataPointIndex];
              },
              offsetY: -20,
              style: {
                fontSize: "15px",
                fontWeight: 900,
                color: "#FFFFFF",
              },
            },
          },
        },
      },
      series: seriesData,
      xaxis: {
        categories: Object.keys(technicians),
      },
      yaxis: {
        labels: {
          style: {
            fontSize: "13px",
          },
        },
        tickAmount: Math.ceil(500 / 20),
      },
      grid: {
        xaxis: {
          lines: {
            show: true,
          },
        },
      },
      colors: states.map((state) => stateColors[state]),
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val;
        },
        style: {
          fontSize: "10px",
          colors: ["#fff"],
        },
      },
    };

    window.chart = new ApexCharts(document.querySelector("#chart"), options);
    window.chart.render();
  }
  let select = document.getElementById(`dropdownContainer`).style;
  select.visibility = "visible";
  select.paddingLeft = "24px";
  select.borderRightWidth = "24px";

  $("#managerDropdown_new").select2();
  setDefaultManagersBasedOnDayAndTime("managerDropdown_new");
}

function setDefaultManagersBasedOnDayAndTime(dropdownId) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();

  let defaultNames = [];

  if (dayOfWeek >= 3 && dayOfWeek <= 6) {
    if (hour >= 8 && hour < 20) {
      defaultNames = ["Sarah Connor"];
    } else {
      defaultNames = ["John Wick"];
    }
  } else {
    if (hour >= 8 && hour < 20) {
      defaultNames = ["David Martin"];
    } else {
      defaultNames = ["Dana Scully"];
    }
  }

  selectDefaultManagers(dropdownId, defaultNames);
}

function selectDefaultManagers(dropdownId, defaultNames) {
  let dropdown = document.getElementById(dropdownId);
  if (!dropdown) {
    console.error("Dropdown not found:", dropdownId);
    return;
  }

  let changed = false;
  for (let option of dropdown.options) {
    if (defaultNames.includes(option.text) && !option.selected) {
      option.selected = true;
      changed = true;
    }
  }

  if (changed) {
    dropdown.dispatchEvent(new Event("change"));
  }
}

function findTechniciansUnderQuota(tasksByManager, taskQuota = 8) {
  const underQuotaTechsByManager = {};
  Object.keys(tasksByManager).forEach((manager) => {
    const managerData = tasksByManager[manager].dates;
    Object.keys(managerData).forEach((date) => {
      const dateData = managerData[date];
      if (dateData && dateData.employees) {
        Object.keys(dateData.employees).forEach((tech) => {
          const techData = dateData.employees[tech];
          if (techData.total < taskQuota) {
            if (!underQuotaTechsByManager[manager]) {
              underQuotaTechsByManager[manager] = {};
            }
            if (!underQuotaTechsByManager[manager][tech]) {
              underQuotaTechsByManager[manager][tech] = { count: 0, dates: [] };
            }
            underQuotaTechsByManager[manager][tech].count++;
            underQuotaTechsByManager[manager][tech].dates.push({
              date: date,
              tasksCompleted: techData.total,
            });
          }
        });
      }
    });
  });
  return underQuotaTechsByManager;
}

function initializeEmployeeRankingChart(tasksByManager) {
  const managerDropdown = document.getElementById("ranking_employee");
  const dateDropdown = document.getElementById("ranking_date");

  Object.keys(tasksByManager).forEach((manager) => {
    let option = document.createElement("option");
    option.value = manager;
    option.text = manager;
    managerDropdown.appendChild(option);
  });

  let chart = new ApexCharts(document.querySelector("#rankingChart"), {
    chart: {
      type: "bar",
      stacked: true,
      height: 350,
    },
    series: [
      {
        name: "Total Tasks",
        data: [],
      },
      {
        name: "Time on Task",
        data: [],
      },
    ],
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    xaxis: {
      categories: [],
    },
    yaxis: {
      title: {
        text: "Performance Metrics",
      },
      labels: {
        style: {
          fontSize: "13px",
        },
      },
    },

    tooltip: {
      y: {
        formatter: function (val) {
          return val;
        },
      },
    },
    dataLabels: {
      enabled: true,
    },
    legend: {
      position: "bottom",
    },
    noData: {
      text: "Select a manager and date to view data",
    },
  });
  chart.render();

  managerDropdown.addEventListener("change", function () {
    populateDateDropdown(tasksByManager[this.value]);
    updateChart(
      this.value,
      dateDropdown.value,
      tasksByManager[this.value],
      chart
    );
  });

  dateDropdown.addEventListener("change", function () {
    updateChart(
      managerDropdown.value,
      this.value,
      tasksByManager[managerDropdown.value],
      chart
    );
  });

  function populateDateDropdown(managerData) {
    dateDropdown.innerHTML = "";
    Object.keys(managerData.dates).forEach((date) => {
      let option = document.createElement("option");
      option.value = date;
      option.text = date;
      dateDropdown.appendChild(option);
    });
  }

  function updateChart(manager, selectedDate, managerData, chart) {
    if (selectedDate && managerData.dates[selectedDate]) {
      const employeeScores = calculateScores(managerData.dates[selectedDate]);
      chart.updateOptions({
        series: [
          {
            data: employeeScores.map((score) => score.taskCount),
          },
          {
            data: employeeScores.map((score) =>
              parseFloat(score.totalMinutes / 60).toFixed(2)
            ),
          },
        ],
        xaxis: {
          categories: employeeScores.map((score) => score.name),
        },
      });
    }
  }
  function calculateScores(dateData) {
    let employeeScores = [];
    Object.keys(dateData.employees).forEach((employee) => {
      const tasks = dateData.employees[employee].tasks;
      const totalMinutes = tasks.reduce((total, task) => {
        let startTime = moment(task["Work Start Date"], "MM/DD/YYYY h:mm a");
        let endTime = moment(task["Work End Date"], "MM/DD/YYYY h:mm a");
        let duration = endTime.diff(startTime, "minutes");

        if (duration <= 720) {
          return total + duration;
        } else {
          return total;
        }
      }, 0);

      employeeScores.push({
        name: employee,
        totalMinutes: totalMinutes,
        taskCount: tasks.length,
      });
    });

    return employeeScores;
  }

  if (Object.keys(tasksByManager).length > 0) {
    const firstManager = Object.keys(tasksByManager)[0];
    managerDropdown.value = firstManager;
    populateDateDropdown(tasksByManager[firstManager]);
    if (Object.keys(tasksByManager[firstManager].dates).length > 0) {
      const firstDate = Object.keys(tasksByManager[firstManager].dates)[0];
      dateDropdown.value = firstDate;
      updateChart(firstManager, firstDate, tasksByManager[firstManager], chart);
    }
  }
}

function initializeTimeTable(tasksByManager) {
  const managerDropdown = document.getElementById("timeTechMgr");
  const techDropdown = document.getElementById("timeTech");
  const dateDropdown = document.getElementById("timeTechDate");
  const tableElement = document.getElementById("timeTable");

  const dataTable = $(tableElement).DataTable({
    retrieve: true,
    dom: '<"top"fB>rt',
    buttons: [
      {
        extend: "excel",
        text: "Excel",
      },
    ],
    search: true,
    pageLength: -1,
    lengthMenu: [
      [10, 25, 50, -1],
      [10, 25, 50, "All"],
    ],
    info: false,
  });

  Object.keys(tasksByManager).forEach((manager) => {
    let option = document.createElement("option");
    option.value = manager;
    option.text = manager;
    managerDropdown.appendChild(option);
  });

  managerDropdown.addEventListener("change", function () {
    updateTechDropdown(this.value);
    updateTable(this.value, techDropdown.value, dateDropdown.value);
  });

  techDropdown.addEventListener("change", function () {
    updateDateDropdown(managerDropdown.value, this.value);
    updateTable(managerDropdown.value, this.value, dateDropdown.value);
  });

  dateDropdown.addEventListener("change", function () {
    updateTable(managerDropdown.value, techDropdown.value, this.value);
  });

  function updateTechDropdown(manager) {
    techDropdown.innerHTML = "";
    const managerData = tasksByManager[manager];
    const allTechs = new Set();
    Object.values(managerData.dates).forEach((date) => {
      Object.keys(date.employees).forEach((tech) => allTechs.add(tech));
    });
    allTechs.forEach((tech) => {
      let option = document.createElement("option");
      option.value = tech;
      option.text = tech;
      techDropdown.appendChild(option);
    });
    techDropdown.dispatchEvent(new Event("change"));
  }

  function updateDateDropdown(manager, tech) {
    dateDropdown.innerHTML = "";
    const dates = tasksByManager[manager].dates;
    Object.keys(dates).forEach((date) => {
      if (dates[date].employees[tech]) {
        let option = document.createElement("option");
        option.value = date;
        option.text = date;
        dateDropdown.appendChild(option);
      }
    });
    dateDropdown.dispatchEvent(new Event("change"));
  }

  function updateTable(manager, tech, date) {
    const tasks =
      tasksByManager[manager]?.dates[date]?.employees[tech]?.tasks || [];
    tasks.sort(
      (a, b) =>
        moment(a["Work Start Date"], "MM/DD/YYYY h:mm a") -
        moment(b["Work Start Date"], "MM/DD/YYYY h:mm a")
    );

    dataTable.clear();

    let lastEndTime = null;

    tasks.forEach((task, index) => {
      const startTime = moment(task["Work Start Date"], "MM/DD/YYYY h:mm a");
      const endTime = moment(task["Work End Date"], "MM/DD/YYYY h:mm a");
      const changedBy = moment(task["Changed By"], "MM/DD/YYYY h:mm a");
      let changed = changedBy.format("MM/DD/YYYY h:mm a");
      let start = startTime.format("MM/DD/YYYY h:mm a");
      let end = endTime.format("MM/DD/YYYY h:mm a");
      let total = endTime.diff(startTime, "hours", true).toFixed(2);

      if (parseFloat(total) > 12) {
        start = end;
        total = "Excluded";
      }

      dataTable.row.add([tech, task.Id, start, end, total]);

      if (lastEndTime && startTime.isAfter(lastEndTime)) {
        const idleDuration = startTime.diff(lastEndTime, "minutes");
        let idleType = getIdleType(idleDuration);
        const idleStart = lastEndTime.format("MM/DD/YYYY h:mm a");
        const idleEnd = startTime.format("MM/DD/YYYY h:mm a");

        dataTable.row.add([
          "Idle (" + idleType + ")",
          "---",
          idleStart,
          idleEnd,
          (idleDuration / 60).toFixed(2) + " hrs",
        ]);
      }

      if (parseFloat(total) <= 12) {
        lastEndTime = endTime;
      }
    });

    dataTable.draw();
  }

  function getIdleType(minutes) {
    if (minutes < 30) return "Break";
    if (minutes >= 30 && minutes <= 120) return "Lunch";
    return "No Activity";
  }

  function handleBreakInsertion(startTime, lastEndTime, dataTable) {
    const breakDuration = startTime.diff(lastEndTime, "minutes");
    let breakType = "Break";
    if (breakDuration >= 30 && breakDuration <= 120) {
      breakType = "Lunch";
    } else if (breakDuration > 120) {
      breakType = "No Activity";
    }

    dataTable.row.add([
      "Idle (" + breakType + ")",
      "---",
      lastEndTime.format("MM/DD/YYYY h:mm a"),
      startTime.format("MM/DD/YYYY h:mm a"),
      (breakDuration / 60).toFixed(2) + " hrs",
    ]);
  }

  function isWithinShiftHours(startTime, endTime, shiftTime) {
    const shiftStart = moment(
      startTime.format("MM/DD/YYYY") + " " + shiftTime.start,
      "MM/DD/YYYY h:mm A"
    );
    const shiftEnd = moment(
      endTime.format("MM/DD/YYYY") + " " + shiftTime.end,
      "MM/DD/YYYY h:mm A"
    );

    if (shiftEnd.isBefore(shiftStart)) {
      return startTime.isAfter(shiftStart) || endTime.isBefore(shiftEnd);
    }
    return (
      startTime.isBetween(shiftStart, shiftEnd, null, "[]") &&
      endTime.isBetween(shiftStart, shiftEnd, null, "[]")
    );
  }

  if (Object.keys(tasksByManager).length > 0) {
    const firstManager = Object.keys(tasksByManager)[0];
    managerDropdown.value = firstManager;
    updateTechDropdown(firstManager);
    if (Object.keys(tasksByManager[firstManager].dates).length > 0) {
      const firstDate = Object.keys(tasksByManager[firstManager].dates)[0];
      dateDropdown.value = firstDate;
      updateDateDropdown(firstManager, techDropdown.value);
      updateTable(firstManager, techDropdown.value, firstDate);
    }
  }
}

const shiftHours = {
  "A-Side Days": { start: "7:00 AM", end: "7:00 PM" },
  "B-Side Days": { start: "7:00 AM", end: "7:00 PM" },
  "A-Side Nights": { start: "7:00 PM", end: "7:00 AM" },
  "B-Side Nights": { start: "7:00 PM", end: "7:00 AM" },
};
function initializePerformanceRanking(tasksByManager, people) {
  let nameToShift = {};
  people.forEach((person) => {
    nameToShift[person.name] = person.shift;
  });

  if ($.fn.dataTable.isDataTable("#performanceTable")) {
    $("#performanceTable").DataTable().clear().destroy();
  }

  let dataTable = $("#performanceTable").DataTable({
    paging: false,
    searching: false,
    info: false,
    scrollY: "300px",
    scrollCollapse: true,
    columns: [
      { title: "Name", data: "name" },
      { title: "Hrs Worked", data: "avgTime" },
      { title: "Resolved", data: "avgTasks" },
      { title: "Score", data: "performanceScore" },
    ],
    order: [[3, "desc"]],
  });

  function populateTable(selectedShift) {
    dataTable.clear();

    let performers = {};
    Object.keys(tasksByManager).forEach((manager) => {
      Object.keys(tasksByManager[manager].dates).forEach((date) => {
        Object.keys(tasksByManager[manager].dates[date].employees).forEach(
          (tech) => {
            const tasks =
              tasksByManager[manager].dates[date].employees[tech].tasks;
            const totalResolved =
              tasksByManager[manager].dates[date].employees[tech].total;
            const assignedTo = tech.split("<")[0].trim();
            const shift = nameToShift[assignedTo] || "Unknown";

            if (shift === selectedShift) {
              if (!performers[assignedTo]) {
                performers[assignedTo] = {
                  totalTime: 0,
                  totalTasks: 0,
                  daysCounted: 0,
                };
              }

              let dailyTime = 0;
              tasks.forEach((task) => {
                const startTime = moment(
                  task["Work Start Date"],
                  "MM/DD/YYYY h:mm a"
                );
                const endTime = moment(
                  task["Work End Date"],
                  "MM/DD/YYYY h:mm a"
                );
                let duration = endTime.diff(startTime, "hours", true);

                if (duration <= 12) {
                  dailyTime += duration;
                }
              });

              performers[assignedTo].totalTime += dailyTime;
              performers[assignedTo].totalTasks += totalResolved;
              performers[assignedTo].daysCounted++;
            }
          }
        );
      });
    });

    Object.entries(performers).forEach(([name, data]) => {
      const avgTime = (data.totalTime / data.daysCounted).toFixed(2);
      const avgTasks = (data.totalTasks / data.daysCounted).toFixed(2);

      const targetTasks = 2;
      const targetHours = 2.0;

      let taskScore = (avgTasks / targetTasks) * 50;
      let timeScore = (avgTime / targetHours) * 50;

      let performanceScore;
      if (avgTasks >= targetTasks && avgTime >= targetHours) {
        taskScore = (avgTasks / targetTasks) * 50;
        timeScore = (avgTime / targetHours) * 50;
        performanceScore = taskScore + timeScore;
      } else {
        taskScore =
          avgTasks >= targetTasks ? 50 : (avgTasks / targetTasks) * 50;
        timeScore = avgTime >= targetHours ? 50 : (avgTime / targetHours) * 50;
        performanceScore = taskScore + timeScore;
        if (performanceScore > 100) {
          performanceScore = 100;
        }
      }

      let color;
      if (performanceScore >= 100) {
        color = "rgba(19,216,170,1)";
      } else if (performanceScore >= 75) {
        color = "rgba(51,178,223,1)";
      } else {
        color = "rgba(212,82,110,1)";
      }

      dataTable.row
        .add({
          name: name,
          avgTime: avgTime,
          avgTasks: avgTasks,
          performanceScore: `<span style="color: ${color};">${performanceScore.toFixed(
            2
          )}%</span>`,
        })
        .draw(false);
    });
  }

  populateTable($("#shiftSelector").val());

  $("#shiftSelector").on("change", function () {
    populateTable(this.value);
  });

  let toggle = true;
  $("#togglePerformance").click(function () {
    toggle = !toggle;
    $(this).text(toggle ? "High Performers" : "Low Performers");
    dataTable.order([3, toggle ? "desc" : "asc"]).draw();
  });
}
