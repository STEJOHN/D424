function handleFileSelect(event) {
  if (!event.target.files || event.target.files.length == 0) {
    return;
  }
  const file = event.target.files[0];
  if (!file.name.endsWith(".csv")) {
    Swal.fire("Please select a CSV file.");
    return;
  }
}

$(document).ready(function () {
  $("#exampleModalCenter").modal({
    backdrop: "static",
    keyboard: false,
  });
});

function handleClickAndReload() {
  localStorage.setItem("showModalAfterReload", true);

  location.reload();
}

function getResolvedByCampus(data) {
  let now = new Date();
  let twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  let todayCount = 0;
  let time_array = [];
  let tempDateArray = [];
  let lens = data.length;

  for (let i = 0; i < lens; i++) {
    if (data[i] && data[i]["State"] === "Resolved") {
      let workEndDate = new Date(data[i]["Work End Date"]);

      if (workEndDate >= twelveHoursAgo && workEndDate <= now) {
        todayCount++;
        tempDateArray.push(workEndDate);
      }
    }
  }

  tempDateArray.sort((a, b) => a - b);

  tempDateArray.forEach((dateObj) => {
    time_array.push(dateObj.toLocaleString("en-US", { hour12: true }));
  });

  document.getElementById(`resolvedTasks`).innerHTML = time_array.length;

  return time_array;
}

function getCreatedByCampus(data) {
  let now = new Date();
  let twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let todayCount = 0;
  let yesterdayCount = 0;
  let time_array = [];
  let tempDateArray = [];
  let lens = data.length;

  for (let i = 0; i < lens; i++) {
    if (data[i] && data[i]["State"] === "Created") {
      let workStartDate = new Date(data[i]["Work Start Date"]);
      let createdDate = new Date(data[i]["Created Date"]);

      if (
        (workStartDate >= twentyFourHoursAgo && workStartDate <= now) ||
        (createdDate >= twentyFourHoursAgo && createdDate <= now)
      ) {
        todayCount++;
        tempDateArray.push(
          workStartDate > createdDate ? workStartDate : createdDate
        );
      }
    }
  }

  tempDateArray.sort((a, b) => a - b);

  tempDateArray.forEach((dateObj) => {
    time_array.push(dateObj.toLocaleString("en-US", { hour12: true }));
  });

  let difference = Math.abs(todayCount - yesterdayCount);

  document.getElementById(`totalCreated`).innerHTML = time_array.length;

  return time_array;
}

function getResolvedBySN(data) {
  let now = new Date();
  let twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  let todayDateString = now.toLocaleDateString();
  let yesterdayDateString = twelveHoursAgo.toLocaleDateString();

  let todayCount = 0;
  let yesterdayCount = 0;
  let time_array = [];
  let tempDateArray = [];
  let lens = data.length;

  for (let i = 0; i < lens; i++) {
    if (data[i] && data[i]["State"] === "Resolved") {
      let datacenterCode = data[i]["Datacenter Code"];

      if (Array.isArray(DC_TX_Region1)) {
        const isRegion1 = DC_TX_Region1.some(
          (obj) => obj["Datacenter Code"] === datacenterCode
        );

        if (isRegion1) {
          let workEndDate = new Date(data[i]["Work End Date"]);
          if (workEndDate >= twelveHoursAgo && workEndDate <= now) {
            tempDateArray.push(workEndDate);
            if (workEndDate.toLocaleDateString() === todayDateString) {
              todayCount++;
            } else if (
              workEndDate.toLocaleDateString() === yesterdayDateString
            ) {
              yesterdayCount++;
            }
          }
        }
      }
    }
  }

  tempDateArray.sort((a, b) => a - b);
  tempDateArray.forEach((dateObj) => {
    time_array.push(dateObj.toLocaleString("en-US", { hour12: true }));
  });

  let difference = Math.abs(todayCount - yesterdayCount);

  let arrowIndicatorElement = document.getElementById(
    "arrowIndicatorResolvedSN"
  );

  document.getElementById("resolvedSN").innerHTML = time_array.length;

  return time_array;
}

function getResolvedBySat(data) {
  let now = new Date();
  let twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  let todayDateString = now.toLocaleDateString();
  let yesterdayDateString = twelveHoursAgo.toLocaleDateString();

  let todayCount = 0;
  let yesterdayCount = 0;
  let time_array = [];
  let tempDateArray = [];
  let lens = data.length;

  for (let i = 0; i < lens; i++) {
    if (data[i] && data[i]["State"] === "Resolved") {
      let datacenterCode = data[i]["Datacenter Code"];

      if (Array.isArray(DC_TX_Region2)) {
        const isRegion2 = DC_TX_Region2.some(
          (obj) => obj["Datacenter Code"] === datacenterCode
        );

        if (isRegion2) {
          let workEndDate = new Date(data[i]["Work End Date"]);
          if (workEndDate >= twelveHoursAgo && workEndDate <= now) {
            tempDateArray.push(workEndDate);
            if (workEndDate.toLocaleDateString() === todayDateString) {
              todayCount++;
            } else if (
              workEndDate.toLocaleDateString() === yesterdayDateString
            ) {
              yesterdayCount++;
            }
          }
        }
      }
    }
  }

  tempDateArray.sort((a, b) => a - b);
  tempDateArray.forEach((dateObj) => {
    time_array.push(dateObj.toLocaleString("en-US", { hour12: true }));
  });

  let difference = Math.abs(todayCount - yesterdayCount);

  let arrowIndicatorElement = document.getElementById(
    "arrowIndicatorResolvedSAT"
  );

  document.getElementById("resolvedSAT").innerHTML = time_array.length;

  return time_array;
}

