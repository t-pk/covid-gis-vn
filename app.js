import { createCharts, updateCharts } from './js/charts.js';

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

  const instructionsExpand = new Expand({ expandIcon: "question", expandTooltip: "How to use this sample", view: view, content: sampleInstructions });
  view.ui.add(instructionsExpand, "top-left");

  view.when().then(() => {
    // Create the charts when the view is ready
    createCharts();

    const layer = webmap.layers.getItemAt(1);
    layer.outFields = [
      "province",
      "total_infected_cases",
      "today_infected_cases",
      "deaths",
      "total_recovered_cases",
      // "date"
    ];

    view.whenLayerView(layer).then((layerView) => {
      reactiveUtils
        .whenOnce(() => !layerView.updating)
        .then(() => {
          view.on(["click", "drag"], (event) => {
            event.stopPropagation();
            queryStatsOnDrag(layerView, event)
              .then(updateCharts)
              .catch((error) => {
                if (error.name !== "AbortError") {
                  console.error(error);
                }
              });
          });
        });
    });
  });

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
