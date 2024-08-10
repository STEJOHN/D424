// function createTimelineChart(data, selectedManager, selectedDate) {
//   //   console.log("Data object:", data);
//   console.log("Selected Manager:", selectedManager);
//   const managerData = data[selectedManager];
//   if (!managerData) {
//     console.error(`Data not found for manager: ${selectedManager}`);
//     return;
//   }

//   const dateData = managerData[selectedDate];
//   if (!dateData) {
//     console.error(`Data not found for date: ${selectedDate}`);
//     return;
//   }

//   const canvas = document.getElementById("timelineChart");
//   const ctx = canvas.getContext("2d");
//   console.log("Tasks:", tasks);

//   // Extract tasks data for the selected date
//   const tasks = dateData.tasks;

//   // Prepare data for Chart.js
//   const chartData = {
//     datasets: [],
//   };

//   // Process the tasks data and add it to chartData.datasets as needed
//   // Assuming tasks is an array of task objects with properties: startDate, endDate, durationFromShiftStart

//   const colors = ["#FF5733", "#33FF57", "#5733FF"]; // You can define your own colors
//   const datasets = [];

//   tasks.forEach((task, index) => {
//     const dataset = {
//       label: `Task ${index + 1}`,
//       data: [
//         {
//           x: task.startDate,
//           y: index + 1,
//           x2: task.endDate,
//         },
//       ],
//       borderColor: colors[index % colors.length],
//       backgroundColor: colors[index % colors.length],
//     };
//     datasets.push(dataset);
//   });

//   chartData.datasets = datasets;

//   // Create the timeline chart using Chart.js
//   new Chart(ctx, {
//     type: "timeline", // Assuming you have a "timeline" chart type implemented
//     data: chartData,
//     options: {
//       scales: {
//         x: {
//           type: "time",
//           time: {
//             unit: "minute", // Adjust the time unit as needed
//           },
//         },
//         y: {
//           title: {
//             display: true,
//             text: "Tasks",
//           },
//         },
//       },
//       plugins: {
//         legend: {
//           display: false, // You can customize legend display as needed
//         },
//       },
//     },
//   });
// }

// function populateManagerSelect(data) {
//   const managerSelect = document.getElementById("managerSelect");
//   managerSelect.innerHTML = ""; // Clear previous options
//   const managers = Object.keys(data);
//   managers.sort(); // Sort the managers in ascending order
//   managers.forEach((manager) => {
//     const option = document.createElement("option");
//     option.value = manager;
//     option.textContent = manager;
//     managerSelect.appendChild(option);
//   });
// }

// function populateDateSelect(data, selectedManager) {
//   const dateSelect = document.getElementById("dateSelect");
//   dateSelect.innerHTML = ""; // Clear previous options
//   if (data[selectedManager]) {
//     const dates = Object.keys(data[selectedManager]);
//     dates.sort(); // Sort the dates in ascending order
//     dates.forEach((date) => {
//       const option = document.createElement("option");
//       option.value = date;
//       option.textContent = date;
//       dateSelect.appendChild(option);
//     });
//   }
// }

// // Wait for the DOM to fully load
// document.addEventListener("DOMContentLoaded", () => {
//   const managerSelect = document.getElementById("managerSelect");
//   const dateSelect = document.getElementById("dateSelect");

//   // Add event listeners to update the chart when selections change
//   managerSelect.addEventListener("change", () => {
//     const selectedManager = managerSelect.value;
//     const selectedDate = dateSelect.value;
//     createTimelineChart(data, selectedManager, selectedDate);
//   });

//   dateSelect.addEventListener("change", () => {
//     const selectedManager = managerSelect.value;
//     const selectedDate = dateSelect.value;
//     createTimelineChart(data, selectedManager, selectedDate);
//   });

//   // Populate the manager selection menu
//   populateManagerSelect(data);

//   // Initially, populate the date selection menu based on the first manager (assuming it exists)
//   const initialManager = managerSelect.value;
//   populateDateSelect(data, initialManager);

//   // Get the initial selected date (assuming the first date for the first manager exists)
//   const initialDate = dateSelect.value;

//   // Check if data exists for the initial manager and date, and create the chart
//   if (data && data[initialManager] && data[initialManager][initialDate]) {
//     createTimelineChart(data, initialManager, initialDate);
//   } else {
//   }
// });
