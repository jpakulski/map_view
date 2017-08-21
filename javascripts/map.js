const LAT_LONG_HAMILTON = {
  latitude: -37.7870,
  longitude: 175.2793
}

class Status {
  constructor(id) {
    this.targ = document.getElementById(id);
    this.content = this.targ.getElementsByClassName('content')[0];
  }

  show(msg, cssClass = 'ok', autoHideDelay = 0) {
    this.setCssClass(cssClass);
    this.setMessage(msg, cssClass);
    if (autoHideDelay > 0) {
      this.hide(autoHideDelay);
    }
    this.targ.classList.remove('hidden');
  }

  hide(delay = 0) {
    setTimeout(()=> {
      this.targ.classList.add('hidden');
    }, delay)
  }

  setMessage(msg) {
    this.content.innerText = msg;
  }

  setCssClass(cssClass) {
    this.clearClasses();
    this.targ.classList.add(cssClass);
  }

  clearClasses() {
    this.targ.classList.remove('ok');
    this.targ.classList.remove('warning');
    this.targ.classList.remove('error');
  }
}

class Processor {
  constructor(status) {
    this.status = status;
    this.maxRank = {};
  }

  getParsed(rawData) {
    this.status.show('Starting parsing data');
    this.rawData = rawData;
    this.parse();
    this.addMeta();
    this.status.show('Finished parsing data', 'ok', 3000);
    return this.parsedDataHash;
  }

  parse() {
    let rows = this.cleanRows(this.rawData.split('\n'));
    this.parsedDataArray = rows.map((row, rowIndex)=> {
      row = row.replace(/\r/g, '');
      return row.split(',').map((col, colIndex)=> {
        return this.clean(col, rowIndex, colIndex);
      });
    });

    let parsedDataKeys = this.parsedDataArray[0];
    this.parsedDataHash = this.parsedDataArray.slice(1).reduce(function(result, row, index) {
      result[index] = parsedDataKeys.reduce(function(result, key, index) {
        result[key] = row[index];
        return result;
      }, {});
      return result;
    }, {});
  }

  addMeta() {
    let maxs = {};
    let mins = {};
    let blackList = ['name', 'longitude', 'latitude'];

    // Compute max and min
    for (var index in this.parsedDataHash) {
      for (var key in this.parsedDataHash[index]) {
        if (blackList.indexOf(key) < 0) {
          let val = this.parsedDataHash[index][key];
          if (!maxs[key] || (maxs[key] && maxs[key] < val)) {
            maxs[key] = val;
          }
          if (!mins[key] || (mins[key] && mins[key] > val)) {
            mins[key] = val;
          }
        }
      }
    }

    // Compute percentage and rank and add it to the result hash
    let tmp = {};
    for (var index in this.parsedDataHash) {
      tmp[index] = {};
      for (var key in this.parsedDataHash[index]) {
        if (blackList.indexOf(key) < 0) {
          let val = this.parsedDataHash[index][key];
          let percent = this.percent(mins[key], maxs[key], val);
          let rank = this.rank(key, val);
          this.parsedDataHash[index]['index'] = index;
          this.parsedDataHash[index][key + ' Percent Raw'] = percent;
          this.parsedDataHash[index][key + ' Percent'] = percent.toFixed(2);
          tmp[index][key] = rank;
          this.updateMaxRank(key, rank);
        }
      }
    }

    // Reverse the rank. Best = 1
    for (var index in tmp) {
      for (var key in tmp[index]) {
        this.parsedDataHash[index][key + ' Rank'] = this.maxRank[key] - tmp[index][key] + 1;
      }
    }
  }

  percent(min, max, val) {
    return (100 * ((val - min) / (max - min)));
  }

  rank(key, val) {
    let result = 0;
    for (var index in this.parsedDataHash) {
      if (this.parsedDataHash[index][key] < val) {
        result++;
      }
    }
    return result;
  }

  updateMaxRank(key, rank) {
    if (!this.maxRank[key]) {
      this.maxRank[key] = rank;
    } else if(rank > this.maxRank[key]) {
      this.maxRank[key] = rank;
    }
  }

  cleanRows(dirtyRows) {
    let lastRow = dirtyRows.slice(-1);
    if (lastRow && lastRow[0] == '') {
      return dirtyRows.slice(0, -1);
    }
    return dirtyRows;
  }

  clean(dirty, rowIndex, colIndex) {
    let val = dirty.replace(/"/g, '');
    if (rowIndex > 0 && colIndex > 0) {
      val = parseFloat(val);
    }
    return val;
  }
}

class DropFile {
  constructor(id) {
    this.targ = document.getElementById(id);
  }

