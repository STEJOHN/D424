let transformedData;
function transformDataset(tasksByManager, people) {
  const formatDateKey = (dateStr) => {
    // Extract date portion and format as 'MM/DD/YYYY'
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

  // Loop through managers
  for (const managerName in tasksByManager) {
    transformedData[managerName] = {};
    const managerData = tasksByManager[managerName];

    // Loop through dates
    for (const dateKey in managerData.dates) {
      transformedData[managerName][dateKey] = {};
      const dateData = managerData.dates[dateKey];

      // Loop through employees
      for (const employeeName in dateData.employees) {
        transformedData[managerName][dateKey][employeeName] = [];

        // Retrieve the tasks and sort them by Work Start Date
        const tasks = dateData.employees[employeeName].tasks;
        tasks.sort(
          (a, b) =>
            new Date(a["Work Start Date"]) - new Date(b["Work Start Date"])
        );

        // Calculate shift start and end times based on shift info
        const shiftInfo = getShiftInfo(tasks[0]["Assigned To"]); // Use shift info from the first task
        let shiftStartHour, shiftEndHour;
        if (shiftInfo.includes("Mon - Fri")) {
          shiftStartHour = 8; // 8 AM
          shiftEndHour = 17; // 5 PM
        } else {
          shiftStartHour = shiftInfo.includes("Days") ? 7 : 19; // 7 AM or 7 PM
          shiftEndHour = shiftInfo.includes("Days") ? 19 : 7; // 7 PM or 7 AM
        }

        let totalWorkedTime = 0; // New property for total time worked
        let totalIdleTime = 0; // New property for total idle time

        for (const [index, task] of tasks.entries()) {
          const startDate = new Date(task["Work Start Date"]);
          const endDate = new Date(task["Work End Date"]);

          // Calculate duration from shift start for the first task
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

          // Calculate duration from shift end for the last task
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

          // Calculate task duration
          const taskDuration = (endDate - startDate) / (1000 * 60); // Duration in minutes

          // Calculate total time worked and idle time
          if (taskDuration <= 720) {
            // Exclude tasks longer than 12 hours
            totalWorkedTime += taskDuration;

            // Check for task overlap with the previous task
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

        // Add total time worked and idle time to the employee's data
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

  // Call updateDateDropdown3 with the initial data
  managerDropdown.onchange = () => updateDateDropdown3(data);
  updateDateDropdown3(data); // Populate initially on page load
}

function shouldDisplayManager(managerData) {
  return Object.values(managerData).some((dateData) =>
    Object.keys(dateData).some((tech) => {
      if (isSeniorTech(tech)) return false; // Exclude senior techs
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

    // Set the first date as selected and update the technician dropdown
    if (Object.keys(managerData).length > 0) {
      dateDropdown.value = Object.keys(managerData)[0];
      updateTechDropdown3(data); // Update the technician dropdown
    } else {
      dateDropdown.innerHTML = "<option value=''>Select Date</option>";
    }
  } else {
    dateDropdown.innerHTML = "<option value=''>Select Date</option>";
  }

  // Attach the onchange event to the date dropdown
  dateDropdown.onchange = () => updateTechDropdown3(data);
}

function updateTechDropdown3(data) {
  const selectedManager = document.getElementById("managerDropdown3").value;
  const selectedDate = document.getElementById("dateDropdown3").value;
  const techDropdown = document.getElementById("techDropdown3");

  // Check if manager and date data is available
  const managerData = data[selectedManager];
  if (managerData && managerData[selectedDate]) {
    const dateData = managerData[selectedDate];

    techDropdown.innerHTML = Object.keys(dateData)
      .map((tech) => `<option value="${tech}">${tech}</option>`)
      .join("");

    // Populate tech dropdown
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

  // Check if the selected manager and date are present in the data
  const managerData = data[selectedManager];
  if (
    managerData &&
    managerData[selectedDate] &&
    managerData[selectedDate][selectedTech]
  ) {
    const tasks = managerData[selectedDate][selectedTech];

    // Check if there are tasks for the selected tech
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

    // Check if taskStart and taskEnd are valid date objects
    if (taskStart && taskEnd) {
      const taskDuration = taskEnd.getTime() - taskStart.getTime();
      // console.log(`Task ${id} CST Start: ${taskStart}, CST End: ${taskEnd}`);

      // Filter out tasks longer than 12 hours (43200000 milliseconds)
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
        barHeight: "10%", // Setting a fixed bar height
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
    // console.error(
    //   "Invalid input: selectedDate is not a string or shiftType is missing."
    // );
    return { start: null, end: null };
  }

  // Regular expression to extract date in format MM/DD/YYYY
  const dateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;

  // Extract date from selectedDate
  const dateMatch = selectedDate.match(dateRegex);

  if (!dateMatch) {
    // console.error("Invalid date format:", selectedDate);
    return { start: null, end: null };
  }

  const month = parseInt(dateMatch[1], 10) - 1; // Months are 0-based in JavaScript
  const day = parseInt(dateMatch[2], 10);
  const year = parseInt(dateMatch[3], 10);

  // Define a mapping of shift types to start hours
  const shiftStartHours = {
    Days: 7,
    Nights: 19,
  };

  const shiftStartHour = shiftStartHours[shiftType];

  if (isNaN(shiftStartHour)) {
    // console.error("Invalid shift type:", shiftType);
    return { start: null, end: null };
  }

  const shiftStart = new Date(year, month, day, shiftStartHour, 0, 0);
  const shiftEnd = new Date(shiftStart);
  shiftEnd.setHours(shiftEnd.getHours() + 12);

  if (isNaN(shiftStart.getTime()) || isNaN(shiftEnd.getTime())) {
    // console.error(
    //   "Calculated Shift Start or End is Invalid:",
    //   shiftStart,
    //   shiftEnd
    // );
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
    // console.error("No tasks available for calculation.");
    return;
  }

  let totalActiveTime = 0;
  let totalIdleTime = 0;
  let lastTaskEndTime = null;
  const maxTaskDuration = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  for (const task of tasks) {
    if (!task.startDate || !task.endDate) {
      // console.error("Invalid task dates found.", task);
      continue;
    }

    const start = new Date(task.startDate).getTime();
    const end = new Date(task.endDate).getTime();
    if (isNaN(start) || isNaN(end)) {
      // console.error("Invalid date conversion for task.", task);
      continue;
    }

    const taskDuration = end - start;

    // Only include tasks with duration less than 12 hours
    if (taskDuration <= maxTaskDuration) {
      totalActiveTime += taskDuration;

      // Calculate idle time
      if (lastTaskEndTime !== null && start > lastTaskEndTime) {
        totalIdleTime += start - lastTaskEndTime;
      }
      lastTaskEndTime = end;
    }
  }

  // Check if there's a valid first task to calculate shift times
  if (!tasks[0] || !tasks[0].startDate || !tasks[0].shift) {
    // console.error("Invalid or missing data for the first task.", tasks[0]);
    return;
  }

  // Calculate the shift duration
  const shiftTimes = getShiftStartEnd(tasks[0].startDate, tasks[0].shift);
  if (!shiftTimes || !shiftTimes.start || !shiftTimes.end) {
    // console.error("Invalid shift start or end time.", shiftTimes);
    return;
  }
  const shiftDuration = shiftTimes.end.getTime() - shiftTimes.start.getTime();
  if (isNaN(shiftDuration)) {
    // console.error("Shift duration calculation resulted in NaN.", shiftTimes);
    return;
  }

  // Calculate effective idle time
  let effectiveIdleTime = shiftDuration - totalActiveTime;
  if (effectiveIdleTime < 0) effectiveIdleTime = 0;

  let statsElement = document.getElementById("techStatistics");
  statsElement.innerHTML = `Total Time Worked Today: ${millisecondsToHoursMinutes(
    totalActiveTime
  )}<br>Total Idle Time: ${millisecondsToHoursMinutes(effectiveIdleTime)}`;
}

function millisecondsToHoursMinutes(milliseconds) {
  if (isNaN(milliseconds)) {
    // console.error("Invalid milliseconds input for conversion.", milliseconds);
    return "Invalid Time";
  }
  let hours = Math.floor(milliseconds / 3600000);
  let minutes = Math.floor((milliseconds % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function convertToCST(dateString) {
  // Assuming dateString is in ISO format like "2024-01-03T12:00:00"
  // CST is UTC-6, but consider Daylight Saving Time
  const date = new Date(dateString);
  const utcOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const cstOffset = 6 * 60 * 60000; // CST offset in milliseconds
  return new Date(date.getTime() + utcOffset - cstOffset);
}
