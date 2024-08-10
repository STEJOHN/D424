export function countTasksByManager(testArr) {
  let result = {};

  function getEmployeesByManager(managerName) {
    return people.filter((person) => person.manager === managerName);
  }

  for (const shift in testArr) {
    for (const date in testArr[shift].dates) {
      for (const task of testArr[shift].dates[date].tasks) {
        const assignedToName = task["Assigned To"].split("<")[0].trim();

        const employee = people.find(
          (person) => person.name === assignedToName
        );

        if (employee) {
          const managerName = employee.manager;
          const workEndDate = new Date(task["Work End Date"]);

          const isOT = isOTCategory(employee, workEndDate);

          if (!result[managerName]) {
            result[managerName] = {
              dates: {},
            };
          }

          const otPrefix = isOT ? "(OT) " : "";
          const otDate = otPrefix + date;

          if (!result[managerName].dates[otDate]) {
            result[managerName].dates[otDate] = {
              total: 0,
              employees: {},
            };
          }

          if (!result[managerName].dates[otDate].employees[assignedToName]) {
            result[managerName].dates[otDate].employees[assignedToName] = {
              total: 0,
              tasks: [],
            };
          }

          result[managerName].dates[otDate].total++;
          result[managerName].dates[otDate].employees[assignedToName].total++;
          result[managerName].dates[otDate].employees[
            assignedToName
          ].tasks.push(task);
        }
      }
    }
  }

  return result;
}
export function getResolvedTasks(data) {
  const tasksClosedByShift = {};

  const tasksByShift = data.reduce((acc, task) => {
    if (task["Work End Date"]) {
      const assignedToName = task["Assigned To"].split("<")[0].trim();
      const person = people.find((p) => p.name === assignedToName);

      if (person) {
        const { shift } = person;
        const workEndDate = new Date(task["Work End Date"]);

        if (isOTCategory(person, workEndDate)) {
          if (!acc["OT"]) {
            acc["OT"] = [];
          }
          acc["OT"].push(task);
        } else {
          if (!acc[shift]) {
            acc[shift] = [];
          }
          acc[shift].push(task);
        }
      }
    }
    return acc;
  }, {});

  for (const shift in tasksByShift) {
    const tasks = tasksByShift[shift];
    const tasksClosedByDate = {};
    const isNightShift = shift.toLowerCase().includes("night");
    const now = new Date();
    now.setHours(now.getHours() - (now.getHours() < 7 ? 24 : 0));

    const currentHour = now.getHours();
    const lastThreeShiftsStart = new Date(now);

    if (isNightShift) {
      lastThreeShiftsStart.setDate(now.getDate() - (currentHour >= 19 ? 2 : 3));
      lastThreeShiftsStart.setHours(19, 0, 0, 0);
    } else {
      lastThreeShiftsStart.setDate(now.getDate() - (currentHour < 7 ? 3 : 2));
      lastThreeShiftsStart.setHours(7, 0, 0, 0);
    }

    const gracePeriod = 4;

    tasks.forEach((task) => {
      const workEndDate = new Date(task["Work End Date"]);
      const hour = workEndDate.getHours();

      if (
        ((isNightShift && (hour >= 19 || hour <= 6 + gracePeriod)) ||
          (!isNightShift && hour >= 7 && hour <= 18 + gracePeriod)) &&
        workEndDate >= lastThreeShiftsStart
      ) {
        if (isNightShift && hour < 7) {
          workEndDate.setDate(workEndDate.getDate() - 1);
        }

        let nextDay = new Date(workEndDate);
        if (isNightShift) {
          nextDay.setDate(workEndDate.getDate() + 1);
        }

        const dateString =
          workEndDate.toLocaleString("en-US", { weekday: "long" }) +
          ` (${
            workEndDate.getMonth() + 1
          }/${workEndDate.getDate()}/${workEndDate.getFullYear()})` +
          (isNightShift
            ? ` 7pm - ${nextDay.toLocaleString("en-US", {
                weekday: "long",
              })} (${
                nextDay.getMonth() + 1
              }/${nextDay.getDate()}/${nextDay.getFullYear()}) 7am`
            : " 7am - 7pm");

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

    const sortedTasksClosedByDate = Object.keys(tasksClosedByDate)
      .sort(
        (a, b) =>
          new Date(a.split("(")[1].split(")")[0]) -
          new Date(b.split("(")[1].split(")")[0])
      )
      .reduce((sortedObj, key) => {
        sortedObj[key] = tasksClosedByDate[key];
        return sortedObj;
      }, {});

    tasksClosedByShift[shift] = {
      dates: sortedTasksClosedByDate,
      total: Object.values(sortedTasksClosedByDate).reduce((sum, dateObj) => {
        return sum + dateObj.total;
      }, 0),
    };
  }

  return tasksClosedByShift;
}

export function taskStatistics(testArr, people) {
  let stats = {
    shifts: {},
  };

  function findEmployeeByName(name) {
    return people.find((person) => person.name === name);
  }

  for (const shift in testArr) {
    for (const date in testArr[shift].dates) {
      for (const task of testArr[shift].dates[date].tasks) {
        const assignedToName = task["Assigned To"].split("<")[0].trim();
        const employee = findEmployeeByName(assignedToName);

        if (employee) {
          const employeeShift = employee.shift;
          const managerName = employee.manager;

          if (!stats.shifts[employeeShift]) {
            stats.shifts[employeeShift] = {};
          }

          if (!stats.shifts[employeeShift][date]) {
            stats.shifts[employeeShift][date] = {
              managers: {},
              totalTasksWithWorkWindow: 0,
              totalExpeditedTasks: 0,
              totalBreachedTasks: 0,
            };
          }

          if (!stats.shifts[employeeShift][date].managers[managerName]) {
            stats.shifts[employeeShift][date].managers[managerName] = {
              tasksWithWorkWindow: 0,
              expeditedTasks: 0,
              breachedTasks: 0,
            };
          }

          if (task["Work Window Start Date"].length > 0) {
            stats.shifts[employeeShift][date].managers[managerName]
              .tasksWithWorkWindow++;
            stats.shifts[employeeShift][date].totalTasksWithWorkWindow++;
          }

          if (task["Expedite"].toLowerCase() === "true") {
            stats.shifts[employeeShift][date].managers[managerName]
              .expeditedTasks++;
            stats.shifts[employeeShift][date].totalExpeditedTasks++;
          }

          if (parseInt(task["OLA"]) < 0) {
            stats.shifts[employeeShift][date].managers[managerName]
              .breachedTasks++;
            stats.shifts[employeeShift][date].totalBreachedTasks++;
          }
        }
      }
    }
  }

  return stats;
}

export function findMostRecentDates(data) {
  let latestDate = null;
  let latestManagers = {};

  for (let category in data) {
    let dates = data[category].dates;

    for (let dateStr in dates) {
      const datePattern = /\((\d{1,2}\/\d{1,2}\/\d{4})\)/;
      const dateMatch = dateStr.match(datePattern);

      if (dateMatch) {
        let dateString = dateMatch[1];
        let dateParts = dateString.split("/");
        let date = new Date(`${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`);

        const timePattern = /(\d{1,2}:\d{2}[ap]m)/i;
        const timeMatch = dateStr.match(timePattern);

        if (timeMatch) {
          const timeString = timeMatch[1];
          const isPM = timeString.toLowerCase().includes("pm");
          let hours = parseInt(timeString, 10) + (isPM ? 12 : 0);
          date.setHours(hours);
        }

        if (latestDate === null || date > latestDate) {
          latestDate = date;
          latestManagers = {
            [category]: { date: dateStr, total: dates[dateStr].total },
          };
        } else if (date.getTime() === latestDate.getTime()) {
          latestManagers[category] = {
            date: dateStr,
            total: dates[dateStr].total,
          };
        }
      }
    }
  }

  return latestManagers;
}

export function resolvedTasksForCampus(tasks, campus) {
  return tasks.filter(
    (task) => task.State === "Resolved" && task["Datacenter Code"] === campus
  ).length;
}

export function getDeploymemts(tasks, sites) {
  let results = new Set();
  for (let i = 0; i < tasks.length; i++) {
    for (let j = 0; j < sites.length; j++) {
      const x = tasks[i];
      const deployFiles = x[`Deployment File Repository`];
      const state = x[`State`];

      const dc = x[`Datacenter Code`];
      const site = sites[j][`Datacenter Code`];

      if (x && deployFiles && state === "Created" && dc === site) {
        results.add(tasks[i]);
      }
    }
  }
  return results;
}
