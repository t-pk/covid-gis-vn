define([
  "esri/core/reactiveUtils"
], function (reactiveUtils) {

  function updateLayerDataView(layerDataView, view, layer_map, csvData) {
    reactiveUtils.when(
      () => !layerDataView.dataUpdating,
      async () => {
        try {
          const results = await layerDataView.queryFeatures({
            geometry: view.extent,
            returnGeometry: true
          });

          const graphics = results.features;

          graphics.forEach((graphic) => {
            const province = graphic.attributes.province;
            const totalCases = graphic.attributes.total_infected_cases;
            csvData[province] = totalCases;
          });

          const renderer = {
            type: "unique-value",
            field: "name",
            uniqueValueInfos: Object.keys(csvData).map((province) => {
              const totalCases = csvData[province];
              let color = "#ffffff";

              if (totalCases <= 100) {
                color = "#ffedea";
              } else if (totalCases <= 500) {
                color = "#ffcec5";
              } else if (totalCases <= 1000) {
                color = "#ffad9f";
              } else if (totalCases <= 5000) {
                color = "#ff6f56";
              } else if (totalCases > 5000) {
                color = "#ef0000";
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
              color: "#ffffff",
              outline: {
                width: 1,
                color: "black"
              }
            }
          };

          layer_map.renderer = renderer;
          console.log("renderer", renderer);
        } catch (error) {
          console.error("Query failed: ", error);
        }
      }
    );
  }

  return {
    updateLayerDataView: updateLayerDataView
  };
});
