var CTPS = {};
CTPS.boatSurveyApp = {};
CTPS.boatSurveyApp.myData = [];
CTPS.boatSurveyApp.store = [];
CTPS.boatSurveyApp.grid = [];
CTPS.boatSurveyApp.tabs ={};
var CSSClass = {};
var display_dock = '';

CTPS.boatSurveyApp.szServerRoot = 'http://www.ctps.org:8080/geoserver/'; 
CTPS.boatSurveyApp.szWMSserverRoot = CTPS.boatSurveyApp.szServerRoot + '/wms'; 
CTPS.boatSurveyApp.szWFSserverRoot = CTPS.boatSurveyApp.szServerRoot + '/wfs';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                         1.  MISCELLANEOUS UTILITY FUNCTIONS

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function make_pct(val){		
        if(val > 0){
			var val1 = val * 100;
			var val2 = val1.toFixed(1);
			return val2 + "%";
		}
}

function unhide(divID) {
	//function toggles hiding and unhiding the Div with ID = 'report'
	var item = document.getElementById(divID);
	if (item) {
		item.className=(item.className==='hidden')?'unhidden':'hidden';
	}
}

function zero_out_grids() {
	// zeroing out old data
	$('#origin_grid').html('');
	$('#dest_grid').html('');
	$('#usage_grid').html('');
	$('#income_grid').html('');
	$('#vehicles_grid').html('');
    $('#race_grid').html('');
	$('#fare_grid').html('');
}

function reset_stores() {
    // Data "stores" - really just arrays of objects (key/value pairs).
	CTPS.boatSurveyApp.OriginStore = [];
	CTPS.boatSurveyApp.DestStore = []; 
	CTPS.boatSurveyApp.UsageStore = [];
	CTPS.boatSurveyApp.IncomeStore = []; 
	CTPS.boatSurveyApp.VehiclesStore = [];
    CTPS.boatSurveyApp.RaceStore = []; 
	CTPS.boatSurveyApp.FareStore = []; 
}

//Note:  the 3 functions below allow selection and manipulation of class tags that have more than 1 class element defined.
//In this app, they are used only to turn on and off visibility of the 'mytabs' element containing the tabs.
//The simpler function 'unhide' above is used to flip on and off all other elements.
CSSClass.is = function(){
	var e = document.getElementById('mytabs');		
	var classes = e.className;
	if(classes==="hidden"){
		alert('from "is" fcn classes=hidden');
	} else {
		alert('from "is" fcn  classes not equal hidden--classes:' + classes);
	}
}

CSSClass.add = function(){
	var e = document.getElementById('mytabs');
	e.className += ' hidden';
}

CSSClass.remove = function(){
	var e = document.getElementById('mytabs');
	e.className = e.className.replace(/hidden/gi,"");
} 

//function resets the 'dock' box and the grid, but keeps the combo box populated
//(if .innerHTML was used for station_name, it would zero out the combo box altogether)
CTPS.boatSurveyApp.clear_selection = function() {

    zero_out_grids();
    reset_stores();
    
    var oElt;
    oElt = document.getElementById("dock");
    oElt.selectedIndex = 0; 
	
    CSSClass.add();

	CTPS.boatSurveyApp.oHighlightLayer.destroyFeatures();
	CTPS.boatSurveyApp.oTownVectorLayer1.destroyFeatures();
	CTPS.boatSurveyApp.oTownVectorLayer2.destroyFeatures();
	CTPS.boatSurveyApp.oTownVectorLayer3.destroyFeatures();
	CTPS.boatSurveyApp.map.panTo(new OpenLayers.LonLat(246000,895250));
	CTPS.boatSurveyApp.map.zoomTo(3);

	unhide('legend');
	
    if (document.getElementById('fetchData').className==='unhidden'){
		unhide('fetchData');
    }
    
	if (document.getElementById('resetData').className==='unhidden'){
		unhide('resetData');	
	}

}; // CTPS.boatSurveyApp.clear_selection()

