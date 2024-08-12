function apex1(dataObject) {
  const transformedData = Object.keys(dataObject).map((key) => {
    return {
      name: key,
      data: [{ x: dataObject[key].date, y: dataObject[key].total }],
    };
  });

  var options = {
    chart: {
      type: "bar",
      height: 350,
    },
    theme: {
      palette: "palette3",
    },
    series: transformedData,
    xaxis: {
      type: "category",
    },
  };

  var chart = new ApexCharts(document.getElementById("chart-line"), options);
  chart.render();
}
function apex2(dataObject) {
  const dropdown = document.getElementById("managerDropdown");

  function getUniqueDatesFromData() {
    let allDates = [];
    for (const manager in dataObject) {
      allDates = allDates.concat(Object.keys(dataObject[manager].dates));
    }
    return [...new Set(allDates)];
  }

  const uniqueDates = getUniqueDatesFromData();
  dropdown.innerHTML = "";
  uniqueDates.forEach((date) => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = date;
    dropdown.appendChild(option);
  });

  function getDataForDate(date) {
    const managers = Object.keys(dataObject);
    const labels = [];
    const dataset = [];
    for (const manager of managers) {
      if (dataObject[manager].dates[date]) {
        labels.push(manager);
        dataset.push(dataObject[manager].dates[date].total);
      }
    }

    return {
      labels: labels,
      series: dataset,
    };
  }

  var chart = new ApexCharts(document.getElementById("chart-donut"), {
    chart: {
      type: "pie",
      height: 350,
      width: 500,
      animations: {
        enabled: true,
        easing: "linear",
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
        autoSelected: "zoom",
      },
    },
    theme: {
      palette: "palette3",
    },
    labels: [],
    series: [],
    legend: {
      show: true,
      position: "bottom",
      fontsize: "25px",
      formatter: function (seriesName, opts) {
        return seriesName + ": " + opts.w.globals.series[opts.seriesIndex];
      },
      itemMargin: {
        vertical: 3,
      },
    },
  });

  chart.render();

  function renderChart(chartData) {
    chart.updateSeries(chartData.series);
    chart.updateOptions({
      labels: chartData.labels,
      legend: {
        formatter: function (seriesName, opts) {
          return seriesName + ": " + chartData.series[opts.seriesIndex];
        },
      },
    });
  }

  const mostRecentDate = uniqueDates[0];
  renderChart(getDataForDate(mostRecentDate));

  dropdown.value = mostRecentDate;
  dropdown.addEventListener("change", function (e) {
    const selectedDate = e.target.value;
    renderChart(getDataForDate(selectedDate));
  });
}
