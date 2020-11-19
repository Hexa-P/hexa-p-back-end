const moment = require('moment');

function mungeTemps(temp_data) {
  return {
    city_api_id: temp_data.city.id,
    name: temp_data.city.properties.name,
    month: temp_data.data
  };
}

function mungeCities(city_data) {
  return city_data.features.map((feature) => { return {
    city_api_id: feature.id,
    name: feature.properties.name,
    coordinates: feature.geometry.coordinates
  };
  });
}

function mungeRcpData(future_temp, month_param) {
  const temps = mungeFutureAzaveaTempData(future_temp.data);
  console.log(temps);
  return {
    city_api_id: future_temp.city.id,
    name: future_temp.city.properties.name,
    month: Object.keys(temps)
      .filter(key => key.slice(-2) === month_param)
      .reduce((obj, key) => {
        obj[key] = temps[key];
        return obj;
      }, {}),
  };
}
function mungeArticles(articles) {
  return articles.articles.map((article) => { return {
    url: article.url,
  };
  });
}
module.exports = {
  mungeTemps,
  mungeCities,
  mungeRcpData,
  mungeArticles
};

function mungeFutureAzaveaTempData(data) {
  return Object.keys(data)
    // Get all of the year strings out of the data, e.g. '2009'
    .reduce((dataObj, key) => {
      // We use reduce to populate an object called dataObj that has keys like '2009-02'
      // Since tasmin/tasmax is just a list of 365 or 366 numbers, we use daysGoneBy to
      // help split the data into months.
      let daysGoneBy = 0;
      // key is a specific year, and we want to create objects in dataObj for each month
      moment.months().forEach(month => {
        // dateString creates a year-month string in the format '2009-02' from the key and month
        const dateString = key + '-' + moment().month(month).format('MM');
        // We get the numbers of days in the current month. This accounts for leap years.
        const daysInMonth = moment(dateString).daysInMonth();
        // Initialize tasmin/maxData for the current month.
        const tasminData = [];
        const tasmaxData = [];
        // Make a copy of daysGoneBy. We do this because where the for loop stops depends on daysGoneBy
        // AND daysGoneBy is mutatated inside of the for loop.
        const daysGoneByCopy = daysGoneBy;
        // Start looping through the data at the index daysGoneBy. Stop when you've gone through daysInMonth days.
        // Push the data wherever it's going.
        for(let i = daysGoneByCopy; i < daysGoneByCopy + daysInMonth; i++) {
          tasminData.push(data[key]['tasmin'][i]);
          tasmaxData.push(data[key]['tasmax'][i]);
          daysGoneBy += 1;
        }
        // Here, we create am average object for tasmin and tasmax.
        const tasminAvgObj = tasminData.reduce((acc, curr) => {
          acc.sum += curr;
          acc.total += 1;
          return acc;
        }, { sum: 0, total: 0 });
        const tasmaxAvgObj = tasmaxData.reduce((acc, curr) => {
          acc.sum += curr;
          acc.total += 1;
          return acc;
        }, { sum: 0, total: 0 });
        // This actually calculates the average from the average objects and converts from Kelvin to Fahrenheit. 
        const tasmaxAvg = 1.8 * (tasmaxAvgObj.sum / tasmaxAvgObj.total - 273.15) + 32;
        const tasminAvg = 1.8 * (tasminAvgObj.sum / tasminAvgObj.total - 273.15) + 32;
        const tasAvg = (tasmaxAvg + tasminAvg) / 2;
        // Put the averages into an object with key dateString in dataObj. 
        dataObj[dateString] = {
          tasminAvg,
          tasmaxAvg,
          tasAvg
        };
      }, {});
      return dataObj;
    }, {});
}
