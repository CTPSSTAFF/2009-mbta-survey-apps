var marymcs = {};
marymcs.demoApp = {};
// marymcs.demoApp.myData = [];
marymcs.demoApp.storeOrigins = [];
marymcs.demoApp.storeFrequency = [];
marymcs.demoApp.storeVehicles = [];
marymcs.demoApp.storeIncome = [];
marymcs.demoApp.storeAccess = [];
marymcs.demoApp.storeRace = [];
marymcs.demoApp.storeFare = [];

marymcs.demoApp.grid = [];
marymcs.demoApp.tabs ={};
var CSSClass = {};


marymcs.demoApp.szServerRoot = 'http://www.ctps.org:8080/geoserver/'; 
marymcs.demoApp.szWMSserverRoot = marymcs.demoApp.szServerRoot + '/wms'; 
marymcs.demoApp.szWFSserverRoot = marymcs.demoApp.szServerRoot + '/wfs';


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                         1.  MISCELLANEOUS UTILITY FUNCTIONS

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////



function unhide(divID) {
	//function toggles hiding and unhiding the Div with ID = 'report'
	var item = document.getElementById(divID);
	if (item) {
		item.className=(item.className==='hidden')?'unhidden':'hidden';
	}
}

function addCommas(nStr)
{
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

//Note:  the 3 functions below allow selection and manipulation of class tags that have more than 1 class element defined.
//In this app, they are used only to turn on and off visibility of the 'mytabs' element containing the tabs.
//The simpler function 'unhide' above is used to flip on and off all other elements.
CSSClass.is = function(){
		var e = document.getElementById('mytabs');		
		var classes = e.className;
		if(classes==="hidden"){
			alert('from "is" fcn classes=hidden');
		}else{
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


function zero_out_grids() {
    document.getElementById('origin_grid').innerHTML = '';
	document.getElementById('frequency_grid').innerHTML = '';
	document.getElementById('vehicles_grid').innerHTML = '';
	document.getElementById('income_grid').innerHTML = '';
    document.getElementById('access_grid').innerHTML = '';
    document.getElementById('race_grid').innerHTML = '';
    document.getElementById('fare_grid').innerHTML = '';
};




//function resets the 'route_name' box and the grid, but keeps the combo box populated
//(if .innerHTML was used for station_name, it would zero out the combo box altogether)
marymcs.demoApp.clear_selection = function() {

    zero_out_grids();
	
	marymcs.demoApp.oHighlightLayer.destroyFeatures();	
	marymcs.demoApp.map.panTo(new OpenLayers.LonLat(233500,895250));                       // (246000,895250));
	marymcs.demoApp.map.zoomTo(3);

    var oElt;
    oElt = document.getElementById("route_name");
    oElt.selectedIndex = 0; 
		   
    document.getElementById('fetchData').disabled = false;
    
    if (document.getElementById('fetchData').className==='unhidden'){
		unhide('fetchData');	
	}
	
	if (document.getElementById('resetData').className==='unhidden'){
		unhide('resetData');	
	}
    
    CSSClass.add();
}


function popup(mylink, windowname) {
// function responds to link click, pops up window with info about survey
	if (! window.focus){return true;}
        var href;
        href='http://www.ctps.org:8080/geoserver/www/apps/mbtaSurveyApps/description_mod.html';
        window.open(href, windowname, 'width=450,height=500,left=550,top=30,status=no,scrollbars=yes');
        return false;
}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                         2.  	SET UP OPENLAYERS MAP WITH VECTOR LAYERS 
//								AND POPULATE COMBO BOX WITH LIST OF STATIONS

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

marymcs.demoApp.init = function() {
//	Called when .html file loaded--creates map with vector layers and populates combo box
//  with list of BUS ROUTES to be queried.


                var szUrl = marymcs.demoApp.szWFSserverRoot + '?'; 
	//			var szUrl = '/geoserver/wfs?';
                var szParams = szUrl;
                szParams += '&service=wfs';
                szParams += '&version=1.0.0';
                szParams += '&request=getfeature';
                szParams += '&typename=postgis:ctps_mbta_2009bus_keyrt_names';
                szParams += '&propertyname=bus_route_name,route_maj';
 
                var aTemp = [];
                var oTemp = {};
                var oOption = {};
                var i = 0;
				// The following variable was used in this fn, but not declared explicitly.
				// Added explicit declaration. -- BK 09/20/2017
				var oFeature = {};

                OpenLayers.Request.issue({
                        'method': 'GET',
                        'url': szParams,
                        'success': function(oRequest) {
                            var g = new OpenLayers.Format.GML();
                            var aFeatures = g.read(oRequest.responseText);
                            for (i = 0; i < aFeatures.length; i++) {
                                oFeature = aFeatures[i];
                                oTemp = {};                                                            
                                oTemp.station = parseFloat(oFeature.attributes['route_maj']);	
								oTemp.station_order = oFeature.attributes['bus_route_name'];                           
                                aTemp.push(oTemp);								
                            }
									
                        // Sort the results of the WFS request;                                                 
                            aTemp.sort(function(a,b){			                                    //  note:  route name converted to number above, so will sort as numbers	
								var stna = a.station, stnb = b.station;
								if (stna < stnb)
									return -1
								if (stna > stnb)
									return 1
								return 0                                                            //  default value if no sorting
							});
												
                        // Populate the pull down list
                            for (i = 0; i < aTemp.length; i++) {
                                oOption = document.createElement("OPTION");	
								var combined = aTemp[i].station + ', ' + aTemp[i].station_order;						
								oOption.text = combined;
                //                oOption.text = aTemp[i].station_order;                   
                                document.drop_list.route_name.options.add(oOption);  
                            }
                                            
                        },
                        'failure': function(oRequest)
                        {
                            alert("failure populating list of bus routes");
                        }
                });										                                            //  END of OpenLayers request to get station names for combo box
				
				
	
		//	Next, create map with vector layers
			marymcs.demoApp.map = new OpenLayers.Map('map',
				{
					controls: [
						new OpenLayers.Control.Navigation(),
						new OpenLayers.Control.PanZoom()		
					],
					projection: 'EPSG:26986',
					maxResolution: 1000,
					numZoomLevels: 8,
					maxExtent: new OpenLayers.Bounds(131000,820000,360000,990000),
		//			maxExtent: new OpenLayers.Bounds(228000,881625,259250,908500),		
					units: 'm'
				});
			
			var oBaseLayer = new OpenLayers.Layer.WMS(
				"Massachusetts Towns",
				marymcs.demoApp.szWMSserverRoot, 
				{		
					layers: 'postgis:ctps_mbta_2009cr_towns_w_hoods', 
					styles: 'towns_w_hoods_blank'
				}
			);

			var oRoads = new OpenLayers.Layer.WMS(
				"Roadways",
				marymcs.demoApp.szWMSserverRoot,
				{		
					layers: 'postgis:road_inventory_grouped', 
					styles: 'RoadsMultiscaleGroupedBG',
					transparent: 'true'
				}
			);
		
							
			var oRoutes = new OpenLayers.Layer.WMS(
				"All Bus Routes",
				marymcs.demoApp.szWMSserverRoot,
				{		
					layers: 'postgis:ctps_mbta_2009bus_keyrt', 		
					transparent: 'true'
				}
			);
				
	
			//the following style definitions are based on Chapter 10 in "OpenLayers" book:
			var vector_style = new OpenLayers.Style({
				fillColor: "red", 
				fillOpacity: 1, 
				strokeColor: "red", 
				strokeWidth: 3.5
			});
			
			var vector_style_select = new OpenLayers.Style({
				fillColor: "#00b366", 
				fillOpacity: 1, 
				strokeColor: "#00b366", 
				strokeWidth: 3.5
			});
			
			
			var myStyle = new OpenLayers.StyleMap({
				'default': vector_style,
				'select':  vector_style_select
			});
			
		
			marymcs.demoApp.oHighlightLayer = new OpenLayers.Layer.Vector(
				"Highlighted Bus Routes",
				{
						styleMap: myStyle	
				}		
			);
			
			
			//Add a select feature control
		var select_feature_control = new OpenLayers.Control.SelectFeature(
			marymcs.demoApp.oHighlightLayer,
			{
				multiple: false,
				toggle: true,
				multipleKey: 'shiftKey',
				box: true
			}
		);
		marymcs.demoApp.map.addControl(select_feature_control);
		//Activate the control
		select_feature_control.activate();
			
		
		// Alternative scale bar
			var scalebar = new OpenLayers.Control.ScaleBar();
			scalebar.displaySystem = 'english';
			scalebar.divisions = 2;
			scalebar.subdivisions = 2;
			scalebar.showMinorMeasures = false;
			scalebar.singleLine = false;
			scalebar.abbreviateLabel = false;
		//    CTPS.demoApp.map.addControl(scalebar);

			marymcs.demoApp.map.addLayers([oBaseLayer, /* oRoutes, */ oRoads, marymcs.demoApp.oHighlightLayer]);
	//		marymcs.demoApp.map.addControl(new OpenLayers.Control.LayerSwitcher());
			marymcs.demoApp.map.addControl(scalebar);
			
			marymcs.demoApp.map.setCenter(new OpenLayers.LonLat(246000,895250));
			marymcs.demoApp.map.zoomTo(3);
			
};													//		END of INIT function



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                                   3.  SELECT ROUTE FOR WHICH DATA QUERIED

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	
	

marymcs.demoApp.searchForRoute = function() {
// function responds to change in combo box to select route, put in Vector Layer,
// zoom map into selected route, and highlight on screen

	// Added declaration of the following variable. -- BK 09/22/2017
	var oFeature = {};

// initialize variables/data stores
    
	zero_out_grids();
    CSSClass.add();
    
	marymcs.demoApp.oHighlightLayer.destroyFeatures();	
//	marymcs.demoApp.myData.length = 0;	

// get station name from combo box	
	var myselect=document.getElementById("route_name");
	
	var realwords = myselect.value;
	i = realwords.indexOf(',',0);
	var route_no = realwords.substring(0,i);

	
	var szSearchForMe = route_no;

	
	if (szSearchForMe === '') { 
		alert("NO ROUTE SELECTED--TRY AGAIN");
		return;
	}
	
	
//  create WFS query to display route on screen and zoom to it	
	var cqlFilter = "(route_maj=='" + szSearchForMe + "')";	                                    
	
	OpenLayers.Request.issue({
			'method': 'GET',
			'url': marymcs.demoApp.szWFSserverRoot,                   //      '/geoserver/wfs',
			'params': {
				service: 'WFS',
				version: '1.0.0',	
				typename: 'postgis:ctps_mbta_2009bus_keyrt', 
				request: 'getfeature',
				cql_filter: cqlFilter
			},
			'headers': {'content-type' : 'application/xml'},
			'success': function(oRequest) {
				var g = new OpenLayers.Format.GML();
				var aFeatures = g.read(oRequest.responseText);
				
				if (aFeatures.length === 0) {
					alert('no ROUTE with that name found');
					marymcs.demoApp.clear_selection();
					return;
				}

/**** BK attempt to hack on Mary's code - probably to be abandoned.
				
				var szResponse = '';
				// BK 09/22/2017: Destroy any features that may be in the vector layer
				//                before adding those for the currently selected route.
				marymcs.demoApp.oHighlightLayer.destroyFeatures();
				for (var i = 0; i < aFeatures.length; i++) {				
					oFeature = aFeatures[i];
					// Not sure why the next line was present. 
					// It's unnecessary, and has been commented out. -- BK 09/22/2017
					// szResponse += 'ROUTE: ' + oFeature.attributes['route_maj'];
					marymcs.demoApp.oHighlightLayer.addFeatures([oFeature]);			
				}
				
**** END OF BK HACK */
				
				var szResponse = '';
				for (var i = 0; i < aFeatures.length; i++) {				
					oFeature = aFeatures[i];
					szResponse += 'ROUTE: ' + oFeature.attributes['ROUTE_MAJ'];
					marymcs.demoApp.oHighlightLayer.destroyFeatures();
					marymcs.demoApp.oHighlightLayer.addFeatures(oFeature);			
				}
				
				
				var oZoomBounds = marymcs.demoApp.oHighlightLayer.features[0].geometry.getBounds();
	

				marymcs.demoApp.map.zoomToExtent(oZoomBounds);
	
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
		});											                                        //	END OpenLayers Request
};													                                        //	END SearchForRoute function

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                          4.   CONSTRUCT AND RUN QUERY, THEN PARSE RESPONSE INTO DATA STORES

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

marymcs.demoApp.getData = function() {	

	// takes selected route from primary attribute layer when
	// "Get Data" button is clicked, and constructs a single query 
	// for all data items desired, to be run on a single table containing all data, 
	// and then runs the single query. It then parses out the query response, 
	// segment by segment, into a single data store which is re-initialized 
	// after each pass for the different data items. It calls the data grid 
	// function after each pass to read that pass's data store into a 
	// display panel which will be contained in one tab. 
	
	if (marymcs.demoApp.oHighlightLayer.features.length === 0) { 
		alert("No features selected for data request ");
		return;
	}else{	
		var place = marymcs.demoApp.oHighlightLayer.features[0].attributes['route_maj'];
	}
	
    zero_out_grids();
    
//	marymcs.demoApp.myData.length = 0;
		
	var table_route = ''
	
// Set up and run master query to get all data for selected route from 
// the single table containing all Bus survey data

	table_route = 'rt' + place;
	var typename = 'postgis:ctps_mbta_2009bus_315_tbl'; 
	
	var propertyname = 'code,attributevalue,' + table_route + ',line_order';	
	
    //console.log('propertyname = ', propertyname);
	
			var szUrl2 = marymcs.demoApp.szWFSserverRoot + '?';            //      '/geoserver/wms?';
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
					var h = new OpenLayers.Format.GML();
					var aFeatures = h.read(oRequest2.responseText);						
					if (aFeatures.length === 0) {
							alert("No survey data in table for BUS ROUTE " + place + " ; try another BUS ROUTE.");
							marymcs.demoApp.clear_selection();
							return;
						}
					var szResponse2 = '';
	
					
	
	//Parse response data into data store in chunks based on survey question, to be read
	//into 4 separate panels in Tab panel:
    
                 var j, changed1 = [];
                 for(j=0;j <=159; j++){
                        changed1[j] = parseInt(aFeatures[j].attributes['code']);                    //  changed1[j] is the value of 'CODE' in data table--the order in which records SHOULD be read for grids
                 };                                                                                 //  --included because OpenLayers query returns records in random order, not as shown in ArcCatalog data table.... 
	
				//  Panel 1:  Origin towns for selected boarders
					//first, get sum of all boarders to use in calculating percents
                        marymcs.demoApp.storeOrigins.length = 0;
						var sum1 = 0;
						var num_boarders = [];
						var boarders_pct = [];
						var boarders_read = 0;
                        var first_attribute = '';		
                        for (j = 1; j <= 159; j++) {									            //   NOTE:  first record skipped, because just origin number			
							first_attribute = aFeatures[j].attributes['attributevalue'];
							if(first_attribute !== 'attributevalue') {           
								if (changed1[j] < 77){                      						
                                    boarders_read = parseFloat(aFeatures[j].attributes[table_route]);                   
                                    if(boarders_read>0) {
                                        num_boarders[j] = boarders_read;                      
                                        sum1 += num_boarders[j];
                                    }                                                               //  END of loop through origins with boarders                                                                     
                                }                                                                   //  END OF finding correct values of "changed"
                            }                                                                       //  END of excluding first record
                        }							                                                //  END of loop through all possible origin towns
				
				
					//then, do second loop to get individual values, calculate percents, and read into data store
                        for (var j = 1; j <= 159; j++) {								            //  loop through all records for selected board_stn
                            if (changed1[j] < 77){	
							oFeature = aFeatures[j];
							if (oFeature.attributes[table_route]>0) {					            //  only include origin towns that contribute riders to this station								
								if (sum1 !== 0){	
									boarders_pct[j] = num_boarders[j] / sum1;
								} else {
									alert('sum1 = 0');
								}
	
                                var my_record = [];
								if (oFeature.attributes['attributevalue']!=='attributevalue') {							  
                                        my_record[j] = { 'ATTRIBUTEVALUE':  [aFeatures[j].attributes['attributevalue']],
                                                         'TOTAL_BOARDERS':  parseFloat([aFeatures[j].attributes[table_route.toLowerCase()]]).toFixed(0),
                                                         'PERCENT':         (boarders_pct[j]*100).toFixed(1) + '%'}
                                        marymcs.demoApp.storeOrigins.push(my_record[j]);      
								};                                                                  // END write to data store
							  };                                                                    // END scrolling though records that have values for each origin town
							};								                                        // END loop thru only 'origin town' records									
						};									                                        // END loop thru all records for selected table_route
			
			
					// Sort the results of the WFS request in REVERSE ORDER by number of boarders;                                                 
                        marymcs.demoApp.storeOrigins.sort(function(a,b){				
							var stna = parseInt(a['TOTAL_BOARDERS']), stnb = parseInt(b['TOTAL_BOARDERS']);
							if (stna < stnb)
								return 1
							if (stna > stnb)
								return -1
							return 0                                                              //    default value if no sorting
						});	
                           
						marymcs.demoApp.SetupDataGrid(1, place);		                                  //    Setup the first data grid and render it.
				
					
				//  Panel 3:  Frequency of bus use for people boarding                            //    NOTE:  '3' skipped because not worth doing destinations
						marymcs.demoApp.storeFrequency.length = 0;
						
						var sum3 = 0;
						var num_usage = [];
						var usage_pct = [];	
						var usage_read = 0						
                        
                         for (var j = 1; j <= 159; j++) { 								          //    loop through all records for selected board_stn                          
							if (changed1[j] >= 79 && changed1[j] <= 87){                          //    identify and loop through all 'frequency' records for selected board_stn                 
                                usage_read = parseFloat(aFeatures[j].attributes[table_route.toLowerCase()]);			
                                num_usage[j] = usage_read; 			
                                sum3 += num_usage[j];                   
                            };                                                                    //    END of loop through all 'frequency' values 
						};                                                                        //    END of loop through all records 							                                              					

                                               
                        for (var j = 1; j <= 159; j++) {								          //    second loop through all records for selected board_stn 
                             oFeature = aFeatures[j]; 
							 if (changed1[j] >= 79 && changed1[j] <= 87){                         //    second loop through all 'frequency' records for selected board_stn				                                                       
                                // Calculate percentages for each value
                                if (sum3 !== 0){	
                                        usage_pct[j] = num_usage[j] / sum3;	                      //    calculate percent of use frequency for all numerical values of 'frequency'						
                                } else {
                                        alert('sum3 = 0');
                                };
                                                  
                                var my_record2 = [];
                                if (oFeature.attributes['attributevalue']!=='ATTRIBUTEVALUE') {                                        
                                            my_record2[j] = { 'ATTRIBUTEVALUE':     [aFeatures[j].attributes['attributevalue']],
                                                              'TOTAL_BOARDERS':     parseFloat([aFeatures[j].attributes[table_route.toLowerCase()]]).toFixed(0),
                                                              'PERCENT':            (usage_pct[j]*100).toFixed(1) + '%'}                                    
                                            marymcs.demoApp.storeFrequency.push(my_record2[j]);      
                                };                                                                //    END writing to data store                            
                             };                                                                   //    END loop through 'frequency' records
						 };	                                                                      //    END loop through all records
						
						marymcs.demoApp.SetupDataGrid(3, place);		                                  //    go to setup of the 'frequency of use' data grid 
                        
						
				//  Panel 4:  Household vehicles for people boarding at selected station
						marymcs.demoApp.storeVehicles.length = 0;
                        
                         var sum4 = 0, veh_read, num_veh = [], veh_pct = [];
                         
                           for (var j = 1; j <= 159; j++) {								          //    loop through all records for selected board_stn                          
							if (changed1[j] >= 89 && changed1[j] <= 92){                          //    identify and loop through all 'number of vehicles' records for selected board_stn 
                                 veh_read = parseFloat(aFeatures[j].attributes[table_route.toLowerCase()]);			
                                 num_veh[j] = veh_read; 			
                                 sum4 += num_veh[j];
                            };
                        };							                                              //    END of loop through all possible usage values ('no answer' excluded at 78)	                        

                       for (var j = 1; j <= 159; j++) {								              //    second loop through all records for selected board_stn                          
							if (changed1[j] >= 89 && changed1[j] <= 92){                          //    second loop through all 'vehicles'records for selected board_stn                    						
							oFeature = aFeatures[j];

                            if (sum4 !== 0){	
                                   veh_pct[j] = num_veh[j] / sum4;               
                                    } else {
                                        alert('sum4 = 0');
                                    };   
	
                            var my_record3 = [];
                            if (oFeature.attributes['attributevalue']!=='ATTRIBUTEVALUE') {							  
                                        my_record3[j] = { 'ATTRIBUTEVALUE':     [aFeatures[j].attributes['attributevalue']],
                                                          'TOTAL_BOARDERS':     parseFloat([aFeatures[j].attributes[table_route.toLowerCase()]]).toFixed(0),
                                                          'PERCENT':            (veh_pct[j]*100).toFixed(1) + '%' }  
                                        marymcs.demoApp.storeVehicles.push(my_record3[j]);      
                             };                                                                  //    END writing to data store 
                          };							                                         //    END loop through 'vehicles' records
						};	                                                                     //    END of loop through all records	
						
						marymcs.demoApp.SetupDataGrid(4,place);		                                 //    go to setup of the 'vehicles' data grid 
						

				//  Panel 5:  Household income for people boarding at selected station
						marymcs.demoApp.storeIncome.length = 0;
                        
                        var sum5 = 0, income_read, num_income = [], income_pct = [];                        
                
                         for (var j = 1; j <= 159; j++) {								         //     loop through all records for selected board_stn                          
							if (changed1[j] >= 94 && changed1[j] <= 101){                        //     loop through all 'income' records for selected board_stn  				  
                                 income_read = parseFloat(aFeatures[j].attributes[table_route.toLowerCase()]);			
                                 num_income[j] = income_read; 			
                                 sum5 += num_income[j];
                            };                                                                  //      END of loop through all 'income' records
                        };							                                            //      END of loop through all records	 
                        
                        
						for (var j = 1; j <= 159; j++) {								        //      second loop through all records for selected board_stn                          
							if (changed1[j] >= 94 && changed1[j] <= 101){                       //      second loop through all 'income' records for selected board_stn 
                            
                                oFeature = aFeatures[j];
                                
                                // Calculate percentages for each value
                                if (sum5 !== 0){	
                                        income_pct[j] = num_income[j] / sum5;               
                                } else {
                                        alert('sum5 = 0');
                                };                
                                var my_record4 = [];
                                if (oFeature.attributes['attributevalue']!=='ATTRIBUTEVALUE') {							  
                                            my_record4[j] = { 'ATTRIBUTEVALUE':     [aFeatures[j].attributes['attributevalue']],
                                                              'TOTAL_BOARDERS':     parseFloat([aFeatures[j].attributes[table_route.toLowerCase()]]).toFixed(0),
                                                              'PERCENT':            (income_pct[j]*100).toFixed(1) + '%' }                                                            
                                            marymcs.demoApp.storeIncome.push(my_record4[j]);      
                                };                                                              //      END of writing to data store
							};                                                                  //      END of loop through all 'income'records		
						};                                                                      //      END of loop through all records			
											
						marymcs.demoApp.SetupDataGrid(5,place);		                                //     go to setup of the 'income' data grid 
                        
                        
              //  Panel 6:  Mode of access for people boarding at selected station
						marymcs.demoApp.storeAccess.length = 0;
                        
                        var sum6 = 0, access_read, num_access = [], access_pct = [];                        
                

                         for (var j = 0; j <= 159; j++) {								        //      loop through all records for selected board_stn                          
							if (changed1[j] > 101 && changed1[j] < 115){                        //      loop through all 'access' records--NOTE: set to omit last record 'no response'
                                 access_read = parseFloat(aFeatures[j].attributes[table_route.toLowerCase()]);			
                                 num_access[j] = access_read; 			
                                 sum6 += num_access[j];
                            };                                                                  //      END of loop through all 'access' records	
                        };							                                            //      END of loop through all records	 
                        
                        
						for (var j = 0; j <= 159; j++) {								        //      second loop through all records for selected board_stn                          
							if (changed1[j] > 101 && changed1[j] < 115){                        //      second loop through all 'access' records--NOTE: set to omit last record 'no response'                                                 
                                oFeature = aFeatures[j];                                
                                // Calculate percentages for each value
                                if (sum6 !== 0){	
                                        access_pct[j] = num_access[j] / sum6;               
                                    } else {
                                        alert('sum6 = 0');
                                    };                
                                var my_record5 = [];
                                if (oFeature.attributes['attributevalue']!=='ATTRIBUTEVALUE') {							  
                                            my_record5[j] = { 'J_ORDER':            changed1[j],             //  included because need to sort resulting table (not read into datastore 'changed1[j]' order)
                                                              'ATTRIBUTEVALUE':     [aFeatures[j].attributes['attributevalue']],
                                                              'TOTAL_BOARDERS':     parseFloat([aFeatures[j].attributes[table_route.toLowerCase()]]).toFixed(0),
                                                              'PERCENT':            (access_pct[j]*100).toFixed(1) + '%' }                                            
                                            marymcs.demoApp.storeAccess.push(my_record5[j]);           
                                };                                                                //      END of writing to data store
							};                                                                    //      END of loop through all 'mode of access' records	
						};                                                                        //      END of loop through all records
                        
                        
                       // Sort the results of the WFS request in ORDER by changed[j] (order in SDE table, NOT random order retrieved by OpenLayers request);                                                 
                        marymcs.demoApp.storeAccess.sort(function(a,b){				
							var stna = parseInt(a['J_ORDER']), stnb = parseInt(b['J_ORDER']);     //    need to sort this datastore after created, because records read in in 'j' order (random), not changed1[j] order
							if (stna > stnb)
								return 1
							if (stna < stnb)
								return -1
							return 0                                                              //     default value if no sorting
						});	 
											
						marymcs.demoApp.SetupDataGrid(6,place);		                                  //     go to setup of the 'access' data grid 
                        
                        
              // Panel 7: Race of boarders
                        marymcs.demoApp.storeRace.length = 0;
                        
                        var sum7 = 0, race_read, num_race = [], race_pct = [];                        
                

                         for (var j = 0; j <= 159; j++) {								        //      loop through all records for selected board_stn                          
							if (changed1[j] >= 116 && changed1[j] <= 121){                      //      loop through all 'access' records--NOTE: set to omit last record 'no response'
                                 race_read = parseFloat(aFeatures[j].attributes[table_route.toLowerCase()]);			
                                 num_race[j] = race_read; 			
                                 sum7 += num_race[j];
                            };                                                                  //      END of loop through all 'access' records	
                        };							                                            //      END of loop through all records	 
                        
                        
						for (var j = 0; j <= 159; j++) {								        //      second loop through all records for selected board_stn                          
							if (changed1[j] >=116 && changed1[j] <= 121){                        //      second loop through all 'access' records--NOTE: set to omit last record 'no response'                                                 
                                oFeature = aFeatures[j];                                
                                // Calculate percentages for each value
                                if (sum7 !== 0){	
                                        race_pct[j] = num_race[j] / sum7;               
                                    } else {
                                        alert('sum7 = 0');
                                    };                
                                var my_record5 = [];
                                if (oFeature.attributes['attributevalue']!=='ATTRIBUTEVALUE') {							  
                                            my_record5[j] = { 'J_ORDER':            changed1[j],             //  included because need to sort resulting table (not read into datastore 'changed1[j]' order)
                                                              'ATTRIBUTEVALUE':     [aFeatures[j].attributes['attributevalue']],
                                                              'TOTAL_BOARDERS':     parseFloat([aFeatures[j].attributes[table_route.toLowerCase()]]).toFixed(0),
                                                              'PERCENT':            (race_pct[j]*100).toFixed(1) + '%' }                                            
                                            marymcs.demoApp.storeRace.push(my_record5[j]);           
                                };                                                                //      END of writing to data store
							};                                                                    //      END of loop through all 'mode of access' records	
						};                                                                        //      END of loop through all records
                            
                        marymcs.demoApp.SetupDataGrid(7,place);

                        
              
              // Panel 8: Fare type
                        marymcs.demoApp.storeFare.length = 0;
                        
                        var sum8 = 0, fare_read, num_fare = [], fare_pct = [], line_order = [];                        
                

                         for (var j = 0; j <= 159; j++) {								        //      loop through all records for selected board_stn                          
							if (changed1[j] >= 126 && changed1[j] < 151){                        //      loop through all 'access' records--NOTE: set to omit last record 'no response'
                                 fare_read = parseFloat(aFeatures[j].attributes[table_route.toLowerCase()]);			
                                 num_fare[j] = fare_read; 			
                                 sum8 += num_fare[j];
                                 
                //			Leave out group totals for "monthly pass" and "reduced fare", since subtotals are included in count--
                //			avoid double-counting	
                
                                 if(aFeatures[j].attributes['line_order'] === '128'||aFeatures[j].attributes['line_order'] === '140'){                                    
                                    sum8 = sum8 - num_fare[j];
                                 };
                                 
                            };                                                                  //      END of loop through all 'access' records	
                        };							                                            //      END of loop through all records	 
                        
                
                
                        // console.log('sum8 = ', sum8);
                        
                        
						for (var j = 0; j <= 159; j++) {								        //      second loop through all records for selected board_stn                          
							if (changed1[j] >=126 && changed1[j] < 151){                        //      second loop through all 'access' records--NOTE: set to omit last record 'no response'                                                 
                                oFeature = aFeatures[j];                                
                                // Calculate percentages for each value
                                if (sum7 !== 0){	
                                        fare_pct[j] = num_fare[j] / sum8;               
                                    } else {
                                        alert('sum8 = 0');
                                    };                
                                var my_record5 = [];
                                if (oFeature.attributes['attributevalue']!=='ATTRIBUTEVALUE') {							  
                                            my_record5[j] = { 'J_ORDER':            changed1[j],             //  included because need to sort resulting table (not read into datastore 'changed1[j]' order)
                                                              'L_ORDER':            parseInt(aFeatures[j].attributes['line_order']),
                                                              'ATTRIBUTEVALUE':     aFeatures[j].attributes['attributevalue'],
                                                              'TOTAL_BOARDERS':     parseFloat([aFeatures[j].attributes[table_route.toLowerCase()]]).toFixed(0),                                                                                   
                                                              'PERCENT':            (fare_pct[j]*100).toFixed(1) + '%' };
                                                              
                                            if( my_record5[j]['l_order'] === 128|| my_record5[j]['l_order'] === 140 ){                                                
                                                my_record5[j]['total_boarders'] = 0;
                                                my_record5[j]['PERCENT'] = '0.0%';
                                             //   console.log('L order is 128, BOARDERS changed to ', my_record5[j]['TOTAL_BOARDERS']);
                                            }
                                                
                                                              
                                            marymcs.demoApp.storeFare.push(my_record5[j]);           
                                };                                                                //      END of writing to data store
							};                                                                    //      END of loop through all 'mode of access' records	
						};                                                                        //      END of loop through all records
                        
                        // console.log('storeFare: ', marymcs.demoApp.storeFare[6]);
              
                        // 				Sort the results of the WFS request by line_order (2ndth item in data store);                                                 
						marymcs.demoApp.storeFare.sort(function(a,b){                            
							var stna = a['L_ORDER'], stnb = b['L_ORDER'];
                 //           console.log('stna, stnb = ', stna, stnb);
							if (stna < stnb)
								return -1
							if (stna > stnb)
								return 1
							return 0                  					//default value if no sorting
						});
              
              
                        marymcs.demoApp.SetupDataGrid(8,place);	
              
                        
                        
				
			},                                  				                                  //     END SUCCESS of OpenLayers Request
			'failure': function(oRequest2) {
				alert("failure");
			}													                                  //	 END FAILURE of OpenLayers Request
		});														                                  //	 END OpenLayers Request
		

		 document.getElementById('fetchData').disabled = true;
        
		if (document.getElementById('resetData').className==='hidden'){
					unhide('resetData');
			}
		
};																//		END GetData function


///////////////////////////////////////////////////////////////////////////////////////////////////////////

//						5.	INPUT DATA FROM DATA STORE FOR EACH TABLE IN SUCCESSION 
//							(selected using SWITCH(a)), THEN READ INTO INDIVIDUAL PANEL DIVS

////////////////////////////////////////////////////////////////////////////////////////////////////////////

marymcs.demoApp.SetupDataGrid = function(a,place) {
	
	//  Called by function "GetData" after data stores created for each Panel topic 
	//	in turn.  "a" is the variable which identifies which Panel topic is the 
	//	subject of each grid.
	
  
 function addCommas(nStr)
{
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

	 
 // FIVE DIFFERENT PATHS FOR SETTING UP DATA GRID DEPENDING ON WHICH BUTTON CLICKED OR
 // QUESTION ASKED:	
 
	switch(a) {
		
		case 1:                                                             // Station selected is BOARDING station--towns of origin requested   	         
           
                var colDesc1 = [ { header : '<br />ORIGIN TOWNS', 		    dataIndex : 'ATTRIBUTEVALUE', style: 'width: 150px;' }, 
                                { header : 'TOTAL<br />BOARDING',           dataIndex : 'TOTAL_BOARDERS', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer: function(x){if(x==0){return ' '} else {return addCommas(x)}} }, 
                                { header : '<br />PERCENT', 	            dataIndex : 'PERCENT', colstyle: "text-align:right;", style: "text-align:right;width:60px;" } 				
                        ];
        
                var mygrid1 = $('#origin_grid').accessibleGrid(colDesc1,  { 
                                                    tableId 	:	'origin_table',
                                                    col1th		: 	true,
                                                    summary		: 	'Table columns are origin for boarders at selected station, numbers of boarders, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                                    caption		:	'Origin Towns for Route ' + place + ' Boarders <small>(Excludes origins with <0.5%)</small>',    
                                                    style       :   'width: 400px;',
                                                    ariaLive	:	'assertive'												
                                        },
                 marymcs.demoApp.storeOrigins);
    
                 break;
        case 3:                                                             // Station selected is BOARDING station--frequency of boarding requested  	         
        
                var colDesc3 = [ { header : '<br />DAYS PER WEEK',           dataIndex : 'ATTRIBUTEVALUE', style: 'width: 100px;' }, 
                                { header : 'TOTAL <br />BOARDING',          dataIndex : 'TOTAL_BOARDERS', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}} }, 
                                { header : '<br/>PERCENT', 	                dataIndex : 'PERCENT', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0.0%'){return ' '} else {return x}}  } 				
                        ];
        
                var mygrid3 = $('#frequency_grid').accessibleGrid(colDesc3,   { 
                                                    tableId 	:	'frequency_table',
                                                    col1th		: 	true,
                                                    summary		: 	'Table columns are origin for boarders at selected station, numbers of boarders, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                                    caption		:	'Number of Days Per Week Route ' + place + ' Bus Used by Boarders',    
                                                    style       :   'width: 400px;',
                                                    ariaLive	:	'assertive'												
                                        },
                 marymcs.demoApp.storeFrequency);	
		//		 console.log('got through deploy third tab');
                 break;
        case 4:                                                             // Station selected is BOARDING station--number household vehicles requested 	         
        
                var colDesc4 = [ { header : 'VEHICLES<br />PER HH', 		    dataIndex : 'ATTRIBUTEVALUE', style: 'width: 100px;'}, 
                                { header : 'TOTAL<BR/>BOARDING',    dataIndex : 'TOTAL_BOARDERS', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}}  }, 
                                { header : 'PERCENT', 	            dataIndex : 'PERCENT', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0.0%'){return ' '} else {return x}}  } 				
                        ];
        
                var mygrid4 = $('#vehicles_grid').accessibleGrid(colDesc4,                                         { 
                                                    tableId 	:	'vehicles_table',
                                                    col1th		: 	true,
                                                    summary		: 	'Table columns are categories of household vehicle ownership, numbers of bus boarders in each category, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                                    caption		:	'Available Household Vehicles Reported by Route ' + place + ' Boarders',    
                                                    style       :   'width: 400px;',
                                                    ariaLive	:	'assertive'												
                                        },
                 marymcs.demoApp.storeVehicles);	
				
                 break;
        case 5:                                                             // Station selected is BOARDING station--household income requested 	         
        
                var colDesc5 = [ { header : 'INCOME<br />CATEGORY', 		dataIndex : 'ATTRIBUTEVALUE', style: 'width: 100px;' }, 
                                { header : 'TOTAL<br />BOARDING',           dataIndex : 'TOTAL_BOARDERS', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}}  }, 
                                { header : '<br />PERCENT', 	            dataIndex : 'PERCENT', colstyle: "text-align:right;", style: "text-align:right;width:60px;"  } 				
                        ];
        
                var mygrid5 = $('#income_grid').accessibleGrid(colDesc5, 
                                        { 
                                                    tableId 	:	'income_table',
                                                    col1th		: 	true,
                                                    summary		: 	'Table columns are categories of household income, numbers of bus boarders in each category, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                                    caption		:	'Household Income Levels Reported by Route ' + place + ' Boarders',    
                                                    style       :   'width: 400px;',
                                                    ariaLive	:	'assertive'												
                                        },
                 marymcs.demoApp.storeIncome);				
                 break;
                 
       case 6:                                                              // Station selected is BOARDING station--mode of access requested   	         
        
                var colDesc6 = [ { header : '<br />ACCESS MODE', 		    dataIndex : 'ATTRIBUTEVALUE', style: 'width: 100px;' }, 
                                { header : 'TOTAL<br />BOARDING',           dataIndex : 'TOTAL_BOARDERS', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}}  }, 
                                { header : '<br />PERCENT', 	            dataIndex : 'PERCENT', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0.0%'){return ' '} else {return addCommas(x)}}   } 				
                        ];
        
                var mygrid6 = $('#access_grid').accessibleGrid(colDesc6, 
                                        { 
                                                    tableId 	:	'access_table',
                                                    col1th		: 	true,
                                                    summary		: 	'Table columns are modes of access to bus, numbers of boarders reporting each access mode, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                                    caption		:	'Modes of Access to Bus Reported by Route ' + place + ' Boarders',    
                                                    style       :   'width: 400px;',
                                                    ariaLive	:	'assertive'												
                                        },
                 marymcs.demoApp.storeAccess);				
                 break; 

        case 7:                                                              // Station selected is BOARDING station--mode of access requested   	         
        
                var colDesc7 = [ { header : '<br />RACE', 		            dataIndex : 'ATTRIBUTEVALUE', style: 'width: 100px;' }, 
                                { header : 'TOTAL<br />BOARDING',           dataIndex : 'TOTAL_BOARDERS', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}}  }, 
                                { header : '<br />PERCENT', 	            dataIndex : 'PERCENT', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0.0%'){return ' '} else {return addCommas(x)}}   } 				
                        ];
        
                var mygrid7 = $('#race_grid').accessibleGrid(colDesc7, 
                                        { 
                                                    tableId 	:	'race_table',
                                                    col1th		: 	true,
                                                    summary		: 	'Table columns are modes of access to bus, numbers of boarders reporting each access mode, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                                    caption		:	'Race Reported by Route ' + place + ' Boarders <br /><small>(note: boarders could click more than 1 choice; percents here are based on number of CLICKS, and may differ slightly from printed summary percents, which were based on number of RESPONDENTS)</small>',    
                                                    style       :   'width: 400px;',
                                                    ariaLive	:	'assertive'												
                                        },
                 marymcs.demoApp.storeRace);				
                 break;

          case 8:                                                              // Station selected is BOARDING station--mode of access requested 

          function subgroups(val){  
				if(val === "Link (Subway + Bus)"||val === "Zone"||val === "Boat"||val === "Inner Express Bus"||val === "Outer Express Bus"||
					val === "Student"||val === "Senior"||val === "Disability"||val === "Local Bus"||val === "No Pass Selected"||val === "No Reduced Fare Selected"){		
					return '<span style="font-style:italic; margin-left: 3em;">' + val + '</span>';               
				} else {
                    return  val ;
				}    
			}
            
        
                var colDesc8 = [ { header : 'FARE TYPE', 		        dataIndex : 'ATTRIBUTEVALUE', style: 'width: 200px;', renderer: subgroups }, 
                                { header : 'TOTAL<br />BOARDING',           dataIndex : 'TOTAL_BOARDERS', colstyle: "text-align:right", style: "text-align:right;width:60px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}}  }, 
                                { header : '<br />PERCENT', 	            dataIndex : 'PERCENT', colstyle: "text-align:right;", style: "text-align:right;width:60px;", renderer:function(x){if(x=='0.0%'){return ' '} else {return addCommas(x)}}   } 				
                        ];
        
                var mygrid8 = $('#fare_grid').accessibleGrid(colDesc8, 
                                        { 
                                                    tableId 	:	'fare_table',
                                                    col1th		: 	true,
                                                    summary		: 	'Table columns are modes of access to bus, numbers of boarders reporting each access mode, and percent of total. Rows are origin towns in descending order by numbers of boarders',
                                                    caption		:	'Fare type Reported by Route ' + place + ' Boarders ',    
                                                    style       :   'width: 400px;',
                                                    ariaLive	:	'assertive'												
                                        },
                 marymcs.demoApp.storeFare);				
                 break;       

                 
		default:
				alert("No data read into grid");
				break;		
	}                            //  	END of "Switch" statement that renders grids

     CSSClass.remove();
    
}								 //		END of SetUpDataGrid function


