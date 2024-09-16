define([
  "esri/core/reactiveUtils",
  "esri/widgets/Expand",
  "esri/widgets/Legend"
], function (reactiveUtils) {

  function updateLayerDataView(layerDataView, view, layer_map, csvData) {
    const queryAndUpdateLayer = async () => {
      const dateInput = document.getElementById('date-input');
      const attribute = document.getElementById('attribute-select').value;
      console.log("attribute", attribute);
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
        view.closePopup();
        graphics.forEach((graphic) => {
          const province = graphic.attributes.province;
          const totalCases = graphic.attributes[attribute];
          csvData[province] = totalCases;
        });

        const renderer = {
          type: "unique-value",
          field: "name",
          uniqueValueInfos: Object.keys(csvData).map((province) => {
            const totalCases = csvData[province] || 0;
            let color = "#ffffff";

            if (totalCases > 1 && totalCases <= 100) {
              color = "#ffedea";
            } else if (totalCases <= 500) {
              color = "#ffcec5";
            } else if (totalCases <= 1000) {
              color = "#ffad9f";
            } else if (totalCases <= 5000) {
              color = "#ff6f56";
            } else if (totalCases > 5000) {
              color = "#ef0000";
            }
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

        layer_map.renderer = renderer;

      } catch (error) {
        console.error("Query failed: ", error);
      }
    };

    reactiveUtils.when(
      () => !layerDataView.dataUpdating,
      queryAndUpdateLayer
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
