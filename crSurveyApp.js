var CTPS = {};
CTPS.mbtaCrSurveyApp = {};
CTPS.mbtaCrSurveyApp.myData = [];
CTPS.mbtaCrSurveyApp.store = [];
CTPS.mbtaCrSurveyApp.grid = [];
CTPS.mbtaCrSurveyApp.tabs ={};
var CSSClass = {};
var display_stn = '';
var changed1 = [];


CTPS.mbtaCrSurveyApp.szServerRoot = 'http://www.ctps.org:8080/geoserver/'; 
CTPS.mbtaCrSurveyApp.szWMSserverRoot = CTPS.mbtaCrSurveyApp.szServerRoot + '/wms'; 
CTPS.mbtaCrSurveyApp.szWFSserverRoot = CTPS.mbtaCrSurveyApp.szServerRoot + '/wfs';

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
	$('#access_grid').html('');
	$('#income_grid').html('');
	$('#vehicles_grid').html('');
}

function reset_stores() {
	// Data "stores" - really just arrays of objects (key/value pairs).
	CTPS.mbtaCrSurveyApp.OriginStore = []; 
	CTPS.mbtaCrSurveyApp.AccessStore = [];
	CTPS.mbtaCrSurveyApp.IncomeStore = []; 
	CTPS.mbtaCrSurveyApp.VehiclesStore = []; 
    CTPS.mbtaCrSurveyApp.RaceStore = []; 
	CTPS.mbtaCrSurveyApp.FareStore = []; 
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

//function resets the 'station_name' box and the grid, but keeps the combo box populated
//(if .innerHTML was used for station_name, it would zero out the combo box altogether)
CTPS.mbtaCrSurveyApp.clear_selection = function() {
      
    zero_out_grids();
    reset_stores();
    
    var oElt;
    oElt = document.getElementById("station_name");
    oElt.selectedIndex = 0; 
	
    CSSClass.add();
	
	CTPS.mbtaCrSurveyApp.oHighlightLayer.destroyFeatures();
	CTPS.mbtaCrSurveyApp.oTownVectorLayer1.destroyFeatures();
	CTPS.mbtaCrSurveyApp.oTownVectorLayer2.destroyFeatures();
	CTPS.mbtaCrSurveyApp.oTownVectorLayer3.destroyFeatures();
	CTPS.mbtaCrSurveyApp.map.panTo(new OpenLayers.LonLat(234000,896500));
	CTPS.mbtaCrSurveyApp.map.zoomTo(2);
	
	unhide('legend');
	
	if (document.getElementById('fetchData').className==='unhidden'){
		unhide('fetchData');
    }
    
	if (document.getElementById('resetData').className==='unhidden'){
		unhide('resetData');	
	}

}; // CTPS.mbtaCrSurveyApp.clear_selection()

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

// Data "stores" - really just arrays of objects (key/value pairs).
CTPS.mbtaCrSurveyApp.OriginStore = []; 
CTPS.mbtaCrSurveyApp.AccessStore = [];
CTPS.mbtaCrSurveyApp.IncomeStore = [];  
CTPS.mbtaCrSurveyApp.VehiclesStore = []; 

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                         2.  	SET UP OPENLAYERS MAP WITH VECTOR LAYERS 
//								AND POPULATE COMBO BOX WITH LIST OF STATIONS

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

CTPS.mbtaCrSurveyApp.init = function() {
//	Called when .html file loaded--creates map with vector layers and populates combo box
//  with list of commuter rail stations to be queried.
				
	// First, get WFS-based pull-down list of stations in Commuter Rail system
	var szUrl = CTPS.mbtaCrSurveyApp.szWFSserverRoot + '?';          //   '/geoserver/wfs?';
	var szParams = szUrl;
	szParams += '&service=wfs';
	szParams += '&version=1.0.0';
	szParams += '&request=getfeature';
	szParams += '&typename=postgis:ctps_mbta_crstations_w_dups3'; 
	szParams += '&propertyname=display_station';

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
					oTemp.station = oFeature.attributes['display_station'];	
					oTemp.station_order = oFeature.attributes['stationorder'];
					aTemp.push(oTemp);
				}												

			// Sort the results of the WFS request;                                                 
				aTemp.sort(function(a,b){				
					var stna = a.station, stnb = b.station;
					if (stna < stnb)
						return -1
					if (stna > stnb)
						return 1
					return 0                  //default value if no sorting
				});
									
			// Populate the pull down list
				for (i = 0; i < aTemp.length; i++) {
					oOption = document.createElement("OPTION");														
					oOption.text = aTemp[i].station; 
					oOption.value = aTemp[i].station; 
					document.drop_list.station_name.options.add(oOption);  
				}
								
			},
			'failure': function(oRequest)
			{
				alert("failure populating list of CR stations");
			}
	});										//		END of OpenLayers request to get station names for combo box
				
	
	//	Next, create map with vector layers
	CTPS.mbtaCrSurveyApp.map = new OpenLayers.Map('map',
		{
			'projection': 'EPSG:26986',
			'maxResolution':'2000',
	//		'maxExtent': new OpenLayers.Bounds(133000,850000,330000,950000),
			'maxExtent': new OpenLayers.Bounds(131000,820000,360000,990000),
			'units': 'm'
		});
		
	var oBaseLayer = new OpenLayers.Layer.WMS(
		"Massachusetts Towns",
		CTPS.mbtaCrSurveyApp.szWMSserverRoot,                         //             "/geoserver/wms",
		{
			layers: 'postgis:ctps_mbta_2009cr_towns_w_hoods', 
			styles: 'towns_w_hoods_blank',
			singleTile: true
		}
	);
	var oLines = new OpenLayers.Layer.WMS(
		"Commuter Rail Lines",
		CTPS.mbtaCrSurveyApp.szWMSserverRoot,                     //               "/geoserver/wms",
		{		
			layers: 'postgis:ctps_mbta_crlines', 
			styles: 'line 2',
			transparent: 'true',
			singleTile: true
		}
	);
	var oStations = new OpenLayers.Layer.WMS(
		"Commuter Rail Stations",
		CTPS.mbtaCrSurveyApp.szWMSserverRoot,                      //                 "/geoserver/wms",
		{		
			layers: 'postgis:ctps_mbta_crstations_w_dups3', 
			styles: 'point_default',
			transparent: 'true',
			singleTile: true
		}
	);
			
	var myStyle = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
		{fillColor: "#34d034", fillOpacity: 1, graphicName: "star", pointRadius: 10, strokeColor: "black",
		label: "${display_station}", fontColor:"black", fontFamily:"Arial", fontSize: 10, fontWeight: "bold", labelXOffset: 10, labelYOffset: -15},
		OpenLayers.Feature.Vector.style["default"]));
		
	var myStyle2 = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
		{fillColor: 'yellow', fillOpacity: 0.3, strokeColor: "green", strokeWidth: 0.2, strokeOpacity: 0.3},
		OpenLayers.Feature.Vector.style["default"]));
		
	var myStyle3 = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
		{fillColor: 'red', fillOpacity: 0.3, strokeColor: "green", strokeWidth: 0.2, strokeOpacity: 0.3},
		OpenLayers.Feature.Vector.style["default"]));
		
	var myStyle4 = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
		{fillColor: 'blue', fillOpacity: 0.3, strokeColor: "green", strokeWidth: 0.2, strokeOpacity: 0.3},
		OpenLayers.Feature.Vector.style["default"]));

	CTPS.mbtaCrSurveyApp.oHighlightLayer = new OpenLayers.Layer.Vector(
		"Highlighted Stations", { styleMap: myStyle	} );
	
	CTPS.mbtaCrSurveyApp.oTownVectorLayer1 = new OpenLayers.Layer.Vector(
		"Origins-Few Riders", { styleMap: myStyle2 } );
		
	CTPS.mbtaCrSurveyApp.oTownVectorLayer2 = new OpenLayers.Layer.Vector(
		"Origins-More Riders", { styleMap: myStyle3 });
		
	CTPS.mbtaCrSurveyApp.oTownVectorLayer3 = new OpenLayers.Layer.Vector(
		"Origins-Many Riders", { styleMap: myStyle4 } );

	// Scale bar add-in
	var scalebar = new OpenLayers.Control.ScaleBar();
	scalebar.displaySystem = 'english';
	scalebar.divisions = 2;
	scalebar.subdivisions = 2;
	scalebar.showMinorMeasures = false;
	scalebar.singleLine = false;
	scalebar.abbreviateLabel = false;

	CTPS.mbtaCrSurveyApp.map.addLayers([oBaseLayer,oLines,oStations,
										CTPS.mbtaCrSurveyApp.oTownVectorLayer1,CTPS.mbtaCrSurveyApp.oTownVectorLayer2,
										CTPS.mbtaCrSurveyApp.oTownVectorLayer3,CTPS.mbtaCrSurveyApp.oHighlightLayer]);
	CTPS.mbtaCrSurveyApp.map.addControl(new OpenLayers.Control.LayerSwitcher());
	CTPS.mbtaCrSurveyApp.map.addControl(scalebar);

	CTPS.mbtaCrSurveyApp.map.setCenter(new OpenLayers.LonLat(234000,896500));
	CTPS.mbtaCrSurveyApp.map.zoomTo(2);
	
	// Bind event handlers.
	$('#station_name').change(CTPS.mbtaCrSurveyApp.searchForStation);
	$('#fetchData').click(CTPS.mbtaCrSurveyApp.getData);
	$('#resetData').click(CTPS.mbtaCrSurveyApp.clear_selection);
			
}; //	END of CTPS.mbtaCrSurveyApp.init() function


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                                   3.  SELECT STATION FOR WHICH DATA QUERIED

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	
	

