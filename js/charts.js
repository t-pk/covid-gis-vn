define([], function () {
  // Global variables to store chart instances
  let barChartInstance = null;
  let lineChartInstance = null;
  let pieChartInstance = null;

  // Hàm tạo biểu đồ sau khi nhận dữ liệu
  function createCharts(data) {
    console.log("data", data);
    
    // Check and destroy previous bar chart instance
    if (barChartInstance) {
      barChartInstance.destroy();
    }
    // Biểu đồ cột cho số ca nhiễm hôm nay
    const barCtx = document.getElementById('barChart').getContext('2d');
    barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Today Infected Cases',
          data: data.today_infected_cases,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // Check and destroy previous line chart instance
    if (lineChartInstance) {
      lineChartInstance.destroy();
    }
    // Biểu đồ đường cho số ca tử vong theo các tỉnh
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    lineChartInstance = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Deaths',
          data: data.deaths,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          fill: true
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // Check and destroy previous pie chart instance
    if (pieChartInstance) {
      pieChartInstance.destroy();
    }
    // Biểu đồ tròn cho tỷ lệ hồi phục
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChartInstance = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Recovered Cases',
          data: data.total_recovered_cases,
          backgroundColor: [
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(255, 206, 86, 0.2)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }]
      }
    });
  }

  return {
    createCharts: createCharts
  };
});
