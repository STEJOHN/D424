let transformedData;
function transformDataset(tasksByManager, people) {
  const formatDateKey = (dateStr) => {
    const dateParts = dateStr.split(" ")[1].split("/");
    const month = dateParts[0].padStart(2, "0");
    const day = dateParts[1].padStart(2, "0");
    const year = dateParts[2];
    return `${month}/${day}/${year}`;
  };

  const getShiftInfo = (assignedTo) => {
    const techName = assignedTo.split("<")[0].trim();
    const tech = people.find((person) => person.name === techName);
    return tech ? tech.shift : null;
  };

  const transformedData = {};

  for (const managerName in tasksByManager) {
    transformedData[managerName] = {};
    const managerData = tasksByManager[managerName];

    for (const dateKey in managerData.dates) {
      transformedData[managerName][dateKey] = {};
      const dateData = managerData.dates[dateKey];

      for (const employeeName in dateData.employees) {
        transformedData[managerName][dateKey][employeeName] = [];

        const tasks = dateData.employees[employeeName].tasks;
        tasks.sort(
          (a, b) =>
            new Date(a["Work Start Date"]) - new Date(b["Work Start Date"])
        );

        const shiftInfo = getShiftInfo(tasks[0]["Assigned To"]);
        let shiftStartHour, shiftEndHour;
        if (shiftInfo.includes("Mon - Fri")) {
          shiftStartHour = 8; // 8 AM
          shiftEndHour = 17; // 5 PM
        } else {
          shiftStartHour = shiftInfo.includes("Days") ? 7 : 19;
          shiftEndHour = shiftInfo.includes("Days") ? 19 : 7;
        }

        let totalWorkedTime = 0;
        let totalIdleTime = 0;

        for (const [index, task] of tasks.entries()) {
          const startDate = new Date(task["Work Start Date"]);
          const endDate = new Date(task["Work End Date"]);

          let durationFromShiftStart = "";
          if (index === 0) {
            const minutes =
              startDate.getHours() * 60 +
              startDate.getMinutes() -
              shiftStartHour * 60;
            if (minutes < 60) {
              durationFromShiftStart = `${minutes} minute${
                minutes === 1 ? "" : "s"
              }`;
            } else {
              const hours = Math.floor(minutes / 60);
              const remainingMinutes = minutes % 60;
              if (remainingMinutes === 0) {
                durationFromShiftStart = `${hours} hour${
                  hours === 1 ? "" : "s"
                }`;
              } else {
                durationFromShiftStart = `${hours} hour${
                  hours === 1 ? "" : "s"
                } ${remainingMinutes} minute${
                  remainingMinutes === 1 ? "" : "s"
                }`;
              }
            }
          }

          let durationFromShiftEnd = "";
          if (index === tasks.length - 1) {
            const minutes =
              shiftEndHour * 60 -
              (endDate.getHours() * 60 + endDate.getMinutes());
            if (minutes < 60) {
              durationFromShiftEnd = `${minutes} minute${
                minutes === 1 ? "" : "s"
              }`;
            } else {
              const hours = Math.floor(minutes / 60);
              const remainingMinutes = minutes % 60;
              if (remainingMinutes === 0) {
                durationFromShiftEnd = `${hours} hour${hours === 1 ? "" : "s"}`;
              } else {
                durationFromShiftEnd = `${hours} hour${
                  hours === 1 ? "" : "s"
                } ${remainingMinutes} minute${
                  remainingMinutes === 1 ? "" : "s"
                }`;
              }
            }
          }

          const taskDuration = (endDate - startDate) / (1000 * 60);

          if (taskDuration <= 720) {
            totalWorkedTime += taskDuration;

            if (index > 0) {
              const prevTask = tasks[index - 1];
              const prevTaskEndDate = new Date(prevTask["Work End Date"]);
              const overlapMinutes =
                (startDate - prevTaskEndDate) / (1000 * 60);

              if (overlapMinutes > 0) {
                totalIdleTime += overlapMinutes;
              }
            }
          }

          transformedData[managerName][dateKey][employeeName].push({
            durationFromShiftStart,
            durationFromShiftEnd,
            endDate,
            id: task.Id,
            shift: shiftInfo,
            startDate,
            title: task.Title,
          });
        }

        transformedData[managerName][dateKey][employeeName].totalTimeWorked =
          totalWorkedTime;
        transformedData[managerName][dateKey][employeeName].totalIdleTime =
          totalIdleTime;
      }
    }
  }

  return transformedData;
}

function calculateDurationFromShiftStart(startDate, shiftType, shiftTime) {
  const shiftStart =
    shiftType === "A-Side Days" || shiftType === "B-Side Days"
      ? 7 * 60
      : 19 * 60;
  const taskStart =
    new Date(startDate).getHours() * 60 + new Date(startDate).getMinutes();
  const durationInMinutes = taskStart - shiftStart;

  return formatDuration(durationInMinutes);
}

