define([
  "./js/charts.js"
], function (Chart) {
  function getColor(totalCases, min, max, colors) {
    const range = max - min;
    if (totalCases <= min + range * 0.1) {
      return colors[0];
    } else if (totalCases <= min + range * 0.2) {
      return colors[1];
    } else if (totalCases <= min + range * 0.4) {
      return colors[2];
    } else if (totalCases <= min + range * 0.6) {
      return colors[3];
    } else {
      return colors[4];
    }
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
    try {
      const results = await layerDataView.queryFeatures({
        geometry: view.extent,
        returnGeometry: true,
        where: `date = DATE '${dateInput.value}'`
      });

      const graphics = results.features;
      if (graphics.length === 0) {
        view.popup.open({
          title: "No Data",
          content: `No data found for the selected date: ${dateInput.value}`,
          location: view.center
        });
        layer_map.renderer = {
          type: "simple",
          symbol: { type: "simple-fill", color: "#ffffff", outline: { width: 1, color: "black" } }
        };
        return;
      }

      // Xử lý dữ liệu
      const data = {
        labels: [],
        total_infected_cases: [],
        today_infected_cases: [],
        deaths: [],
        total_recovered_cases: []
      };

      graphics.forEach(graphic => {
        const attributes = graphic.attributes;
        data.labels.push(attributes.province);
        data.total_infected_cases.push(attributes.total_infected_cases);
        data.today_infected_cases.push(attributes.today_infected_cases);
        data.deaths.push(attributes.deaths);
        data.total_recovered_cases.push(attributes.total_recovered_cases);
      });

      Chart.createCharts(data);
      view.closePopup();

      // Lấy dữ liệu từ graphics và tạo csvData cho attribute hiện tại
      graphics.forEach((graphic) => {
        const province = graphic.attributes.province;
        const totalCases = graphic.attributes[attribute];
        csvData[province] = totalCases;
      });

      // Tính giá trị min và max cho attribute hiện tại
      const values = Object.values(csvData);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const colors = colorSchemes[attribute];

      // Tạo renderer cho từng province
      const renderer = {
        type: "unique-value",
        field: "name",
        uniqueValueInfos: Object.keys(csvData).map((province) => {
          const totalCases = csvData[province] || 0;
          const color = getColor(totalCases, min, max, colors);

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

      const legendInfo = getLegendInfo(min, max, colors);
      return { renderer, legendInfo };
    } catch (error) {
      console.error("Query failed: ", error);
    }
  }

  return {
    queryAndUpdateLayer: queryAndUpdateLayer
  };
});