function determineCampus(datacenterCode) {
  const region1Sites = ["DC1", "DC2", "DC4", "DC4"];
  const region2Sites = ["DC5", "DC6", "DC7", "DC8"];

  if (region1Sites.includes(datacenterCode)) {
    return "Region 1";
  } else if (region2Sites.includes(datacenterCode)) {
    return "Region 2";
  }
}

function arbByCampus(campus) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next24Hours = new Date();
  next24Hours.setHours(next24Hours.getHours() + 24);

  const oneWeekFromToday = new Date(today);
  oneWeekFromToday.setDate(today.getDate() + 7);

  const oneMonthFromToday = new Date(today);
  oneMonthFromToday.setMonth(today.getMonth() + 1);

  const categories = {
    dueTodayOrPrior: {},
    dueInNext24Hours: {},
    dueInOneWeek: {},
    dueInOneMonth: {},
    dueLater: {},
  };

  let lens = campus.length;

  for (let i = 0; i < lens; i++) {
    const task = campus[i];
    const arbString = task["Action Required By"];
    const arbDate = new Date(arbString);
    const datacenterCode = task["Datacenter Code"];
    const state = task["State"];
    const ww = task["Work Window Start Date"];
    const campusName = determineCampus(datacenterCode);

    let category = null;

    if (arbDate <= today) {
      category = "dueTodayOrPrior";
    } else if (arbDate <= next24Hours) {
      category = "dueInNext24Hours";
    } else if (arbDate <= oneWeekFromToday) {
      category = "dueInOneWeek";
    } else if (arbDate <= oneMonthFromToday) {
      category = "dueInOneMonth";
    } else {
      category = "dueLater";
    }

    if (!categories[category][campusName]) {
      categories[category][campusName] = {};
    }

    if (!categories[category][campusName][datacenterCode]) {
      categories[category][campusName][datacenterCode] = [];
    }

    if (state === "Created" && ww.length === 0) {
      categories[category][campusName][datacenterCode].push(task);
    }
  }

  for (const cat in categories) {
    for (const campusName in categories[cat]) {
      for (const dcCode in categories[cat][campusName]) {
        if (categories[cat][campusName][dcCode].length === 0) {
          delete categories[cat][campusName][dcCode];
        }
      }
      if (Object.keys(categories[cat][campusName]).length === 0) {
        delete categories[cat][campusName];
      }
    }
    if (Object.keys(categories[cat]).length === 0) {
      delete categories[cat];
    }
  }

  return categories;
}

function getFaults(metro) {
  let results = {};
  let lens = metro.length;

  for (let i = 0; i < lens; i++) {
    const code = metro[i]["Fault Code"];

    if (code) {
      if (!results.hasOwnProperty(code)) {
        results[code] = metro[i]["Title"];
      } else {
        results[code] = metro[i]["Fault Description"];
      }
    }
  }

  return results;
}

function parseDate(str) {
  if (!str) return new Date(0);
  const [date, time, meridiem] = str.split(" ");
  const [month, day, year] = date.split("/");
  const [hour, minute] = time.split(":");
  let h = parseInt(hour);
  if (meridiem === "pm") h += 12;
  return new Date(year, month - 1, day, h, minute);
}

function processTitle(task) {
  let title = task["Title"] || "";
  let faultDescription = task["Fault Description"] || "";
  let betterDescription = "";

  if (title.includes(":")) {
    const [beforeColon] = title.split(":");
    if (!beforeColon.toLowerCase().includes("device")) {
      betterDescription = beforeColon.trim();
    }
  }

  if (!betterDescription && faultDescription.includes(":")) {
    const [beforeColon, afterColon] = faultDescription.split(":");
    if (beforeColon.toLowerCase().includes("device")) {
      betterDescription = afterColon.trim();
    }
  }

  if (!betterDescription) {
    betterDescription =
      title.length >= faultDescription.length ? title : faultDescription;
  }

  return betterDescription;
}