CTPS.mbtaCrSurveyApp.searchForStation = function() {
// function responds to change in combo box to select station, put in Vector Layer,
// zoom map into selected station, and highlight on screen

	//if (CTPS.mbtaCrSurveyApp.tabs.rendered){
	//		CTPS.mbtaCrSurveyApp.tabs.hide();
	//	} 
	
     zero_out_grids();
     reset_stores()
	 CSSClass.add();
     
	// initialize variables/data store
	CTPS.mbtaCrSurveyApp.oHighlightLayer.destroyFeatures();
	CTPS.mbtaCrSurveyApp.oTownVectorLayer1.destroyFeatures();
	CTPS.mbtaCrSurveyApp.oTownVectorLayer2.destroyFeatures();
	CTPS.mbtaCrSurveyApp.oTownVectorLayer3.destroyFeatures();
	CTPS.mbtaCrSurveyApp.myData.length = 0;

	
	// get station name from combo box	
	var myselect=document.getElementById("station_name")
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
    
    display_stn = szSearchForMe;
	
	//  create WFS query to display station on screen and zoom to it	
	var cqlFilter = "(display_station=='" + szSearchForMe + "')";
  
	OpenLayers.Request.issue({
			'method': 'GET',
			'url': CTPS.mbtaCrSurveyApp.szWFSserverRoot,                          //      '/geoserver/wfs',
			'params': {
				service: 'WFS',
				version: '1.0.0',	
				typename: 'postgis:ctps_mbta_crstations_w_dups3',
				request: 'getfeature',
				cql_filter: cqlFilter
			},
			'headers': {'content-type' : 'application/xml'},
			'success': function(oRequest) {
				var g = new OpenLayers.Format.GML();
				var aFeatures = g.read(oRequest.responseText);
				
				if (aFeatures.length === 0) {
					alert('no station with that name found');
					CTPS.mbtaCrSurveyApp.clear_selection();
					return;
				} 
				
				var szResponse = '';
				for (var i = 0; i < aFeatures.length; i++) {				
					oFeature = aFeatures[i];
					szResponse += 'STATION: ' + oFeature.attributes['station'];
					CTPS.mbtaCrSurveyApp.oHighlightLayer.destroyFeatures();
					CTPS.mbtaCrSurveyApp.oHighlightLayer.addFeatures(oFeature);			
				}
                
                
                document.getElementById('fetchData').disabled = false;
                if (document.getElementById('fetchData').className==='hidden'){
					unhide('fetchData');
                }
                
                if (document.getElementById('resetData').className==='unhidden'){
					unhide('resetData');
                }
				
	//			CTPS.mbtaCrSurveyApp.getData();
				
			},
			'failure': function(oRequest) {
				alert("failure");
			}
		});											//	END OpenLayers Request
};	//	END CTPS.mbtaCrSurveyApp.searchForStation() function

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                          4.   CONSTRUCT AND RUN QUERY, THEN PARSE RESPONSE INTO DATA STORES

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