  show() {
    this.targ.classList.remove('hidden');
  }

  hide() {
    this.targ.classList.add('hidden');
  }
}

class Checkbox {
  constructor(id, defaultState, callback) {
    this.targ = document.getElementById(id);
    this.state = defaultState;
    this.callback = callback;
    this.update();
    this.bind();
  }

  bind() {
    this.targ.addEventListener('click', ()=> {
      this.toggle();
    });
  }

  toggle() {
    this.state = this.isChecked();
    this.update();
    this.callback(this.state);
  }

  isChecked() {
    return this.targ.className.indexOf('checked') >= 0;
  }

  update() {
    if (this.state) {
      this.targ.classList.remove('checked');
    } else {
      this.targ.classList.add('checked');
    }
  }
}

class MainMenuPanel {
  constructor(id, plotKeySelectCallback = null, resetMapBtnCallback = null, fitMapBtnCallback = null) {
    this.targ = document.getElementById(id);
    this.plotKeySelect = document.getElementById('current-select');
    this.resetMapBtn = document.getElementById('reset-map-btn');
    this.fitMapBtn = document.getElementById('fit-map-btn');
    this.plotKeySelectCallback = plotKeySelectCallback;
    this.resetMapBtnCallback = resetMapBtnCallback;
    this.fitMapBtnCallback = fitMapBtnCallback;
    this.bind();
  }

  show() {
    this.targ.classList.remove('hidden');
  }

  hide() {
    this.targ.classList.add('hidden');
  }

  bind() {
    this.plotKeySelect.addEventListener('change', ()=> {
      if (this.plotKeySelectCallback) {
        this.plotKeySelectCallback(this.plotKeySelect.value);
      }
    });

    this.resetMapBtn.addEventListener('click', ()=> {
      if (this.resetMapBtnCallback) {
        this.resetMapBtnCallback();
      }
    });

    this.fitMapBtn.addEventListener('click', ()=> {
      if (this.fitMapBtnCallback) {
        this.fitMapBtnCallback();
      }
    });
  }

  setPlotKeySelect(keys) {
    let options = '';
    this.filteredCopy(keys).forEach((key, index)=> {
      if (index === 0) {
        this.firstKey = key;
      }
      options += '<option value="' + key + '">' + key + '</option>';
    });
    this.plotKeySelect.innerHTML = options;
  }

  filteredCopy(arr) {
    let blackList = ['name', 'longitude', 'latitude', 'index'];
    return arr.filter(function(val) {
      return blackList.indexOf(val) < 0 && val.indexOf('Percent') < 0 && val.indexOf('Rank') < 0;
    });
  }
}

class DetailPanel {
  constructor(id) {
    this.targ = document.getElementById(id);
    this.title = this.targ.getElementsByTagName('h2')[0];
    this.content = this.targ.getElementsByClassName('data-content')[0];
  }

  update(data) {
    let filteredData = this.filteredCopy(data);
    let rowHtml = '';
    for (var key in filteredData) {
      if (key.indexOf('Percent') < 0 && key.indexOf('Rank') < 0 && key.indexOf('index') < 0) {
        let val = filteredData[key];
        let percent = filteredData[key + ' Percent'];
        let rank = filteredData[key + ' Rank'];
        if (percent === undefined) {
          percent = '-';
        }
        if (rank === undefined) {
          rank = '-';
        }
        rowHtml += '<tr><th>' + key + '</th><td>' + val + '</td><td>' + percent + '</td><td>' + rank + '</td></tr>';
      }
    }
    this.title.innerText = data.name;
    this.content.innerHTML = rowHtml;
  }

  show() {
    this.targ.classList.remove('hidden');
  }

  hide() {
    this.targ.classList.add('hidden');
  }

  filteredCopy(obj) {
    let result = {};
    for (var key in obj) {
      if (key != 'name') {
        result[key] = obj[key];
      }
    }
    return result;
  }
}

class Map {
  constructor(id, initialCoordinates = {}, status = null, options = {}) {
    this.id = id;
    this.status = status;
    this.initialCoordinates = initialCoordinates;
    this.initialZoom = options.initialZoom || 8;
    this.minRadius = options.minRadius || 10.0;
    this.maxRadius = options.maxRadius || 80.0;
    this.selectedKey = 'Value 1';
    this.selectedCircle = null;
    this.highlitCircle = null;
    this.detailPanel = new DetailPanel('detail-panel');
    this.mainMenuPanel = new MainMenuPanel(
      'main-menu-panel',
      (key)=> { return this.selectedKeyChanged(key) },
      ()=> { this.reset() },
      ()=> { this.fit() }
    );
    this.barIndex = new BarIndex('index-panel',
    (id)=> { this.highlightCircle(id) },
    (id)=> { this.selectCircle(id) });
    this.initMap();
  }

