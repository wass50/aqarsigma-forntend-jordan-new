// Save this as generateProperties.js and run with: node generateProperties.js

const fs = require('fs');

const cities = [
  { city: "Toronto", lat: 43.7, lng: -79.4, neighborhoods: ["Yorkville", "University", "Scarborough", "North York", "Etobicoke", "Downtown", "Liberty Village"] },
  { city: "Mississauga", lat: 43.6, lng: -79.65, neighborhoods: ["City Centre", "Port Credit", "Erin Mills", "Cooksville", "Meadowvale"] },
  { city: "Brampton", lat: 43.7, lng: -79.76, neighborhoods: ["Downtown Brampton", "Bramalea", "Mount Pleasant", "Springdale"] },
  { city: "Vaughan", lat: 43.8, lng: -79.5, neighborhoods: ["Maple", "Woodbridge", "Concord", "Kleinburg"] },
  { city: "Markham", lat: 43.86, lng: -79.3, neighborhoods: ["Unionville", "Milliken", "Thornhill", "Cornell"] },
  { city: "Richmond Hill", lat: 43.87, lng: -79.44, neighborhoods: ["Oak Ridges", "Bayview Hill", "Jefferson"] },
  { city: "Oakville", lat: 43.45, lng: -79.68, neighborhoods: ["Bronte", "Old Oakville", "Glen Abbey"] }
];

const propertyTypes = ["Condo", "Apartment", "Townhouse", "Detached", "Loft"];
const listingStatuses = ["Active", "Sold", "De-listed"];
const listingTypes = ["For-Sale", "For-Lease"];
const featuresList = [
  ["Parking", "Locker", "Balcony", "Gym"],
  ["Utilities Included", "Close to U of T"],
  ["Pool", "Gym", "Concierge"],
  ["Garage", "Backyard"],
  ["Garage", "Fireplace", "Deck"],
  ["Loft Style", "Open Concept"],
  ["Finished Basement", "Backyard"],
  ["Rooftop Patio", "Party Room"]
];
const agentNames = ["Jane Doe", "John Smith", "Linda Park", "Mike Brown", "Sara Kim", "Alice Lee", "Bob Martin"];
const brokerages = ["Sigma Realty", "HomeLife", "Royal LePage", "RE/MAX", "Century 21"];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const properties = [];

for (let i = 1; i <= 100; i++) {
  const cityObj = randomFrom(cities);
  const city = cityObj.city;
  const lat = +(cityObj.lat + (Math.random() - 0.5) * 0.1).toFixed(6);
  const lng = +(cityObj.lng + (Math.random() - 0.5) * 0.1).toFixed(6);
  const neighborhood = randomFrom(cityObj.neighborhoods);
  const propertyType = randomFrom(propertyTypes);
  const listingStatus = randomFrom(listingStatuses);
  const listingType = randomFrom(listingTypes);
  const bedrooms = randomInt(1, 5);
  const bathrooms = randomInt(1, 4);
  const sqft = randomInt(500, 3000);
  const price = listingType === "For-Lease" ? randomInt(1800, 6000) : randomInt(400000, 2500000);
  const originalPrice = price + randomInt(0, 20000);
  const soldPrice = listingStatus === "Sold" ? price - randomInt(0, 20000) : null;
  const daysOnMarket = randomInt(1, 60);
  const maintenanceFee = propertyType === "Detached" ? 0 : randomInt(300, 800);
  const taxes = randomInt(2000, 9000);
  const parking = randomInt(0, 2);
  const locker = randomInt(0, 1);
  const yearBuilt = randomInt(1990, 2024);
  const lotSize = propertyType === "Detached" ? `${randomInt(30, 60)}x${randomInt(80, 150)} ft` : "N/A";
  const features = randomFrom(featuresList);
  const agentName = randomFrom(agentNames);
  const agentPhone = `416-555-${randomInt(1000,9999)}`;
  const brokerage = randomFrom(brokerages);
  const mlsNumber = `${city[0]}${1000000 + i}`;
  const address = `${randomInt(100,999)} ${randomFrom(["Bloor", "King", "Queen", "Yonge", "Bay", "Dundas", "Burnhamthorpe", "Steeles", "Eglinton", "Hurontario"])} St${randomFrom(["", " W", " E", " N", " S"])}`;
  const postalCode = `M${randomInt(1,9)}${String.fromCharCode(65+randomInt(0,25))}${randomInt(1,9)} ${String.fromCharCode(65+randomInt(0,25))}${randomInt(1,9)}${String.fromCharCode(65+randomInt(0,25))}`;
  const photo = "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=600&q=80";
  const photos = [photo];
  const description = `${propertyType} in ${neighborhood}, ${city}. ${features.join(", ")}.`;
  const listingDate = `2025-${String(randomInt(1,6)).padStart(2,"0")}-${String(randomInt(1,28)).padStart(2,"0")}`;
  const soldDate = listingStatus === "Sold" ? `2025-${String(randomInt(1,6)).padStart(2,"0")}-${String(randomInt(1,28)).padStart(2,"0")}` : null;
  const virtualTourUrl = "";

  properties.push({
    id: i,
    mlsNumber,
    address,
    city,
    province: "ON",
    postalCode,
    neighborhood,
    lat,
    lng,
    price,
    originalPrice,
    soldPrice,
    bedrooms,
    bathrooms,
    sqft,
    propertyType,
    listingStatus,
    listingType,
    listingDate,
    soldDate,
    daysOnMarket,
    maintenanceFee,
    taxes,
    parking,
    locker,
    yearBuilt,
    lotSize,
    features,
    photo,
    photos,
    description,
    agentName,
    agentPhone,
    brokerage,
    virtualTourUrl
  });
}

fs.writeFileSync("propertiesList.json", JSON.stringify(properties, null, 2));
console.log("Generated 100 properties in propertiesList.json");