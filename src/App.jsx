import { useState, useEffect, useRef } from "react";
import Geocode from "react-geocode";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayerGroup,
  Circle,
  useMapEvents,
} from "react-leaflet";
import * as L from "leaflet";
import "./App.css";

function App() {
  Geocode.setApiKey("AIzaSyD18ZwY2PLxYqoz5OVmVufHEQc2VOTOET8");
  Geocode.setLanguage("en");

  const autoCompleteRef = useRef();
  const inputRef = useRef();

  const options = {
    componentRestrictions: { country: "us" },
    fields: ["address_components", "geometry", "icon", "name"],
    types: ["establishment"],
  };

  const [inputAddress, setInputAddress] = useState("");
  const [points, setPoints] = useState([]);
  const [message, setMessage] = useState("");
  const [userLocation, setUserLocation] = useState([37.77493, -122.41116]);

  const userIcon = L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  useEffect(() => {
    autoCompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      options
    );
    autoCompleteRef.current.addListener("place_changed", async function () {
      const { address_components: place } =
        await autoCompleteRef.current.getPlace();
      const fullAddress = `${place[0]["long_name"]} ${place[1]["long_name"]}, ${place[3]["long_name"]}, ${place[5]["long_name"]}, ${place[6]["long_name"]}, ${place[7]["long_name"]}`;
      setInputAddress(fullAddress);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    await getLocationFromAddress();
  };

  const getMarkersFromCoordinates = async (lat, lng) => {
    const { data } = await axios.get(
      `https://data.sfgov.org/resource/rqzj-sfat.json?$where=within_circle(location,${lat},${lng},2000)`
    );
    if (data.length === 0) {
      setMessage("No results found!");
    }
    setPoints(data);
  };

  const getLocationFromAddress = async () => {
    if (!inputAddress) {
      setMessage("Enter an address!");
      return;
    }

    Geocode.fromAddress(inputAddress).then(async (response) => {
      if (response.status === "OK") {
        const result = response.results[0].geometry.location;
        const { data } = await axios.get(
          `https://data.sfgov.org/resource/rqzj-sfat.json?$where=within_circle(location,${result.lat},${result.lng},2000)`
        );
        setUserLocation([result.lat, result.lng]);
        if (data.length === 0) {
          setMessage("No results found!");
        }
        setPoints(data);
      } else {
        setMessage("Address not found!");
      }
    });
  };

  const UserLocation = () => {
    useMapEvents({
      click(e) {
        setUserLocation([e.latlng.lat, e.latlng.lng]);
        getMarkersFromCoordinates(e.latlng.lat, e.latlng.lng);
      },
    });

    return userLocation ? (
      <Marker position={userLocation || [37.77493, -122.41116]} icon={userIcon}>
        <Popup>
          <strong>Your current Location</strong>
        </Popup>
      </Marker>
    ) : null;
  };

  return (
    <div className="container">
      <MapContainer
        center={userLocation}
        zoom={13}
        scrollWheelZoom={false}
        className="map-container"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <UserLocation />
        {points.map((point, idx) => {
          return (
            <Marker key={idx} position={[point.latitude, point.longitude]}>
              <Popup className="popup-container">
                <strong>{point.address}</strong> <br />
                <strong>Applicant:</strong> {point.applicant} <br />
                <strong>Type:</strong> {point.facilitytype} <br />
                <strong>Food Items:</strong> {point.fooditems}
              </Popup>
            </Marker>
          );
        })}
        <LayerGroup>
          <Circle
            center={userLocation}
            pathOptions={
              points.length > 0
                ? { fillColor: "blue" }
                : { fillColor: "red", stroke: false }
            }
            radius={2000}
          />
        </LayerGroup>
      </MapContainer>

      <div className="form-container">
        <h1>Food Truck Finder</h1>
        <p className="info-text">
          The best app to find the best food trucks in SF near you (2km radius)!{" "}
          <br />
          Find them by either:
        </p>
        <p>1. Entering your current address to see nearby food trucks.</p>
        <p>2. Click anywhere on the map to update your current location.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            ref={inputRef}
            placeholder="Enter your address location..."
          />
          <button type="submit">Find Food Trucks</button>
        </form>
        {message && <p className="error-msg">{message}</p>}
      </div>
    </div>
  );
}

export default App;