CTPS.mbtaCrSurveyApp.getData = function() {	

	// takes selected station from primary attribute layer when
	// "Get Data" button is clicked, and constructs a single query 
	// for all data items desired, to be run on a single table containing all data, 
	// and then runs the single query. It then parses out the query response, 
	// segment by segment, into a single data store which is re-initialized 
	// after each pass for the different data items. It calls the data grid 
	// function after each pass to read that pass's data store into a 
	// display panel which will be contained in one tab ("grid-exampleX"). 
	
	if (CTPS.mbtaCrSurveyApp.oHighlightLayer.features.length === 0) { 
		alert("No features selected for data request ");
		return;
	} else {	
		var place = CTPS.mbtaCrSurveyApp.oHighlightLayer.features[0].attributes['station'];
	}
	
	CTPS.mbtaCrSurveyApp.myData.length = 0;
	
	var board_stn = ''
	// set up and run master query to get all data for selected station from 
	// the single table containing all Commuter Rail survey data

	board_stn = 'BOARD_' + place;

    var typename = 'postgis:ctps_mbta_2009cr_2015_tbl';
	// In PostgreSQL column names are in lower case, so need to down-case "board_stn" for query.
	var propertyname = 'id,attributevalue,' + board_stn.toLowerCase();	
	
			var szUrl2 = CTPS.mbtaCrSurveyApp.szWFSserverRoot + '?';                        //    '/geoserver/wfs?';
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
                    var board_stn_integer = '';
                    var formatted_pct = '';
					var h = new OpenLayers.Format.GML();
					var aFeatures = h.read(oRequest2.responseText);	
					if (aFeatures.length === 0) {
							alert("No survey data reported for station  " + place.toLowerCase() + " ; try another station.");
							CTPS.mbtaCrSurveyApp.clear_selection();
							return;
						} 
					var szResponse2 = '';
						
	
                //Parse response data into data stores in chunks based on survey question, to be read
                //into 4 separate panels in Tab panel:
	
				//  Panel 1:  Origin towns for selected boarders
					//first, get sum of all boarders to use in calculating percents
						var sum1 = 0;
						var num_boarders = [];
						var boarders_pct = [];
						var boarders_read = 0;
						var first_attribute = '';
						var j;
						var changed1 = [];
						for (j = 1; j <= 412; j++) {									  //   NOTE:  first record skipped, because just origin number			
							first_attribute = aFeatures[j].attributes['attributevalue'];
							if(first_attribute !== 'StationOrder') {
								changed1[j] = parseInt(aFeatures[j].attributes['id']);
								  if (changed1[j] <= 354){
									boarders_read = parseFloat(aFeatures[j].attributes[board_stn.toLowerCase()]);            
									if(boarders_read>0) {                  
										num_boarders[j] = boarders_read;                      
										sum1 += num_boarders[j];
								}                          //  END of loop through origins with boarders
							  }							  //   END OF finding correct values of "changed"
							}							//  END of excluding first record
						}							   //  END of loop through all possible origin towns
						
		
				
					//then, do second loop to get individual values, calculate percents, and read into data store
						for (var i = 1; i <= 412; i++) {								//loop through all records for selected board_stn
							oFeature = aFeatures[i];
							if(changed1[i] <= 354){
                                if (oFeature.attributes[board_stn.toLowerCase()]>0 && first_attribute !== 'StationOrder') {					// only include origin towns that contribute riders to this station
                                    szResponse2 += 'OriginTown ' + oFeature.attributes['attributevalue'];			
                                    szResponse2 += '\nNUMBER: ' + oFeature.attributes[board_stn.toLowerCase()] + '\n\n';
        
                                    if (sum1 !== 0){	
                                        boarders_pct[i] = num_boarders[i] / sum1;
                                    } else {
                                        alert('sum1 = 0');
                                    }
        
                                    if (oFeature.attributes['attributevalue']!=='StationOrder') {
                                            board_stn_integer = parseInt(aFeatures[i].attributes[board_stn.toLowerCase()]);
                                            aTemp1 = [aFeatures[i].attributes['attributevalue']];						
                                            aTemp1.push(board_stn_integer,make_pct(boarders_pct[i]));			
                                            CTPS.mbtaCrSurveyApp.myData.push(aTemp1);									
                                    }
                                    
                                }								  // END loop thru towns contributing riders	
							}									//   END loop thru all relevant values of "changed"
						};									  // END loop thru all records for selected board_stn
			
			
					// Sort the results of the WFS request in REVERSE ORDER by number of boarders;                                                 
                        CTPS.mbtaCrSurveyApp.myData.sort(function(a,b){				
							var stna = parseInt(a[1]), stnb = parseInt(b[1]);
							if (stna < stnb)
								return 1
							if (stna > stnb)
								return -1
							return 0                  //default value if no sorting
						});
						
						CTPS.mbtaCrSurveyApp.secondVector()			// call function which displays boarder origin towns in 3
                                                                    // additional vector layer
                                                                    
                       //  Create new database store (BoardStore)  as JSON-type structure:                                
                        var my_record = [];
                        var dblength = CTPS.mbtaCrSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'origin_town':  CTPS.mbtaCrSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.mbtaCrSurveyApp.myData[j][1],
                                                    'percent':          CTPS.mbtaCrSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.mbtaCrSurveyApp.myData[j][3]
                                }; 
                                CTPS.mbtaCrSurveyApp.OriginStore.push(my_record[j]);                                                                
                         } 
                                                                    
                                                                    
																
						CTPS.mbtaCrSurveyApp.SetupDataGrid(1,display_stn);		// Setup the ExtJS data grid and render it.
			
				//  Panel 2:  Access modes for people boarding at selected station
					//first, get sum of all boarders to use in calculating percents
						CTPS.mbtaCrSurveyApp.myData.length = 0;						
						var sum2 = 0;
						var num_mode = [];
						var mode_pct = [];                        
						for (j = 1; j <= 412; j++) {		
							if (changed1[j] >= 500 && changed1[j] <= 511){
									num_mode[j] = parseFloat(aFeatures[j].attributes[board_stn.toLowerCase()]);
									sum2 += num_mode[j];
							}
						}
								
					//then, do second loop to get individual values, calculate percents, and read into data store							
					
						for (var i = 1; i <=412; i++) {
							oFeature = aFeatures[i];
							if (changed1[i] >= 500 && changed1[i] <= 511){
								szResponse2 += 'STATION ' + oFeature.attributes['attributevalue'];
								szResponse2 += '\nACCESS MODE: ' + oFeature.attributes[board_stn.toLowerCase()] + '\n\n';								
								
								if (sum2 !== 0){	
									mode_pct[i] = num_mode[i] / sum2;
								} else {
									alert('sum2 = 0');
								}
								
                              
								aTemp2 = [aFeatures[i].attributes['attributevalue']];
                                board_stn_integer = parseInt(aFeatures[i].attributes[board_stn.toLowerCase()]);
								aTemp2.push(board_stn_integer); 
                                if(mode_pct[i] == 0){                                
                                        formatted_pct = mode_pct[i];
                                    } else {
                                        formatted_pct = make_pct(mode_pct[i]);    //  format non-zero numbers with % sign                                 
                                    }
                                aTemp2.push(formatted_pct);
                               	
								CTPS.mbtaCrSurveyApp.myData.push(aTemp2);
							}										//   END loop thru all relevant values of "changed"
						};											//   END loop thru all features	

                     //  Create new database store (AccessStore)  as JSON-type structure:   
                        var my_record = [];
                        var dblength = CTPS.mbtaCrSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'attribute_value':  CTPS.mbtaCrSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.mbtaCrSurveyApp.myData[j][1],
                                                    'percent':          CTPS.mbtaCrSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.mbtaCrSurveyApp.myData[j][3]
                                }; 
                                CTPS.mbtaCrSurveyApp.AccessStore.push(my_record[j]);                                                                
                         }	                      					
                        
		
						CTPS.mbtaCrSurveyApp.SetupDataGrid(2,display_stn);		// Setup the ExtJS data grid and render it.
                        
                        
               	//  Panel 3:  Household income for people boarding at selected station
						CTPS.mbtaCrSurveyApp.myData.length = 0;

                        var sum3 = 0;
						var num_inc = [];
						var inc_pct = [];                        
						for (j = 1; j <= 412; j++) {		
							if (changed1[j] >= 519 && changed1[j] <= 526){
									num_inc[j] = parseFloat(aFeatures[j].attributes[board_stn.toLowerCase()]);
									sum3 += num_inc[j];
							}
						}
						
						for (var i = 1; i <= 412; i++) {			
							oFeature = aFeatures[i];
							if (changed1[i] >= 519 && changed1[i] <= 526){
								szResponse2 += 'INCOME GROUP ' + oFeature.attributes['attributevalue'];
								szResponse2 += '\nNUMBER OF HH: ' + oFeature.attributes[board_stn.toLowerCase()] + '\n\n';

                                if (sum3 !== 0){	
									inc_pct[i] = num_inc[i] / sum3;
								} else {
									alert('sum3 = 0');
								}
								
								
								aTemp3 = [aFeatures[i].attributes['attributevalue']];
                                board_stn_integer = parseInt(aFeatures[i].attributes[board_stn.toLowerCase()]);
								aTemp3.push(board_stn_integer);

                                if(inc_pct[i] == 0){                                
                                        formatted_pct = inc_pct[i];
                                    } else {
                                        formatted_pct = make_pct(inc_pct[i]);    //  format non-zero numbers with % sign                                 
                                    }
                                aTemp3.push(formatted_pct);
                                
								CTPS.mbtaCrSurveyApp.myData.push(aTemp3);	
							}										//		END loop thru correct values of "changed"
						};

                     //  Create new database store (IncomeStore)  as JSON-type structure:   
                        var my_record = [];
                        var dblength = CTPS.mbtaCrSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'attribute_value':  CTPS.mbtaCrSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.mbtaCrSurveyApp.myData[j][1],
                                                    'percent':          CTPS.mbtaCrSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.mbtaCrSurveyApp.myData[j][3]
                                }; 
                                CTPS.mbtaCrSurveyApp.IncomeStore.push(my_record[j]);                                                                
                         }	                                    
											
						CTPS.mbtaCrSurveyApp.SetupDataGrid(3,display_stn);		// Setup the ExtJS data grid and render it.
					
					
				//  Panel 4:  Household vehicles for people boarding at selected station
						CTPS.mbtaCrSurveyApp.myData.length = 0;

                        var sum4 = 0;
						var num_veh = [];
						var veh_pct = [];                        
						for (j = 1; j <= 412; j++) {		
							if (changed1[j] >= 514 && changed1[j] <= 517){
									num_veh[j] = parseFloat(aFeatures[j].attributes[board_stn.toLowerCase()]);
									sum4 += num_veh[j];
							}
						}
						
						for (var i = 1; i <= 412; i++) {		
							oFeature = aFeatures[i];
							if (changed1[i] >= 514 && changed1[i] <= 517){
								szResponse2 += 'VEHICLE GROUP ' + oFeature.attributes['attributevalue'];
								szResponse2 += '\nVEH PER HH: ' + oFeature.attributes[board_stn] + '\n\n';

                                if (sum4 !== 0){	
									veh_pct[i] = num_veh[i] / sum4;
								} else {
									alert('sum4 = 0');
								}
                                
									
								aTemp4 = [aFeatures[i].attributes['attributevalue']];
                                board_stn_integer = parseInt(aFeatures[i].attributes[board_stn.toLowerCase()]);
								aTemp4.push(board_stn_integer);

                                if(veh_pct[i] == 0){                                
                                        formatted_pct = veh_pct[i];
                                    } else {
                                        formatted_pct = make_pct(veh_pct[i]);    //  format non-zero numbers with % sign 
                                        
                                    }
                                aTemp4.push(formatted_pct);
								CTPS.mbtaCrSurveyApp.myData.push(aTemp4);
							}
						};

                        //  Create new database store (AccessStore)  as JSON-type structure:   
                        var my_record = [];
                        var dblength = CTPS.mbtaCrSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'attribute_value':  CTPS.mbtaCrSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.mbtaCrSurveyApp.myData[j][1],
                                                    'percent':          CTPS.mbtaCrSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.mbtaCrSurveyApp.myData[j][3]
                                }; 
                                CTPS.mbtaCrSurveyApp.VehiclesStore.push(my_record[j]);                                                                
                         }	                      					
                        
						
						CTPS.mbtaCrSurveyApp.SetupDataGrid(4,display_stn);		// Setup the ExtJS data grid and render it	
                        
                        
                        
              // Panel 5: Race of boarders
                        CTPS.mbtaCrSurveyApp.myData.length = 0;
                        
                        var sum5 = 0, race_read, num_race = [], race_pct = [];

                        for (j = 1; j <= 412; j++) {		
							if (changed1[j] >= 623 && changed1[j] <= 628){
									num_race[j] = parseFloat(aFeatures[j].attributes[board_stn.toLowerCase()]);
									sum5 += num_race[j];
							}
						}
                        
               
                        
                         for (j = 1; j <= 412; j++) {		
							if (changed1[j] >= 623 && changed1[j] <= 628){
                              if(sum5 != 0){ 
                                      race_pct[j] = num_race[j] / sum5;
                              } else {
									alert('sum5 = 0');
							  }

                              aTemp5 = [aFeatures[j].attributes['attributevalue']];                       
                              
                              board_stn_integer = parseInt(aFeatures[j].attributes[board_stn.toLowerCase()]);
							  aTemp5.push(board_stn_integer); 
                              if(race_pct[j] == 0){                                
                                        formatted_pct = race_pct[j];
                               } else {
                                        formatted_pct = make_pct(race_pct[j]);    //  format non-zero numbers with % sign                                 
                               }
                               aTemp5.push(formatted_pct);
                               	
							   CTPS.mbtaCrSurveyApp.myData.push(aTemp5);                             
                              
                            }
                          }

                        //  Create new database store (AccessStore)  as JSON-type structure:   
                        var my_record = [];
                        var dblength = CTPS.mbtaCrSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'attribute_value':  CTPS.mbtaCrSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.mbtaCrSurveyApp.myData[j][1],
                                                    'percent':          CTPS.mbtaCrSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.mbtaCrSurveyApp.myData[j][3]
                                }; 
                                CTPS.mbtaCrSurveyApp.RaceStore.push(my_record[j]);                                                                
                         }	           
                                               
					
                        CTPS.mbtaCrSurveyApp.SetupDataGrid(5,display_stn);		// Setup the ExtJS data grid and render it	    
                       

            // Panel 6: Fare type reported by boarders
                        CTPS.mbtaCrSurveyApp.myData.length = 0;
                        
                        var sum6 = 0, fare_read, num_fare = [], fare_pct = [];

                        for (j = 1; j <= 412; j++) {		
							if (changed1[j] > 600 && changed1[j] <= 611){
									num_fare[j] = parseFloat(aFeatures[j].attributes[board_stn.toLowerCase()]);
									sum6 += num_fare[j];
							}
						}
                        
               
                        
                         for (j = 1; j <= 412; j++) {		
							if (changed1[j] > 600 && changed1[j] <= 611){
                              if(sum5 != 0){ 
                                      fare_pct[j] = num_fare[j] / sum6;
                              } else {
									alert('sum6 = 0');
							  }
                              
                              aTemp6 = [];
                              aTemp6.push(aFeatures[j].attributes['attributevalue']);
                              board_stn_integer = parseInt(aFeatures[j].attributes[board_stn.toLowerCase()]);
							  aTemp6.push(board_stn_integer); 
                              if(fare_pct[j] == 0){                                
                                        formatted_pct = fare_pct[j];
                              } else {
                                        formatted_pct = make_pct(fare_pct[j]);    //  format non-zero numbers with % sign                                 
                              }
                              aTemp6.push(formatted_pct);
                               	
							  CTPS.mbtaCrSurveyApp.myData.push(aTemp6);                             
                              
                            }
                         }

                        //  Create new database store (AccessStore)  as JSON-type structure:   
                        var my_record = [];
                        var dblength = CTPS.mbtaCrSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'attribute_value':  CTPS.mbtaCrSurveyApp.myData[j][0],
                                                    'total_boarders':   CTPS.mbtaCrSurveyApp.myData[j][1],
                                                    'percent':          CTPS.mbtaCrSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.mbtaCrSurveyApp.myData[j][3]
                                }; 
                                CTPS.mbtaCrSurveyApp.FareStore.push(my_record[j]);                                                                
                         }	           
                                               
					
                        CTPS.mbtaCrSurveyApp.SetupDataGrid(6,display_stn);		// Setup the ExtJS data grid and render it	    
                             
                    
                        document.getElementById('fetchData').disabled = true;
							
			},                                  				//     	END SUCCESS
			'failure': function(oRequest2) {
				alert("failure");
			}													//		END FAILURE
		});														//		END OpenLayers Request
		
		
		if (document.getElementById('resetData').className==='hidden'){
			unhide('resetData');
		}
		if (document.getElementById('legend').className==='hidden'){
			unhide('legend');
		}
            
};	//	END CTPS.mbtaCrSurveyApp.getData() function


