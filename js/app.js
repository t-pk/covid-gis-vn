import { createCharts, updateCharts } from './charts.js';

require([
  "esri/views/MapView",
  "esri/WebMap",
  "esri/widgets/Legend",
  "esri/widgets/Expand",
  "esri/widgets/Bookmarks",
  "esri/core/lang",
  "esri/core/promiseUtils",
  "esri/core/reactiveUtils"
], (MapView, WebMap, Legend, Expand, Bookmarks, lang, promiseUtils, reactiveUtils) => {

  let highlightHandle = null;

  const webmap = new WebMap({ portalItem: { id: "1e254684c9bd41259e296eea06a0b1b0" } });

  const view = new MapView({ map: webmap, container: "viewDiv" });

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

  const legendExpand = new Expand({ view: view, content: new Legend({ view: view }), expanded: view.widthBreakpoint !== "xsmall" });
  view.ui.add(legendExpand, "bottom-left");

  reactiveUtils.watch(() => view.widthBreakpoint, (widthBreakpoint) => {
    titleExpand.expanded = widthBreakpoint !== "xsmall";
    legendExpand.expanded = widthBreakpoint !== "xsmall";
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
    // Wait for the view to load
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
    const layerView1 = await view.whenLayerView(layer_map);
    const layerView0 = await view.whenLayerView(layer_csv);

    // Fetch and process CSV data
    const csvData = {};
    const queryCSV = layer_csv.createQuery();
    queryCSV.returnGeometry = false; // No need for geometry
    queryCSV.outFields = ["province", "total_infected_cases"];

    const responseCSV = await layerView0.queryFeatures(queryCSV);
    responseCSV.features.forEach((feature) => {
      const province = feature.attributes.province;
      const totalCases = feature.attributes.total_infected_cases;
      csvData[province] = totalCases;
    });
    
    // Set up renderer for the map layer based on CSV data
    const renderer = {
      type: "unique-value", // Using unique-value renderer to apply colors based on case count
      field: "name", // Matching province name in the map layer
      uniqueValueInfos: Object.keys(csvData).map((province) => {
        const totalCases = csvData[province];
        let color = "#ffffff"; // Default color if no data
        if (totalCases == null || totalCases === "") {
          // Gán một màu mặc định hoặc bỏ qua tỉnh này
          color = "#ffffff";
        }
        // Apply color based on the number of cases
        if (totalCases <= 100) {
          color = "#ffedea";
        } else if (totalCases <= 500) {
          color = "#ffcec5";
        } else if (totalCases <= 1000) {
          color = "#ffad9f";
        } else if (totalCases <= 5000) {
          color = "#ff6f56";
        } else {
          color = "#e74c3c";
        }

        return {
          value: province,
          symbol: {
            type: "simple-fill",
            color: color,
            outline: {
              width: 1,
              color: "black"
            }
          },
          label: `${province}: ${totalCases} cases`
        };
      }),
      defaultSymbol: {
        type: "simple-fill",
        color: "#ffffff", // Default color for provinces with no data
        outline: {
          width: 1,
          color: "black"
        }
      }
    };

    // Apply the renderer to the map layer
    layer_map.renderer = renderer;

    view.whenLayerView(layer_map).then(() => {
      layer_map.renderer = renderer; // Thiết lập lại renderer nếu cần
    });

    // Handle map click event to show popup with detailed information
    view.on("click", async (event) => {
      event.stopPropagation();

      const query1 = layer_map.createQuery();
      query1.geometry = view.toMap(event);

      const response1 = await layerView1.queryFeatures(query1);
      if (currentHighlight) {
        currentHighlight.remove();
      }

      // Highlight the selected province
      currentHighlight = layerView1.highlight(response1.features[0]);

      layerView1.highlightOptions = {
        color: "#ffe700",
        haloOpacity: 0.9,
        fillOpacity: 0.2
      };

      if (response1.features.length > 0) {
        const provinceFromLayer1 = response1.features[0].attributes.name;

        const query0 = layer_csv.createQuery();
        query0.where = `province = '${provinceFromLayer1}'`;
        query0.returnGeometry = true;

        const response0 = await layerView0.queryFeatures(query0);
        if (response0.features.length > 0) {
          const provinceFromLayer0 = response0.features[0];
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

  // Call the async function to initialize the map
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
