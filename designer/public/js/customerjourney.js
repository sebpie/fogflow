$(function() {

    // initialization  
    var handlers = {}

    var wishedStoreList = null;

    var maxCapability = 443

    var occupancyPercentage = 30
 
    var geoscope = {
        scopeType: "local",
        scopeValue: "local"
    };


    var curMap = null;

    addMenuItem('CustomerJourney', 'Customer Journey', showCustomerJourney);
    addMenuItem('WishedStore', 'Wished Store', showWishedStore);
    addMenuItem('SuggestedStore', 'Suggested Store', showWishedStore);
    addMenuItem('KPIs', 'KPIs', showKPIs);

    // //connect to the socket.io server via the NGSI proxy module
    // var ngsiproxy = new NGSIProxy();
    // ngsiproxy.setNotifyHandler(handleNotify);

    // client to interact with IoT Broker
    // var ldclient = new NGSILDclient(config.LdbrokerURL);
    var client = new NGSI10Client(config.brokerURL);
    // subscribeResult();

    if(!config.doNotInitApplications){
        console.log('doNotInitApplications: ' + config.doNotInitApplications);
        // initParkingSite();
    }

    showCustomerJourney();

    $(window).on('hashchange', function() {
        var hash = window.location.hash;
        selectMenuItem(location.hash.substring(1));
    });

    function addMenuItem(id, name, func) {
        handlers[id] = func;
        $('#menu').append('<li id="' + id + '"><a href="' + '#' + id + '">' + name + '</a></li>');
    }

    function selectMenuItem(name) {
        $('#menu li').removeClass('active');
        var element = $('#' + name);
        element.addClass('active');

        var handler = handlers[name];
        handler();
    }


    function showCustomerJourney() {
        $('#info').html('to show the customery journey application overview');

        var html = '';
        html += '<div><img width="50%" src="/img/smart-parking.png"></img></div>';

        $('#content').html(html);
    }

    function showWishedStore() {
        // console.log("showWishedStore")
        $('#info').html('to show the list of wished store');

        var shopTypes = [
            "musicshop",
            "shoesstore",
            "cafe",
            "restaurant",
            "cinema",
            "eventticketsstore",
            "sweetsshop",
            "clothesstore",
            "beuatystore",
            "teeshop",
            "smartphonesstore",
            "computerstore",
            "electronicsstore",
            "jewellery",
            "flowershop",
            "opticianstore",
            "bookshop",
            "kitchensupplystore"
        ]

        var html = ''

        html += '<h2>CDP Wished Store</h2>';
        
        html += '<br><br>';

        html += '<div style="display: table-row">';

        html += '<div style="display: table-cell;"><button style="background: #dfe7ff;color:#4e46e5;padding: 15px 32px;font-size: 16px;border-radius: 12px;" type="button">CDP Wished Store Prediction</button></div>'
        html += '<div style="display: table-cell;"><table style="width:100px">'
        html += '<tr><th>musicshop</th><th><button style="background: #f6091c;border-radius: 4px;" type="button">Remove</button></th></tr>'
        html += '<tr><th>cafe</th><th><button style="background: #f6091c;border-radius: 4px;" type="button">Remove</button></th></tr>'
        html += '</table></div>'
        
        html += '</div>'

        html += '<label for="shoptypeselection">Manually choose a shop type:</label>' 
        html += '<select name="shoptype" id="shoptype">' 
        for (const shopType of shopTypes) {
            html += '<option value="'+shopType+'">'+shopType+'</option>'
        }
        html += '</select>'
               
        html += '<br><br>';

        html += '<div id="map"  style="width: 600px; height: 500px"></div>';
        
        html += '<br><br><br>';

        html += '<h2>Suggested Store without Digital Twin</h2>';
        
        html += '<button  id="getWishedStore" type="button">Show Digital Twin based Wished Store</button>'

        // html += '<div id="wishedStore"></div>';

        html += '<table style="border: 1px solid black;">'
        //html += '<thead><tr><th id="shopidsort">Shop Id</th><th id="shoptypesort">Shop Type</th><th id="occupancysort">Occupancy</th></tr></thead>'
        html += '<thead><tr style="border: 1px solid black">'
        // html += '<th><button id="shopidsort" type="button">Shop ID</button></th>'
        // html += '<th><button id="shoptypesort" type="button">Shop Type</button></th>'
        // html += '<th><button id="occupancysort" type="button">Occupancy</button></th>'
        html += '<th>Approach</th>'
        html += '<th>Suggested Stores</th>'
        html += '<th>Shops Count</th>'
        html += '<th>Average Waiting Time</th>'
        html += '</thead></tr>'
        html += '<tbody>'

        html += '<tr style="border: 3px solid black;">'
        html += '<td><button id="suggStoreNoContext" type="button">Without Context Intelligence</button></td>'
        html += '<td><div id="suggStoreNoContextTable" style="height: 200px; overflow: auto">'
        html += '</div></td>'
        html += '<td><div id="shopsCountNoContext"</div></td>'
        html += '<td><div id="avgTimeNoContext"</div></td></tr>'

        html += '</tbody></table>'


        html += '<br><br><br>';

        html += '<h2>Suggested Store based on Digital Twin</h2>';
                
        html += '<br><br>';
        
        html += '<div id="occupancyPercentageSlider"></div>';

        html += '<br>';

        html += '<table id="digitalwishedstore" style="border: 1px solid black;">'
        //html += '<thead><tr><th id="shopidsort">Shop Id</th><th id="shoptypesort">Shop Type</th><th id="occupancysort">Occupancy</th></tr></thead>'
        html += '<thead><tr style="border: 1px solid black">'
        // html += '<th><button id="shopidsort" type="button">Shop ID</button></th>'
        // html += '<th><button id="shoptypesort" type="button">Shop Type</button></th>'
        // html += '<th><button id="occupancysort" type="button">Occupancy</button></th>'
        html += '<th>Approach</th>'
        html += '<th>Suggested Stores</th>'
        html += '<th>Shops Count</th>'
        html += '<th>Average Waiting Time</th>'
        html += '</thead></tr>'
        html += '<tbody>'

        // html += '<tr style="border: 3px solid black;">'
        // html += '<td><button id="suggStoreNoContext" type="button">Without Context Intelligence</button></td>'
        // html += '<td><div id="suggStoreNoContextTable" style="height: 200px; overflow: auto">'
        // html += '</div></td>'
        // html += '<td><div id="shopsCountNoContext"</div></td>'
        // html += '<td><div id="avgTimeNoContext"</div></td></tr>'
        
        html += '<tr style="border: 3px solid black;">'
        html += '<td><button id="suggStorePeopleCount" type="button">Based on People Counting</button></td>'
        html += '<td><div id="suggStorePeopleCountTable" style="height: 200px; overflow: auto">'
        html += '</div></td>'
        html += '<td><div id="shopsCountPeopleCount"</div></td>'
        html += '<td><div id="avgTimePeopleCount"</div></td></tr>'
        
        html += '<tr style="border: 3px solid black;">'
        html += '<td><button id="suggStorePredictedLinReg" type="button">Based on Predicted Occupancy</button></td>'
        html += '<td><div id="suggStorePredictedLinRegTable" style="height: 200px; overflow: auto">'
        html += '</div></td>'
        html += '<td><div id="shopsCountPredictedLinReg"</div></td>'
        html += '<td><div id="avgTimePredictedLinReg"</div></td></tr>'

        html += '</tbody></table>'

        html += '&nbsp&nbsp&nbsp&nbsp&nbsp';

        $('#content').html(html);

        // associate functions to clickable buttons
        $('#getWishedStore').click(updateWishedStoreList);
        $('#suggStoreNoContext').click(createWishedStoreTable_noContext);
        $('#suggStorePeopleCount').click(createWishedStoreTable_peopleCount);
        $('#suggStorePredictedLinReg').click(createWishedStoreTable_predictedLinReg);

        // show up the map
        showMap();

        displaySlider();


    }

    
    

    function showKPIs() {
        $('#info').html('list of all digital twins and each of them is a virtual entity');

        var html = '<div id="kpis"></div>';
        $('#content').html(html);
        updateKPIs();
    }

    function updateWishedStoreList() {
        var queryReq = {}
        queryReq.entities = [{
            "type": "kitchensupplystore",
            "isPattern": true
          },
          {
            "type": "bookshop",
            "isPattern": true
          }];

        queryReq.restriction = {"scopes": [geoscope]}

        client.queryContext(queryReq).then(function(response) {
            console.log(response);
            wishedStoreList = response
            displayWishedStore(wishedStoreList);
        }).catch(function(error) {
            console.log(error);
            console.log('failed to query context');
        });
    }

    // function updateKPIs() {
    //     var queryReq = {}
    //     //queryReq.entities = [{ id: 'Twin.*', isPattern: true }];
    //     queryReq.type = 'Query';
    //     queryReq.entities = [{ idPattern : 'urn:ngsi-ld:Twin.*' }];
    //     ldclient.queryContext(queryReq).then(function(twinList) {
    //         console.log(twinList);
    //         // displayTwinList(twinList);
    //     }).catch(function(error) {
    //         console.log(error);
    //         console.log('failed to query context');
    //     });
    // }

    function occupancyPercentageSlidingBar(){
        var html = '<div class="slidecontainer">';
        html += '<input type="range" min="1" max="100" value="' + occupancyPercentage + '" class="slider" id="occupancyRange">'
        html += '<p>Limit of occupancy: <span id="occupancylimit"></span>%</p>';
        html += '</div>'

        return html
    }

    function showMap() {
        var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var osm = L.tileLayer(osmUrl, { zoom: 11 });
        var map = new L.Map('map', { zoomControl: true, layers: [osm], center: new L.LatLng(35.6817, 139.7566), zoom: 11 });

        //disable zoom in/out
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();

        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);


        var drawControl = new L.Control.Draw({
            draw: {
                position: 'topleft',
                polyline: false,
                polygon: true,
                rectangle: true,
                circle: {
                    shapeOptions: {
                        color: '#E3225C',
                        weight: 2,
                        clickable: false
                    }
                },
                marker: false
            },
            edit: {
                featureGroup: drawnItems
            }
        });
        map.addControl(drawControl);

        map.on('draw:created', function(e) {
            var type = e.layerType;
            var layer = e.layer;

            if (type === 'rectangle') {
                var geometry = layer.toGeoJSON()['geometry'];
                console.log(geometry);

                geoscope.scopeType = 'polygon';
                geoscope.scopeValue = {
                    vertices: []
                };

                points = geometry.coordinates[0];
                for (i in points) {
                    geoscope.scopeValue.vertices.push({ longitude: points[i][0], latitude: points[i][1] });
                }

                console.log(geoscope);
            }
            if (type === 'circle') {
                var geometry = layer.toGeoJSON()['geometry'];
                console.log(geometry);
                var radius = layer.getRadius();

                geoscope.scopeType = 'circle';
                geoscope.scopeValue = {
                    centerLatitude: geometry.coordinates[1],
                    centerLongitude: geometry.coordinates[0],
                    radius: radius
                }

                console.log(geoscope);
            }
            if (type === 'polygon') {
                var geometry = layer.toGeoJSON()['geometry'];
                console.log(geometry);

                geoscope.scopeType = 'polygon';
                geoscope.scopeValue = {
                    vertices: []
                };

                points = geometry.coordinates[0];
                for (i in points) {
                    geoscope.scopeValue.vertices.push({ longitude: points[i][0], latitude: points[i][1] });
                }

                console.log(geoscope);
            }

            drawnItems.addLayer(layer);
        });

        // remember the created map
        curMap = map;

        // display the current search scope
        displaySearchScope();
    }

    function displaySearchScope() {
        console.log(geoscope);
        if (geoscope != null) {
            switch (geoscope.scopeType) {
                case 'circle':
                    L.circle([geoscope.scopeValue.centerLatitude, geoscope.scopeValue.centerLongitude], geoscope.scopeValue.radius).addTo(curMap);
                    break;
                case 'polygon':
                    var points = [];
                    for (var i = 0; i < geoscope.scopeValue.vertices.length; i++) {
                        points.push(new L.LatLng(geoscope.scopeValue.vertices[i].latitude, geoscope.scopeValue.vertices[i].longitude))
                    }
                    L.polygon(points).addTo(curMap);
                    break;
            }
        }
    }

    function createWishedStoreTable_noContext(){
        data = createWishedStoreTable(wishedStoreList, "building_occupancy", -1)
        html = data.table
        $('#suggStoreNoContextTable').html(html);
        console.log(data.averageOccupancy)
        console.log(getWaitingTime(data.averageOccupancy, 60))
        waitingTime = Math.round((getWaitingTime(data.averageOccupancy, 60) + Number.EPSILON) * 100) / 100
        $('#shopsCountNoContext').html(data.shopsCount);
        $('#avgTimeNoContext').html(waitingTime);
    }

    function createWishedStoreTable_peopleCount(){
        data = createWishedStoreTable(wishedStoreList, "building_occupancy", maxCapability*(occupancyPercentage/100))
        html = data.table
        $('#suggStorePeopleCountTable').html(html);
        console.log(data.averageOccupancy)
        console.log(getWaitingTime(data.averageOccupancy, 60))
        waitingTime = Math.round((getWaitingTime(data.averageOccupancy, 60) + Number.EPSILON) * 100) / 100
        $('#shopsCountPeopleCount').html(data.shopsCount);
        $('#avgTimePeopleCount').html(waitingTime);
    }

    function createWishedStoreTable_predictedLinReg(){
        data = createWishedStoreTable(wishedStoreList, "predicted_building_occupancy_linreg", maxCapability*(occupancyPercentage/100))
        html = data.table
        $('#suggStorePredictedLinRegTable').html(html);
        console.log(data.averageOccupancy)
        console.log(getWaitingTime(data.averageOccupancy, 60))
        waitingTime = Math.round((getWaitingTime(data.averageOccupancy, 60) + Number.EPSILON) * 100) / 100
        $('#shopsCountPredictedLinReg').html(data.shopsCount);
        $('#avgTimePredictedLinReg').html(waitingTime);
    }

    function getWaitingTime(customers, baselineTime){
        return (customers/(maxCapability)) * baselineTime
    }

    function createWishedStoreTable(wishedStoreList, attributeNameToCheck, maxOccupancy) {

        
        var html = '';
        html += '<table style="border: 1px solid black;">'
        //html += '<thead><tr><th id="shopidsort">Shop Id</th><th id="shoptypesort">Shop Type</th><th id="occupancysort">Occupancy</th></tr></thead>'
        html += '<thead><tr style="border: 1px solid black">'
        // html += '<th><button id="shopidsort" type="button">Shop ID</button></th>'
        // html += '<th><button id="shoptypesort" type="button">Shop Type</button></th>'
        // html += '<th><button id="occupancysort" type="button">Occupancy</button></th>'
        html += '<th>Shop ID</th>'
        html += '<th>Shop Type</th>'
        html += '<th>Occupancy</th>'
        html += '</thead></tr>'
        html += '<tbody>'

        var count = 0
        var accum = 0
        for (const element of wishedStoreList) {
            console.log(element.attributes)
            if (maxOccupancy < 0 || element.attributes[attributeNameToCheck].value < maxOccupancy){
                html += '<tr style="border: 1px solid black;"><td>'+element.entityId.id+'</td><td>'+element.entityId.type+'</td><td>'+element.attributes.building_occupancy.value+'</td></tr>'
                console.log("taking "+ element.entityId.id);
                count += 1
                accum += element.attributes.building_occupancy.value
            } else {
                console.log("not taking" + element.entityId.id)
            }
        }

        html += '</tbody></table>'

        return {"table" :html,
                "shopsCount": count,
                "averageOccupancy": accum/count}

    }

    function displayWishedStore(wishedStoreList) {


        var html = '';
        html += '<table id="wishedStoreTable" style="border: 1px solid black;">'
        //html += '<thead><tr><th id="shopidsort">Shop Id</th><th id="shoptypesort">Shop Type</th><th id="occupancysort">Occupancy</th></tr></thead>'
        html += '<thead><tr style="border: 1px solid black">'
        // html += '<th><button id="shopidsort" type="button">Shop ID</button></th>'
        // html += '<th><button id="shoptypesort" type="button">Shop Type</button></th>'
        // html += '<th><button id="occupancysort" type="button">Occupancy</button></th>'
        html += '<th>Shop ID</th>'
        html += '<th>Shop Type</th>'
        html += '<th>Occupancy</th>'
        html += '</thead></tr>'
        html += '<tbody style="height:300px; overflow:auto;">'

        for (const element of wishedStoreList) {
            html += '<tr style="border: 1px solid black;"><td>'+element.entityId.id+'</td><td>'+element.entityId.type+'</td><td>'+element.attributes.building_occupancy.value+'</td></tr>'
            console.log(element.entityId.id);
        }

        html += '</tbody></table>'

        $('#wishedStore').html(html);
    }


    function displaySlider() {


        var html = occupancyPercentageSlidingBar();
        
        $('#occupancyPercentageSlider').html(html);
        
        var slider = document.getElementById("occupancyRange");
        var output = document.getElementById("occupancylimit");
        output.innerHTML = slider.value; // Display the default slider value
      
        // Update the current slider value (each time you drag the slider handle)
        slider.oninput = function() {
            output.innerHTML = this.value;
            occupancyPercentage = this.value;
        } 
    }


    // function removeDigitalTwin(deviceObj) {
    //     var entityid = {
    //         id: deviceObj.entityId.id,
    //         isPattern: false
    //     };

    //     client.deleteContext(entityid).then(function(data) {
    //         console.log('remove the digital twin');

    //         // show the updated digital twin list
    //         showKPIs();
    //     }).catch(function(error) {
    //         console.log('failed to cancel a requirement');
    //     });
    // }


    // function showTasks() {
    //     $('#info').html('list of all triggerred function tasks');

    //     var queryReq = {}
    //     queryReq.entities = [{ type: 'Task', isPattern: true }];

    //     client.queryContext(queryReq).then(function(taskList) {
    //         console.log(taskList);
    //         displayTaskList(taskList);
    //     }).catch(function(error) {
    //         console.log(error);
    //         console.log('failed to query task');
    //     });
    // }


    // function displayTaskList(tasks) {
    //     $('#info').html('list of all function tasks that have been triggerred');

    //     if (tasks.length == 0) {
    //         $('#content').html('');
    //         return;
    //     }

    //     var html = '<table class="table table-striped table-bordered table-condensed">';

    //     html += '<thead><tr>';
    //     html += '<th>ID</th>';
    //     html += '<th>Type</th>';
    //     html += '<th>Service</th>';
    //     html += '<th>Task</th>';
    //     html += '<th>Worker</th>';
    //     html += '<th>port</th>';
    //     html += '<th>status</th>';
    //     html += '</tr></thead>';

    //     for (var i = 0; i < tasks.length; i++) {
    //         var task = tasks[i];
    //         html += '<tr>';
    //         html += '<td>' + task.entityId.id + '</td>';
    //         html += '<td>' + task.entityId.type + '</td>';
    //         html += '<td>' + task.attributes.service.value + '</td>';
    //         html += '<td>' + task.attributes.task.value + '</td>';
    //         html += '<td>' + task.metadata.worker.value + '</td>';

    //         html += '<td>' + task.attributes.port.value + '</td>';

    //         if (task.attributes.status.value == "paused") {
    //             html += '<td><font color="red">' + task.attributes.status.value + '</font></td>';
    //         } else {
    //             html += '<td><font color="green">' + task.attributes.status.value + '</font></td>';
    //         }

    //         html += '</tr>';
    //     }

    //     html += '</table>';

    //     $('#content').html(html);
    // }


    // function showParking() {
    //     $('#info').html('to illustrate the smart parking use case for Murcia');

    //     var html = '';

    //     html += '<div id="map"  style="width: 800px; height: 600px"></div>';

    //     $('#content').html(html);

    //     var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    //     var osm = L.tileLayer(osmUrl, { maxZoom: 15, zoom: 13 });
    //     var map = new L.Map('map', {
    //         layers: [osm],
    //         center: myCenter,
    //         zoom: 13,
    //         zoomControl: true
    //     });

    //     var drawnItems = new L.FeatureGroup();
    //     map.addLayer(drawnItems);

    //     // show edge nodes on the map
    //     displayEdgeNodeOnMap(map);

    //     // show moving car
    //     drawConnectedCar(map);

    //     // display parking sites
    //     displayParkingSites(map);

    //     // remember the created map
    //     curMap = map;
    // }

    // function displayEdgeNodeOnMap(map) {
    //     var queryReq = {}
    //     queryReq.entities = [{ type: 'Worker', isPattern: true }];
    //     queryReq.restriction = { scopes: [{ scopeType: 'stringQuery', scopeValue: 'role=EdgeNode' }] }
    //     client.queryContext(queryReq).then(function(edgeNodeList) {
    //         console.log(edgeNodeList);

    //         var edgeIcon = L.icon({
    //             iconUrl: '/img/gateway.png',
    //             iconSize: [48, 48]
    //         });

    //         for (var i = 0; i < edgeNodeList.length; i++) {
    //             var worker = edgeNodeList[i];

    //             console.log(worker);

    //             latitude = worker.attributes.location.value.latitude;
    //             longitude = worker.attributes.location.value.longitude;
    //             edgeNodeId = worker.entityId.id;

    //             console.log(latitude, longitude, edgeNodeId);

    //             var marker = L.marker(new L.LatLng(latitude, longitude), { icon: edgeIcon });
    //             marker.nodeID = edgeNodeId;
    //             marker.addTo(map).bindPopup(edgeNodeId);
    //             marker.on('click', showRunningTasks);

    //             console.log('=======draw edge on the map=========');
    //         }
    //     }).catch(function(error) {
    //         console.log(error);
    //         console.log('failed to query context');
    //     });
    // }

    // function showRunningTasks() {
    //     var clickMarker = this;

    //     var queryReq = {}
    //     queryReq.entities = [{ type: 'Task', isPattern: true }];
    //     queryReq.restriction = { scopes: [{ scopeType: 'stringQuery', scopeValue: 'worker=' + clickMarker.nodeID }] }

    //     client.queryContext(queryReq).then(function(tasks) {
    //         console.log(tasks);
    //         var content = "";
    //         for (var i = 0; i < tasks.length; i++) {
    //             var task = tasks[i];

    //             if (task.attributes.status.value == "paused") {
    //                 content += '<font color="red">' + task.attributes.id.value + '</font><br>';
    //             } else {
    //                 content += '<font color="green"><b>' + task.attributes.id.value + '</b></font><br>';
    //             }
    //         }

    //         clickMarker._popup.setContent(content);
    //     }).catch(function(error) {
    //         console.log(error);
    //         console.log('failed to query task');
    //     });
    // }

    // function drawConnectedCar(map) {
    //     var taxiIcon = L.icon({
    //         iconUrl: '/img/taxi.png',
    //         iconSize: [80, 80]
    //     });

    //     var path = [
    //         [37.996655, -1.150094],
    //         [37.984174, -1.141039]
    //     ];
    //     carMarker = L.Marker.movingMarker(path, [10000], { autostart: false, loop: true });
    //     carMarker.options.icon = taxiIcon;

    //     map.addLayer(carMarker);

    //     carMarker.on('click', function() {
    //         if (carMarker.isRunning()) {
    //             console.log('timerID = ', timerID);
    //             if (timerID != null) {
    //                 clearInterval(timerID);
    //             }
    //             carMarker.pause();
    //             carMarker.bindPopup('<b>Click me to start !</b>').openPopup();
    //         } else {
    //             carMarker.start();
    //             carMarker.bindPopup('<b>Click me to pause !</b>').openPopup();
    //             timerID = setInterval(function() {
    //                 var mylocation = carMarker.getLatLng();
    //                 updateMobileObject(mylocation);
    //             }, 1000);
    //             console.log('timerID = ', timerID);
    //         }
    //     });

    //     carMarker.bindPopup('<b>Click me to start !</b>', { closeOnClick: false });
    //     carMarker.openPopup();
    // }

    // function displayParkingSites(map) {
    //     var queryReq = {}
	// queryReq.type = 'Query';
    //     queryReq.entities = [{ idPattern: 'urn:ngsi-ld:Twin.ParkingSite.*'}];
    //     ldclient.queryContext(queryReq).then(function(sites) {
    //         console.log(sites);

    //         for (var i = 0; i < sites.length; i++) {
    //             var site = sites[i];
	//     for (var j = 0; j < site.length; j++) {
	// 	 var displaySite = site[j];
    //              console.log(" display sites ",displaySite)
    //             if (displaySite.iconURL != null) {
    //                 var iconImag = displaySite.iconURL.value;
    //                 var icon = L.icon({
    //                     iconUrl: iconImag,
    //                     iconSize: [48, 48]
    //                 });

    //                 latitude = displaySite.location.value.coordinates[0];
    //                 longitude = displaySite.location.value.coordinates[1];
    //                 siteId = displaySite.id;

    //                 var marker = L.marker(new L.LatLng(latitude, longitude), { icon: icon });
    //                 marker.addTo(map).bindPopup(siteId);
    //             }
    //         }
    //    }

    //     }).catch(function(error) {
    //         console.log(error);
    //         console.log('failed to query context');
    //     });
    // }

    // function updateMobileObject(location) {
    //     //register a new device
    //     var movingCarObject = {};

    //     movingCarObject.id = 'urn:ngsi-ld:Twin.ConnectedCar.01';
        
    //     movingCarObject = {};
    //     movingCarObject.iconURL = { type: 'Property', value: '/img/taxi.png' };
    //     movingCarObject.location = {
    //         type: 'GeoProperty',
    //         value: { 
	// 		type: 'Point',
	// 		coordinates: [location.lat, location.lng ]}
    //     };


    //     ldclient.updateContext(movingCarObject).then(function(data) {
    //         console.log(data);
    //     }).catch(function(error) {
    //         console.log('failed to update car object');
    //     });

    // }

});
