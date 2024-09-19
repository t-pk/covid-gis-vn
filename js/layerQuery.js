define([
  "./js/charts.js"
], function (Chart) {
  function getColor(value, colors, attribute) {
    if (attribute === "total_infected_cases") {
      if (value < 100) {
        return colors[0];
      } else if (value <= 500) {
        return colors[1];
      } else if (value <= 1000) {
        return colors[2];
      } else if (value <= 5000) {
        return colors[3];
      } else {
        return colors[4];
      }
    }

    if (attribute === "total_recovered_cases") {
      if (value < 100) {
        return colors[0];
      } else if (value <= 500) {
        return colors[1];
      } else if (value <= 1000) {
        return colors[2];
      } else if (value <= 5000) {
        return colors[3];
      } else {
        return colors[4];
      }
    }

    if (attribute === "deaths") {
      if (value < 100) {
        return colors[0];
      } else if (value <= 200) {
        return colors[1];
      } else if (value <= 400) {
        return colors[2];
      } else if (value <= 1000) {
        return colors[3];
      } else {
        return colors[4];
      }
    }

    if (attribute === "today_infected_cases") {
      if (value < 100) {
        return colors[0];
      } else if (value <= 500) {
        return colors[1];
      } else if (value <= 1000) {
        return colors[2];
      } else if (value <= 5000) {
        return colors[3];
      } else {
        return colors[4];
      }
    }
    return colors[0];
  }

  function getLegendInfo(min, max, colors) {
    const range = max - min;
    return [
      { label: `<= ${Math.round(min + range * 0.2)} ca`, color: colors[0] },
      { label: `<= ${Math.round(min + range * 0.4)} ca`, color: colors[1] },
      { label: `<= ${Math.round(min + range * 0.6)} ca`, color: colors[2] },
      { label: `<= ${Math.round(min + range * 0.8)} ca`, color: colors[3] },
      { label: `> ${Math.round(min + range * 0.8)} ca`, color: colors[4] }
    ];
  }

  async function queryAndUpdateLayer(layerDataView, view, layer_map, csvData, attribute, colorSchemes) {

    const dateInput = document.getElementById('date-input');
    const endDate = new Date(dateInput.value);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 30); // 30 ngày trước

    try {
      const results = await layerDataView.queryFeatures({
        geometry: view.extent,
        returnGeometry: true,
        where: `date = DATE '${dateInput.value}'`
      });

      const graphics = results.features;
      const results1 = await layerDataView.queryFeatures({
        geometry: view.extent,
        returnGeometry: true,
      });

      const graphics1 = results1.features;

      let provinceData = (graphics1 || []).map(graphic => {
        const attributes = graphic.attributes;
        return {
          province: attributes.province || '',
          total_infected_cases: attributes.total_infected_cases || 0,
          today_infected_cases: attributes.today_infected_cases || 0,
          deaths: attributes.deaths || 0,
          total_recovered_cases: attributes.total_recovered_cases || 0,
          date: attributes.date
        };
      });

      Chart.createComboCharts(provinceData, dateInput.value, attribute);
      const results2 = await layerDataView.queryFeatures({
        geometry: view.extent,
        returnGeometry: true,
        where: `date >= DATE '${startDate.toISOString().split('T')[0]}' AND date <= DATE '${endDate.toISOString().split('T')[0]}'`
      });
  
      const graphics2 = results2.features;
  
      // Chuyển đổi dữ liệu
      const provinceData1 = (graphics2 || []).map(graphic => {
        const attributes = graphic.attributes;
        return {
          date: attributes.date,
          total_infected_cases: attributes.total_infected_cases || 0,
          today_infected_cases: attributes.today_infected_cases || 0,
          deaths: attributes.deaths || 0,
          total_recovered_cases: attributes.total_recovered_cases || 0
        };
      });
  
      // Gọi hàm tạo biểu đồ line
      Chart.createLineChart(provinceData1, 'lineChartCanvas', attribute);
  
      if (graphics.length === 0) {
        view.openPopup({
          title: "No Data",
          content: `No data found for the selected date: ${dateInput.value}`,
          location: view.center
        });
        layer_map.renderer = {
          type: "simple",
          symbol: { type: "simple-fill", color: "#ffffff", outline: { width: 1, color: "black" } }
        };
        return { renderer: layer_map.renderer };
      }

      view.closePopup();

      graphics.forEach((graphic) => {
        const province = graphic.attributes.province;
        const totalCases = graphic.attributes[attribute];
        csvData[province] = totalCases || -1;
      });

      const colors = colorSchemes[attribute];

      const renderer = {
        type: "unique-value",
        field: "name",
        uniqueValueInfos: Object.keys(csvData || []).map((province) => {
          const totalCases = csvData[province] || 0;
          const color = getColor(totalCases, colors, attribute);

          return {
            value: province,
            symbol: {
              type: "simple-fill",
              color: color, outline: { width: 1, color: "black" }
            },
          };
        }),
        defaultSymbol: {
          type: "simple-fill",
          color: "#ffffff", outline: { width: 1, color: "black" }
        }
      };

      // const legendInfo = getLegendInfo(min, max, colors);
      // return { renderer, legendInfo };
      return { renderer };
    } catch (error) {
      console.error("Query failed: ", error);
    }
  }

  return {
    queryAndUpdateLayer: queryAndUpdateLayer
  };
});