  initMap() {
    try {
      this.mapBounds = new google.maps.LatLngBounds();
      this.initialLatLong = new google.maps.LatLng(this.initialCoordinates.latitude, this.initialCoordinates.longitude);
      this.map = new google.maps.Map(d3.select('#' + this.id).node(), {
        zoom: this.initialZoom,
        center: this.initialLatLong,
        mapTypeId: google.maps.MapTypeId.TERRAIN
      });
    } catch(e) {
      this.status.show('Error, ' + e.message + '!', 'error', 3000);
    }
  }

  reset() {
    this.map.setCenter(this.initialLatLong);
    this.map.setZoom(this.initialZoom);
  }

  fit() {
    this.map.fitBounds(this.mapBounds);
  }

  highlightCircle(id) {
    let circle = document.getElementById('circle-' + id);
    if (circle) {
      if (this.highlitCircle) {
        this.highlitCircle.classList.remove('highlight');
      }
      this.highlitCircle = circle;
      this.highlitCircle.classList.add('highlight');
    }
  }

  selectCircle(id) {
    let circle = document.getElementById('circle-' + id);
    let data = JSON.parse(circle.dataset['value']);
    if (circle && data) {
      this.detailPanel.update(data);
      this.detailPanel.show();
      this.markSelectedCircle(circle);
    }
  }

  selectedKeyChanged(key) {
    this.selectedKey = key;
    this.removeDataOverlay();
    this.updateDataOverlay();
  }

  removeDataOverlay() {
    this.mapBounds = new google.maps.LatLngBounds();
    if (this.mapOverlay) {
      this.mapOverlay.setMap(null);
    }
  }

  drawDataOverlay(data) {
    if (!data || !data[0]) {
      return;
    }

    this.data = data;
    this.mainMenuPanel.setPlotKeySelect(Object.keys(this.data[0]));
    this.selectedKey = this.mainMenuPanel.firstKey;

    this.setDomain();
    this.setScale();
    this.mapOverlay = new google.maps.OverlayView();
    this.bindMapOverlayEvents();
    this.mapOverlay.setMap(this.map);
    this.mainMenuPanel.show();
  }

  updateDataOverlay() {
    this.setDomain();
    this.setScale();
    this.mapOverlay = new google.maps.OverlayView();
    this.bindMapOverlayEvents();
    this.mapOverlay.setMap(this.map);
  }

  setDomain() {
    this.minValue = Number.MAX_VALUE;
    this.maxValue = Number.MIN_VALUE;
    for (var key in this.data) {
      let val = this.data[key][this.selectedKey];
      if (val > this.maxValue) {
        this.maxValue = val;
      }
      if (val < this.minValue) {
        this.minValue = val;
      }
    }
  }

  bindMapOverlayEvents() {
    let _this = this;

    this.mapOverlay.onAdd = ()=> {
      this.chartLayer = d3.select(this.mapOverlay.getPanes().overlayMouseTarget)
        .append('div')
        .attr('class', 'chart-layer');
    }

    this.mapOverlay.onRemove = ()=> {
      this.chartLayer.remove();
    }

    this.mapOverlay.draw = ()=> {
      let projection = this.mapOverlay.getProjection();
      let maxRadius = this.maxRadius;
      let data = d3.entries(this.data);
      data.sort((a, b)=> {
        return b.value[this.selectedKey] - a.value[this.selectedKey];
      });

      this.barIndex.plot(data, this.selectedKey);
      this.barIndex.show();

      let marker = this.chartLayer.selectAll('svg')
          .data(data)
          .each((d, i, markers)=> {
            this.markerPosition(d, i, markers, projection)
          })
          .enter().append('svg')
          .each((d, i, markers)=> {
            this.markerPosition(d, i, markers, projection);
          })
          .attr('class', 'marker')
          .style('width', (d)=> {
            return 2 * (this.scale(d.value[this.selectedKey]) + 2);
          })
          .style('height', (d)=> {
            return 2 * (this.scale(d.value[this.selectedKey]) + 2);
          });

      // Circle is proportional to the plotted value
      marker.append('circle')
        .attr('r', (d)=> {
          return this.scale(d.value[this.selectedKey]);
        })
        .attr('cx', (d)=> {
          return this.scale(d.value[this.selectedKey]) + 2;
        })
        .attr('cy', (d)=> {
          return this.scale(d.value[this.selectedKey]) + 2;
        })
        .attr('id', (d)=> {
          return 'circle-' + d.value['index'];
        })
        .style('fill', (d)=> {
          return heatMapColor(d.value[this.selectedKey + ' Percent Raw'], 0.75);
        })
        .attr('class', 'circle')
        .attr('data-value', function(d) {
          return JSON.stringify(d.value);
        })
        .on('click', function(d) {
          _this.detailPanel.update(d.value);
          _this.detailPanel.show();
          _this.markSelectedCircle(this);
        });
    }
  }

