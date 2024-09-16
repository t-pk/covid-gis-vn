let infectedCasesChart;

export function createCharts() {
  const infectedCasesCanvas = document.getElementById("infected-cases-chart");

  infectedCasesChart = new Chart(infectedCasesCanvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["2019", "2020", "2021"],
      datasets: [
        {
          label: "Solved by 2017",
          backgroundColor: "#149dcf",
          stack: "Stack 0",
          data: [0, 0, 0, 0]
        }
      ]
    },

    options: {
      responsive: false,
      legend: { position: "top" },
      title: { display: true, text: "Homicides by year" },
      scales: {
        xAxes: [{ stacked: true }],
        yAxes: [{ stacked: true, ticks: { beginAtZero: true } }]
      }
    }
  });
}

export function updateCharts(responses) {
  console.log("updateCharts", Object.values(responses));
  if (infectedCasesChart) {
    infectedCasesChart.data.datasets[0].data = Object.values(responses);
    infectedCasesChart.update();
  }
}
