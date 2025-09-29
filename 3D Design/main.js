let map=L.map("map").setView([0,0],3);
let userBattery;
L.tileLayer("https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=5ss5yFCq4GDeUWDijeEi",{
    attribution:`<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>`
}).addTo(map)


if("geolocation" in navigator){
    
    navigator.geolocation.getCurrentPosition((position)=>{
        let myLatitude=position.coords.latitude;
        let myLongitude=position.coords.longitude;
        let marker=L.marker([myLatitude,myLongitude]).addTo(map);
        marker.bindPopup(`Your Location`).openPopup();
        map.setView([myLatitude,myLongitude],10)
    })
}
// scale and watermark
L.control.scale({
    metric:true,
    imperial:false
}).addTo(map)
L.Control.Watermark=L.Control.extend({
    onAdd:(map)=>{
        let img=L.DomUtil.create("img");
        img.src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/2449px-NASA_logo.svg.png";
        img.style.width = "50px";
        return img;
    },
    onRemove:(map)=>{}
})
    L.control.watermark = function(opts) {
    return new L.Control.Watermark(opts);
}
L.control.watermark({ position: 'bottomright' }).addTo(map);

// geocoding search
let key="A5pNhy1HohawUNrIkqaL"

let geocoder=L.control.maptilerGeocoding({
    apiKey: key,
    placeholder:"Search for place..",
    collapsed:true,
    marker:false
}).addTo(map)

let lastMarker=null;
geocoder.on("select", function(e) {
    let coords;

    if (e.latlng) {
        // If latlng is provided (some cases)
        coords = [e.latlng.lat, e.latlng.lng];
    } else if (e.feature && e.feature.geometry && e.feature.geometry.coordinates) {
        // If feature exists
        let c = e.feature.geometry.coordinates; // [lng, lat]
        coords = [c[1], c[0]]; // convert to [lat, lng]
    } 
    if (!coords) return; // exit silently if no coordinates
    
    if (lastMarker) {
        map.removeLayer(lastMarker);
    }

    // Add new marker
    lastMarker = L.marker(coords)
            .addTo(map)
            .bindPopup(e.feature ? e.feature.place_name : "Unknown place")
            .openPopup();

    map.setView(coords, 12); 
});
let marker;
document.getElementById("searchForm").addEventListener("submit", async (e) => {
    let result=document.getElementById("result");
    result.style.display="block"
    e.preventDefault();
    const address = document.getElementById("address").value;
    const date = document.getElementById("date").value.replaceAll("-", "");
    const param = document.getElementById("parameter").value;

    // Geocode (using geocode.maps.co to avoid CORS)
    const geoRes = await fetch(`https://geocode.maps.co/search?q=${encodeURIComponent(address)}`);
    const geoData = await geoRes.json();

    if (geoData && geoData.length > 0) {
    const lat = geoData[0].lat;
    const lon = geoData[0].lon;

    map.setView([lat, lon], 10);
    if (marker) marker.setLatLng([lat, lon]);
    else marker = L.marker([lat, lon]).addTo(map);

    // Fetch NASA POWER data
// Fetch NASA POWER data
    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${param}&start=${date}&end=${+date+5}&latitude=${lat}&longitude=${lon}&format=JSON`;
    const nasaRes = await fetch(nasaUrl);
    const nasaData = await nasaRes.json();

    if (nasaData.properties && nasaData.properties.parameter) {
    const value = nasaData.properties.parameter[param][date];
    const prettyName = document.querySelector(`#parameter option[value="${param}"]`).innerText;
    
    result.innerHTML = `
        <h3>Results for ${address}</h3>
        <p><b>Latitude:</b> ${lat}, <b>Longitude:</b> ${lon}</p>
        <p><b>Date:</b> ${date}</p>
        <p><b>${prettyName}:</b> ${value}</p>
    `;
    } else {
    result.innerHTML = `
        <p style="color:red;">❌ No climate data available for this date. Try an earlier one.</p>
    `;
    }
    }
});
