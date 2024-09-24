define([
  "./js/charts.js"
], function (Chart) {

  function getThresholds(attribute) {
    if (attribute === "total_infected_cases" || attribute === "today_infected_cases") {
      return [100, 500, 1000, 5000];
    }
    if (attribute === "today_recovered_cases") {
      return [50, 100, 500, 1000];
    }
    if (attribute === "deaths") {
      return [20, 50, 100, 500];
    }
    return [];
  }

  function getColor(value, colors, attribute) {
    const thresholds = getThresholds(attribute);

    if (thresholds.length > 0) {
      if (value < thresholds[0]) {
        return colors[0];
      } else if (value <= thresholds[1]) {
        return colors[1];
      } else if (value <= thresholds[2]) {
        return colors[2];
      } else if (value <= thresholds[3]) {
        return colors[3];
      } else {
        return colors[4];
      }
    }

    return colors[0];
  }

  function getLegendInfo(attribute, colors) {
    const thresholds = getThresholds(attribute);

    if (thresholds.length > 0) {
      return [
        { label: `dưới ${thresholds[0]} `, color: colors[0] },
        { label: `dưới ${thresholds[1]} `, color: colors[1] },
        { label: `dưới ${thresholds[2]} `, color: colors[2] },
        { label: `dưới ${thresholds[3]} `, color: colors[3] },
        { label: `trên ${thresholds[3]} `, color: colors[4] }
      ];
    }

    return [
      { label: `0 `, color: colors[0] }
    ];
  }

  async function queryAndUpdateLayer(layerDataView, view, layer_map, csvData, attribute, colorSchemes) {

    const dateInput = document.getElementById('date-input');
    const endDate = new Date(dateInput.value);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 59); // 60 ngày trước

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
          today_recovered_cases: attributes.today_recovered_cases || 0,
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

      const provinceData1 = (graphics2 || []).map(graphic => {
        const attributes = graphic.attributes;
        return {
          date: attributes.date,
          total_infected_cases: attributes.total_infected_cases || 0,
          today_infected_cases: attributes.today_infected_cases || 0,
          deaths: attributes.deaths || 0,
          today_recovered_cases: attributes.today_recovered_cases || 0
        };
      });

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

      const legendInfo = getLegendInfo(attribute, colors);
      return { renderer, legendInfo };

    } catch (error) {
      console.error("Query failed: ", error);
    }
  }

  return {
    queryAndUpdateLayer: queryAndUpdateLayer
  };
});
