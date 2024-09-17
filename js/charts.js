define([], function () {
  let barChartInstance = null;
  let lineChartInstance = null;
  let pieChartInstance = null;

  function createCharts(data, attribute) {

    function sortData(provinceData, sortAttribute) {
      provinceData.sort((a, b) => b[sortAttribute] - a[sortAttribute]);

      const top20Provinces = provinceData.slice(0, 20);
    
      const otherProvinces = provinceData.slice(20).reduce((acc, province) => {
        acc.total_infected_cases += province.total_infected_cases;
        acc.today_infected_cases += province.today_infected_cases;
        acc.deaths += province.deaths;
        acc.total_recovered_cases += province.total_recovered_cases;
        return acc;
      }, {
        province: "Other",
        total_infected_cases: 0,
        today_infected_cases: 0,
        deaths: 0,
        total_recovered_cases: 0
      });
    
      top20Provinces.push(otherProvinces);
    
      return {
        labels: top20Provinces.map(item => item.province),
        values: top20Provinces.map(item => item[sortAttribute])
      };
    }    

    let sortedTodayInfectedCases = sortData(data, attribute);
    if (barChartInstance) {
      barChartInstance.destroy();
    }

    const barCtx = document.getElementById('barChart').getContext('2d');
    barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: sortedTodayInfectedCases.labels,
        datasets: [{
          label: 'Today Infected Cases',
          data: sortedTodayInfectedCases.values,
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

    if (lineChartInstance) {
      lineChartInstance.destroy();
    }

    let sortedDeaths = sortData(data, attribute);

    const lineCtx = document.getElementById('lineChart').getContext('2d');
    lineChartInstance = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: sortedDeaths.labels,
        datasets: [{
          label: 'Deaths',
          data: sortedDeaths.values,
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

    if (pieChartInstance) {
      pieChartInstance.destroy();
    };
    console.log("data", data);
    let sortedRecoveredCases = sortData(data, attribute);
    console.log("sortedRecoveredCases", sortedRecoveredCases);
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChartInstance = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: sortedRecoveredCases.labels,
        datasets: [{
          label: 'Recovered Cases',
          data: sortedRecoveredCases.values,
          backgroundColor: [
            'rgba(75, 192, 192, 0.2)',   
            'rgba(153, 102, 255, 0.2)',  
            'rgba(255, 159, 64, 0.2)',   
            'rgba(255, 206, 86, 0.2)',   
            'rgba(54, 162, 235, 0.2)',   
            'rgba(255, 99, 132, 0.2)',   
            'rgba(201, 203, 207, 0.2)',  
            'rgba(255, 205, 86, 0.2)',   
            'rgba(75, 192, 192, 0.2)',   
            'rgba(153, 102, 255, 0.2)',  
            'rgba(255, 159, 64, 0.2)',   
            'rgba(54, 162, 235, 0.2)',   
            'rgba(255, 99, 132, 0.2)',   
            'rgba(201, 203, 207, 0.2)',  
            'rgba(255, 205, 86, 0.2)',   
            'rgba(75, 192, 192, 0.2)',   
            'rgba(153, 102, 255, 0.2)',  
            'rgba(255, 159, 64, 0.2)',   
            'rgba(54, 162, 235, 0.2)',   
            'rgba(255, 99, 132, 0.2)',   
            'rgba(255, 205, 86, 0.2)'    
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',    
            'rgba(153, 102, 255, 1)',   
            'rgba(255, 159, 64, 1)',    
            'rgba(255, 206, 86, 1)',    
            'rgba(54, 162, 235, 1)',    
            'rgba(255, 99, 132, 1)',    
            'rgba(201, 203, 207, 1)',   
            'rgba(255, 205, 86, 1)',    
            'rgba(75, 192, 192, 1)',    
            'rgba(153, 102, 255, 1)',   
            'rgba(255, 159, 64, 1)',    
            'rgba(54, 162, 235, 1)',    
            'rgba(255, 99, 132, 1)',    
            'rgba(201, 203, 207, 1)',   
            'rgba(255, 205, 86, 1)',    
            'rgba(75, 192, 192, 1)',    
            'rgba(153, 102, 255, 1)',   
            'rgba(255, 159, 64, 1)',    
            'rgba(54, 162, 235, 1)',    
            'rgba(255, 99, 132, 1)',    
            'rgba(255, 205, 86, 1)'     
          ],
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Pie Chart for Recovered Cases by Province'
          }
        }
      }
    });
  }

  return {
    createCharts: createCharts
  };
});
