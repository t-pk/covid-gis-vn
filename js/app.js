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
  titleContent.innerHTML = [
    "<div id='title' class='esri-widget'>",
    "<span id='num-homicides'>0</span> homicides occurred within one mile of the pointer location over the last 10 years.",
    "The average age of the victims is <span id='avg-age'>0</span>. The average time an unsolved case has been",
    "open is <span id='avg-open-time'>0</span> years.",
    "</div>"
  ].join(" ");

  const titleExpand = new Expand({
    expandIcon: "dashboard",
    expandTooltip: "Summary stats",
    view: view,
    content: titleContent,
    expanded: view.widthBreakpoint !== "xsmall",
    placement: "left-start",
    group: "top-right"
  });
  view.ui.add(titleExpand, "top-right");

  reactiveUtils.watch(() => view.widthBreakpoint, (widthBreakpoint) => {
    titleExpand.expanded = widthBreakpoint !== "xsmall";
  });

  const bookmarksWidget = new Bookmarks({ view: view });
  const bookmarksExpand = new Expand({ view: view, content: bookmarksWidget, group: "top-right" });
  view.ui.add(bookmarksExpand, "top-right");

  bookmarksWidget.on("select-bookmark", (event) => { bookmarksExpand.expanded = false });

  const sampleInstructions = document.createElement("div");
  sampleInstructions.style.padding = "10px";
  sampleInstructions.style.backgroundColor = "white";
  sampleInstructions.style.width = "300px";
  sampleInstructions.innerHTML = [
    "<b>Drag</b> the pointer over the data to view stats",
    "within one mile of the pointer location."
  ].join(" ");

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
    const csvData = {};

    promiseUtils.eachAlways([
      layerDataViewUtils
    ]).then(() => {
      layerDataViewUtils.updateLayerDataView(layerDataView, view, layer_map, csvData);
    }).catch((error) => {
      console.error("Error loading modules: ", error);
    });

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

      function buildWhereClause1() {
        const dateInput = document.getElementById('date-input').value;
        return `date = DATE '${dateInput}'`;
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
  }

  initializeMap();
});