function popup(mylink, windowname) {
// function responds to link click, pops up window with info about survey
	if (! window.focus){return true;}
	var href;
	if (typeof(mylink) === 'string'){
	   href=mylink;
	} else {
	   href=mylink.href;
		window.open(href, windowname, 'width=450,height=500,left=550,top=30,status=no,scrollbars=yes');
		return false;
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                         2.  	SET UP OPENLAYERS MAP WITH VECTOR LAYERS 
//								AND POPULATE COMBO BOX WITH LIST OF STATIONS

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

CTPS.boatSurveyApp.init = function() {
//	Called when .html file loaded--creates map with vector layers and populates combo box
//  with list of commuter rail stations to be queried.

	   // First, get WFS-based pull-down list of stations in Commuter Boat system
	var szUrl = CTPS.boatSurveyApp.szWFSserverRoot + '?';               //  '/geoserver/wfs?';
	var szParams = szUrl;
	szParams += '&service=wfs';
	szParams += '&version=1.0.0';
	szParams += '&request=getfeature';
	szParams += '&typename=postgis:ctps_mbta_2009boat_docks'; 
	szParams += '&propertyname=term_name';

	//             alert(' szParams = '  + szParams);
	var aTemp = [];
	var oTemp = {};
	var oOption = {};
	var i = 0;

	OpenLayers.Request.issue({
			'method': 'GET',
			'url': szParams,
			'success': function(oRequest) {
				var g = new OpenLayers.Format.GML();
				var aFeatures = g.read(oRequest.responseText);
				for (i = 0; i < aFeatures.length; i++) {
					oFeature = aFeatures[i];
					oTemp = {};                                                            
					oTemp.term_name = oFeature.attributes['term_name'];	
					oTemp.match_name = oFeature.attributes['match_name'];
					aTemp.push(oTemp);
				}												

				// Populate the pull down list
				for (i = 0; i < aTemp.length; i++) {
					oOption = document.createElement("OPTION");														
					oOption.text = aTemp[i].term_name; 
					oOption.value = aTemp[i].term_name;
	//				alert('oOptionvalue[' + i + '] = ' + oOption.value);
					document.drop_list.dock.options.add(oOption);  
				}				
			},
			'failure': function(oRequest)
			{
				alert("failure populating list of boat terminals");
			}
	});										//		END of OpenLayers request to get station names for combo box
				
				
	//	Next, create map with vector layers
	CTPS.boatSurveyApp.map = new OpenLayers.Map('map',
		{
			controls: [
				new OpenLayers.Control.Navigation(),
				new OpenLayers.Control.PanZoomBar()
			],
			projection: 'EPSG:26986',
			maxResolution: 1000,
			numZoomLevels: 8,
			maxExtent: new OpenLayers.Bounds(131000,820000,360000,990000),		
			units: 'm'
		});
			
	var oBaseLayer = new OpenLayers.Layer.WMS(
		"Massachusetts Towns",
		CTPS.boatSurveyApp.szWMSserverRoot,                              //      "/geoserver/wms",
		{
			layers: 'postgis:ctps_mbta_2009cr_towns_w_hoods',
			styles: 'towns_w_hoods_blank',
			singleTile: true
		}
	);
				
	var oRoutes = new OpenLayers.Layer.WMS(
		"Boat Routes",
		CTPS.boatSurveyApp.szWMSserverRoot,                          //         "/geoserver/wms",
		{		
			layers: 'postgis:ctps_mbta_2009boat_routes', 		
			transparent: 'true',
			singleTile: true
		}
	);
				
	var oDocks = new OpenLayers.Layer.WMS(
		"Boat Docks",
		CTPS.boatSurveyApp.szWMSserverRoot,                          //             "/geoserver/wms",
		{		
			layers: 'postgis:ctps_mbta_2009boat_docks', 
			styles: 'point_deep_pink',
			transparent: 'true',
			singleTile: true
		}
	);
			
	var myStyle = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
		{fillColor: "green", fillOpacity: 1, graphicName: "star", pointRadius: 10, strokeColor: "black",label: "${term_name}", 
			fontColor:"black", fontFamily:"Arial", fontSize: 10, fontWeight: "bold", labelXOffset: 10, labelYOffset: -15},
		OpenLayers.Feature.Vector.style["default"]));
		
	var myStyle2 = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
		{fillColor: '#bdd3ef', fillOpacity: 0.5, strokeColor: "green", strokeWidth: 0.2, strokeOpacity: 0.3},
		OpenLayers.Feature.Vector.style["default"]));
		
	var myStyle3 = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
		{fillColor: '#f8c473', fillOpacity: 0.5, strokeColor: "green", strokeWidth: 0.2, strokeOpacity: 0.3},
		OpenLayers.Feature.Vector.style["default"]));                    //alternative color:   '#a9d6a8'
		
	var myStyle4 = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
		{fillColor: '#c790b9', fillOpacity: 0.5, strokeColor: "green", strokeWidth: 0.2, strokeOpacity: 0.3},
		OpenLayers.Feature.Vector.style["default"]));                        // alternative color:  '#166761'

	CTPS.boatSurveyApp.oHighlightLayer = new OpenLayers.Layer.Vector(
		"Selected Boat Dock", { styleMap: myStyle }	);
	
	CTPS.boatSurveyApp.oTownVectorLayer1 = new OpenLayers.Layer.Vector(
		"Origins- <50 Riders", { styleMap: myStyle2 });
		
	CTPS.boatSurveyApp.oTownVectorLayer2 = new OpenLayers.Layer.Vector(
		"Origins-50 to 100 Riders", { styleMap: myStyle3 } );
		
	CTPS.boatSurveyApp.oTownVectorLayer3 = new OpenLayers.Layer.Vector(
		"Origins- >100 Riders", { styleMap: myStyle4 } );

	// Scale bar add-in
	var scalebar = new OpenLayers.Control.ScaleBar();
	scalebar.displaySystem = 'english';
	scalebar.divisions = 2;
	scalebar.subdivisions = 2;
	scalebar.showMinorMeasures = false;
	scalebar.singleLine = false;
	scalebar.abbreviateLabel = false;

	CTPS.boatSurveyApp.map.addLayers([oBaseLayer,oRoutes,oDocks,
									  CTPS.boatSurveyApp.oTownVectorLayer1,CTPS.boatSurveyApp.oTownVectorLayer2,
									  CTPS.boatSurveyApp.oTownVectorLayer3,CTPS.boatSurveyApp.oHighlightLayer]);
	CTPS.boatSurveyApp.map.addControl(new OpenLayers.Control.LayerSwitcher());
	CTPS.boatSurveyApp.map.addControl(scalebar);
	
	CTPS.boatSurveyApp.map.setCenter(new OpenLayers.LonLat(246000,895250));
	CTPS.boatSurveyApp.map.zoomTo(4);
	
	// Bind event handlers.
	$('#dock').change(CTPS.boatSurveyApp.searchForDock);
	$('#fetchData').click(CTPS.boatSurveyApp.fetchData);
	$('#resetData').click(CTPS.boatSurveyApp.clear_selection);
			
};	//	END of CTPS.boatSurveyApp.init() function



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                                   3.  SELECT STATION FOR WHICH DATA QUERIED

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	
	

CTPS.boatSurveyApp.searchForDock = function() {
// function responds to change in combo box to select station, put in Vector Layer,
// zoom map into selected station, and highlight on screen

// initialize variables/data store
	   
    zero_out_grids();
    reset_stores();
    
	CTPS.boatSurveyApp.oHighlightLayer.destroyFeatures();
	CTPS.boatSurveyApp.oTownVectorLayer1.destroyFeatures();
	CTPS.boatSurveyApp.oTownVectorLayer2.destroyFeatures();
	CTPS.boatSurveyApp.oTownVectorLayer3.destroyFeatures();
	CTPS.boatSurveyApp.myData.length = 0;

    CSSClass.add();

// get station name from combo box	
	var myselect=document.getElementById("dock");
   
	
	for (var i=0; i<myselect.options.length; i++){
		if (myselect.options[i].selected==true){
			var szSearchForMe = myselect.options[i].value; 
		break;
		}
	}
	
	if (szSearchForMe === '') { 
		alert("NO STATION SELECTED--TRY AGAIN");
		return;
	}
    
    display_dock = szSearchForMe;
	
//  create WFS query to display station on screen and zoom to it	
	var cqlFilter = "(term_name=='" + szSearchForMe + "')";	
	
	OpenLayers.Request.issue({
			'method': 'GET',
			'url': CTPS.boatSurveyApp.szWFSserverRoot,                   //               '/geoserver/wfs',
			'params': {
				service: 'WFS',
				version: '1.0.0',	
				typename: 'postgis:ctps_mbta_2009boat_docks', 
				request: 'getfeature',
				cql_filter: cqlFilter
			},
			'headers': {'content-type' : 'application/xml'},
			'success': function(oRequest) {
				var g = new OpenLayers.Format.GML();
				var aFeatures = g.read(oRequest.responseText);
				
				if (aFeatures.length === 0) {
					alert('no DOCK with that name found');
					CTPS.boatSurveyApp.clear_selection();
					return;
				}
				
				var szResponse = '';
				for (var i = 0; i < aFeatures.length; i++) {				
					oFeature = aFeatures[i];
					szResponse += 'DOCK: ' + oFeature.attributes['match_name'];
					CTPS.boatSurveyApp.oHighlightLayer.destroyFeatures();
					CTPS.boatSurveyApp.oHighlightLayer.addFeatures(oFeature);			
				}
                
                document.getElementById('fetchData').disabled = false;
                if (document.getElementById('fetchData').className==='hidden'){
					unhide('fetchData');
                }
                
                if (document.getElementById('resetData').className==='unhidden'){
					unhide('resetData');
                }
				
			},
			'failure': function(oRequest) {
				alert("failure");
			}
		});											//	END OpenLayers Request
};	//	END CTPS.boatSurveyApp.searchForDock() function

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                          4.   CONSTRUCT AND RUN QUERY, THEN PARSE RESPONSE INTO DATA STORES

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

