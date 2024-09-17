define([
  "esri/core/reactiveUtils",
  "./js/layerQuery.js",
    "./js/charts.js"
], function (reactiveUtils, layerQuery, Chart) {

  function updateLayerDataView(layerDataView, view, layer_map, csvData) {
    const colorSchemes = {
      "total_infected_cases": ["#ffedea", "#ffcec5", "#ffad9f", "#ff6f56", "#ef0000"],
      "today_infected_cases": ["#f3e5f5", "#e1bee7", "#ce93d8", "#ab47bc", "#6a1b9a"],
      "deaths": ["#e0e0e0", "#bdbdbd", "#9e9e9e", "#616161", "#000000"],
      "total_recovered_cases": ["#e8f5e9", "#c8e6c9", "#a5d6a7", "#66bb6a", "#2e7d32"]
    };

    async function queryAndUpdateLayer() {
      const attribute = document.getElementById('attribute-select').value;
      const { renderer, legendInfo } = await layerQuery.queryAndUpdateLayer(layerDataView, view, layer_map, csvData, attribute, colorSchemes);
      console.log("renderer", renderer);
      
      // if (renderer && legendInfo) {
      //   // Tạo Legend cho attribute hiện tại
      //   const legendDiv = document.createElement("div");
      //   legendDiv.innerHTML = `<h3>Legend for ${attribute}</h3>`;
      //   legendInfo.forEach(info => {
      //     const legendItem = document.createElement("div");
      //     legendItem.innerHTML = `<span style="background-color: ${info.color}; width: 20px; height: 20px; display: inline-block; margin-right: 10px;"></span>${info.label}`;
      //     legendDiv.appendChild(legendItem);
      //   });

      //   // Tạo Expand widget cho Legend
      //   if (expandWidget) view.ui.remove(expandWidget);
      //   expandWidget = new Expand({
      //     content: legendDiv,
      //     view: view,
      //     expanded: false,
      //     expandIconClass: "esri-icon-legend",
      //     expandTooltip: `Legend for ${attribute}`
      //   });
      //   view.ui.add(expandWidget, "bottom-left");

      //   // Cập nhật renderer cho layer
      //   layer_map.renderer = renderer;
      // }
      layer_map.renderer = renderer;
    }

    reactiveUtils.when(
      () => !layerDataView.dataUpdating,
      queryAndUpdateLayer
    );

    window.onload = async function () {
      await queryAndUpdateLayer();
    };

    const dateInput = document.getElementById('date-input');
    dateInput.addEventListener('change', queryAndUpdateLayer);
    const attribute = document.getElementById('attribute-select');
    attribute.addEventListener('change', queryAndUpdateLayer);
  }

  return {
    updateLayerDataView: updateLayerDataView
  };
});