CTPS.mbtaCrSurveyApp.secondVector = function() {						
// 		Uses data store from Panel 1, divides data into 3 categories by
//		numbers of boarders, and creates filter queries which will be fed 
//		into "againRunRequest" function for each category to display each 
//		of the 3 categories in a separate vector layer on the map.

	var totaldat = CTPS.mbtaCrSurveyApp.myData;					
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
				} else {
					szFilter[0] += " OR town_neighb='" + townUC + "'";
				}
				break;
			case 1:
				if(szFilter[1]==''){
					szFilter[1] += "town_neighb='" + townUC + "'";
				} else {
					szFilter[1] += " OR town_neighb='" + townUC + "'";
				}
				break;
			case 2:
				if(szFilter[2]==''){
					szFilter[2] += "town_neighb='" + townUC + "'";
				} else {
					szFilter[2] += " OR town_neighb='" + townUC + "'";
				}
				break;		
			}
		}			//		END of "exclude neighboring states" loop
	}				//		END Looping through all records up to maxloop	
	
	CTPS.mbtaCrSurveyApp.queryVectorLayers(szFilter);
	
} // END CTPS.mbtaCrSurveyApp.secondVector() function	


CTPS.mbtaCrSurveyApp.queryVectorLayers = function(szFilter) {
// MAIN FUNCTION (no. 3 below) runs query for Vector Layer 1 and THEN 
// calls helper functions "queryVectorLayer3" and "queryVectorLayer2"
// to get the other 2.  The "zoom to bounds" function is only run at 
// the end of querying Layer 3--i.e., after all layers for which there
// are features have been populated.

// 1.  Helper function to query vector layer 3.
	queryVectorLayer3 = function(szFilter) {
		OpenLayers.Request.issue({
				method: 'GET',			
				url: CTPS.mbtaCrSurveyApp.szWFSserverRoot,                   //     '/geoserver/wfs',
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
						    CTPS.mbtaCrSurveyApp.oTownVectorLayer3.addFeatures(aFeatures);
						}
						// Response to WFS request for 3rd vector layer received and processed.
						// Zoom map to the bounds of the vector layers.
						CTPS.mbtaCrSurveyApp.zoomToVectorLayerBounds();						
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
				url:  CTPS.mbtaCrSurveyApp.szWFSserverRoot,                //                   '/geoserver/wfs',
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
						    CTPS.mbtaCrSurveyApp.oTownVectorLayer2.addFeatures(aFeatures);
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
	
// 	3. MAIN FUNCTION-- CTPS.mbtaCrSurveyApp.queryVectorLayers-- begins here.
// 		This function queries vector layer 1, and calls queryVectorLayer2 after
// 		it has received and processed its response.
	OpenLayers.Request.issue({
				method: 'GET',			
				url:  CTPS.mbtaCrSurveyApp.szWFSserverRoot,                 //             '/geoserver/wfs',
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
						    CTPS.mbtaCrSurveyApp.oTownVectorLayer1.addFeatures(aFeatures);
						}
						// Response to WFS request for 1st vector layer received and processed.
						// Initiate WFS request for 2nd vector layer.
						queryVectorLayer2(szFilter);
					},
				failure: function(oRequest) {
						alert("Error: WFS request for 1st vector layer failed.");
					}
	});				//		END OF   MAIN FUNCTION (no. 3)
}; 	// 	END OF   CTPS.mbtaCrSurveyApp.queryVectorLayers() function

	
CTPS.mbtaCrSurveyApp.zoomToVectorLayerBounds = function() {
		// Zoom to all selected towns--first determine bounds from Layer 1 (presumably the largest area)
		// but if there are no features in Layer 1, use Layer 2.  Big IF statement uses Layer 1 if it
		// has features, the ELSE uses Layer 2.
		if(CTPS.mbtaCrSurveyApp.oTownVectorLayer1.features.length > 0){
			var oCentroid = CTPS.mbtaCrSurveyApp.oTownVectorLayer1.features[0].geometry.getCentroid();
			var oLonLat = new OpenLayers.LonLat(oCentroid.x,oCentroid.y);						
			var oZoomBounds = CTPS.mbtaCrSurveyApp.oTownVectorLayer1.features[0].geometry.getBounds();				
						
			if(CTPS.mbtaCrSurveyApp.oTownVectorLayer3.features.length > 0){
				oZoomBounds.extend(CTPS.mbtaCrSurveyApp.oTownVectorLayer3.features[0].geometry.getBounds());
			}
		
			if(CTPS.mbtaCrSurveyApp.oTownVectorLayer2.features.length > 0){
				oZoomBounds.extend(CTPS.mbtaCrSurveyApp.oTownVectorLayer2.features[0].geometry.getBounds());
			}
				
			if(CTPS.mbtaCrSurveyApp.oTownVectorLayer1.features.length > 0){
				for (var i = 1; i < CTPS.mbtaCrSurveyApp.oTownVectorLayer1.features.length; i++) {
						oZoomBounds.extend(CTPS.mbtaCrSurveyApp.oTownVectorLayer1.features[i].geometry.getBounds());	
				}
			}						
			CTPS.mbtaCrSurveyApp.map.zoomToExtent(oZoomBounds);
			//   END of setting boundary based on Layer 1
		} else if (!CTPS.mbtaCrSurveyApp.oTownVectorLayer1.features.length > 0 && CTPS.mbtaCrSurveyApp.oTownVectorLayer2.features.length > 0){
			var oCentroid = CTPS.mbtaCrSurveyApp.oTownVectorLayer2.features[0].geometry.getCentroid();
			var oLonLat = new OpenLayers.LonLat(oCentroid.x,oCentroid.y);	
						
			var oZoomBounds = CTPS.mbtaCrSurveyApp.oTownVectorLayer2.features[0].geometry.getBounds();
			if (CTPS.mbtaCrSurveyApp.oTownVectorLayer3.features.length > 0){
				oZoomBounds.extend(CTPS.mbtaCrSurveyApp.oTownVectorLayer3.features[0].geometry.getBounds());
			}
			CTPS.mbtaCrSurveyApp.map.zoomToExtent(oZoomBounds);
			//	END of setting boundary based on Layer 2 assuming Layer 1 is empty
		}	else {
			//	alert("nothing!");	//  one of the 2 above should work!!
		}	
}; 	// 	END OF zoomToVectorLayerBounds() function