CTPS.boatSurveyApp.fetchData = function() {	

	// takes selected dock from primary attribute layer when
	// "Get Data" button is clicked, and constructs a single query 
	// for all data items desired, to be run on a single table containing all data, 
	// and then runs the single query. It then parses out the query response, 
	// segment by segment, into a single data store which is re-initialized 
	// after each pass for the different data items. It calls the data grid 
	// function after each pass to read that pass's data store into a 
	// display panel which will be contained in one tab ("grid-exampleX"). 
	
	if (CTPS.boatSurveyApp.oHighlightLayer.features.length === 0) { 
		alert("No features selected for data request ");
		return;
	}else{	
		var place = CTPS.boatSurveyApp.oHighlightLayer.features[0].attributes['match_name'];
	}
	
	CTPS.boatSurveyApp.myData.length = 0;
	
	var board_stn = ''
	
	// set up and run master query to get all data for selected station from 
	// the single table containing all Boat survey data
	
	// Column names in PostgreSQL are in lower case, so need to down-case
	// place to get correct column name.
	// BK 09/19/2017

	board_stn = 'board_' + place.toLowerCase();
	var typename = 'postgis:ctps_mbta_2009boat_2015'; 
	var propertyname = 'id,attributevalue,' + board_stn;	
	
	
	var szUrl2 = CTPS.boatSurveyApp.szWFSserverRoot + '?';                          //     '/geoserver/wms?';
	var oParams2 = {
		'service': 'wfs',
		'version': '1.0.0',
		'request': 'getfeature',	
		'typename': typename,
		'outputformat':  'GML2',
		'propertyname': propertyname
	};

	var szParams2 = '';
	szParams2 += 'srs=' + oParams2['srs'];
	szParams2 += '&service=' + oParams2['service'];
	szParams2 += '&version=' + oParams2['version'];
	szParams2 += '&request=' + oParams2['request'];
	szParams2 += '&query_layers=' + oParams2['typename'];
	szParams2 += '&info_format=' + oParams2['outputformat'];
	szParams2 += '&propertyname=' + oParams2['propertyname'];
		
	
		OpenLayers.Request.issue({
	//		'method': 'POST',
			'url': szUrl2,
			'params': oParams2,
			'data': szParams2,
			'headers': {'content-type' : 'application/xml'},
			'success': function(oRequest2) {
					var aTemp1 = [];
					var aTemp2 = [];
					var aTemp3 = [];
					var aTemp4 = [];
					var aTemp5 = [];
                    var aTemp6 = [];
					var aTemp7 = [];
					var h = new OpenLayers.Format.GML();
					var aFeatures = h.read(oRequest2.responseText);	
					if (aFeatures.length === 0) {
							alert("No survey data reported for DOCK " + place + " ; try another BOAT DOCK.");
							CTPS.boatSurveyApp.clear_selection();
							return;
						}
					var szResponse2 = '';
	
					
	
	//Parse response data into data store in chunks based on survey question, to be read
	//into 4 separate panels in Tab panel:
	
				//  Panel 1:  Origin towns for selected boarders
					//first, get sum of all boarders to use in calculating percents
						var sum1 = 0;
						var num_boarders = [];
						var boarders_pct = [];
						var boarders_read = 0
						var j;
						var changed1 = [];
						for (j = 1; j < 136; j++) {									  //   NOTE:  first record skipped, because just origin number
							changed1[j] = parseInt(aFeatures[j].attributes['id']);				
							if (changed1[j] <= 42) {
								boarders_read = parseFloat(aFeatures[j].attributes[board_stn]);
								if(boarders_read>0) {
									num_boarders[j] = boarders_read;                      
									sum1 += num_boarders[j];
								}                          //  END of loop through origins with boarders
							}							//  END OF looking for values of "changed1"	
						}							   //  END of loop through all possible origin towns				
					
				
					//then, do second loop to get individual values, calculate percents, and read into data store
						for (var i = 1; i < 136; i++) {								//loop through all records for selected board_stn
							oFeature = aFeatures[i];
							if(changed1[i] <= 42) {
								if (oFeature.attributes[board_stn]>0) {					// only include origin towns that contribute riders to this station
									szResponse2 += 'OriginTown ' + oFeature.attributes['attribuevalue'];			
									szResponse2 += '\nNUMBER: ' + oFeature.attributes[board_stn] + '\n\n';
		
									if (sum1 !== 0){	
										boarders_pct[i] = num_boarders[i] / sum1;
									} else {
										alert('sum1 = 0');
									}
		
									if (oFeature.attributes['attributevalue']!=='DockOrder') {
											aTemp1 = [aFeatures[i].attributes['attributevalue']];
                                            board_stn_integer = parseInt(aFeatures[i].attributes[board_stn]);                                            
											aTemp1.push(board_stn_integer);
                                            aTemp1.push(make_pct(boarders_pct[i]));			
											CTPS.boatSurveyApp.myData.push(aTemp1);									
									}
									
								}								  // END loop thru towns contributing riders	
							}									//  END loop thru records for board stations
						};									  // END loop thru all records for selected board_stn
			
			
					// Sort the results of the WFS request in REVERSE ORDER by number of boarders;                                                 
                        CTPS.boatSurveyApp.myData.sort(function(a,b){				
							var stna = parseInt(a[1]), stnb = parseInt(b[1]);
							if (stna < stnb)
								return 1
							if (stna > stnb)
								return -1
							return 0                  //default value if no sorting
						});
                                              
						
						CTPS.boatSurveyApp.secondVector()			// call function which displays boarder origin towns in 3
																// additional vector layers
                                                                
                   //  Create new database store (BoardStore)  as JSON-type structure:                                
                        var my_record = [];
                        var dblength = CTPS.boatSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'origin_town':  CTPS.boatSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.boatSurveyApp.myData[j][1],
                                                    'percent':          CTPS.boatSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.boatSurveyApp.myData[j][3]
                                }; 
                                CTPS.boatSurveyApp.OriginStore.push(my_record[j]);                                                                
                         } 
                        
                        
																
						CTPS.boatSurveyApp.SetupDataGrid(1);		// Setup the data grid and render it.
			
			
	
				//  Panel 2:  Destination towns for people boarding at selected docks
					//first, get sum of all boarders to use in calculating percents
						CTPS.boatSurveyApp.myData.length = 0;						
						var sum2 = 0;
						var num_dest = [];
						var dest_pct = [];	
						var dest_read = 0					
						
						for (j = 1; j < 136; j++) {						
							if ((changed1[j] > 42)&&(changed1[j]<=77)) {
								dest_read = parseFloat(aFeatures[j].attributes[board_stn]);
								if(dest_read>0) {
									num_dest[j] = dest_read;                      
									sum2 += num_dest[j];
								}                          //  END of loop through origins with boarders
							}
						}							   //  END of loop through all possible destination towns

								
						
					//then, do second loop to get individual values, calculate percents, and read into data store							
					
						for (var i = 1; i < 136; i++) {
							oFeature = aFeatures[i];
							  if ((changed1[i] > 42)&&(changed1[i]<=77)) {
								if (oFeature.attributes[board_stn]>0) {					// only include origin towns that contribute riders to this station
									szResponse2 += 'DestinationTown' + oFeature.attributes['attributevalue'];
									szResponse2 += '\nNUMBER ' + oFeature.attributes[board_stn] + '\n\n';	

											
									if (sum2 !== 0){	
										dest_pct[i] = num_dest[i] / sum2;								
									} else {
										alert('sum2 = 0');
									}
										
									aTemp2 = [aFeatures[i].attributes['attributevalue']];
                                    board_stn_integer = parseInt(aFeatures[i].attributes[board_stn]);
									aTemp2.push(board_stn_integer); 
                                    aTemp2.push(make_pct(dest_pct[i]));			
									CTPS.boatSurveyApp.myData.push(aTemp2);
								}
							}
						};	

						// Sort the results of the WFS request in REVERSE ORDER by number of boarders;                                                 
                        CTPS.boatSurveyApp.myData.sort(function(a,b){				
							var stna = parseInt(a[1]), stnb = parseInt(b[1]);
							if (stna < stnb)
								return 1
							if (stna > stnb)
								return -1
							return 0                  //default value if no sorting
						});
                        
                        
                         //  Create new database store (BoardStore)  as JSON-type structure:                                
                        var my_record = [];
                        var dblength = CTPS.boatSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'destination_town':  CTPS.boatSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.boatSurveyApp.myData[j][1],
                                                    'percent':          CTPS.boatSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.boatSurveyApp.myData[j][3]
                                }; 
                                CTPS.boatSurveyApp.DestStore.push(my_record[j]);                                                                
                         } 
                        

		
						CTPS.boatSurveyApp.SetupDataGrid(2);		// Setup the data grid and render it.
					
					
				//  Panel 3:  Frequency of boat use for people boarding at selected station
						CTPS.boatSurveyApp.myData.length = 0;
						
						var sum3 = 0;
						var num_usage = [];
						var usage_pct = [];	
						var usage_read = 0					
						
						for (j = 1; j < 136; j++) {			//  NOTE:  OK to start at 79--that's "< 1 day" 			
							if ((changed1[j] > 78)&&(changed1[j]<=87)) {
								usage_read = parseFloat(aFeatures[j].attributes[board_stn]);			
								num_usage[j] = usage_read; 			
								sum3 += num_usage[j];
							}
						}							        //  END of loop through all possible usage values ('no answer' excluded at 78)						

						for (var i = 1; i < 136; i++) {
							oFeature = aFeatures[i];
							if ((changed1[i] > 78)&&(changed1[i]<=87)){
									szResponse2 += 'USE PER WEEK ' + oFeature.attributes['attributevalue'];
									szResponse2 += '\nNUMBER OF DAYS: ' + oFeature.attributes[board_stn] + '\n\n';					
									
									// Calculate percentages for each value
									if (sum3 !== 0){	
											usage_pct[i] = num_usage[i] / sum3;							
										} else {
											alert('sum3 = 0');
										}
										
									aTemp3 = [aFeatures[i].attributes['attributevalue']];
                                    board_stn_integer = parseInt(aFeatures[i].attributes[board_stn]);
									aTemp3.push(board_stn_integer);
                                    
                                    if(usage_pct[i] == 0){                                
                                        formatted_pct = usage_pct[i];
                                    } else {
                                        formatted_pct = make_pct(usage_pct[i]);    //  format non-zero numbers with % sign                                 
                                    }
                                    aTemp3.push(formatted_pct);
                                    
                                  		
									CTPS.boatSurveyApp.myData.push(aTemp3);
							}
						};


                         //  Create new database store (BoardStore)  as JSON-type structure:                                
                        var my_record = [];
                        var dblength = CTPS.boatSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'number_days_used':  CTPS.boatSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.boatSurveyApp.myData[j][1],
                                                    'percent':          CTPS.boatSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.boatSurveyApp.myData[j][3]
                                }; 
                                CTPS.boatSurveyApp.UsageStore.push(my_record[j]);                                                                
                         } 
                        
						
						CTPS.boatSurveyApp.SetupDataGrid(3);		// Setup the data grid and render it.
						
			

				//  Panel 4:  Household income for people boarding at selected station
						CTPS.boatSurveyApp.myData.length = 0;	

                        var sum4 = 0;
						var num_inc = [];
						var inc_pct = [];                        
						for (j = 1; j < 136; j++) {		
							if (changed1[j] > 93 && changed1[j] <= 101){
									num_inc[j] = parseFloat(aFeatures[j].attributes[board_stn]);
									sum4 += num_inc[j];
							}
						}
					
						for (var i = 1; i < 136; i++) {
							oFeature = aFeatures[i];				
							if ((changed1[i] > 93)&&(changed1[i]<=101)){
								szResponse2 += 'INCOME GROUP ' + oFeature.attributes['attributevalue'];
								szResponse2 += '\nNUMBER OF HH: ' + oFeature.attributes[board_stn] + '\n\n';
                                
                                 if (sum4 !== 0){	
									inc_pct[i] = num_inc[i] / sum4;
								} else {
									alert('sum4 = 0');
								}
                                                         
								
								aTemp4 = [aFeatures[i].attributes['attributevalue']];
                                board_stn_integer = parseInt(aFeatures[i].attributes[board_stn]);
								aTemp4.push(board_stn_integer);	
								                               
                                if(inc_pct[i] == 0){                                
                                        formatted_pct = inc_pct[i];
                                    } else {
                                        formatted_pct = make_pct(inc_pct[i]);    //  format non-zero numbers with % sign                                 
                                    }
                                aTemp4.push(formatted_pct);
                                
                                CTPS.boatSurveyApp.myData.push(aTemp4);
                                
							}
						};	

                         //  Create new database store (BoardStore)  as JSON-type structure:                                
                        var my_record = [];
                        var dblength = CTPS.boatSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'income_category':  CTPS.boatSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.boatSurveyApp.myData[j][1],
                                                    'percent':          CTPS.boatSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.boatSurveyApp.myData[j][3]
                                }; 
                                CTPS.boatSurveyApp.IncomeStore.push(my_record[j]);                                                                
                         }                        
                        
											
						CTPS.boatSurveyApp.SetupDataGrid(4);		// Setup the data grid and render it.

                        
                  //  Panel 5:  Household vehicles for people boarding at selected station
						CTPS.boatSurveyApp.myData.length = 0;
                        
                         var sum5 = 0;
						 var num_veh = [];
						 var veh_pct = [];                        
						 for (j = 1; j < 136; j++) {		
							if (changed1[j] > 88 && changed1[j] <=92){
									num_veh[j] = parseFloat(aFeatures[j].attributes[board_stn]);
									sum5 += num_veh[j];
							}
						}
						
						for (var i = 1; i < 136; i++) {							
							oFeature = aFeatures[i];			
							if ((changed1[i] > 88)&&(changed1[i]<=92)){
								szResponse2 += 'VEHICLE GROUP ' + oFeature.attributes['attributevalue'];
								szResponse2 += '\nVEH PER HH: ' + oFeature.attributes[board_stn] + '\n\n';	

                                if (sum5 !== 0){	
									veh_pct[i] = num_veh[i] / sum5;
								} else {
									alert('sum5 = 0');
								}
									
								aTemp5 = [oFeature.attributes['attributevalue']];
                                board_stn_integer = parseInt(aFeatures[i].attributes[board_stn]);
								aTemp5.push(board_stn_integer);	

                                 if(veh_pct[i] == 0){                                
                                        formatted_pct = veh_pct[i];
                                    } else {
                                        formatted_pct = make_pct(veh_pct[i]);    //  format non-zero numbers with % sign                                         
                                    }
                                aTemp5.push(formatted_pct);
                                
								CTPS.boatSurveyApp.myData.push(aTemp5);
							}
						};

                     //  Create new database store (BoardStore)  as JSON-type structure:                                
                        var my_record = [];
                        var dblength = CTPS.boatSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'veh_per_hh':       CTPS.boatSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.boatSurveyApp.myData[j][1],
                                                    'percent':          CTPS.boatSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.boatSurveyApp.myData[j][3]
                                }; 
                                CTPS.boatSurveyApp.VehiclesStore.push(my_record[j]);                                                                
                         }                        
                        
						
						CTPS.boatSurveyApp.SetupDataGrid(5);		// Setup the data grid and render it.
						 

              //  Panel 6:  Race reported by people boarding at selected station
						CTPS.boatSurveyApp.myData.length = 0;
                        
                         var sum6 = 0;
						 var num_race = [];
						 var race_pct = [];                        
						 for (j = 1; j < 136; j++) {		
							if (changed1[j] > 127 && changed1[j] <=133){
									num_race[j] = parseFloat(aFeatures[j].attributes[board_stn]);
									sum6 += num_race[j];
							}
						}
						
						for (var i = 1; i < 136; i++) {							
							oFeature = aFeatures[i];			
							if ((changed1[i] > 127)&&(changed1[i]<=133)){		
                                if (sum6 !== 0){	
									race_pct[i] = num_race[i] / sum6;
								} else {
									alert('sum6 = 0');
								}
									
								aTemp6 = [oFeature.attributes['attributevalue']];
                                board_stn_integer = parseInt(aFeatures[i].attributes[board_stn]);
								aTemp6.push(board_stn_integer);	

                                 if(race_pct[i] == 0){                                
                                        formatted_pct = race_pct[i];
                                    } else {
                                        formatted_pct = make_pct(race_pct[i]);    //  format non-zero numbers with % sign                                         
                                    }
                                aTemp6.push(formatted_pct);
                                
								CTPS.boatSurveyApp.myData.push(aTemp6);
							}
						};

                     //  Create new database store (BoardStore)  as JSON-type structure:                                
                        var my_record = [];
                        var dblength = CTPS.boatSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'race_category':    CTPS.boatSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.boatSurveyApp.myData[j][1],
                                                    'percent':          CTPS.boatSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.boatSurveyApp.myData[j][3]
                                }; 
                                CTPS.boatSurveyApp.RaceStore.push(my_record[j]);                                                                
                         }                        
                        
						
						CTPS.boatSurveyApp.SetupDataGrid(6);		// Setup the data grid and render it.

                        
                        
                        
              //  Panel 7:  Fare type reported by people boarding at selected station
						CTPS.boatSurveyApp.myData.length = 0;
                        
                         var sum7 = 0;
						 var num_fare = [];
						 var fare_pct = [];                        
						 for (j = 1; j < 136; j++) {		
							if (changed1[j] > 102 && changed1[j] <=114){
									num_fare[j] = parseFloat(aFeatures[j].attributes[board_stn]);
                                    if(isNaN(num_fare[j])){
                                        num_fare[j] = 0;
                                    }                           
									sum7 += num_fare[j];
							}
						}
						
						for (var i = 1; i < 136; i++) {							
							oFeature = aFeatures[i];			
							if ((changed1[i] > 102)&&(changed1[i]<=114)){		
                                if (sum7 !== 0){	
									fare_pct[i] = num_fare[i] / sum7;
                                    if(num_fare[i]===0){fare_pct[i] = 0};
								} else {
									alert('sum7 = 0');
								}
									
								aTemp7 = [oFeature.attributes['attributevalue']];                                
                                board_stn_integer = parseInt(aFeatures[i].attributes[board_stn]);
                                if(isNaN(board_stn_integer)){board_stn_integer = 0};
								aTemp7.push(board_stn_integer);	

                                 if(fare_pct[i] == 0){                                
                                        formatted_pct = fare_pct[i];
                                    } else {
                                        formatted_pct = make_pct(fare_pct[i]);    //  format non-zero numbers with % sign                                         
                                    }
                                aTemp7.push(formatted_pct);
                                
								CTPS.boatSurveyApp.myData.push(aTemp7);
							}
						};

                     //  Create new database store (BoardStore)  as JSON-type structure:                                
                        var my_record = [];
                        var dblength = CTPS.boatSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'fare_category':    CTPS.boatSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.boatSurveyApp.myData[j][1],
                                                    'percent':          CTPS.boatSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.boatSurveyApp.myData[j][3]
                                }; 
                                CTPS.boatSurveyApp.FareStore.push(my_record[j]);                                                                
                         }                        
                        
						
						CTPS.boatSurveyApp.SetupDataGrid(7);		// Setup the data grid and render it. 
                         



             
                        document.getElementById('fetchData').disabled = true;
			
			},                                  				//     	END SUCCESS
			'failure': function(oRequest2) {
				alert("failure");
			}													//		END FAILURE
		});														//		END OpenLayers Request
		
