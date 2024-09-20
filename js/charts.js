define([], function () {
  let comboChartInstance = null;
  let provinceChartInstance = null;
  let lineChartInstance = null;
  let chartManager = {
    charts: {}
  };
  const mappingName = {
    "total_infected_cases": "Tổng số ca nhiễm",
    "today_infected_cases": "Tổng số ca nhiễm trong ngày",
    "deaths": "Tống số ca tử vong",
    "today_recovered_cases": "Tổng số ca hồi phục, xuất viện trong ngày"
  };
  function createLineChart(provinceData, canvasId, attribute) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (lineChartInstance) {
      lineChartInstance.destroy()
    }
    // Helper function to format timestamps as dd/mm
    function formatDate(timestamp) {
      const date = new Date(timestamp);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      return `${day}/${month}`;
    }

    function sortDataByDate(data) {
      return data.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    function aggregateData(data, maxPoints) {
      const interval = Math.ceil(data.length / maxPoints);
      const aggregatedData = [];

      for (let i = 0; i < data.length; i += interval) {
        const slice = data.slice(i, i + interval);
        const aggregatedItem = slice.reduce((acc, item) => {
          acc[attribute] += item[attribute];
          return acc;
        }, { [attribute]: 0, date: slice[0].date });

        aggregatedItem.date = slice[Math.floor(slice.length / 2)].date;
        aggregatedData.push(aggregatedItem);
      }

      return aggregatedData;
    }

    const sortedData = sortDataByDate(provinceData);
    const aggregatedData = aggregateData(sortedData, 30);

    lineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: aggregatedData.map(item => formatDate(item.date)),
        datasets: [{
          label: mappingName[attribute],
          data: aggregatedData.map(item => item[attribute]),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${mappingName[attribute]} - Trở về 60 ngày trước`
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Số lượng'
            }
          }
        }
      }
    });
  }


  function createComboCharts(data, dateInput, attribute) {
    function filterDataByDate(provinceData, dateInput) {
      const currentDate = new Date(dateInput);
      return provinceData.filter(item => {
        const date = new Date(item.date);
        return date.toDateString() === currentDate.toDateString();
      });
    }

    function sortAndAggregate(provinceData, attribute) {
      provinceData.sort((a, b) => b[attribute] - a[attribute]);

      const top20Provinces = provinceData.slice(0, 20);

      const otherProvinces = provinceData.slice(20).reduce((acc, province) => {
        acc[attribute] += province[attribute];
        return acc;
      }, { province: "Other", [attribute]: 0 });

      top20Provinces.push(otherProvinces);

      return {
        labels: top20Provinces.map(item => item.province),
        values: top20Provinces.map(item => item[attribute])
      };
    }

    function calculateAverage(data, attribute) {
      const total = data.reduce((sum, item) => sum + item[attribute], 0);
      return (parseFloat(total / data.length).toFixed(0));
    }

    const filteredData = filterDataByDate(data, dateInput);
    const sortedData = sortAndAggregate(filteredData, attribute);
    const averageValue = calculateAverage(filteredData, attribute);

    if (comboChartInstance) {
      comboChartInstance.destroy();
    }

    const ctx = document.getElementById('comboChart').getContext('2d');

    comboChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedData.labels,
        datasets: [
          {
            type: 'bar',
            label: `Tổng số ca`,
            data: sortedData.values,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            type: 'line',
            label: 'Đường Trung bình Cộng',
            data: new Array(sortedData.labels.length).fill(averageValue),
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: false
          }
        ]
      },
      options: {
        scales: {
          y: {
            title: {
              display: true,
              text: 'Số lượng'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: mappingName[attribute]
          }
        }
      }
    });
  }
  function createProvinceCharts(provinceData, allData, provinceData1) {

    const ctx = document.getElementById('provinceChart').getContext('2d');

    if (provinceChartInstance) {
      provinceChartInstance.destroy();
    };

    provinceChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Số ca nhiễm trong ngày', 'Tử vong', 'Hồi phục'],
        datasets: [{
          label: provinceData.province,
          data: [
            provinceData.today_infected_cases,
            provinceData.deaths,
            provinceData.today_recovered_cases
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: provinceData.province
          }
        }
      }
    });

    function calculateOtherProvincesSum(attribute) {
      const dateInput = document.getElementById('date-input');
      const currentDate = new Date(dateInput.value);

      return allData
        .filter(item => {
          const date = new Date(item.attributes.date);
          return item.attributes.province !== provinceData.province && (date.toDateString() === currentDate.toDateString());
        })
        .reduce((sum, item) => sum + item.attributes[attribute], 0);
    }

    function createOrUpdatePieChart(attributeName, attributeColor, canvasId) {
      const dateInput = document.getElementById('date-input');

      const ctx = document.getElementById(canvasId).getContext('2d');
      const provinceValue = provinceData[attributeName];
      const otherProvincesSum = calculateOtherProvincesSum(attributeName);

      const chartTitle = mappingName[attributeName];
      const labels = [provinceData.province, 'Các tỉnh thành còn lại'];

      if (chartManager.charts[canvasId]) {
        const chart = chartManager.charts[canvasId];
        chart.data.labels = labels;
        chart.data.datasets[0].data = [provinceValue, otherProvincesSum];
        chart.data.datasets[0].backgroundColor[0] = attributeColor;
        chart.options.plugins.title.text = chartTitle;
        chart.update();
      } else {
        chartManager.charts[canvasId] = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: labels, // Set labels
            datasets: [{
              label: mappingName[attributeName],
              data: [provinceValue, otherProvincesSum],
              backgroundColor: [
                attributeColor,
                'rgba(200, 200, 200, 0.6)'
              ],
              borderColor: [
                'rgba(255, 255, 255, 1)',
                'rgba(255, 255, 255, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            plugins: {
              title: {
                display: true,
                text: chartTitle
              }
            },
            responsive: false,
            cutoutPercentage: 35,
            legend: {
              position: "bottom"
            },
          }
        });
      }
    }

    createOrUpdatePieChart('total_infected_cases', 'rgba(255, 99, 132, 0.6)', 'totalCasesChart');
    createOrUpdatePieChart('today_infected_cases', 'rgba(54, 162, 235, 0.6)', 'todayCasesChart');
    createOrUpdatePieChart('deaths', 'rgba(255, 159, 64, 0.6)', 'deathsChart');
    createOrUpdatePieChart('today_recovered_cases', 'rgba(75, 192, 192, 0.6)', 'recoveredChart');


    function createMultiLineChart(provinceData2, canvasId) {
      const ctx = document.getElementById(canvasId).getContext('2d');

      function formatDate(timestamp) {
        const date = new Date(timestamp);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
      }

      function sortDataByDate(data) {
        return data.sort((a, b) => new Date(a.attributes.date) - new Date(b.attributes.date));
      }

      function aggregateData(data, maxPoints) {
        const interval = Math.ceil(data.length / maxPoints);
        const aggregatedData = [];

        for (let i = 0; i < data.length; i += interval) {
          const slice = data.slice(i, i + interval);
          const aggregatedItem = slice.reduce((acc, item) => {
            acc.total_infected_cases += item.attributes.total_infected_cases;
            acc.today_infected_cases += item.attributes.today_infected_cases;
            acc.deaths += item.attributes.deaths;
            acc.today_recovered_cases += item.attributes.today_recovered_cases;
            return acc;
          }, { total_infected_cases: 0, today_infected_cases: 0, deaths: 0, today_recovered_cases: 0, date: slice[0].attributes.date });

          // Use the middle timestamp for label
          aggregatedItem.date = slice[Math.floor(slice.length / 2)].attributes.date;
          aggregatedData.push(aggregatedItem);
        }

        return aggregatedData;
      }

      // Sort data by date and aggregate it
      const sortedData = sortDataByDate(provinceData2);
      const aggregatedData = aggregateData(sortedData, 30); // Show 30 points
      if (chartManager.charts[canvasId]) {
        // Đã có biểu đồ, cập nhật dữ liệu
        const chart = chartManager.charts[canvasId];

        // Cập nhật lại labels (ngày tháng)
        chart.data.labels = aggregatedData.map(item => formatDate(item.date));

        // Cập nhật dữ liệu cho từng dataset (đường biểu diễn)
        chart.data.datasets[0].data = aggregatedData.map(item => item.total_infected_cases);
        chart.data.datasets[1].data = aggregatedData.map(item => item.today_infected_cases);
        chart.data.datasets[2].data = aggregatedData.map(item => item.deaths);
        chart.data.datasets[3].data = aggregatedData.map(item => item.today_recovered_cases);

        // Cập nhật tiêu đề biểu đồ
        chart.options.plugins.title.text = `Dữ liệu COVID-19 trong tỉnh ${provinceData.province} 60 ngày qua`;

        // Cập nhật lại biểu đồ
        chart.update();
      } else {
        chartManager.charts[canvasId] = new Chart(ctx, {
          type: 'line',
          data: {
            labels: aggregatedData.map(item => formatDate(item.date)),
            datasets: [
              {
                label: 'Tổng số ca nhiễm',
                data: aggregatedData.map(item => item.total_infected_cases),
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: false
              },
              {
                label: 'Tổng số ca nhiễm trong ngày hôm nay',
                data: aggregatedData.map(item => item.today_infected_cases),
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: false
              },
              {
                label: 'Số ca tử vong trong ngày',
                data: aggregatedData.map(item => item.deaths),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false
              },
              {
                label: 'Số ca hồi phục trong ngày',
                data: aggregatedData.map(item => item.today_recovered_cases),
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `Dữ liệu COVID-19 trong tỉnh ${provinceData.province} 60 ngày qua`
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Ngày'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Số lượng'
                }
              }
            }
          }
        });
      }
    }
    createMultiLineChart(provinceData1, 'multiLineChartCanvas');
  }

  function clearProvinceCharts() {
    provinceChartInstance.destroy();
    Object.keys(chartManager.charts).forEach((canvasId) => {
      if (chartManager.charts[canvasId]) {
        chartManager.charts[canvasId].destroy();
      }
    });
    chartManager = {
      charts: {}
    };
  };

  return {
    createComboCharts: createComboCharts,
    createProvinceCharts: createProvinceCharts,
    clearProvinceCharts: clearProvinceCharts,
    createLineChart: createLineChart
  };
});