//marymcs.demoApp.downloadDataTable = function(){
$(document).ready(function(){ 
 
$('#downloadData1,#downloadData2,#downloadData3').click(function(){
 
    var selected_table = this.id;    
	
	if (document.getElementById('origin_grid').innerHTML===''&& document.getElementById('frequency_grid').innerHTML==='' && document.getElementById('vehicles_grid')==='' && document.getElementById('income_grid')==='' ){
		alert("No data query run yet--\ncomplete Step 3 and \nuse GET DATA to run query \nfor selected town(s).");
		downloadWindow.hide();
	}
      
    var table_choice = '';
    var cqlFilter = '', propertyName = '';
    var szQry = '';
    var typename = 'postgis:ctps_mbta_2009bus_315_tbl'; 
    
    var piece_dom = $('#mytabs ul > li.current').text();  
    table_choice = piece_dom.substring(13);
    
    switch(table_choice) {                                                          //  gets values for displayed table only for selected route
        case 'Origin Towns':                                                       
            cqlFilter = "(code > 0)AND(code<=77)";
            break;
       case 'Frequency':
            cqlFilter = "(code > 78)AND(code<=88)";
            break;
       case 'Vehicles perHousehold':
            cqlFilter = "(code > 88)AND(code<93)";
            break; 
       case 'Household Income':
            cqlFilter = "(code > 93)AND(code<=101)";
            break;
       case 'Mode of Access':
            cqlFilter = "(code > 101)AND(code<=115)";
            break; 
       case 'Race':
            cqlFilter = "(code > 115)AND(code<=121)";
            break; 
       case 'Fare Type':
            cqlFilter = "(code > 125)AND(code<=150)";
            break; 
       default:
            alert('no grid selected');
    }
	    
	var myselect=document.getElementById("route_name");
	var realwords = myselect.value;
	i = realwords.indexOf(',',0);
	var route_no = realwords.substring(0,i);
         
    switch(selected_table){
        case 'downloadData1':  
             propertyName = 'code,attributevalue,' + 'rt' + route_no.toLowerCase();                    //  gets values for displayed table for selected route only
             break;
         case 'downloadData2':              
            // var all_routes = ['RT1,RT57,RT66,RT39,RT77,RT73,RT23,RT22,RT28,RT32,RT116,RT117,RT71,RT15,RT111'];
			var all_routes = ['rt1,rt57,rt66,rt39,rt77,rt73,rt23,rt22,rt28,rt32,rt116,rt117,rt71,rt15,rt111'];
            var propertyName = 'code,attributevalue,' + all_routes;
            break;
        case 'downloadData3':
             cqlFilter = '(code <= 150)';
             var propertyName = 'code,attributevalue,' + 'rt' + route_no.toLowerCase();                    //  gets values for displayed table for selected route only
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
			var szTemp = marymcs.demoApp.szWFSserverRoot + '?';                                                       //      NOTE:  CHANGED TO MAKE DOWNLOAD WORK FROM \\lindalino:8080       
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
	