//		CTPS.boatSurveyApp.DeployTabs();							//  	Call function which assembles all data grids into a single tab thingie
		
	if (document.getElementById('resetData').className==='hidden'){
		unhide('resetData');
	}
	if (document.getElementById('legend').className==='hidden'){
		unhide('legend');
	}
		
};	//	END CTPS.boatSurveyApp.fetchData() function


CTPS.boatSurveyApp.secondVector = function() {						
// 		Uses data store from Panel 1, divides data into 3 categories by
//		numbers of boarders, and creates filter queries which will be fed 
//		into "againRunRequest" function for each category to display each 
//		of the 3 categories in a separate vector layer on the map.

	var totaldat = CTPS.boatSurveyApp.myData;					
	var rec = []; 
	var town, boarders;
	var townUC;
	var szFilter = [];
	var maxloop;
	var category;
	if (totaldat.length > 16){								//  NOTE: this is included because WFS request fails if too long;
		maxloop = 16;										//  For CR origin towns, 16 was determined to be the threshold of failure at present.
	} else {
		maxloop = totaldat.length;
	}
	
	szFilter[0]='';
	szFilter[1]='';
	szFilter[2]='';
	
	for (var i=0;i<maxloop;i++) {					//	Assigns a "category" value to each boarder origin town
		rec = totaldat[i];
		town = rec[0];
		boarders = rec[1];		
			
		if(boarders<50) { category = 0};
		if(boarders>=50 && boarders<100) { category = 1};
		if(boarders>=100) { category = 2};

//	Filter to exclude New Hampshire, Rhode Island, and Connecticut towns from selection query for highlight layers
		if (town.search(/ NH/) === -1 && town.search(/ RI/) === -1 && !(town === 'Unspecified')) {	
			townUC = town.toUpperCase();
			switch(category) {
			case 0:
				if(szFilter[0]==''){
					szFilter[0] += "town_neighb='" + townUC + "'";
				} else{
					szFilter[0] += " OR town_neighb='" + townUC + "'";
				}
				break;
			case 1:
				if(szFilter[1]==''){
					szFilter[1] += "town_neighb='" + townUC + "'";
				} else{
					szFilter[1] += " OR town_neighb='" + townUC + "'";
				}
				break;
			case 2:
				if(szFilter[2]==''){
					szFilter[2] += "town_neighb='" + townUC + "'";
				} else{
					szFilter[2] += " OR town_neighb='" + townUC + "'";
				}
				break;		
			}
		}			//		END of "exclude neighboring states" loop
	}				//		END Looping through all records up to maxloop	
	
	CTPS.boatSurveyApp.queryVectorLayers(szFilter);
	
};	//	END CTPS.boatSurveyApp.secondVector() function	


