window.onload = init;

function init() {
    const map = new ol.Map({
        view: new ol.View({
            center: ol.proj.fromLonLat([79.5308, 17.9835]),
            zoom: 16,
            maxZoom: 18,
            minZoom: 4,
        }),
        target: "js-map",
    });

    // Base Layers
    const OSMStandard = new ol.layer.Tile({
        source: new ol.source.OSM(),
        zIndex: 0,
        visible: true,
        title: "OSMStandard",
    });

    const OSMHumanitarian = new ol.layer.Tile({
        source: new ol.source.OSM({
            url: "https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        }),
        zIndex: 1,
        visible: false,
        title: "OSMHumanitarian",
    });

    const OSMCyclosm = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: "https://{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
        }),
        zIndex: 2,
        visible: false,
        title: "OSMCyclosm",
    });

    // Adding Bing Maps
    const BingMap = new ol.layer.Tile({
        source: new ol.source.BingMaps({
            key: 'AjGJklRvjl8-HGoaC8u97sNQxzaLs1O_gfqoEStBvDoKiHSH63-N9C1DAyETjwQJ',
            imagerySet: 'AerialWithLabels'
        }),
        zIndex: 3,
        visible: false,
        title: 'BingMap'
    });

    // Stamen Stadia Maps
    const Stadia = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg'
        }),
        zIndex: 4,
        visible: false,
        title: 'Stadia'
    });

    const baseLayerGroup = new ol.layer.Group({
        layers: [OSMStandard, OSMHumanitarian, OSMCyclosm, BingMap, Stadia],
    });
    map.addLayer(baseLayerGroup);

    // Thematic Layers
    const vectorGeoJSON = new ol.layer.Vector({
        source: new ol.source.Vector({
            url: "map (4).geojson",
            format: new ol.format.GeoJSON(),
        }),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({ color: "blue", width: 2 }),
            fill: new ol.style.Fill({ color: "rgba(0, 0, 255, 0.3)" }),
        }),
        visible: false,
        zIndex: 5,
        title: "GeoJSONLayer",
    });

    const kmlLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            url: "./Nitw_kml.kml",
            format: new ol.format.KML(),
        }),
        style: function () {
            return new ol.style.Style({
                stroke: new ol.style.Stroke({ color: "#000000", width: 3 }),
                fill: new ol.style.Fill({ color: "rgba(255, 165, 0, 0.5)" }),
            });
        },
        visible: false,
        zIndex: 6,
        title: "KMLLayer",
    });

    const wmsLayer = new ol.layer.Tile({
        source: new ol.source.TileWMS({
            url: "https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms",
            params: {
                LAYERS: "lulc:TS_LULC50K_1516",
                FORMAT: "image/png",
                VERSION: "1.1.1",
                TILED: false,
            },
            crossOrigin: "anonymous",
            serverType: "geoserver",
        }),
        zIndex: 10,
        visible: false,
        title: "WMSLayer",
    });

    // Add Thematic Layers
    map.addLayer(vectorGeoJSON);
    map.addLayer(kmlLayer);
    map.addLayer(wmsLayer);

    // Base Layer Switcher Logic
    const baseLayerElements = document.querySelectorAll('input[type=radio]');
    for (let baseLayerElement of baseLayerElements) {
        baseLayerElement.addEventListener("change", function () {
            let baseLayerElementValue = this.value;
            baseLayerGroup.getLayers().forEach(function (element) {
                let baseLayerName = element.get("title");
                element.setVisible(baseLayerName === baseLayerElementValue);
            });

            // Thematic layers remain visible if checked
            document.getElementById("checkGeoJSON").checked && vectorGeoJSON.setVisible(true);
            document.getElementById("checkKML").checked && kmlLayer.setVisible(true);
            document.getElementById("checkLULC").checked && wmsLayer.setVisible(true);
        });
    }

    // Checkbox Layer Control
    document.getElementById("checkGeoJSON").addEventListener("change", function () {
        vectorGeoJSON.setVisible(this.checked);
    });

    document.getElementById("checkKML").addEventListener("change", function () {
        kmlLayer.setVisible(this.checked);
    });

    document.getElementById("checkLULC").addEventListener("change", function () {
        wmsLayer.setVisible(this.checked);
    });

    // Feature Information Overlay
    const overlayContainerElement = document.querySelector('.overlay-container');
    const overlayLayer = new ol.Overlay({
        element: overlayContainerElement,
        autoPan: true,
        autoPanAnimation: { duration: 250 },
    });
    map.addOverlay(overlayLayer);

    const overlayFeatureName = document.getElementById('feature-name');
    const overlayFeatureInfo = document.getElementById('feature-info');

    // Change cursor when hovering over a feature
    map.on("pointermove", function (e) {
        const pixel = map.getEventPixel(e.originalEvent);
        const hit = map.hasFeatureAtPixel(pixel);
        map.getTargetElement().style.cursor = hit ? "pointer" : "";
    });

    // Show feature attributes on click
    map.on('click', (e) => {
        overlayLayer.setPosition(undefined);
    
        map.forEachFeatureAtPixel(e.pixel, (feature) => {
            if (!feature) return;
    
            let props = feature.getProperties();
            delete props.geometry; // Remove geometry
    
            // Get feature name, if not available, return (don't show overlay)
            let name = props.name || props.Name || props.FeatureName || props.feature_label;
            if (!name) return; // Skip unnamed features
    
            // Remove "Name_Building" and "Building_Name" fields
            delete props.Name_Building;
            delete props.Building_Name;
    
            let tableHTML = `<table border="1" style="background: cyan; color: red; border-collapse: collapse;">
                                <tr><th colspan="2">${name}</th></tr>
                                <tr><th>Attribute</th><th>Value</th></tr>` +
                Object.entries(props).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('') +
                `</table>`;
    
            overlayFeatureInfo.innerHTML = tableHTML;
            overlayLayer.setPosition(e.coordinate);
        });
    });

   
}


