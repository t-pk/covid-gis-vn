define([], function () {
  let comboChartInstance = null;
  let provinceChartInstance = null;

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
            label: `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} by Province`,
            data: sortedData.values,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            type: 'line',
            label: 'Average',
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
            text: `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} in Top 20 Provinces vs Average`
          }
        }
      }
    });
  }
  function createProvinceChart(provinceData) {
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
            'rgba(255, 99, 132, 0.6)',   // Màu cho tổng số ca nhiễm
            'rgba(54, 162, 235, 0.6)',   // Màu cho số ca nhiễm hôm nay
            'rgba(255, 206, 86, 0.6)',   // Màu cho tử vong
            'rgba(75, 192, 192, 0.6)'    // Màu cho hồi phục
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
            responsive: true,
            // onResize: handleResize,
            maintainAspectRatio: false,
            display: true,
            text: provinceData.province  // Đặt tên chart là tên tỉnh
          }
        }
      }
    });
  }



  return {
    createComboCharts: createComboCharts,
    createProvinceChart: createProvinceChart
  };
});