  transform(d, marker, projection, radius) {
    d = projection.fromLatLngToDivPixel(d);
    return d3.select(marker)
      .style('left', (d.x - radius - 2) + 'px')
      .style('top', (d.y - radius - 2) + 'px');
  }

  markerPosition(d, i, markers, projection) {
    let radius = this.scale(d.value[this.selectedKey]);
    let latLong = new google.maps.LatLng(d.value.latitude, d.value.longitude);
    this.mapBounds.extend(latLong);
    this.transform(latLong, markers[i], projection, radius);
  }

  markSelectedCircle(element) {
    document.querySelectorAll('#map .circle').forEach(function(circle) {
      circle.classList.remove('selected');
    });
    element.classList.add('selected');
  }

  setScale() {
    let minValue = this.minValue;
    let minRadius = this.minRadius;
    let scaleFactor = parseFloat(this.maxRadius - minRadius) / (this.maxValue - minValue);
    this.scale = function(val) {
      return (scaleFactor * (val - minValue)) + minRadius;
    }
  }

  getOffset(el) {
    el.getBoundingClientRect();
  }
}

class BarIndex {
  constructor(id, mouseOverCallback, clickCallback) {
    this.targ = document.getElementById(id);
    this.bars = this.targ.getElementsByClassName('bars')[0];
    this.mouseOverCallback = mouseOverCallback;
    this.clickCallback = clickCallback;
    this.selectedBar = null;
  }

  plot(data, key) {
    let html = '';
    let bar, value, name, datum;
    for (var i in data) {
      datum = data[i].value;
      value = '<div class="value">' + datum[key] + '</div>';
      name = '<div class="name">' + datum[key + ' Rank'] + '. ' + datum['name'] + '</div>';
      bar = '<div class="bar" style="width: ' + datum[key + ' Percent'] + '%;"></div>';
      html += '<div class="track" id="track-' + datum['index'] + '">' + bar + name + value + '</div>';
    }
    this.bars.innerHTML = html;
    this.bind();
  }

  bind() {
    let tracks = this.bars.getElementsByClassName('track');
    for(var i = 0; i < tracks.length; i++) {
      let track = tracks[i];
      let id = parseInt(track.getAttribute('id').replace('track-', ''));
      track.addEventListener('mouseover', ()=> {
        if (typeof this.mouseOverCallback === 'function') {
          this.mouseOverCallback(id);
        }
      });
      track.addEventListener('click', ()=> {
        if (typeof this.clickCallback === 'function') {
          this.clickCallback(id);
        }
      });
    }
  }

  show() {
    this.targ.classList.remove('hidden');
  }

  hide() {
    this.targ.classList.add('hidden');
  }
}

function heatMapColor(percent, opacity){
  var value = percent / 100;
  var h = (1.0 - value) * 240;
  return 'hsla(' + h + ', 100%, 48%, ' + opacity + ')';
}

document.ondragover = document.ondrop = (event) => {
  event.preventDefault();
}

let status = new Status('status-overlay');
let dropFile = new DropFile('drop-file');
let map = new Map('map', LAT_LONG_HAMILTON, status);
let heatMapToggle = new Checkbox('heat-map-toggle', false, ()=> {
  var map = document.getElementById('map');
  if (map.className.indexOf('no-heat-map') >= 0) {
    map.classList.remove('no-heat-map');
  } else {
    map.classList.add('no-heat-map');
  }
});

document.body.ondrop = (event)=> {
  let file = event.dataTransfer.files[0]
  status.show('Reading: ' + file.name);

  let fileReader = new FileReader();
  fileReader.onload = function(event) {
    let fileText = event.target.result;
    let processor = new Processor(status);
    let mapData = processor.getParsed(fileText);
    dropFile.hide();
    map.removeDataOverlay();
    map.drawDataOverlay(mapData);
  }

  fileReader.readAsText(file);

  event.preventDefault();
}