function getAssigned(data, people, DC_TX_Region1, DC_TX_Region2) {
  const siteMap = new Map();
  const region1Set = new Set(
    DC_TX_Region1.map((site) => site["Datacenter Code"].toLowerCase())
  );
  const region2Set = new Set(
    DC_TX_Region2.map((site) => site["Datacenter Code"].toLowerCase())
  );

  const peopleMap = new Map(people.map((p) => [p["name"], p["manager"]]));

  for (const x of data) {
    if (x["Assigned To"]) {
      const alias = x["Assigned To"].split("<")[0].trim();
      const dc = x["Datacenter Code"].toLowerCase();
      const state = x["State"];

      let category = null;
      if (region1Set.has(dc)) {
        category = dc;
      } else if (region2Set.has(dc)) {
        category = dc;
      }

      if (
        state !== "Resolved" &&
        state !== "Canceled" &&
        category &&
        peopleMap.has(alias)
      ) {
        const mgr = peopleMap.get(alias);
        if (mgr !== "IGNORE") {
          if (!siteMap.has(category)) {
            siteMap.set(category, new Set());
          }
          siteMap.get(category).add(x);
        }
      }
    }
  }

  const region1Total = Array.from(region1Set).reduce((sum, dc) => {
    return sum + (siteMap.has(dc) ? siteMap.get(dc).size : 0);
  }, 0);

  const region2Total = Array.from(region2Set).reduce((sum, dc) => {
    return sum + (siteMap.has(dc) ? siteMap.get(dc).size : 0);
  }, 0);

  document.getElementById(
    "assignedTasks"
  ).innerHTML = `Region 1: ${region1Total} / Region 2: ${region2Total}`;

  return siteMap;
}

function populateAndShowModal(taskDetails) {
  let rows = [];

  taskDetails.forEach((taskSet, site) => {
    const peopleMap = new Map(people.map((p) => [p.name, p.manager]));
    let managerName = "";
    taskSet.forEach((task) => {
      let employeeName = task[`Assigned To`].split(`<`)[0].trim();
      if (employeeName && peopleMap.has(employeeName)) {
        managerName = peopleMap.get(employeeName);
      }
      const betterDescription = processTitle(task);
      const row = `<tr>
      <td>${task.Id}</td>
      <td>${task["Assigned To"]}</td>
      <td>${task["Datacenter Code"]}</td>
      <td>${managerName}</td>
      <td>${task["State"]}</td>
      <td>${betterDescription}</td>
      <td>${task["Task Type"]}</td>
    </tr>`;
      rows.push(row);
    });
  });

  if ($.fn.DataTable.isDataTable("#taskTable")) {
    $("#taskTable").DataTable().clear().destroy();
  }

  $("#taskTableBody").html(rows.join(""));

  $("#taskTable").DataTable({
    retrieve: true,
    dom: '<"top"lfB>rtip',
    buttons: [
      {
        extend: "excel",
        text: "Export to Excel",
      },
    ],
    search: true,
  });

  $("#infoModal").modal("show");
}

$(document).on(
  "click",
  "#inProgressInfo, #assignedInfo, #holdInfo, #resolvedInfo",
  function () {
    if ($.fn.DataTable.isDataTable("#taskTable")) {
      $("#taskTable").DataTable().clear().destroy();
    }

    let taskDetails;

    if (this.id === "inProgressInfo") {
      taskDetails = getInProgress(tasks, people, DC_TX_Region1, DC_TX_Region2);
    } else if (this.id === "assignedInfo") {
      taskDetails = getAssigned(tasks, people, DC_TX_Region1, DC_TX_Region2);
    } else if (this.id === "holdInfo") {
      taskDetails = getHold(tasks, people, DC_TX_Region1, DC_TX_Region2);
    } else if (this.id === "resolvedInfo") {
      taskDetails = getResolved(tasks, people, DC_TX_Region1, DC_TX_Region2);
    }

    populateAndShowModal(taskDetails);
  }
);

function analyzeTasks(tasks) {
  const datacenterCategories = {};

  const parseDate = (dateStr) => new Date(dateStr);
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task["State"] === "Created") {
      const datacenterCode = task["Datacenter Code"];
      if (!datacenterCategories[datacenterCode]) {
        datacenterCategories[datacenterCode] = {
          expedite: [],
          actionRequired: {
            dueNow: [],
            due24hr: [],
            dueWeek: [],
            dueMonth: [],
            dueYear: [],
          },
          workWindowStart: {
            dueToday: [],
            dueTomorrow: [],
            dueWeek: [],
          },
          severity: {
            0: [],
            1: [],
            2: [],
          },
        };
      }

      if (task["Expedite"] === "true") {
        datacenterCategories[datacenterCode].expedite.push(task);
      }

      const arbDate = parseDate(task["Action Required By"]);
      const timeToArb = arbDate - now;
      if (timeToArb <= oneDay) {
        datacenterCategories[datacenterCode].actionRequired.dueNow.push(task);
      } else if (timeToArb <= oneWeek) {
        datacenterCategories[datacenterCode].actionRequired.due24hr.push(task);
      } else if (timeToArb <= oneMonth) {
        datacenterCategories[datacenterCode].actionRequired.dueWeek.push(task);
      } else if (timeToArb <= endOfYear - now) {
        datacenterCategories[datacenterCode].actionRequired.dueMonth.push(task);
      } else {
        datacenterCategories[datacenterCode].actionRequired.dueYear.push(task);
      }

      const workWindowDate = parseDate(task["Work Window Start Date"]);
      const timeToWorkWindow = workWindowDate - now;
      if (timeToWorkWindow <= oneDay) {
        datacenterCategories[datacenterCode].workWindowStart.dueToday.push(
          task
        );
      } else if (timeToWorkWindow <= 2 * oneDay) {
        datacenterCategories[datacenterCode].workWindowStart.dueTomorrow.push(
          task
        );
      } else if (timeToWorkWindow <= oneWeek) {
        datacenterCategories[datacenterCode].workWindowStart.dueWeek.push(task);
      }

      const severityLevel = task["Severity"];
      if ([0, 1, 2].includes(Number(severityLevel))) {
        datacenterCategories[datacenterCode].severity[severityLevel].push(task);
      }
    }
  }
  return datacenterCategories;
}

