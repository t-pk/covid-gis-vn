require([
  "esri/views/MapView",
  "esri/WebMap",
  "esri/widgets/Expand",
  "esri/widgets/Bookmarks",
  "esri/core/promiseUtils",
  "esri/core/reactiveUtils",
  "./js/layerDataViewUtils.js",
  "./js/charts.js"
], (MapView, WebMap, Expand, Bookmarks, promiseUtils, reactiveUtils, layerDataViewUtils, Chart) => {

  const webmap = new WebMap({ portalItem: { id: "1e254684c9bd41259e296eea06a0b1b0" } });

  const view = new MapView({ map: webmap, container: "viewDiv" });

  view.constraints = { minZoom: 6, maxZoom: 7 };

  const titleContent = document.createElement("div");
  titleContent.style.padding = "15px";
  titleContent.style.backgroundColor = "white";
  titleContent.style.width = "350px";

  reactiveUtils.watch(() => view.widthBreakpoint, (widthBreakpoint) => {
    titleExpand.expanded = widthBreakpoint !== "xsmall";
  });

  async function initializeMap() {
    await view.when();
    const layer_csv = webmap.layers.getItemAt(1);
    const layer_map = webmap.layers.getItemAt(0);
    layer_map.outFields = ["name", "id"];
    layer_csv.outFields = [
      "province",
      "total_infected_cases",
      "today_infected_cases",
      "deaths",
      "today_recovered_cases",
      "date"
    ];

    let currentHighlight = null;

    const layerMapView = await view.whenLayerView(layer_map);
    const layerDataView = await view.whenLayerView(layer_csv);
    function buildWhereClause1() {
      const dateInput = document.getElementById('date-input').value;
      return `date = DATE '${dateInput}'`;
    }

    const csvData = {};
    let titleExpand;
    async function initExpandData() {
      console.log("asdasd");

      const query = layer_csv.createQuery();
      query.where = buildWhereClause1();

      const results = await layer_csv.queryFeatures(query);

      let totalTodayInfected = 0;
      let totalDeaths = 0;
      let totalRecovered = 0;

      results.features.forEach(feature => {
        const attributes = feature.attributes;
        totalTodayInfected += attributes.today_infected_cases || 0;
        totalDeaths += attributes.deaths || 0;
        totalRecovered += attributes.today_recovered_cases || 0;
      });

      titleContent.innerHTML = [
        "<div id='title' class='esri-widget'>",
        `<span id='total-today-infected'>${totalTodayInfected}</span> là tổng số ca nhiễm hôm nay.`,
        `Tổng số ca tử vong hôm nay là <span id='total-deaths'>${totalDeaths}</span>.`,
        `Số ca phục hồi, xuất viện là <span id='total-recovered'>${totalRecovered}</span>.`,
        "</div>"
      ].join(" ");
      if (titleExpand) {
        titleExpand.content = titleContent;
      } else {
        titleExpand = new Expand({
          expandIcon: "dashboard",
          expandTooltip: "Summary stats",
          view: view,
          content: titleContent,
          expanded: view.widthBreakpoint !== "xsmall",
          placement: "left-start",
          group: "top-right"
        });

        view.ui.add(titleExpand, "top-right");
      }
    }
    promiseUtils.eachAlways([
      layerDataViewUtils
    ]).then(() => {
      layerDataViewUtils.updateLayerDataView(layerDataView, view, layer_map, csvData);
    }).catch((error) => {
      console.error("Error loading modules: ", error);
    });
    await initExpandData();
    view.on("click", async (event) => {
      event.stopPropagation();

      const mapQuery = layer_map.createQuery();
      mapQuery.geometry = view.toMap(event);

      const responseMap = await layerMapView.queryFeatures(mapQuery);
      if (currentHighlight) {
        currentHighlight.remove();
      }

      currentHighlight = layerMapView.highlight(responseMap.features[0]);

      layerMapView.highlightOptions = {
        color: "#ffe700",
        haloOpacity: 0.9,
        fillOpacity: 0.2
      };

      function buildWhereClause(selectedDate, provinceFromLayerData) {
        return `date = DATE '${selectedDate}' AND province = '${provinceFromLayerData}'`;
      }

      function buildWhereClause2(dateInput, provinceInput) {
        const endDate = new Date(dateInput);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 59);
        return `date >= DATE '${startDate.toISOString().split('T')[0]}' AND date <= DATE '${endDate.toISOString().split('T')[0]}' AND province = '${provinceInput}'`
      }

      async function fetchAndDisplayData(query, event) {
        let responseData = await layerDataView.queryFeatures(query);
        let query1 = layer_csv.createQuery();
        query1.where = buildWhereClause1();
        let responseData1 = await layerDataView.queryFeatures(query1);

        if (responseData.features.length > 0) {
          const provinceFromLayer0 = responseData.features[0];
          const provinceFromLayer1 = responseData1.features;
          const query2 = layer_csv.createQuery();
          query2.where = buildWhereClause2(provinceFromLayer0.attributes.date, provinceFromLayer0.attributes.province);
          let responseData2 = await layerDataView.queryFeatures(query2);
          Chart.createProvinceCharts(provinceFromLayer0.attributes, provinceFromLayer1, responseData2.features);

          view.openPopup({
            title: "Thông tin chi tiết",
            content: `
                    <b>Province:</b> ${provinceFromLayer0.attributes.province}<br>
                    <b>Total Infected Cases:</b> ${provinceFromLayer0.attributes.total_infected_cases}<br>
                    <b>Today's Infected Cases:</b> ${provinceFromLayer0.attributes.today_infected_cases}<br>
                    <b>Deaths:</b> ${provinceFromLayer0.attributes.deaths}<br>
                    <b>Today Recovered Cases:</b> ${provinceFromLayer0.attributes.today_recovered_cases}<br>
                    <b>Date:</b> ${new Date(provinceFromLayer0.attributes.date).toLocaleDateString()}
            `,
            location: event.mapPoint
          });
        }
      }

      if (responseMap.features.length > 0) {
        const dateInput = document.getElementById('date-input');
        const queryCSV = layer_csv.createQuery();
        const provinceFromLayerData = responseMap.features[0].attributes.name;

        queryCSV.where = buildWhereClause(dateInput.value, provinceFromLayerData);
        fetchAndDisplayData(queryCSV, event);

        dateInput.addEventListener('change', async (event) => {
          if (currentHighlight) {
            currentHighlight.remove();
            currentHighlight = null;
            Chart.clearProvinceCharts();
          }
          await initExpandData();
        });
        const attribute = document.getElementById('attribute-select');
        attribute.addEventListener('change', async (event) => {
          if (currentHighlight) {
            currentHighlight.remove();
            currentHighlight = null;
            Chart.clearProvinceCharts();
          }
        });
      }
      else {
        if (currentHighlight) {
          currentHighlight.remove();
          currentHighlight = null;
          Chart.clearProvinceCharts();
        }
        view.openPopup({
          title: "No data",
          location: event.mapPoint,
          content: "No data available for this location."
        });
      }
    });
    const dateInput = document.getElementById('date-input');
    dateInput.addEventListener('change', async (event) => {
      await initExpandData();
    });
  }

  initializeMap();
});