///////////////////////////////////////////////////////////////////////////////////////////////////////////

//						5.	INPUT DATA FROM DATA STORE FOR EACH TABLE IN SUCCESSION 
//							(selected using SWITCH(a)), THEN READ INTO INDIVIDUAL PANEL DIVS

////////////////////////////////////////////////////////////////////////////////////////////////////////////

CTPS.mbtaCrSurveyApp.SetupDataGrid = function(a,display_stn) {
	
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
  
 // FOUR DIFFERENT PATHS FOR SETTING UP DATA GRID DEPENDING ON WHICH BUTTON CLICKED OR
 // QUESTION ASKED:	
 
	switch(a) {
	case 1:      
		// Station selected is BOARDING station--towns of origin requested   	         
		var colDesc = [ { header : 'ORIGIN TOWN', 		    dataIndex : 'origin_town', style: 'width: 150px;' }, 
						{ header : 'TOTAL',                 dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}}  }, 
						{ header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}}  } 
				   //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
					];

		var mygrid1 = $('#origin_grid').accessibleGrid(colDesc, 
								{   tableId 	:	'origin_table',
									col1th		: 	true,
									summary		: 	'Table columns are origin for boarders at selected station, numbers of boarders, and percent of total. Rows are origin towns in descending order by numbers of boarders',
									caption		:	'Towns of Origin for Boarders at ' + display_stn,
									style       :   'width: 400px;',
									ariaLive	:	'assertive'												
								}, CTPS.mbtaCrSurveyApp.OriginStore);	
		break;
						
	case 2:	                                      
		//  Station selected is BOARDING station--Access Modes requested		
		var colDesc = [ { header : 'ACCESS MODE', 		    dataIndex : 'attribute_value', style: 'width: 100px;' }, 
						{ header : 'TOTAL',                 dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}} }, 
						{ header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}} } 
				   //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
					];
	
		var mygrid2 = $('#access_grid').accessibleGrid(colDesc, 
								{ 	tableId 	:	'access_table',
									col1th		: 	true,
									summary		: 	'Table columns are station access modes used by boarders at selected station, numbers of boarders, and percent of total. Rows are access modes such as walk, drive, carpool',
									caption		:	'Modes of Station Access for Boarders at ' + display_stn,
									style       :   'width: 400px;',
									ariaLive	:	'assertive'												
								}, CTPS.mbtaCrSurveyApp.AccessStore);								
		break;
				
	case 3:
		var colDesc = [ { header : 'HOUSEHOLD INCOME', 		        dataIndex : 'attribute_value', style: 'width: 100px;' }, 
								{ header : 'TOTAL',                 dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}}  }, 
								{ header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}} } 
						   //     { header : 'STATION ORDER',         dataIndex : 'LINE_ORDER' }					
					  ];
		
		var mygrid3 = $('#income_grid').accessibleGrid(colDesc, 
							{ 	tableId 	:	'income_table',
								col1th		: 	true,
								summary		: 	'Table columns are household income categories for boarders at selected station, numbers of boarders, and percent of total. Rows are 8 income categories',
								caption		:	'Household Income for Boarders at ' + display_stn,
								style       :   'width: 400px;',
								ariaLive	:	'assertive'                                                           
							}, CTPS.mbtaCrSurveyApp.IncomeStore);
        break;
			
	case 4:	
		 var colDesc = [ { header : 'VEHICLES PER HH', 		    dataIndex : 'attribute_value', style: 'width: 100px;' }, 
						 { header : 'TOTAL',                 dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}} }, 
						 { header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}} } 
						// { header : 'STATION ORDER',         dataIndex : 'line_order' }					
						];
    
		var mygrid4 = $('#vehicles_grid').accessibleGrid(colDesc, 
							{ 	tableId 	:	'vehicles_table',
								col1th		: 	true,
								summary		: 	'Table columns are vehicles per household for boarders at selected station, numbers of boarders, and percent of total. Rows are zero, one, two, or three plus vehicles',
								caption		:	'Vehicles per Household for Boarders at ' + display_stn,
								style		:   'width: 400px;',
								ariaLive	:	'assertive'												
						}, CTPS.mbtaCrSurveyApp.VehiclesStore);	    
		break;
        
           
    case 5:
        var colDesc = [ { header : 'RESPONDENTS RACE', 		    dataIndex : 'attribute_value', style: 'width: 100px;' }, 
						 { header : 'TOTAL',                        dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}} }, 
						 { header : 'PERCENT', 	                    dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}} } 
						// { header : 'STATION ORDER',         dataIndex : 'line_order' }					
						];
    
		var mygrid5 = $('#race_grid').accessibleGrid(colDesc, 
							{ 	tableId 	:	'race_table',
								col1th		: 	true,
								summary		: 	'Table columns are vehicles per household for boarders at selected station, numbers of boarders, and percent of total. Rows are zero, one, two, or three plus vehicles',
								caption		:	'Reported Race of Boarders at ' + display_stn + '<br /><small>(note: boarders could click more than 1 choice; percents here are based on number of CLICKS, and may differ slightly from printed summary percents, which were based on number of RESPONDENTS)</small>',
								style		:   'width: 400px;',
								ariaLive	:	'assertive'												
						}, CTPS.mbtaCrSurveyApp.RaceStore);	    
		break;
        
      case 6:          
      
        var colDesc = [ { header : 'FARE ', 		                dataIndex : 'attribute_value', style: 'width: 200px;' }, 
						 { header : 'TOTAL',                        dataIndex : 'total_boarders', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return x}} }, 
						 { header : 'PERCENT', 	                    dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0'){return ' '} else {return x}} } 
						// { header : 'STATION ORDER',         dataIndex : 'line_order' }					
						];
    
		var mygrid5 = $('#fare_grid').accessibleGrid(colDesc, 
							{ 	tableId 	:	'fare_table',
								col1th		: 	true,
								summary		: 	'Table columns are vehicles per household for boarders at selected station, numbers of boarders, and percent of total. Rows are zero, one, two, or three plus vehicles',
								caption		:	'Fare Type for Boarders at ' + display_stn,
								style		:   'width: 400px;',
								ariaLive	:	'assertive'												
						}, CTPS.mbtaCrSurveyApp.FareStore);	    
		break;       

	default:
		alert("No data read into grid");
		break;		
	}     //  	END of "Switch" statement that renders grid
    
     CSSClass.remove();

};  // END of CTPS.mbtaCrSurveyApp.SetupDataGrid() function


