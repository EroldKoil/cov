function graphicCreator() {
  this.context = document.getElementById("graphic");
  this.dataMass = {
    labels: [],
  };

  this.datasets = [{
      id: 0,
      label: 'Confirmed',
      data: [],
      backgroundColor: '#218000'
    },
    {
      id: 1,
      label: 'Recovered',
      data: [],
      backgroundColor: '#038c89'
    },
    {
      id: 2,
      label: 'Deaths',
      data: [],
      backgroundColor: '#ff6565'
    }
  ]

  //config for graphic
  this.config = {
    type: 'bar',
    options: {
      title: {
        display: false
      },
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        onClick: function(e, legendItem) {
          return;
        },
        labels: {
          boxWidth: 20
        }
      },
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            autoSkip: true,
            maxTicksLimit: 13
          },
          categoryPercentage: 1.0,
          barPercentage: 1.0
        }],
        yAxes: [{
          ticks: {
            callback: function(value) {
              let length = value.toString().length;
              let str = value.toString();
              if (str[0] == '0') {
                return str.slice(0, 7);
              } else {
                if (length == 4) {
                  return str.slice(0, 1) + "тыс.";
                }
                if (length == 5) {
                  return str.slice(0, 2) + "тыс.";
                }
                if (length == 6) {
                  return 0 + "." + str.slice(0, 1) + "млн.";
                }
                if (length == 7) {
                  return str.slice(0, 1) + "млн.";
                }
                if (length >= 8) {
                  return str.slice(0, str.length - 6) + "млн.";
                } else {
                  return str;
                }
              }
            },
            beginAtZero: true
          }
        }]
      }
    }
  }
}


graphicCreator.prototype.renderGraphic = function() {
  Chart.defaults.global.defaultFontColor = '#ababab';
  this.graphic = new Chart(this.context, this.config);
}

graphicCreator.prototype.rerenderGraphic = function() {
  this.context.data = {};
  let resultObj = {};

  //clear mass's with values 
  this.clearDataSets();

  if (dashboard.arguments.sortBy == "Confirmed") {
    resultObj = this.datasets[0];
  }
  if (dashboard.arguments.sortBy == "Recovered") {
    resultObj = this.datasets[1];
  }
  if (dashboard.arguments.sortBy == "Deaths") {
    resultObj = this.datasets[2];
  }
  if (dashboard.selectedCountry == "world") {
    fetch("https://disease.sh/v3/covid-19/historical/all?lastdays=360", this.requestOptions)
      .then(response => response.text())
      .then(result => {
        let object = JSON.parse(result);

        //fill mass of points for graphic
        resultObj.data = this.updateDataSets(object);

        //last apdated or all time
        resultObj.data = this.changeUpdateTime(resultObj.data);

        //на 100 000 населения или absolute
        resultObj.data = this.changeStep(resultObj.data, false);

        this.changeConfig(resultObj, object);
        this.graphic.update();
      })
  } else {
    fetch(`https://disease.sh/v3/covid-19/historical/${dashboard.selectedCountry}?lastdays=all`)
      .then(response => response.text())
      .then(result => {
        let object = JSON.parse(result).timeline;

        //fill mass of points for graphic
        resultObj.data = this.updateDataSets(object);

        //last apdated or all time
        resultObj.data = this.changeUpdateTime(resultObj.data);

        //на 100 000 населения или absolute
        resultObj.data = this.changeStep(resultObj.data, true);

        this.changeConfig(resultObj, object);
        this.graphic.update();
      });
  }
}

graphicCreator.prototype.clearDataSets = function() {
  this.datasets.forEach(element => {
    element.data = [];
  });
}

graphicCreator.prototype.updateDataSets = function(object) {
  let data = [];
  for (item in object) {
    if (item == "cases" && dashboard.arguments.sortBy == "Confirmed") {
      let mass = Object.entries(object[item]);
      mass.forEach(element => {
        data.push(element[1]);
      })
    }
    if (item == "recovered" && dashboard.arguments.sortBy == "Recovered") {
      let mass = Object.entries(object[item]);
      mass.forEach(element => {
        data.push(element[1]);
      })
    }
    if (item == "deaths" && dashboard.arguments.sortBy == "Deaths") {
      let mass = Object.entries(object[item]);
      mass.forEach(element => {
        data.push(element[1]);
      })
    }
  }
  return data;
}

graphicCreator.prototype.changeUpdateTime = function(mass) {
  let data = mass.slice();
  if (dashboard.arguments.period == "New") {
    let mass = [];
    for (let i = 1; i < data.length; i++) {
      mass.push(data[i] - data[i - 1] < 0 ? mass[i - 2] : data[i] - data[i - 1]);
    }
    data = mass;
  }
  return data;
}

graphicCreator.prototype.changeStep = function(mass, flag) {
  let data = mass.slice();
  let population;
  if (flag) {
    population = dashboard.allInfo[dashboard.selectedCountry].population;
  } else {
    population = dashboard.worldInfo.population;
  }
  if (!dashboard.arguments.absValue) {
    data = data.map(element => {
      let res = 100000 / population * element;
      if (res < 1) {
        return res.toFixed(4);
      }
      return Math.floor(res);
    })
  }
  return data;
}

graphicCreator.prototype.changeConfig = function(resultObj, object) {
  let labels = Object.keys(object['cases']);
  let datasets = [];
  datasets.push(resultObj);
  this.config.data = {
    labels: labels,
    datasets: datasets
  }
}