CTPS.boatSurveyApp.queryVectorLayers = function(szFilter) {
// MAIN FUNCTION (no. 3 below) runs query for Vector Layer 1 and THEN 
// calls helper functions "queryVectorLayer3" and "queryVectorLayer2"
// to get the other 2.  The "zoom to bounds" function is only run at 
// the end of querying Layer 3--i.e., after all layers for which there
// are features have been populated.

// 1.  Helper function to query vector layer 3.
	queryVectorLayer3 = function(szFilter) {
		OpenLayers.Request.issue({
				method: 'GET',			
				url: CTPS.boatSurveyApp.szWFSserverRoot,                  //               '/geoserver/wfs',
				params: {
						service: 'WFS',
						version: '1.0.0',	
						typename: 'postgis:ctps_mbta_2009cr_towns_w_hoods', 
						request: 'getfeature',
						cql_filter: szFilter[2]
					},
				headers: {'content-type' : 'application/xml'},		
				success: function(oRequest) {
					var g = new OpenLayers.Format.GML();
					var aFeatures = g.read(oRequest.responseText);
						if (aFeatures.length === 0) {
							// alert("?? No town of name found. Value of szFilter[2] is " + szFilter[2]);
						} else {
						    CTPS.boatSurveyApp.oTownVectorLayer3.addFeatures(aFeatures);
						}
						// Response to WFS request for 3rd vector layer received and processed.
						// Zoom map to the bounds of the vector layers.
						CTPS.boatSurveyApp.zoomToVectorLayerBounds();						
					},
				failure: function(oRequest) {
						alert("Error: WFS request for 3rd vector layer failed.");
					}
		});
	}; 							// END OF  queryVectorLayer3
	
// 2.  Helper function to query vector layer 2.
	queryVectorLayer2 = function(szFilter) {
		OpenLayers.Request.issue({
				method: 'GET',			
				url: CTPS.boatSurveyApp.szWFSserverRoot,              //     '/geoserver/wfs',
				params: {
						service: 'WFS',
						version: '1.0.0',	
						typename: 'postgis:ctps_mbta_2009cr_towns_w_hoods', 
						request: 'getfeature',
						cql_filter: szFilter[1]
					},
				headers: {'content-type' : 'application/xml'},		
				success: function(oRequest) {
					var g = new OpenLayers.Format.GML();
					var aFeatures = g.read(oRequest.responseText);
						if (aFeatures.length === 0) {
							// alert("?? No town of name found. Value of szFilter[1] is " + szFilter[1]);
						} else {
						    CTPS.boatSurveyApp.oTownVectorLayer2.addFeatures(aFeatures);
						}
						// Response to WFS request for 2nd vector layer received and processed.
						// Initiate WFS request for 3rd vector layer.
						queryVectorLayer3(szFilter);
					},
				failure: function(oRequest) {
						alert("Error: WFS request for 2nd vector layer failed.");
					}
		});
	}; 						// END OF queryVectorLayer2()
	
// 	3. MAIN FUNCTION-- CTPS.demoapp.queryVectorLayers-- begins here.
// 		This function queries vector layer 1, and calls queryVectorLayer2 after
// 		it has received and processed its response.
	OpenLayers.Request.issue({
				method: 'GET',			
				url: CTPS.boatSurveyApp.szWFSserverRoot,                     //     '/geoserver/wfs',
				params: {
						service: 'WFS',
						version: '1.0.0',	
						typename: 'postgis:ctps_mbta_2009cr_towns_w_hoods', 
						request: 'getfeature',
						cql_filter: szFilter[0]
					},
				headers: {'content-type' : 'application/xml'},		
				success: function(oRequest) {
					var g = new OpenLayers.Format.GML();
					var aFeatures = g.read(oRequest.responseText);
						if (aFeatures.length === 0) {
							// alert("?? No town of name found. szFilter[0] is " + szFilter[0]);
						} else {
						    CTPS.boatSurveyApp.oTownVectorLayer1.addFeatures(aFeatures);
						}
						// Response to WFS request for 1st vector layer received and processed.
						// Initiate WFS request for 2nd vector layer.
						queryVectorLayer2(szFilter);
					},
				failure: function(oRequest) {
						alert("Error: WFS request for 1st vector layer failed.");
					}
	});				//		END OF   MAIN FUNCTION (no. 3)
}; 	// 	END OF   CTPS.boatSurveyApp.queryVectorLayers() function

	
CTPS.boatSurveyApp.zoomToVectorLayerBounds = function() {
		// Zoom to all selected towns--first determine bounds from Layer 1 (presumably the largest area)
		// but if there are no features in Layer 1, use Layer 2.  Big IF statement uses Layer 1 if it
		// has features, the ELSE uses Layer 2.
		if(CTPS.boatSurveyApp.oTownVectorLayer1.features.length > 0){
			var oCentroid = CTPS.boatSurveyApp.oTownVectorLayer1.features[0].geometry.getCentroid();
			var oLonLat = new OpenLayers.LonLat(oCentroid.x,oCentroid.y);						
			var oZoomBounds = CTPS.boatSurveyApp.oTownVectorLayer1.features[0].geometry.getBounds();				
						
			if(CTPS.boatSurveyApp.oTownVectorLayer3.features.length > 0){			
				oZoomBounds.extend(CTPS.boatSurveyApp.oTownVectorLayer3.features[0].geometry.getBounds());
			}
		
			if(CTPS.boatSurveyApp.oTownVectorLayer2.features.length > 0){
				for (var j = 1; j < CTPS.boatSurveyApp.oTownVectorLayer2.features.length; j++) {
						oZoomBounds.extend(CTPS.boatSurveyApp.oTownVectorLayer2.features[j].geometry.getBounds());	
				}			
			}
				
			if(CTPS.boatSurveyApp.oTownVectorLayer1.features.length > 0){
				for (var k = 1; k < CTPS.boatSurveyApp.oTownVectorLayer1.features.length; k++) {
						oZoomBounds.extend(CTPS.boatSurveyApp.oTownVectorLayer1.features[k].geometry.getBounds());	
				}
			}						
			CTPS.boatSurveyApp.map.zoomToExtent(oZoomBounds);	
			
			//   END of setting boundary based on Layer 1
			
		} else if (!CTPS.boatSurveyApp.oTownVectorLayer1.features.length > 0 && CTPS.boatSurveyApp.oTownVectorLayer2.features.length > 0){
			var oCentroid = CTPS.boatSurveyApp.oTownVectorLayer2.features[0].geometry.getCentroid();
			var oLonLat = new OpenLayers.LonLat(oCentroid.x,oCentroid.y);	
						
			var oZoomBounds = CTPS.boatSurveyApp.oTownVectorLayer2.features[0].geometry.getBounds();
			if (CTPS.boatSurveyApp.oTownVectorLayer3.features.length > 0){
				oZoomBounds.extend(CTPS.boatSurveyApp.oTownVectorLayer3.features[0].geometry.getBounds());
			}
			CTPS.boatSurveyApp.map.zoomToExtent(oZoomBounds);
		
			//	END of setting boundary based on Layer 2 assuming Layer 1 is empty
			
		} else if (!CTPS.boatSurveyApp.oTownVectorLayer1.features.length > 0 && !CTPS.boatSurveyApp.oTownVectorLayer2.features.length > 0){
			var oCentroid = CTPS.boatSurveyApp.oTownVectorLayer3.features[0].geometry.getCentroid();
			var oLonLat = new OpenLayers.LonLat(oCentroid.x,oCentroid.y);	
			
			var oZoomBounds = CTPS.boatSurveyApp.oTownVectorLayer3.features[0].geometry.getBounds();
			CTPS.boatSurveyApp.map.zoomToExtent(oZoomBounds);
		
			//	END of setting boundary based on Layer 3 assuming Layers 1 and 2 are both empty
			
		}	else {
			//	alert("nothing!");	//  one of the 3 above should work!!
		}	
}; 	// 	END OF zoomToVectorLayerBounds() function