$(document).ready(function(){ 
 
$('#downloadData1,#downloadData3').click(function(){
 
    var selected_table = this.id;    

    if (CTPS.mbtaCrSurveyApp.oHighlightLayer.features.length === 0) { 
		alert("No features selected for data request ");
		return;
	} else {	
		var place = CTPS.mbtaCrSurveyApp.oHighlightLayer.features[0].attributes['station'];
	}
	
    
    var table_choice = '';
    var cqlFilter = '', propertyName = '';
    var szQry = '';
    var typename = 'postgis:ctps_mbta_2009cr_2015_tbl'; 
    
    var piece_dom = $('#mytabs ul > li.current').text();  
    table_choice = piece_dom.substring(13);
    
    console.log('table_choice', table_choice);
    
    switch(table_choice) {                                                                         //  gets values for displayed table only for selected origin
        case 'Origin Town':                                                       
            cqlFilter = "(code > 0)AND(code<=499)";				
            break;
       case 'Access Mode':
            cqlFilter = "(code >=500)AND(code<=511)";
            break;      
       case 'Household Income':
            cqlFilter = "(code >= 519)AND(code<=526)";
            break;
       case 'Household Vehicles':
            cqlFilter = "(code >= 514)AND(code<=517)";
            break;
       case 'Race':
            cqlFilter = "(code >= 623)AND(code<=628)";
            break; 
       case 'Fare Type':
            cqlFilter = "(code > 600)AND(code<=611)";
            break; 
       default:
            alert('no grid selected');
    }
	    
         
    switch(selected_table){
        case 'downloadData1':  
             propertyName = 'id,attributevalue,' + 'board_' + place.toLowerCase() + ',code';                       //  gets values for displayed table for selected origin station only
             break;
         case 'downloadData2':            
            alert('shouldnt be here');
            break;
        case 'downloadData3':
             cqlFilter = '(code <= 611) OR ((code >= 623)AND(code<=628))';                                                                         //  gets ALL data for selected origin station, not just displayed table
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
			var szTemp = CTPS.mbtaCrSurveyApp.szWFSserverRoot + '?';                                                     //      NOTE:  CHANGED TO MAKE DOWNLOAD WORK FROM \\lindalino:8080       
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





