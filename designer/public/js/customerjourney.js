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

    addMenuItem('CustomerJourneyScenario', 'Customer Journey Scenario', showCustomerJourneyScenario);
    addMenuItem('CustomerJourneyDigitalTwin', 'Digital Twin for Customer Journey', showCustomerJourneyDigitalTwin);
    addMenuItem('WishedStore', 'Wished Store', showWishedStore);
    addMenuItem('SelectedStores', 'Selected Stores', showSelectedStore);
    addMenuItem('TransactionsSimulator', 'Suggested Store Simulator', transactionsSimulator);

    // //connect to the socket.io server via the NGSI proxy module
    // var ngsiproxy = new NGSIProxy();
    // ngsiproxy.setNotifyHandler(handleNotify);

    // client to interact with IoT Broker
    // var ldclient = new NGSILDclient(config.LdbrokerURL);
    var client = new NGSI10Client(config.brokerURL);
    var ldclient = new NGSILDclient(config.LdbrokerURL);

    // subscribeResult();

    if(!config.doNotInitApplications){
        console.log('doNotInitApplications: ' + config.doNotInitApplications);
        // initParkingSite();
    }

    showCustomerJourneyScenario();

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


    function showCustomerJourneyScenario() {
        $('#info').html('Customer journey application scenario');

        var html = '';
        html += '<div><img width="70%" src="/img/customerjourneyscenario.png"></img></div>';

        $('#content').html(html);
    }

    function showCustomerJourneyDigitalTwin() {
        $('#info').html('Digital Twin for customer journey');

        var html = '';
        html += '<div><img width="50%" src="/img/customerjourneydigitaltwin.png"></img></div>';
        html += '<button  id="populate" type="button">Populate System</button>'

        $('#content').html(html);

        $('#populate').click(populateSystem);
    }

    function showWishedStore() {
        // console.log("showWishedStore")
        $('#info').html('Wished store from Customer Data Platform (CDP)');

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

        html += '<div><img width="40%" src="/img/customerjourney_cdpSegmentIdentification.png"></img></div>';

        html += '<h2>CDP Wished Store</h2>';
        
        html += '<br><br>';

        html += '<div style="display: table-row">';

        html += '<div style="display: table-cell;vertical-align: middle;"><button id="CDPWishedStore" style="transition: all 0.5s; cursor: pointer; background: #d0be34;color:#ffffff;padding: 15px 32px;font-size: 16px;border-radius: 100px;" type="button">CDP Segment Identification</button></div>'
        html += '<div style="display: table-cell;"><table id="wishedStoreTypesTable" style="width:100px; display: none;">'
        html += '<tr><td><button id="rowButton" style="border-radius: 4px;" type="button">x</button></td><td>musicshop</td></tr>'
        html += '<tr><td><button id="rowButton" style="border-radius: 4px;" type="button">x</button></td><td>cafe</td></tr>'
        html += '</table></div>'
        
        

        html += '</div>'

        html += '<div id="cdpManual" >▷ Manually configure CDP Segment Identification</div>'

        html += '<div id="shopTypeSelect" style="display: none;" ><label for="shopTypeSelection"></label>' 
        html += '<select name="shoptype" id="shopTypeSelection" >' 
        html += '<option value="empty">- choose shop type -</option>'
        for (const shopType of shopTypes) {
            html += '<option value="'+shopType+'">'+shopType+'</option>'
        }
        html += '</select></div>'
               
        html += '<br><br>';

        html += '<h4>Geolocation of the customer:</h4>';
        html += '<div id="map"  style="width: 600px; height: 500px"></div>';
        
        html += '<br><br>';
        
        html += '<button  id="getWishedStore" type="button">Get Wished Store List</button>'

        html += '<br><br>';
        html += '<h4>List of wished stores:</h4>';
        html += '<div id="wishedStore"></div>';

        
        html += '<br><br><br>';

        $('#content').html(html);

        // associate functions to clickable buttons
        $('#getWishedStore').click(updateWishedStoreList);
        $('#CDPWishedStore').click(cdpWishedStore);
        $('#shopTypeSelection').change(shopTypeSelected);
        $('#cdpManual').click(cdpManualSelection);
   
        $('[id=rowButton]').click(function(e){
            $(this).closest('tr').remove()
        })

        // show up the map
        showMap();

    }

    function shopTypeSelected() {
        var shopType = document.getElementById("shopTypeSelection").value;
        if (shopType != "empty"){
            $('#wishedStoreTypesTable').append('<tr><td><button id="rowButton" style="border-radius: 4px;" type="button">x</button></td><td>'+shopType+'</td></tr>');
            $('[id=rowButton]').click(function(e){
                $(this).closest('tr').remove()
            })
        }

    }
    
    function cdpWishedStore() {
        var x = document.getElementById("wishedStoreTypesTable");
        x.style.display = "block";
    }

    function cdpManualSelection() {
        var x = document.getElementById("shopTypeSelect");
        if (x.style.display == "none") {
            x.style.display = "block";
            $('#cdpManual').html("▼ Manually configure CDP Segment Identification");
        } else {
            x.style.display = "none";
            $('#cdpManual').html("▷ Manually configure CDP Segment Identification");

        }
    }

    function populateSystem() {

        fetch('/data/shops_data.json')
            .then(response => response.json())
            .then( shopsdata =>
                ldclient.updateContext(shopsdata).then(function(data) {
                    console.log(data);
                }).catch(function(error) {
                    console.log('failed to create a parking site entity');
                })
        )
    }



    function showSelectedStore() {
        // console.log("showWishedStore")
        $('#info').html('Suggested store with and without context');

        var html = ''
        
        html += '<div><img width="50%" src="/img/customerjourney_wishedStoreSelection.png"></img></div>';

        html += '<br><br>'

        html += '<h2>Customer Satisfaction Index Comparison</h2>';

        html += '<div><img width="50%" src="/img/customerjourney_customersatisfactionindex.png"></img></div>';

        html += '<br><br>'
        
        html += 'Baseline Time in the Shop (minutes): <input type="text" class="input-large" value="60" id="baselineTime"><br>';
        
        html += '<br><br>'
        
        html += '<h2>Suggested Store without Digital Twin</h2>';

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

        html += '<br><br><br>';

        $('#content').html(html);

        // associate functions to clickable buttons
        $('#suggStoreNoContext').click(createWishedStoreTable_noContext);
        $('#suggStorePeopleCount').click(createWishedStoreTable_peopleCount);
        $('#suggStorePredictedLinReg').click(createWishedStoreTable_predictedLinReg);


        displaySlider();
    }

    
    

    function transactionsSimulator() {

        $('#info').html('Simulate scenario for total transactions');

        var html = '<div id="kpis"></div>';
        html += '<div><img width="70%" src="/img/customerjourney_transactionsSimulation.png"></img></div>';
        html += 'Number of Customers: <input type="text" class="input-large" id="customers"><br>';
        html += 'Time Budget: <input type="text" class="input-large" id="time_budget"><br>';
        html += 'Baseline time per shop: <input type="text" class="input-large" id="baseline_time_per_shop"><br>';
        html += '<th><button id="startSimulation" type="button">Simulate Transactions</button></th>'
        html += '<div id="simulationresult"></div>';
        html += '<div id="transactionsChart"><svg style="height:500px"></svg></div>'
        html += '<div id="shopsChart"><svg style="height:500px"></svg></div>'

        $('#content').html(html);

        // showChart('#chart svg',cumulativeTestData())

        //simulateTransactions(1000,60,15,-1,"building_occupancy")
        
        $('#startSimulation').click(runSimulations);

    }

    function runSimulations(){

        var number_customers_under_study = parseFloat($('#customers').val());
        var time_budget = parseFloat($('#time_budget').val());
        var baseline_time_per_shop = parseFloat($('#baseline_time_per_shop').val());

        
        var simulationsResults_noContext = {"key": "noContext", "values":[]}
        var simulationsResults_peopleCount = {"key": "peopleCount", "values":[]}
        var simulationsResults_predictionLinReg = {"key": "predictionLinReg", "values":[]}

        var simulationsResults_shops_noContext = {"key": "noContext", "values":[]}
        var simulationsResults_shops_peopleCount = {"key": "peopleCount", "values":[]}
        var simulationsResults_shops_predictionLinReg = {"key": "predictionLinReg", "values":[]}

        // Simulate only once for noContext
        // var noContextSimulationResult = simulateTransactions(number_customers_under_study, 
        //         time_budget, 
        //         baseline_time_per_shop, 
        //         -1, 
        //         "building_occupancy")

        var temp = null
        for (let percentage = 5; percentage < 101; percentage++) {

            // Add the already simulated one for noContext
            // simulationsResults_noContext.values.push([percentage,noContextSimulationResult])

            // Simulate for peopleCount

            temp = simulateTransactions(number_customers_under_study, 
                time_budget, 
                baseline_time_per_shop, 
                -1, 
                "building_occupancy")
            simulationsResults_noContext.values.push( 
                [percentage,
                    temp.successful_transactions])
            simulationsResults_shops_noContext.values.push( 
                [percentage,
                    temp.selected_shops])

            var maxOccupancy = percentage * maxCapability / 100

            // Simulate for peopleCount
            
            temp = simulateTransactions(number_customers_under_study, 
                time_budget, 
                baseline_time_per_shop, 
                maxOccupancy, 
                "building_occupancy")
            simulationsResults_peopleCount.values.push( 
                [percentage,
                    temp.successful_transactions])
            simulationsResults_shops_peopleCount.values.push( 
                [percentage,
                    temp.selected_shops])

            // Simulate for predictionLinReg                                                        
            temp = simulateTransactions(number_customers_under_study, 
                time_budget, 
                baseline_time_per_shop, 
                maxOccupancy, 
                "predicted_building_occupancy_linreg")
            simulationsResults_predictionLinReg.values.push(
                [percentage,
                    temp.successful_transactions])
            simulationsResults_shops_predictionLinReg.values.push( 
                [percentage,
                    temp.selected_shops])
        }

        var simulationsResults_transactions = [simulationsResults_noContext, simulationsResults_peopleCount, simulationsResults_predictionLinReg]
        console.log(simulationsResults_transactions)
        showChart('#transactionsChart svg',simulationsResults_transactions, "Occupancy Percentage", "Transactions")

        var simulationsResults_shops = [simulationsResults_shops_noContext, simulationsResults_shops_peopleCount, simulationsResults_shops_predictionLinReg]
        console.log(simulationsResults_shops)
        showChart('#shopsChart svg',simulationsResults_shops,  "Occupancy Percentage", "Selected Shops")

    }

    function simulateTransactions(number_customers_under_study, time_budget, baseline_time_per_shop, maxOccupancy, attributeNameToCheck){

        // attributeNameToCheck = "building_occupancy"

        const crowdValues = []

        for (const element of wishedStoreList) { 
            
            //console.log(element.attributes)
            if (maxOccupancy < 0 || element.attributes[attributeNameToCheck].value < maxOccupancy){
                //console.log("taking "+ element.entityId.id);
                crowdValues.push(element.attributes.building_occupancy.value)
            } else {
                //console.log("not taking" + element.entityId.id)
            }
        }

        console.log("number of selected shops "+ crowdValues.length)

        var successful_transactions = 0

        console.log("number of number_customers_under_study "+ number_customers_under_study)

        for (let i = 0; i < number_customers_under_study; i++) {
            var timer = 0.0
            while (timer < time_budget){
                const random = Math.floor(Math.random() * crowdValues.length);
                // console.log("random "+ random)
                crowd = crowdValues[random];
                // console.log("crowd "+crowd)
                shop_time = getWaitingTime(crowd, baseline_time_per_shop) + baseline_time_per_shop
                // console.log("shop_time "+shop_time+ " "+typeof shop_time)
                timer += shop_time
                // console.log("timer "+timer + " "+typeof timer)
                if (timer < time_budget){
                    successful_transactions += 1
                }
            }
        }


        return {"successful_transactions" : successful_transactions, "selected_shops" : crowdValues.length}

    }

    function showChart(divID, dataset, xLabel, yLabel){
        var chart = nv.models.lineChart()
            .useInteractiveGuideline(true)
            .x(function(d) { return d[0] })
            .y(function(d) { return d[1] })
            .color(d3.scale.category10().range())
            .duration(300)
            .clipVoronoi(false);
            
        chart.dispatch.on('renderEnd', function() {
            console.log('render complete: cumulative line with guide line');
        });
        
        chart.xAxis.tickFormat(function(d) {
            return d+"%"
        });

        chart.xAxis.axisLabel(xLabel)
        // console.log(chart.yAxis.range())
        chart.yAxis.axisLabel(yLabel)

        // chart.yAxis.tickFormat(d3.format(',.1%'));

        d3.select(divID)
            .datum(dataset)
            .call(chart);

        //TODO: Figure out a good way to do this automatically
        nv.utils.windowResize(chart.update);

        // chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });
        // chart.state.dispatch.on('change', function(state){
        //     nv.log('state', JSON.stringify(state));
        // });
    }

    function updateWishedStoreList() {

 

        var queryReq = {}
        queryReq.entities = []
        // queryReq.entities = [{
        //     "type": "kitchensupplystore",
        //     "isPattern": true
        //   },
        //   {
        //     "type": "bookshop",
        //     "isPattern": true
        //   }];

        var storeTableRows = document.getElementById("wishedStoreTypesTable").rows
        for (let i=0; i < storeTableRows.length; i++){
            storeType = storeTableRows[i].cells[1].innerHTML
            console.log(storeType)
            queryReq.entities.push({
                    "type": storeType,
                    "isPattern": true
                  })
        }

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
        data = createWishedStoreTable(wishedStoreList, 
            "building_occupancy", 
            -1,
            [],
            [])
        html = data.table
        $('#suggStoreNoContextTable').html(html);
        console.log(data.averageOccupancy)
        var baselineTime = parseFloat($('#baselineTime').val());
        console.log(getWaitingTime(data.averageOccupancy, baselineTime))
        waitingTime = Math.round((getWaitingTime(data.averageOccupancy, baselineTime) + Number.EPSILON) * 100) / 100
        $('#shopsCountNoContext').html(data.shopsCount);
        $('#avgTimeNoContext').html(waitingTime);
        //Add borders to the cells
        $('td').css("border", "1px solid black"); 
        $('td').css("text-align", "center"); 
        $('th').css("border", "1px solid black"); 
    }

    function createWishedStoreTable_peopleCount(){
        data = createWishedStoreTable(wishedStoreList, 
            "building_occupancy", 
            maxCapability*(occupancyPercentage/100),
            ['building_occupancy'],
            ['Occupancy'])
        html = data.table
        $('#suggStorePeopleCountTable').html(html);
        console.log(data.averageOccupancy)
        var baselineTime = parseFloat($('#baselineTime').val());
        console.log(getWaitingTime(data.averageOccupancy, baselineTime))
        waitingTime = Math.round((getWaitingTime(data.averageOccupancy, baselineTime) + Number.EPSILON) * 100) / 100
        $('#shopsCountPeopleCount').html(data.shopsCount);
        $('#avgTimePeopleCount').html(waitingTime);
        //Add borders to the cells
        $('td').css("border", "1px solid black"); 
        $('td').css("text-align:", "center"); 
        $('th').css("border", "1px solid black"); 
    }

    function createWishedStoreTable_predictedLinReg(){
        data = createWishedStoreTable(wishedStoreList, 
            "predicted_building_occupancy_linreg", 
            maxCapability*(occupancyPercentage/100),
            ['predicted_building_occupancy_linreg', 'CO2','building_occupancy'],
            ['Prediction','CO2', 'Occupancy'])
        html = data.table
        $('#suggStorePredictedLinRegTable').html(html);
        console.log(data.averageOccupancy)
        var baselineTime = parseFloat($('#baselineTime').val());
        console.log(getWaitingTime(data.averageOccupancy, baselineTime))
        waitingTime = Math.round((getWaitingTime(data.averageOccupancy, baselineTime) + Number.EPSILON) * 100) / 100
        $('#shopsCountPredictedLinReg').html(data.shopsCount);
        $('#avgTimePredictedLinReg').html(waitingTime);
        //Add borders to the cells
        $('td').css("border", "1px solid black"); 
        $('td').css("text-align:", "center"); 
        $('th').css("border", "1px solid black"); 
    }

    function getWaitingTime(customers, baselineTime){
        return (customers/(maxCapability)) * baselineTime
    }

    function createWishedStoreTable(wishedStoreList, attributeNameToCheck, maxOccupancy, properties, headers) {

        
        var html = '';
        html += '<table style="border: 1px solid black;">'
        //html += '<thead><tr><th id="shopidsort">Shop Id</th><th id="shoptypesort">Shop Type</th><th id="occupancysort">Occupancy</th></tr></thead>'
        html += '<thead><tr style="border: 1px solid black">'
        // html += '<th><button id="shopidsort" type="button">Shop ID</button></th>'
        // html += '<th><button id="shoptypesort" type="button">Shop Type</button></th>'
        // html += '<th><button id="occupancysort" type="button">Occupancy</button></th>'
        html += '<th>Shop ID</th>'
        html += '<th>Shop Type</th>'
        for (const header of headers){
            html += '<th>'+header+'</th>'
        }
        html += '</thead></tr>'
        html += '<tbody>'

        var count = 0
        var accum = 0
        for (const element of wishedStoreList) {
            // console.log(element.attributes)
            if (maxOccupancy < 0 || element.attributes[attributeNameToCheck].value < maxOccupancy){
                html += '<tr style="border: 1px solid black;"><td>'+element.entityId.id+'</td><td>'+element.entityId.type+'</td>'
                for (const property of properties){
                    html += '<td>'+element.attributes[property].value+'</td>'
                }
                html += '</tr>'
                // html += '<tr style="border: 1px solid black;"><td>'+element.entityId.id+'</td><td>'+element.entityId.type+'</td><td>'+element.attributes.building_occupancy.value+'</td></tr>'                
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

        
        $('td').css("border", "1px solid black"); 
        $('td').css("text-align", "center"); 
        $('th').css("border", "1px solid black"); 
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

});