///////////////////////////////////////////////////////////////////////////////////////////////////////////

//						5.	INPUT DATA FROM DATA STORE FOR EACH TABLE IN SUCCESSION 
//							(selected using SWITCH(a)), THEN READ INTO INDIVIDUAL PANEL DIVS

////////////////////////////////////////////////////////////////////////////////////////////////////////////

CTPS.boatSurveyApp.SetupDataGrid = function(a) {
	
	//  Called by function "GetData" after data stores created for each Panel topic 
	//	in turn.  "a" is the variable which identifies which Panel topic is the 
	//	subject of each grid.
	
	function truncate(val){
	// invokes the rounding function to round numbers to integers
		if(val > 0){	
			var val2 = Ext.util.Format.number(val,"0.");
			return '<span style="color:green;">' + val2 + '</span>';
		}
	}
	
	function commas(val){
	//invokes the rounding function, then formats the integer using the comma separator
		if(val > 0) {
				var val2 = val;
		//Ext.util.Format allows formatting of numbers
				var val3 = Ext.util.Format.number(val2,"0,000.");
				return val3;
			}else{
				return val3;
			}
	}
	
	function change(val){		
        if(val > 0){
			var val1 = val * 100;
			var val2 = Ext.util.Format.number(val1,"0.0");
			return val2 + "%";
		}
	}
 
	 
 // FIVE DIFFERENT PATHS FOR SETTING UP DATA GRID DEPENDING ON WHICH BUTTON CLICKED OR
 // QUESTION ASKED:	
 
	switch(a) {
	case 1:
	    // Station selected is BOARDING station--towns of origin requested
	    // create the data store for the grid       
        
		var colDesc = [ { header : 'ORIGIN TOWN', 		    dataIndex : 'origin_town', style: 'width: 150px;' }, 
						{ header : 'TOTAL',                 dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}}  }, 
						{ header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}}  } 
				   //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
				];
    
            var mygrid1 = $('#origin_grid').accessibleGrid(colDesc, 
                                    {  tableId 	:	'origin_table',
                                       col1th		: 	true,
                                       summary		: 	'Table columns are origin for boarders at selected boat dock, numbers of boarders, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                       caption		:	'Towns of Origin for Boarders at ' + display_dock,
                                       style       :   'width: 400px;',
                                       ariaLive	:	'assertive'												
                                    }, CTPS.boatSurveyApp.OriginStore);	
			break;
          			
		case 2:	
			//  Station selected is BOARDING station--Destination Towns requested
			// create the data store for the grid        
            var colDesc = [ { header : 'DESTINATION', 		    dataIndex : 'destination_town', style: 'width: 100px;' }, 
                            { header : 'TOTAL',                 dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}}  }, 
                            { header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}}  } 
                       //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
                    ];
    
            var mygrid2 = $('#dest_grid').accessibleGrid(colDesc, 
                                    {  tableId 	:	'dest_table',
                                       col1th		: 	true,
                                       summary		: 	'Table columns are destinations for boarders at selected boat dock, numbers of boarders, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                       caption		:	'Destinations for Boarders at ' + display_dock,
                                       style       :   'width: 400px;',
                                       ariaLive	:	'assertive'												
                                    }, CTPS.boatSurveyApp.DestStore);		
			break;
				
		case 3:											//  WEEKLY USAGE OF BOAT
             // Station selected is BOARDING station--number of days per week boat used
            var colDesc = [ { header : 'DAYS PER WEEK', dataIndex : 'number_days_used', style: 'width: 100px;' }, 
                            { header : 'TOTAL',         dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}}  }, 
                            { header : 'PERCENT', 	    dataIndex : 'percent', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}}  }
                       //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
                    ];
    
            var mygrid3 = $('#usage_grid').accessibleGrid(colDesc, 
                                    { tableId 	:	'usage_table',
                                      col1th		: 	true,
                                      summary		: 	'Table columns are origin for boarders at selected boat dock, numbers of boarders, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                      caption		:	'Days per Week Boat Use for Boarders at ' + display_dock,
                                      style       :   'width: 400px;',
                                      ariaLive	:	'assertive'												
                                    }, CTPS.boatSurveyApp.UsageStore); 
			break;

		case 4:										//  HOUSEHOLD INCOME CATEGORIES
           // Station selected is BOARDING station--number of days per week boat used
            var colDesc = [ { header : 'INCOME CATEGORY',  dataIndex : 'income_category', style: 'width: 100px;' }, 
                            { header : 'TOTAL',            dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}}  }, 
                            { header : 'PERCENT', 	       dataIndex : 'percent', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}}  } 
                       //     { header : 'STATION ORDER',         dataIndex : 'LINE_ORDER' }					
                    ];
    
            var mygrid4 = $('#income_grid').accessibleGrid(colDesc, 
                                    {  tableId 	:	'income_table',
                                       col1th		: 	true,
                                       summary		: 	'Table columns are origin for boarders at selected boat dock, numbers of boarders, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                       caption		:	'Household Income Reported for Boarders at ' + display_dock,
                                       style       :   'width: 400px;',
                                       ariaLive	:	'assertive'												
                                    }, CTPS.boatSurveyApp.IncomeStore);       
			break;
		
		case 5:				
			// VEHICLE CHART for people BOARDING at selected station	
			// Station selected is BOARDING station--vehicles per household
            var colDesc = [ { header : 'HOUSEHOLD VEHICLES', dataIndex : 'veh_per_hh', style: 'width: 100px;' }, 
                            { header : 'TOTAL',              dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}}  }, 
                            { header : 'PERCENT', 	         dataIndex : 'percent', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}}  } 
                       //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
                    ];
    
            var mygrid5 = $('#vehicles_grid').accessibleGrid(colDesc, 
                                    {  tableId 	:	'vehicles_table',
                                       col1th		: 	true,
                                       summary		: 	'Table columns are origin for boarders at selected boat dock, numbers of boarders, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                       caption		:	'Vehicles per Household Reported for Boarders at ' + display_dock,
                                       style       :   'width: 400px;',
                                       ariaLive	:	'assertive'												
                                    }, CTPS.boatSurveyApp.VehiclesStore);         
			break;

        case 6:				
			// Reported Race of people BOARDING at selected station	
			// Station selected is BOARDING station--Race
            var colDesc = [ { header : 'RACE',               dataIndex : 'race_category', style: 'width: 100px;' }, 
                            { header : 'TOTAL',              dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}}  }, 
                            { header : 'PERCENT', 	         dataIndex : 'percent', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}}  } 
                       //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
                    ];
    
            var mygrid6 = $('#race_grid').accessibleGrid(colDesc, 
                                    {  tableId 	:	'race_table',
                                       col1th		: 	true,
                                       summary		: 	'Table columns are origin for boarders at selected boat dock, numbers of boarders, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                       caption		:	'Race Reported by Boarders at ' + display_dock + '<br /><small>(note: boarders could click more than 1 choice; percents here are based on number of CLICKS, and may differ slightly from printed summary percents, which were based on number of RESPONDENTS)</small>',
                                       style       :   'width: 400px;',
                                       ariaLive	:	'assertive'												
                                    }, CTPS.boatSurveyApp.RaceStore);         
			break;

      case 7:				
			// Fare Type of for people BOARDING at selected station	
			// Station selected is BOARDING station--Fare
            var colDesc = [ { header : 'FARE TYPE',               dataIndex : 'fare_category', style: 'width: 100px;' }, 
                            { header : 'TOTAL',              dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}}  }, 
                            { header : 'PERCENT', 	         dataIndex : 'percent', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}}  } 
                       //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
                    ];
    
            var mygrid7 = $('#fare_grid').accessibleGrid(colDesc, 
                                    {  tableId 	:	'fare_table',
                                       col1th		: 	true,
                                       summary		: 	'Table columns are origin for boarders at selected boat dock, numbers of boarders, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                       caption		:	'Type of Fare Reported by Boarders at ' + display_dock,
                                       style       :   'width: 400px;',
                                       ariaLive	:	'assertive'												
                                    }, CTPS.boatSurveyApp.FareStore);         
			break;	           
            

		default:
			alert("No data read into grid");
			break;		
	}  //  	END of switch statement that renders grid
    
     CSSClass.remove();

};	//	END of CTPS.boatSurveyApp.SetupDataGrid() function