function generateStackedBarChart(heatmapData) {
  const sortedCategories = Object.keys(heatmapData).sort();

  const safeLength = (obj, ...keys) => {
    for (const key of keys) {
      if (!obj || !obj.hasOwnProperty(key)) {
        return 0;
      }
      obj = obj[key];
    }
    return obj.length;
  };

  const series = [
    {
      name: "Expedite",
      data: sortedCategories.map((dc) =>
        safeLength(heatmapData[dc], "expedite")
      ),
    },
    {
      name: "ARB Due Now",
      data: sortedCategories.map((dc) =>
        safeLength(heatmapData[dc], "actionRequired", "dueNow")
      ),
    },
    {
      name: "ARB > 24hrs",
      data: sortedCategories.map((dc) =>
        safeLength(heatmapData[dc], "actionRequired", "due24hr")
      ),
    },
    {
      name: "WW Due Today",
      data: sortedCategories.map((dc) =>
        safeLength(heatmapData[dc], "workWindowStart", "dueToday")
      ),
    },
  ].filter((serie) => serie.data.some((value) => value > 0));

  const options = {
    chart: {
      type: "line",
      stacked: true,
    },
    series: series,
    xaxis: {
      categories: sortedCategories,
    },
    legend: {
      show: true,
    },
  };

  const chart = new ApexCharts(
    document.querySelector("#stackedBarChart"),
    options
  );
  chart.render();
}

function prepareChartData(datacenterCategories) {
  const categories = [];
  const series = [
    { name: "Expedite", data: [] },
    { name: "Action Required Now", data: [] },
    { name: "Action Required within 24hr", data: [] },
    { name: "Action Required this Week", data: [] },
    { name: "Work Window Today", data: [] },
    { name: "Work Window Tomorrow", data: [] },
  ];

  for (const [datacenterCode, taskTypes] of Object.entries(
    datacenterCategories
  )) {
    categories.push(datacenterCode);

    series[0].data.push(taskTypes.expedite.length);
    series[1].data.push(taskTypes.actionRequired.dueNow.length);
    series[2].data.push(taskTypes.actionRequired.due24hr.length);
    series[3].data.push(taskTypes.actionRequired.dueWeek.length);
    series[4].data.push(taskTypes.workWindowStart.dueToday.length);
    series[5].data.push(taskTypes.workWindowStart.dueTomorrow.length);
  }

  return { categories, series };
}

