function updateEmployeeDetails(data) {
  function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let diffInMinutes = (end - start) / 60000;

    if (diffInMinutes > 120) {
      return `${(diffInMinutes / 60).toFixed(1)} hours`;
    } else {
      return `${diffInMinutes} minutes`;
    }
  }

  function populateManagersDropdown(data) {
    const managerDropdown = document.getElementById("managerDropdown2");
    managerDropdown.innerHTML = "";
    for (let manager in data) {
      const option = document.createElement("option");
      option.value = manager;
      option.textContent = manager;
      managerDropdown.appendChild(option);
    }
  }

  function populateDateDropdown(managerData) {
    const dateDropdown = document.getElementById("dateDropdown2");
    dateDropdown.innerHTML = "";
    for (let date in managerData.dates) {
      const option = document.createElement("option");
      option.value = date;
      option.textContent = date;
      dateDropdown.appendChild(option);
    }
  }

  function displayEmployeeProgress(managerData, date) {
    const employeeDataDiv = document.getElementById("employeeData");
    employeeDataDiv.innerHTML = "";

    const dateData = managerData.dates[date];
    let managerTotalTasks = dateData.total;

    let employeesArray = [];
    for (let employee in dateData.employees) {
      if (dateData.employees[employee]) {
        employeesArray.push({
          name: employee,
          totalTasks: dateData.employees[employee].total,
        });
      }
    }
    employeesArray.sort((a, b) => b.totalTasks - a.totalTasks);

    for (let employeeObj of employeesArray) {
      const employee = employeeObj.name;
      const employeeTotalTasks = employeeObj.totalTasks;

      const progressPercentage = (employeeTotalTasks / managerTotalTasks) * 100;

      const employeeDiv = document.createElement("div");
      employeeDiv.className = "employee-detail";

      const employeeNameLink = document.createElement("a");
      employeeNameLink.className = "employee-name clickable";
      employeeNameLink.href = "javascript:void(0);";
      employeeNameLink.textContent = `${
        employee.split(" <")[0]
      } (${employeeTotalTasks} tasks)`;

      if (employeeTotalTasks < 8) {
        employeeNameLink.style.color = "#d4526e";
        employeeNameLink.style.fontWeight = "bold";
      }

      employeeNameLink.addEventListener("click", function () {
        populateDataTable(employee, dateData.employees[employee].tasks);

        var employeeModal = new bootstrap.Modal(
          document.getElementById("employeeModal")
        );
        employeeModal.show();
      });

      employeeDiv.appendChild(employeeNameLink);

      const progressDiv = document.createElement("div");
      progressDiv.className = "progress";
      const progressBarDiv = document.createElement("div");
      progressBarDiv.className = "progress-bar";
      progressBarDiv.style.width = `${progressPercentage}%`;
      progressBarDiv.setAttribute("aria-valuenow", progressPercentage);
      progressBarDiv.setAttribute("aria-valuemin", "0");
      progressBarDiv.setAttribute("aria-valuemax", "100");
      progressDiv.appendChild(progressBarDiv);

      employeeDiv.appendChild(progressDiv);
      employeeDataDiv.appendChild(employeeDiv);
    }

    const totalTasksDiv = document.createElement("div");
    totalTasksDiv.className = "total-tasks";

    const totalTasksText = document.createElement("span");
    const breaks = document.createElement("br");
    breaks.style.marginBottom = "10px";
    totalTasksText.textContent = `Total Resolved: ${managerTotalTasks}`;
    totalTasksDiv.appendChild(breaks);
    totalTasksDiv.appendChild(totalTasksText);

    employeeDataDiv.appendChild(totalTasksDiv);

    bindEmployeeClickEvents(managerData, date);
  }

  function calculateTimeOnTask(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffInMinutes = (endDate - startDate) / 60000;

    if (diffInMinutes < 60) {
      return `${diffInMinutes.toFixed(0)} minutes`;
    } else if (diffInMinutes < 1440) {
      return `${(diffInMinutes / 60).toFixed(1)} hours`;
    } else {
      return `${(diffInMinutes / 1440).toFixed(1)} days`;
    }
  }
  let managerName = "";
  function populateDataTable(employeeName, tasks) {
    if (!Array.isArray(tasks)) {
      return;
    }
    const peopleMap = new Map(people.map((p) => [p.name, p.manager]));

    if (employeeName && peopleMap.has(employeeName)) {
      managerName = peopleMap.get(employeeName);
      console.log(managerName);
    }

    const tableBody = tasks
      .map((task) => {
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
        const timeResolved = new Date(task["Work End Date"]);
        const timeOnTask = calculateTimeOnTask(
          task["Work Start Date"],
          task["Work End Date"]
        );
        let convertedTime = 0;

        if (timeOnTask.includes("minutes")) {
          convertedTime = parseFloat(timeOnTask.split(" ")[0]);
        } else if (timeOnTask.includes("hours")) {
          convertedTime = parseFloat(timeOnTask.split(" ")[0]) * 60;
        } else if (timeOnTask.includes("days")) {
          convertedTime = parseFloat(timeOnTask.split(" ")[0]) * 1440;
        }
        document.getElementById("techManager").textContent =
          "Manager: " + managerName;

        return `<tr>
          <td>${task.Id}</td>
          <td>${task["Assigned To"]}</td>
          <td>${task["Datacenter Code"]}</td>
          <td>${task["State"]}</td>
          <td>${betterDescription}</td>
          <td>${task["Work End Date"]}</td>
          <td data-order="${convertedTime}">${timeOnTask}</td>

        </tr>`;
      })
      .join("");

    if ($.fn.DataTable.isDataTable("#data_table")) {
      $("#data_table").DataTable().clear().destroy();
    }

    $("#data_table tbody").html(tableBody);

    $("#data_table").DataTable({
      retrieve: true,
      dom: '<"top"fB>rt',
      buttons: [
        {
          extend: "excel",
          text: "Export to Excel",
          title: function () {
            return (
              "Export_" +
              new Date()
                .toISOString()
                .replace(/T/, "_")
                .replace(/:|\..+/g, "")
            );
          },
        },
      ],
      search: true,
      pageLength: -1,
    });
  }

  function bindEmployeeClickEvents(managerData, selectedDate) {
    const clickableEmployees = document.querySelectorAll(
      ".employee-name.clickable"
    );
    clickableEmployees.forEach((el) => {
      const clonedEl = el.cloneNode(true);
      el.parentNode.replaceChild(clonedEl, el);
    });

    document.querySelectorAll(".employee-name.clickable").forEach((el) => {
      el.addEventListener("click", function () {
        let employeeNameRaw = el.textContent.trim();
        let splitName = employeeNameRaw.split(" (");
        let employeeName = splitName[0].trim();

        if (splitName.length > 2) {
          employeeName += " (" + splitName[1].split(")")[0] + ")";
        }

        if (managerData.dates[selectedDate].employees[employeeName]) {
          populateDataTable(
            employeeName,
            managerData.dates[selectedDate].employees[employeeName].tasks
          );
        }

        const techNameElement = document.querySelector("#techName");
        if (techNameElement) {
          techNameElement.textContent = " " + employeeName;
        }

        document.querySelector("#techDate").textContent = selectedDate;

        var myModal = new bootstrap.Modal(
          document.getElementById("employeeModal"),
          {}
        );
        myModal.show();
      });
    });
  }

  let employeeStatsChart;

  function updateEmployeeStatsChart(tasks) {
    let titleCounts = {};

    tasks.forEach((task) => {
      let title = task.Title.replace(/\d+/g, "").trim();
      title = title.includes("-") ? title.split("-")[0].trim() : title;
      title = title.includes(":") ? title.split(":")[0].trim() : title;

      if (title.includes("RMA Ticket")) {
        if (title.includes("Blade level wire check")) {
          title = "Blade level wire check";
        } else {
          title = "fault description code";
        }
      } else if (title.includes(":")) {
        title = title.split(":")[0].trim();
      } else {
      }

      if (!titleCounts[title]) {
        titleCounts[title] = 1;
      } else {
        titleCounts[title]++;
      }
    });
  }

  populateManagersDropdown(data);
  const firstManager = Object.keys(data)[0];
  populateDateDropdown(data[firstManager]);
  const firstDate = Object.keys(data[firstManager].dates)[0];
  displayEmployeeProgress(data[firstManager], firstDate);

  document
    .getElementById("managerDropdown2")
    .addEventListener("change", function () {
      const selectedManager = this.value;
      populateDateDropdown(data[selectedManager]);
      const selectedDate = document.getElementById("dateDropdown2").value;
      displayEmployeeProgress(data[selectedManager], selectedDate);
    });

  document
    .getElementById("dateDropdown2")
    .addEventListener("change", function () {
      const selectedManager = document.getElementById("managerDropdown2").value;
      const selectedDate = this.value;
      displayEmployeeProgress(data[selectedManager], selectedDate);

      const currentEmployee = document.querySelector(
        ".employee-name.clickable"
      );
      if (currentEmployee) {
        const employeeNameRaw = currentEmployee.textContent.trim();
        const splitName = employeeNameRaw.split(" (");
        const employeeName = splitName[0].trim();
        document.getElementById("techName").textContent = employeeName;
        document.getElementById("techDate").textContent = selectedDate;
      }
    });
}
