function mungeTemps(temp_data, month_param) {
  return {
    city_api_id: temp_data.city.id,
    name: temp_data.city.properties.name,
    month: Object.keys(temp_data.data)
      .filter(key => key.slice(-2) === month_param)
      .reduce((obj, key) => {
        obj[key] = temp_data.data[key];
        return obj;
      }, {}),
  };
}
function mungeCities(city_data) {
  const mapThrough = city_data.features.map((feature) => { return {
    city_api_id: feature.id,
    name: feature.properties.name,
    coordinates: feature.geometry.coordinates
  };
  });

  return mapThrough;
}
module.exports = {
  mungeTemps,
  mungeCities
};