function generateDC_Chart(datacenterCategories) {
  const { categories, series } = prepareChartData(datacenterCategories);

  const options = {
    series: series.filter((s) => s.data.some((v) => v !== 0)),
    chart: {
      type: "bar",
      height: 430,
      stacked: true,
    },
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: {
          style: {
            fontSize: "8px",
          },
          formatter: function (val) {
            return val === 0 ? "" : val;
          },
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
    xaxis: {
      categories: categories,
    },
  };

  const chart = new ApexCharts(
    document.querySelector("#treeMapChart"),
    options
  );
  chart.render();
}

function assessOvertime(tasks, people, selectedManager) {
  let tallyInfo = {};
  let uniqueTechs = new Set();

  global_tech_count = 0;
  global_ot_techs = {
    "A-Side Days": [],
    "A-Side Nights": [],
    "B-Side Days": [],
    "B-Side Nights": [],
  };
  ot_techs = [];

  tasks.forEach((task) => {
    const assignedTo = task["Assigned To"].split("<")[0].trim();
    const taskState = task["State"];
    let taskDate;

    if (taskState === "Resolved") {
      taskDate = new Date(task["Work End Date"]);
    } else {
      return;
    }
    const taskDayName = taskDate.toLocaleString("en-US", { weekday: "long" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (taskDate.toDateString() !== today.toDateString()) {
      return;
    }

    const person = people.find((p) => p.name === assignedTo);

    if (
      !person ||
      person.manager === "IGNORE" ||
      ![
        "A-Side Days",
        "A-Side Nights",
        "B-Side Days",
        "B-Side Nights",
      ].includes(person.shift)
    ) {
      return;
    }

    if (selectedManager) {
      const shouldBeCounted =
        ["Susie Garcia", "David Levis"].includes(assignedTo) &&
        "B-Side Days" === person.shift &&
        selectedManager === person.manager;

      if (
        !shouldBeCounted &&
        uniqueTechs.has(`${assignedTo}-${person.shift}`)
      ) {
        uniqueTechs.delete(`${assignedTo}-${person.shift}`);
        global_tech_count--;
        return;
      }

      if (!shouldBeCounted) return;
    }

    if (uniqueTechs.has(`${assignedTo}-${person.shift}`)) {
      return;
    }

    uniqueTechs.add(`${assignedTo}-${person.shift}`);
    global_tech_count++;

    const side = person.shift.split(" ")[0];
    if (!tallyInfo[side]) {
      tallyInfo[side] = 0;
    }
    tallyInfo[side]++;
    const isOvertime =
      (person.shift === "A-Side Days" &&
        ["Thursday", "Friday", "Saturday"].includes(taskDayName)) ||
      (person.shift === "A-Side Nights" &&
        ["Thursday", "Friday", "Saturday"].includes(taskDayName) &&
        (taskDayName !== "Thursday" || taskDate.getHours() >= 19)) ||
      (person.shift === "B-Side Days" &&
        ["Sunday", "Monday", "Tuesday"].includes(taskDayName)) ||
      (person.shift === "B-Side Nights" &&
        ["Sunday", "Monday", "Tuesday"].includes(taskDayName) &&
        (taskDayName !== "Sunday" || taskDate.getHours() >= 19));

    if (isOvertime) {
      if (!global_ot_techs[person.shift].includes(person.name)) {
        global_ot_techs[person.shift].push(person.name);
      }
      if (!ot_techs.includes(person.name)) {
        ot_techs.push(person.name);
      }
    }
  });

  let maxSide, minSide;
  if (Object.keys(tallyInfo).length > 0) {
    maxSide = Object.keys(tallyInfo).reduce((a, b) =>
      tallyInfo[a] > tallyInfo[b] ? a : b
    );
    minSide = Object.keys(tallyInfo).reduce((a, b) =>
      tallyInfo[a] < tallyInfo[b] ? a : b
    );
  } else {
    maxSide = null;
    minSide = null;
  }
}

function exportToExcel() {
  convertSelectsToText();

  const html = $("#summernote").summernote("code");
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const $doc = $(doc.body);

  const wb = XLSX.utils.book_new();
  const ws = {};

  let row = 1;

  const headers = [
    "Date",
    "Campus",
    "DCTM",
    "Issues/changes Encountered",
    "Project Details",
    "Late Arrivals",
    "PTO",
    "Call Outs",
    "Techs WFH",
    "Techs on site",
    "Overtime Tech #",
    "Techs on BF",
    "Techs on DPLY/Other",
    "# Escorts",
    "Tickets Closed",
  ];

  headers.forEach((header, index) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
    ws[cellRef] = { t: "s", v: header };
  });

  $doc.find("table tr").each((i, tr) => {
    if (i === 0) return;

    $(tr)
      .find("td")
      .each((j, cell) => {
        const value = $(cell).text();
        const cellRef = XLSX.utils.encode_cell({ r: row, c: j });
        ws[cellRef] = { t: "s", v: value };
      });
    row++;
  });

  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: row, c: headers.length - 1 },
  });

  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  XLSX.writeFile(wb, "StructuredData.xlsx");
}
function calculateHeaderData(tasks, people, selectedManager) {
  let data = {
    issuesChanges: [],
    uniqueTechs: new Set(),
    uniqueBreakFixTechs: new Set(),
    resolved: 0,
    techsOnSite: new Set(),
  };

  assessOvertime(tasks, people, selectedManager, true);

  const currentDate = new Date();
  const timeBoundary = new Date(currentDate.getTime() - 12 * 60 * 60 * 1000);

  tasks.forEach((task) => {
    const workEndDate = new Date(task["Work End Date"]);
    const person = people.find(
      (p) => p.name === task["Assigned To"].split("<")[0].trim()
    );

    if (
      !person ||
      person.manager !== selectedManager ||
      workEndDate < timeBoundary ||
      workEndDate > currentDate
    ) {
      return;
    }

    if (task["State"] === "Resolved") {
      data.resolved++;

      const faultDescription = task["Fault Description"];
      if (
        [
          "General: PDU Audit",
          "General: Physical Audit",
          "General: Security Escort",
        ].includes(faultDescription)
      ) {
        data.issuesChanges.push(task);
      }

      data.uniqueTechs.add(task["Assigned To"]);
      if (["BreakFix", "RMA"].includes(task["Task Type"])) {
        data.uniqueBreakFixTechs.add(task["Assigned To"]);
      }

      if (task["Work Start Date"] && task["Work From Home"] !== true) {
        data.techsOnSite.add(task["Assigned To"]);
      }
    }
  });

  return {
    ...data,
    uniqueTechs: {
      size: data.uniqueTechs.size,
      names: Array.from(data.uniqueTechs),
    },
    uniqueBreakFixTechs: {
      size: data.uniqueBreakFixTechs.size,
      names: Array.from(data.uniqueBreakFixTechs),
    },
    techsOnSite: {
      size: data.techsOnSite.size,
      names: Array.from(data.techsOnSite),
    },
  };
}

