import { createCharts, updateCharts } from './charts.js';

require([
  "esri/views/MapView",
  "esri/WebMap",
  "esri/widgets/Legend",
  "esri/widgets/Expand",
  "esri/widgets/Bookmarks",
  "esri/core/promiseUtils",
  "esri/core/reactiveUtils",
  "./js/layerDataViewUtils.js"
], (MapView, WebMap, Legend, Expand, Bookmarks, promiseUtils, reactiveUtils, layerDataViewUtils) => {

  let highlightHandle = null;

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

    // Call createCharts after view is ready
    createCharts();

    const layer_csv = webmap.layers.getItemAt(1);
    const layer_map = webmap.layers.getItemAt(0);
    layer_map.outFields = ["name", "id"];
    layer_csv.outFields = [
      "province",
      "total_infected_cases",
      "today_infected_cases",
      "deaths",
      "total_recovered_cases",
      "date"
    ];

    let currentHighlight = null;

    // Wait for layer views to load
    const layerMapView = await view.whenLayerView(layer_map);
    const layerDataView = await view.whenLayerView(layer_csv);

    const csvData = {};

    layerDataViewUtils.updateLayerDataView(layerDataView, view, layer_map, csvData);

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

      if (responseMap.features.length > 0) {
        const dateInput = document.getElementById('date-input');
        const queryCSV = layer_csv.createQuery();
        const provinceFromLayerData = responseMap.features[0].attributes.name;

        queryCSV.where = `date = DATE '${dateInput.value}' AND province = '${provinceFromLayerData}'`
        queryCSV.returnGeometry = true;

        console.log("queryCSV", queryCSV);
        dateInput.addEventListener('change', async (event) => {
          const selectedDate = event.target.value;

          queryCSV.where = `date = DATE '${selectedDate}' AND province = '${provinceFromLayerData}'`
          let responseData = await layerDataView.queryFeatures(queryCSV);
          if (responseData.features.length > 0) {
            const provinceFromLayer0 = responseData.features[0];
            view.openPopup({
              title: "Thông tin chi tiết",
              content: `
              <b>Province:</b> ${provinceFromLayer0.attributes.province}<br>
              <b>Total Infected Cases:</b> ${provinceFromLayer0.attributes.total_infected_cases}<br>
              <b>Today's Infected Cases:</b> ${provinceFromLayer0.attributes.today_infected_cases}<br>
              <b>Deaths:</b> ${provinceFromLayer0.attributes.deaths}<br>
              <b>Total Recovered Cases:</b> ${provinceFromLayer0.attributes.total_recovered_cases}<br>
              <b>Date:</b> ${new Date(provinceFromLayer0.attributes.date).toLocaleDateString()}
            `,
              location: event.mapPoint
            });
          }
        });
        let responseData = await layerDataView.queryFeatures(queryCSV);
        if (responseData.features.length > 0) {
          const provinceFromLayer0 = responseData.features[0];
          view.openPopup({
            title: "Thông tin chi tiết",
            content: `
              <b>Province:</b> ${provinceFromLayer0.attributes.province}<br>
              <b>Total Infected Cases:</b> ${provinceFromLayer0.attributes.total_infected_cases}<br>
              <b>Today's Infected Cases:</b> ${provinceFromLayer0.attributes.today_infected_cases}<br>
              <b>Deaths:</b> ${provinceFromLayer0.attributes.deaths}<br>
              <b>Total Recovered Cases:</b> ${provinceFromLayer0.attributes.total_recovered_cases}<br>
              <b>Date:</b> ${new Date(provinceFromLayer0.attributes.date).toLocaleDateString()}
            `,
            location: event.mapPoint
          });
        }
      }
    });
  }

  initializeMap();

  const queryStatsOnDrag = promiseUtils.debounce((layerView, event) => {
    console.log(layerView, event);
    const query = layerView.layer.createQuery();
    query.geometry = view.toMap(event);
    query.distance = 1;
    query.units = "miles";

    layerView.queryObjectIds(query).then((ids) => {
      if (highlightHandle) {
        highlightHandle.remove();
        highlightHandle = null;
      }
      highlightHandle = layerView.highlight(ids);
    });

    const statsQuery = query.clone();

    return layerView.queryFeatures(statsQuery).then(
      function (response) {
        const stats = response.features[0].attributes;
        console.log("layerView.queryFeatures", stats);
        return stats;
      },
      function (e) {
        console.error(e);
      }
    );
  });
});