$(document).ready(function(){ 
 
$('#downloadData1,#downloadData3').click(function(){
 
    var selected_table = this.id;    

    if (CTPS.boatSurveyApp.oHighlightLayer.features.length === 0) { 
		alert("No features selected for data request ");
		return;
	} else {	
		var place = CTPS.boatSurveyApp.oHighlightLayer.features[0].attributes['match_name'];
	}
	
    
    var table_choice = '';
    var cqlFilter = '', propertyName = '';
    var szQry = '';
    var typename = 'postgis:ctps_mbta_2009boat_2015';
    
    var piece_dom = $('#mytabs ul > li.current').text();  
    table_choice = piece_dom.substring(13);
 
    
    switch(table_choice) {                                                                         //  gets values for displayed table only for selected origin
        case 'Origin Town':                                                       
            cqlFilter = "(code<=42)";				
            break;
       case 'Destination Town':
            cqlFilter = "(code > 42)AND(code<=77)";
            break;
       case 'Weekly Use':
            cqlFilter = "(code >78)AND(code<=87)";
            break;   
       case 'Household Income':
            cqlFilter = "(code >93)AND(code<=101)";
            break;
       case 'Household Vehicles':
            cqlFilter = "(code > 88)AND(code<=92)";
            break; 
       case 'Race':
            cqlFilter = "(code >127)AND(code<=133)";
            break;
       case 'Fare Type':
            cqlFilter = "(code > 102)AND(code<= 114)";
            break;
       default:
            alert('no grid selected');
    }
	    
     // Because in PostgreSQL column names are in lower case, need to down-case
	 // "place" in list of property names in CQL query strings being constructed
	 // in the following switch statement.
	 // BK 09/19/2017
    switch(selected_table){
        case 'downloadData1':  
             propertyName = 'id,attributevalue,' + 'board_' + place.toLowerCase() + ',code';                       //  gets values for displayed table for selected origin station only
             break;
         case 'downloadData2':            
            alert('shouldnt be here');
            break;
        case 'downloadData3':
             cqlFilter = "(code<= 114)OR ((code>127)AND(code<=133))";                                                                         //  gets ALL data for selected origin station, not just displayed table
             var propertyName = 'id,attributevalue,' + 'board_' + place.toLowerCase() + ',code';                    //  gets values for displayed table for selected origin station only
             break;
        default:
            alert('OK, now Im confused..');
      }         

    var oElement = document.getElementById("downloadAnchorTag1");
       
    var szQry = "request=getfeature&version=1.0.0&service=wfs&";
    szQry += "typename=" + typename + "&";    
    szQry += "outputFormat=csv&";    
    if(cqlFilter!==''){
        szQry += "CQL_filter=" + cqlFilter + "&";
    } else {
        szQry = szQry;
    };    
    szQry += "propertyName=" + propertyName;

  
    
   // Construct the HTML for the "download" page.     
			var downloadText = '';               
			var szTemp = CTPS.boatSurveyApp.szWFSserverRoot + '?';
			szTemp += szQry;          
           
            var downloadText = szTemp;           

			$('.spanForButtonWithLink').each(function() { 
				$(this).click(function() {
					location = $(this).find('a').attr('href');
				});	
			});                                                                                                 //      end each() 
                      
            oElement.setAttribute("href", downloadText);
    
 })
 });












	