function populateSummernote() {
  const headerData = calculateHeaderData(tasks, people, selectedManager);

  let content = '<table class="table table-striped table-hover"><tr>';
  const headers = [
    "Date",
    "Campus",
    "DCTM",
    "Issues/changes Encountered",
    "Project Details",
    "Late Arrivals",
    "PTO",
    "Call Outs",
    "Techs WFH",
    "Techs on site",
    "Overtime Tech #",
    "Techs on BF",
    "Techs on DPLY/Other",
    "# Escorts",
    "Tickets Closed",
  ];

  headers.forEach((header) => {
    content += `<th>${header}</th>`;
  });

  content += "</tr><tr>";

  const date = new Date();
  const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${String(
    date.getFullYear()
  ).slice(2)}`;
  content += `<td>${formattedDate}</td>`;

  const campusOptions = ["SN/Leased", "SAT"]
    .map((campus) => `<option>${campus}</option>`)
    .join("");
  content += `<td><select id='campus_selected'>${campusOptions}</select></td>`;

  const uniqueManagerOptions = [
    `<option${selectedManager ? "" : " selected"}>Select Manager</option>`,
    ...Array.from(new Set(people.map((person) => person.manager)))
      .filter((manager) => manager !== "Ricardo Rendon" && manager !== "IGNORE")
      .map(
        (manager) =>
          `<option${
            manager === selectedManager ? " selected" : ""
          }>${manager}</option>`
      ),
  ].join("");

  content += `<td><select id='manager_selected'>${uniqueManagerOptions}</select></td>`;

  content += `<td>${headerData.issuesChanges
    .map((issue) => issue.Title)
    .join(", ")}</td>`;
  content += `<td>${headerData.issuesChanges
    .map((issue) => issue.Title)
    .join(", ")}</td>`;
  content += `<td>${headerData.uniqueTechs.size}</td>`;
  content += `<td>0</td>`;
  content += `<td>0</td>`;
  content += `<td>0</td>`;
  content += `<td>0</td>`;
  content += `<td>${headerData.techsOnSite.size}</td>`;
  content += `<td></td>`;
  content += `<td>${headerData.uniqueBreakFixTechs.size}</td>`;
  content += `<td></td>`;
  content += `<td></td>`;
  content += `<td>${headerData.resolved}</td>`;

  content += "</tr></table>";

  $("#summernote").summernote("code", content);
}

document.addEventListener("change", function (event) {
  if (event.target.id === "manager_selected") {
    selectedManager = event.target.value;
    populateSummernote();
  }
});
let mgr = "";
document.addEventListener("change", function (event) {
  if (event.target.id === "manager_selected") {
    selectedManager = event.target.value;
    mgr = selectedManager;
    localStorage.setItem("manager", mgr);

    populateSummernote();
  }
});

function convertSelectsToText() {
  const selects = document.querySelectorAll("table select");

  selects.forEach((select) => {
    const selectedText = select.options[select.selectedIndex].text;
    select.parentElement.innerHTML = selectedText;
  });
}

function analyzeResourceDistribution(tasks) {
  const siteWorkload = { SN: {}, SAT: {} };

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const twelveHours = 12 * 60 * 60 * 1000;

  tasks.forEach((task) => {
    if (task["State"] === "Created") {
      const siteCode = task["Datacenter Code"];
      const siteType = [
        "SN1",
        "SN2",
        "SN4",
        "SN7",
        "SN3",
        "SN5",
        "SN6",
        "SAT20",
      ].includes(siteCode)
        ? "SN"
        : "SAT";

      if (!siteWorkload[siteType][siteCode]) {
        siteWorkload[siteType][siteCode] = 0;
      }

      const arbDate = new Date(task["Action Required By"]);
      const wwsDate = new Date(task["Work Window Start Date"]);
      const timeToArb = arbDate - now;
      const timeToWws = wwsDate - now;

      if (
        timeToArb <= oneDay ||
        timeToWws <= twelveHours ||
        task["Expedite"] === "true"
      ) {
        siteWorkload[siteType][siteCode]++;
      }
    }
  });

  return siteWorkload;
}

function prepareResourceChartData(siteWorkload) {
  const categories = [];
  const series = [
    { name: "Action Required By", data: [] },
    { name: "Work Window Start", data: [] },
    { name: "Expedite", data: [] },
  ];

  for (const [siteType, datacenters] of Object.entries(siteWorkload)) {
    for (const [datacenterCode, taskTypes] of Object.entries(datacenters)) {
      categories.push(`${siteType} - ${datacenterCode}`);

      const totalTasks = taskTypes.total;

      if (totalTasks > 0) {
        series[0].data.push(taskTypes.actionRequiredBy);
        series[1].data.push(taskTypes.workWindowStart);
        series[2].data.push(taskTypes.expedite);
      } else {
        series[0].data.push(0);
        series[1].data.push(0);
        series[2].data.push(0);
      }
    }
  }

  return { categories, series };
}

function getARB(campus, DC_TX_Region1) {
  const currentTime = new Date();

  const startOfDay = new Date(currentTime);
  startOfDay.setHours(0, 0, 0, 0);

  const DC_TX_Region1Set = new Set(
    (DC_TX_Region1 || []).map((item) => item["Datacenter Code"])
  );

  const categories = {
    Created: { SAT: {}, "SN/Leased": {} },
    Resolved: { SAT: {}, "SN/Leased": {} },
  };

  for (let i = 0; i < campus.length; i++) {
    const task = campus[i];
    const state = task["State"];
    const datacenterCode = task["Datacenter Code"];

    const campusName = DC_TX_Region1Set.has(datacenterCode)
      ? "SN/Leased"
      : "SAT";

    let relevantDate;
    let category;

    if (state === "Created") {
      relevantDate = new Date(task["Created Date"]);
      category = "Created";
    } else if (state === "Resolved") {
      relevantDate = new Date(task["Work End Date"]);
      category = "Resolved";
    } else {
      continue;
    }

    if (relevantDate >= startOfDay && relevantDate <= currentTime) {
      if (!categories[category][campusName][datacenterCode]) {
        categories[category][campusName][datacenterCode] = [];
      }

      categories[category][campusName][datacenterCode].push(task);
    }
  }

  return categories;
}

function blockedTasks(tasks) {
  let filteredTasks = [];
  const currentDate = new Date();

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const state = task["State"];
    const id = task["Id"];
    const slaDue = task["SLA Due Date"];
    const dueDate = new Date(slaDue);

    const diffTime = Math.abs(dueDate - currentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (state === "Blocked" && diffDays > 25) {
      filteredTasks.push(task);
    }
  }

  return filteredTasks;
}

function getInProgress(data, people, DC_TX_Region1, DC_TX_Region2) {
  const siteMap = new Map();
  const region1Set = new Set(
    DC_TX_Region1.map((site) => site["Datacenter Code"].toLowerCase())
  );
  const region2Set = new Set(
    DC_TX_Region2.map((site) => site["Datacenter Code"].toLowerCase())
  );

  const peopleMap = new Map(people.map((p) => [p["name"], p["manager"]]));

  for (const x of data) {
    if (x["Assigned To"]) {
      const alias = x["Assigned To"].split("<")[0].trim();
      const dc = x["Datacenter Code"].toLowerCase();
      const state = x["State"];

      let category = null;
      if (region1Set.has(dc)) {
        category = dc;
      } else if (region2Set.has(dc)) {
        category = dc;
      }

      if (state === "InProgress" && category && peopleMap.has(alias)) {
        const mgr = peopleMap.get(alias);
        if (mgr !== "IGNORE") {
          if (!siteMap.has(category)) {
            siteMap.set(category, new Set());
          }
          siteMap.get(category).add(x);
        }
      }
    }
  }

  const region1Total = Array.from(region1Set).reduce((sum, dc) => {
    return sum + (siteMap.has(dc) ? siteMap.get(dc).size : 0);
  }, 0);

  const region2Total = Array.from(region2Set).reduce((sum, dc) => {
    return sum + (siteMap.has(dc) ? siteMap.get(dc).size : 0);
  }, 0);

  document.getElementById(
    "inProgressTasks"
  ).innerHTML = `Region 1: ${region1Total} / Region 2: ${region2Total}`;

  return siteMap;
}

function getHold(data, people, DC_TX_Region1, DC_TX_Region2) {
  const siteMap = new Map();
  const region1Set = new Set(
    DC_TX_Region1.map((site) => site["Datacenter Code"].toLowerCase())
  );
  const region2Set = new Set(
    DC_TX_Region2.map((site) => site["Datacenter Code"].toLowerCase())
  );

  const peopleMap = new Map(people.map((p) => [p["name"], p["manager"]]));

  for (const x of data) {
    if (x["Assigned To"]) {
      const alias = x["Assigned To"].split("<")[0].trim();
      const dc = x["Datacenter Code"].toLowerCase();
      const state = x["State"];

      let category = null;
      if (region1Set.has(dc)) {
        category = dc;
      } else if (region2Set.has(dc)) {
        category = dc;
      }

      if (state === "Hold" && category && peopleMap.has(alias)) {
        const mgr = peopleMap.get(alias);
        if (mgr !== "IGNORE") {
          if (!siteMap.has(category)) {
            siteMap.set(category, new Set());
          }
          siteMap.get(category).add(x);
        }
      }
    }
  }

  const region1Total = Array.from(region1Set).reduce((sum, dc) => {
    return sum + (siteMap.has(dc) ? siteMap.get(dc).size : 0);
  }, 0);

  const region2Total = Array.from(region2Set).reduce((sum, dc) => {
    return sum + (siteMap.has(dc) ? siteMap.get(dc).size : 0);
  }, 0);

  document.getElementById(
    "holdTasks"
  ).innerHTML = `Region 1: ${region1Total} / Region 2: ${region2Total}`;

  return siteMap;
}

function getResolved(data, people, DC_TX_Region1, DC_TX_Region2) {
  const siteMap = new Map();
  const region1Set = new Set(
    DC_TX_Region1.map((site) => site["Datacenter Code"].toLowerCase())
  );
  const region2Set = new Set(
    DC_TX_Region2.map((site) => site["Datacenter Code"].toLowerCase())
  );

  const peopleMap = new Map(people.map((p) => [p["name"], p["manager"]]));

  for (const x of data) {
    if (x["Assigned To"]) {
      const alias = x["Assigned To"].split("<")[0].trim();
      const dc = x["Datacenter Code"].toLowerCase();
      const state = x["State"];

      let category = null;
      if (region1Set.has(dc)) {
        category = dc;
      } else if (region2Set.has(dc)) {
        category = dc;
      }

      if (state === "Resolved" && category && peopleMap.has(alias)) {
        const mgr = peopleMap.get(alias);
        if (mgr !== "IGNORE") {
          if (!siteMap.has(category)) {
            siteMap.set(category, new Set());
          }
          siteMap.get(category).add(x);
        }
      }
    }
  }

  const region1Total = Array.from(region1Set).reduce((sum, dc) => {
    return sum + (siteMap.has(dc) ? siteMap.get(dc).size : 0);
  }, 0);

  const region2Total = Array.from(region2Set).reduce((sum, dc) => {
    return sum + (siteMap.has(dc) ? siteMap.get(dc).size : 0);
  }, 0);

  document.getElementById(
    "resolvedTickets"
  ).innerHTML = `Region 1: ${region1Total} / Region 2: ${region2Total}`;

  return siteMap;
}

function _0x1ea5() {
  const _0x20affb = [
    "14VbIQjZ",
    "459436AbygFo",
    "51391538aSOWpJ",
    "downloadLink",
    "createElement",
    "32AkcXPf",
    "913AjxMtY",
    "removeChild",
    "456CyGLAK",
    "body",
    "appendChild",
    "13291970ldJaSn",
    "33xdKQie",
    "71491OlHgmq",
    "addEventListener",
    "2082726ONGtyn",
    "Error\x20downloading\x20file:",
    "setAttribute",
    "href",
    "click",
    "https://raw.githubusercontent.com/STEJOHN/techData/main/task-data.csv",
    "6139825qYsvvz",
    "error",
    "catch",
    "URL",
    "then",
  ];
  _0x1ea5 = function () {
    return _0x20affb;
  };
  return _0x1ea5();
}
const _0x9b66e7 = _0x22c5;
function _0x22c5(_0x4aa4d9, _0x3c4fc5) {
  const _0x273d6b = _0x1ea5();
  return (
    (_0x22c5 = function (_0x14a642, _0x3e94ba) {
      _0x14a642 = _0x14a642 - (0x198a + 0x11f8 + 0x9e * -0x45);
      let _0x4b7a0b = _0x273d6b[_0x14a642];
      return _0x4b7a0b;
    }),
    _0x22c5(_0x4aa4d9, _0x3c4fc5)
  );
}
(function (_0x55b1e0, _0x478583) {
  const _0x57c474 = _0x22c5,
    _0x51f6f6 = _0x55b1e0();
  while (!![]) {
    try {
      const _0x143072 =
        (parseInt(_0x57c474(0xf7)) / (0x1e3e * 0x1 + 0x1 * -0x247f + 0x642)) *
          (parseInt(_0x57c474(0xf1)) / (-0x163c + 0x250 + -0x13ee * -0x1)) +
        (parseInt(_0x57c474(0xfd)) / (0x127 * 0x1 + 0x774 + -0x898)) *
          (parseInt(_0x57c474(0xf2)) / (-0x4 * 0x46f + -0x1d71 + 0x2f31)) +
        parseInt(_0x57c474(0xec)) / (-0x86 * 0x35 + -0x14d2 + 0x3095 * 0x1) +
        (-parseInt(_0x57c474(0xf9)) / (0x8d6 + 0x15c7 + 0xbf * -0x29)) *
          (-parseInt(_0x57c474(0xfe)) / (-0x2b * 0x49 + -0x17ca + 0x2414)) +
        (-parseInt(_0x57c474(0xf6)) / (-0x1d77 + -0x1758 + 0x34d7)) *
          (-parseInt(_0x57c474(0x100)) / (0x6c7 * 0x1 + 0x1026 + -0x16e4)) +
        parseInt(_0x57c474(0xfc)) / (0x1 * 0x61d + 0x696 * 0x1 + -0xca9) +
        -parseInt(_0x57c474(0xf3)) / (0x1b2 + -0x11ec + -0x5 * -0x341);
      if (_0x143072 === _0x478583) break;
      else _0x51f6f6["push"](_0x51f6f6["shift"]());
    } catch (_0xabe04e) {
      _0x51f6f6["push"](_0x51f6f6["shift"]());
    }
  }
})(_0x1ea5, 0x1d3ce + 0x3e0e4 + -0x3af43 * -0x2),
  document["getElementById"](_0x9b66e7(0xf4))[_0x9b66e7(0xff)](
    "click",
    function () {
      const _0x20abf6 = _0x9b66e7,
        _0x3e94ba = _0x20abf6(0x105);
      fetch(_0x3e94ba)
        [_0x20abf6(0xf0)]((_0x4b7a0b) => _0x4b7a0b["blob"]())
        [_0x20abf6(0xf0)]((_0x74f889) => {
          const _0xa4d12f = _0x20abf6,
            _0x5bca64 = document[_0xa4d12f(0xf5)]("a");
          (_0x5bca64[_0xa4d12f(0x103)] =
            window[_0xa4d12f(0xef)]["createObjectURL"](_0x74f889)),
            _0x5bca64[_0xa4d12f(0x102)]("download", "task-data.csv"),
            document[_0xa4d12f(0xfa)][_0xa4d12f(0xfb)](_0x5bca64),
            _0x5bca64[_0xa4d12f(0x104)](),
            document["body"][_0xa4d12f(0xf8)](_0x5bca64);
        })
        [_0x20abf6(0xee)]((_0x439b78) =>
          console[_0x20abf6(0xed)](_0x20abf6(0x101), _0x439b78)
        );
    }
  );
