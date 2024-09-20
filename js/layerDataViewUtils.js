define([
  "esri/core/reactiveUtils",
  "./js/layerQuery.js",
  "esri/widgets/Expand",
], function (reactiveUtils, layerQuery, Expand) {
  let titleExpand;
  function updateLayerDataView(layerDataView, view, layer_map, csvData) {
    let dataLoaded = false;

    const colorSchemes = {
      "total_infected_cases": ["#ffedea", "#ffcec5", "#ffad9f", "#ff6f56", "#ef0000"],
      "today_infected_cases": ["#f3e5f5", "#e1bee7", "#ce93d8", "#ab47bc", "#6a1b9a"],
      "deaths": ["#e0e0e0", "#bdbdbd", "#9e9e9e", "#616161", "#000000"],
      "today_recovered_cases": ["#e8f5e9", "#c8e6c9", "#a5d6a7", "#66bb6a", "#2e7d32"]
    };
    // Tạo hàm để hiển thị thông tin Legend dưới dạng HTML
    function createLegendHTML(legendInfo) {
      const container = document.createElement('div');
      container.style.padding = '10px';
      legendInfo.forEach(info => {
        const legendItem = document.createElement('div');
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.marginBottom = '5px';

        // Tạo ô màu
        const colorBox = document.createElement('span');
        colorBox.style.width = '20px';
        colorBox.style.height = '20px';
        colorBox.style.backgroundColor = info.color;
        colorBox.style.marginRight = '10px';

        // Tạo nhãn cho mỗi ô màu
        const label = document.createElement('span');
        label.textContent = info.label;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        container.appendChild(legendItem);
      });
      return container;
    }

    // Hàm để tạo Expand widget
    function createExpandWidget(view, legendInfo) {
      const legendContainer = createLegendHTML(legendInfo);

      if (titleExpand) {
        titleExpand.content = legendContainer;
      } else {
        titleExpand = new Expand({
          view: view,
          content: legendContainer,
          expandIconClass: 'esri-icon-key',
          expanded: true,
          group: "bottom-left"
        });
      }
      view.ui.add(titleExpand, 'bottom-left');
    }
    async function queryAndUpdateLayer() {
      const attribute = document.getElementById('attribute-select').value;
      const { renderer, legendInfo } = await layerQuery.queryAndUpdateLayer(layerDataView, view, layer_map, csvData, attribute, colorSchemes);
      createExpandWidget(view, legendInfo);
      dataLoaded = true;
      layer_map.renderer = renderer;
    }

    async function retryQueryAndUpdateLayer() {
      await queryAndUpdateLayer();

      if (!dataLoaded) {
        setTimeout(retryQueryAndUpdateLayer, 1000);
      }
    };

    reactiveUtils.when(
      () => !layerDataView.dataUpdating,
      () => {
        dataLoaded = false;
        retryQueryAndUpdateLayer();
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
