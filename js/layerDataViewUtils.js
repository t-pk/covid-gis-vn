define([
  "esri/core/reactiveUtils",
  "./js/layerQuery.js",
], function (reactiveUtils, layerQuery) {

  function updateLayerDataView(layerDataView, view, layer_map, csvData) {
    let dataLoaded = false;
    console.log("function updateLayerDataView(layerDataView, view, layer_map, csvData)");
    const colorSchemes = {
      "total_infected_cases": ["#ffedea", "#ffcec5", "#ffad9f", "#ff6f56", "#ef0000"],
      "today_infected_cases": ["#f3e5f5", "#e1bee7", "#ce93d8", "#ab47bc", "#6a1b9a"],
      "deaths": ["#e0e0e0", "#bdbdbd", "#9e9e9e", "#616161", "#000000"],
      "total_recovered_cases": ["#e8f5e9", "#c8e6c9", "#a5d6a7", "#66bb6a", "#2e7d32"]
    };

    async function queryAndUpdateLayer() {
      console.log("async function queryAndUpdateLayer()");
      const attribute = document.getElementById('attribute-select').value;
      const { renderer } = await layerQuery.queryAndUpdateLayer(layerDataView, view, layer_map, csvData, attribute, colorSchemes);
      console.log("renderer", renderer);
      dataLoaded = true;
      layer_map.renderer = renderer;
    }
  
    async function retryQueryAndUpdateLayer() {
      console.log("retryQueryAndUpdateLayer before",  dataLoaded);
      await queryAndUpdateLayer(); // Thực hiện query và cập nhật layer
      console.log("retryQueryAndUpdateLayer",  dataLoaded);

      if (!dataLoaded) {
        console.log("retryQueryAndUpdateLayer queryAndUpdateLayer",  dataLoaded);
        console.log("retryQueryAndUpdateLayer queryAndUpdateLayer 1000",  dataLoaded);
        setTimeout(retryQueryAndUpdateLayer, 1000); // Thử lại sau 1 giây nếu dữ liệu chưa sẵn sàng
      }
    };

    reactiveUtils.when(
      () => !layerDataView.dataUpdating,
      () => {
        dataLoaded = false; // Đặt lại biến khi bắt đầu query
        retryQueryAndUpdateLayer(); // Bắt đầu quá trình retry
      }
    );

    const dateInput = document.getElementById('date-input');
    dateInput.addEventListener('change', queryAndUpdateLayer);
    const attribute = document.getElementById('attribute-select');
    attribute.addEventListener('change', queryAndUpdateLayer);
  }

  return {
    updateLayerDataView: updateLayerDataView
  };
});
