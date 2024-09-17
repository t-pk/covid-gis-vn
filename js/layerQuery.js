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

      const data = {
        labels: [],
        total_infected_cases: [],
        today_infected_cases: [],
        deaths: [],
        total_recovered_cases: []
      };

      let provinceData = graphics.map(graphic => {
        const attributes = graphic.attributes;
        return {
          province: attributes.province,
          total_infected_cases: attributes.total_infected_cases,
          today_infected_cases: attributes.today_infected_cases,
          deaths: attributes.deaths,
          total_recovered_cases: attributes.total_recovered_cases
        };
      });
      

      provinceData.sort((a, b) => b.today_infected_cases - a.today_infected_cases);

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
      

      top20Provinces.forEach(province => {
        data.labels.push(province.province);
        data.total_infected_cases.push(province.total_infected_cases);
        data.today_infected_cases.push(province.today_infected_cases);
        data.deaths.push(province.deaths);
        data.total_recovered_cases.push(province.total_recovered_cases);
      });
      
      data.labels.push(otherProvinces.province);
      data.total_infected_cases.push(otherProvinces.total_infected_cases);
      data.today_infected_cases.push(otherProvinces.today_infected_cases);
      data.deaths.push(otherProvinces.deaths);
      data.total_recovered_cases.push(otherProvinces.total_recovered_cases);
      
      Chart.createCharts(data);
      
      view.closePopup();

      graphics.forEach((graphic) => {
        const province = graphic.attributes.province;
        const totalCases = graphic.attributes[attribute];
        csvData[province] = totalCases;
      });

      const values = Object.values(csvData);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const colors = colorSchemes[attribute];

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