function calculateDurationFromShiftEnd(endDate, shiftType, shiftTime) {
  const shiftEnd =
    shiftType === "A-Side Days" || shiftType === "B-Side Days"
      ? 19 * 60
      : 7 * 60;
  const taskEnd =
    new Date(endDate).getHours() * 60 + new Date(endDate).getMinutes();
  const durationInMinutes = shiftEnd - taskEnd;

  return formatDuration(durationInMinutes);
}

function getShiftTypeAndTime(assignedTo, employees) {
  const assignedShift = employees.find((employee) =>
    assignedTo.includes(employee)
  );
  if (assignedShift) {
    return assignedShift.split(":").map((s) => s.trim());
  }
  return ["", ""];
}

function formatDuration(minutes) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} minute${
      remainingMinutes > 1 ? "s" : ""
    }`;
  }
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

let currentChart = null;

function populateManagerDropdown3(data) {
  const managerDropdown = document.getElementById("managerDropdown3");
  managerDropdown.innerHTML = Object.keys(data)
    .filter((manager) => shouldDisplayManager(data[manager]))
    .map((manager) => `<option value="${manager}">${manager}</option>`)
    .join("");

  managerDropdown.onchange = () => updateDateDropdown3(data);
  updateDateDropdown3(data);
}

function shouldDisplayManager(managerData) {
  return Object.values(managerData).some((dateData) =>
    Object.keys(dateData).some((tech) => {
      if (isSeniorTech(tech)) return false;
      const techData = dateData[tech];
      return techData.length > 0;
    })
  );
}

function updateDateDropdown3(data) {
  const selectedManager = document.getElementById("managerDropdown3").value;
  const dateDropdown = document.getElementById("dateDropdown3");
  const managerData = data[selectedManager];

  if (managerData) {
    dateDropdown.innerHTML = Object.keys(managerData)
      .map((date) => `<option value="${date}">${date}</option>`)
      .join("");

    if (Object.keys(managerData).length > 0) {
      dateDropdown.value = Object.keys(managerData)[0];
      updateTechDropdown3(data);
    } else {
      dateDropdown.innerHTML = "<option value=''>Select Date</option>";
    }
  } else {
    dateDropdown.innerHTML = "<option value=''>Select Date</option>";
  }

  dateDropdown.onchange = () => updateTechDropdown3(data);
}

function updateTechDropdown3(data) {
  const selectedManager = document.getElementById("managerDropdown3").value;
  const selectedDate = document.getElementById("dateDropdown3").value;
  const techDropdown = document.getElementById("techDropdown3");

  const managerData = data[selectedManager];
  if (managerData && managerData[selectedDate]) {
    const dateData = managerData[selectedDate];

    techDropdown.innerHTML = Object.keys(dateData)
      .map((tech) => `<option value="${tech}">${tech}</option>`)
      .join("");

    techDropdown.innerHTML = Object.keys(dateData)
      .filter((tech) => !isSeniorTech(tech) && dateData[tech].length > 0)
      .map((tech) => `<option value="${tech}">${tech}</option>`)
      .join("");

    if (!techDropdown.innerHTML) {
      techDropdown.innerHTML =
        "<option value=''>No Technicians Available</option>";
    }
  } else {
    techDropdown.innerHTML = "<option value=''>Select Technician</option>";
  }
  techDropdown.onchange = () => displayTaskDetails(data);
  displayTaskDetails(data);
}

function displayTaskDetails(data) {
  const selectedManager = document.getElementById("managerDropdown3").value;
  const selectedDate = document.getElementById("dateDropdown3").value;
  const selectedTech = document.getElementById("techDropdown3").value;

  const managerData = data[selectedManager];
  if (
    managerData &&
    managerData[selectedDate] &&
    managerData[selectedDate][selectedTech]
  ) {
    const tasks = managerData[selectedDate][selectedTech];

    if (tasks) {
      const shiftType = tasks.length > 0 ? tasks[0].shift : "A-Side Days";

      renderTimelineChart(tasks, selectedDate, shiftType);
      displayTechStatistics(tasks);
    } else {
    }
  } else {
  }
}

function renderTimelineChart(tasks, selectedDate, shiftType) {
  const chartElement = document.getElementById("chart-timeline");

  if (currentChart) {
    currentChart.destroy();
  }

  let seriesData = [];
  let lastTaskEndTime =
    getShiftStartEnd(selectedDate, shiftType)?.start || new Date();

  tasks.forEach((task) => {
    const taskStart = task.startDate;
    const taskEnd = task.endDate;
    const id = task.id;

    if (taskStart && taskEnd) {
      const taskDuration = taskEnd.getTime() - taskStart.getTime();

      if (taskDuration <= 43200000) {
        if (taskStart > lastTaskEndTime) {
          seriesData.push({
            x: "Idle Time",
            y: [lastTaskEndTime.getTime(), taskStart.getTime()],
            fillColor: "#FF0000",
          });
        }

        seriesData.push({
          x: `Task ${task.id}`,
          y: [taskStart.getTime(), taskEnd.getTime()],
          fillColor: "#008FFB",
        });

        lastTaskEndTime = taskEnd;
      }
    }
  });

  const options = {
    series: [{ data: seriesData }],
    chart: {
      height: 350,
      type: "rangeBar",
    },
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        barHeight: "10%",
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        datetimeUTC: false,
      },
    },
    tooltip: {
      custom: function ({ seriesIndex, dataPointIndex, w }) {
        const task = w.config.series[seriesIndex]?.data[dataPointIndex];
        return task ? `<div class="apexcharts-tooltip">${task.x}</div>` : "";
      },
    },
  };

  currentChart = new ApexCharts(chartElement, options);
  currentChart.render();
}

function getShiftStartEnd(selectedDate, shiftType) {
  if (typeof selectedDate !== "string" || !shiftType) {
    return { start: null, end: null };
  }

  const dateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;

  const dateMatch = selectedDate.match(dateRegex);

  if (!dateMatch) {
    return { start: null, end: null };
  }

  const month = parseInt(dateMatch[1], 10) - 1;
  const day = parseInt(dateMatch[2], 10);
  const year = parseInt(dateMatch[3], 10);

  const shiftStartHours = {
    Days: 7,
    Nights: 19,
  };

  const shiftStartHour = shiftStartHours[shiftType];

  if (isNaN(shiftStartHour)) {
    return { start: null, end: null };
  }

  const shiftStart = new Date(year, month, day, shiftStartHour, 0, 0);
  const shiftEnd = new Date(shiftStart);
  shiftEnd.setHours(shiftEnd.getHours() + 12);

  if (isNaN(shiftStart.getTime()) || isNaN(shiftEnd.getTime())) {
    return { start: null, end: null };
  }

  return { start: shiftStart, end: shiftEnd };
}

function isSeniorTech(name) {
  const person = people.find((p) => p.name === name);
  return person ? person.isSenior : false;
}

function displayTechStatistics(tasks) {
  if (!tasks || tasks.length === 0) {
    return;
  }

  let totalActiveTime = 0;
  let totalIdleTime = 0;
  let lastTaskEndTime = null;
  const maxTaskDuration = 12 * 60 * 60 * 1000;

  for (const task of tasks) {
    if (!task.startDate || !task.endDate) {
      continue;
    }

    const start = new Date(task.startDate).getTime();
    const end = new Date(task.endDate).getTime();
    if (isNaN(start) || isNaN(end)) {
      continue;
    }

    const taskDuration = end - start;

    if (taskDuration <= maxTaskDuration) {
      totalActiveTime += taskDuration;

      if (lastTaskEndTime !== null && start > lastTaskEndTime) {
        totalIdleTime += start - lastTaskEndTime;
      }
      lastTaskEndTime = end;
    }
  }

  if (!tasks[0] || !tasks[0].startDate || !tasks[0].shift) {
    return;
  }

  const shiftTimes = getShiftStartEnd(tasks[0].startDate, tasks[0].shift);
  if (!shiftTimes || !shiftTimes.start || !shiftTimes.end) {
    return;
  }
  const shiftDuration = shiftTimes.end.getTime() - shiftTimes.start.getTime();
  if (isNaN(shiftDuration)) {
    return;
  }

  let effectiveIdleTime = shiftDuration - totalActiveTime;
  if (effectiveIdleTime < 0) effectiveIdleTime = 0;

  let statsElement = document.getElementById("techStatistics");
  statsElement.innerHTML = `Total Time Worked Today: ${millisecondsToHoursMinutes(
    totalActiveTime
  )}<br>Total Idle Time: ${millisecondsToHoursMinutes(effectiveIdleTime)}`;
}

function millisecondsToHoursMinutes(milliseconds) {
  if (isNaN(milliseconds)) {
    return "Invalid Time";
  }
  let hours = Math.floor(milliseconds / 3600000);
  let minutes = Math.floor((milliseconds % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function convertToCST(dateString) {
  const date = new Date(dateString);
  const utcOffset = date.getTimezoneOffset() * 60000;
  const cstOffset = 6 * 60 * 60000;
  return new Date(date.getTime() + utcOffset - cstOffset);
}
