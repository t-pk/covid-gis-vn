define([], function () {
  let comboChartInstance = null;
  let provinceChartInstance = null;
  const mappingName = {
    "total_infected_cases": "Tổng số ca nhiễm",
    "today_infected_cases": "Tổng số ca nhiễm trong ngày hôm nay",
    "deaths": "Tống số ca tử vong",
    "total_recovered_cases": "Tổng số ca hồi phục, xuất viện"
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
            beginAtZero: true
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
  function createProvinceCharts(provinceData, allData) {
    const ctx = document.getElementById('provinceChart').getContext('2d');

    if (provinceChartInstance) {
      provinceChartInstance.destroy();
    };

    provinceChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Tổng số ca nhiễm', 'Số ca nhiễm hôm nay', 'Tử vong', 'Hồi phục'],
        datasets: [{
          label: provinceData.province,
          data: [
            provinceData.total_infected_cases,
            provinceData.today_infected_cases,
            provinceData.deaths,
            provinceData.total_recovered_cases
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
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

    function createPieChart(attributeName, attributeColor, canvasId) {
      const ctx = document.getElementById(canvasId).getContext('2d');
      const provinceValue = provinceData[attributeName];
      const otherProvincesSum = calculateOtherProvincesSum(attributeName);

      if (window[canvasId + 'Instance']) {
        window[canvasId + 'Instance'].destroy();
      }

      window[canvasId + 'Instance'] = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: [provinceData.province, 'Các tỉnh thành còn lại'],
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
              text: mappingName[attributeName]
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

    createPieChart('total_infected_cases', 'rgba(255, 99, 132, 0.6)', 'totalCasesChart');
    createPieChart('today_infected_cases', 'rgba(54, 162, 235, 0.6)', 'todayCasesChart');
    createPieChart('deaths', 'Deaths', 'deathsChart');
    createPieChart('total_recovered_cases', 'rgba(75, 192, 192, 0.6)', 'recoveredChart');
  }

  return {
    createComboCharts: createComboCharts,
    createProvinceCharts: createProvinceCharts
  };
});
