var CTPS = {};
CTPS.rtSurveyApp = [];
CTPS.rtSurveyApp.myData = [];
CTPS.rtSurveyApp.store = [];
CTPS.rtSurveyApp.grid = [];
CTPS.rtSurveyApp.tabs ={};
var CSSClass = {};

CTPS.rtSurveyApp.szServerRoot = 'http://www.ctps.org:8080/geoserver/'; 
CTPS.rtSurveyApp.szWMSserverRoot = CTPS.rtSurveyApp.szServerRoot + '/wms'; 
CTPS.rtSurveyApp.szWFSserverRoot = CTPS.rtSurveyApp.szServerRoot + '/wfs';


// No sure why Mary defined "place" and "aCaps" globally, but too late to clean things up at this point.
// Needed to define "aLower" and "placeLower" as well, so made these global ... 
// Ugh... would prefer to rewrite the whole kit-and-kaboodle getting rid of these globals, but too late to do so now.
// BK 09/19/2017
var place, placeLower,  aCaps = [], aLower = [];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                         1.  MISCELLANEOUS UTILITY FUNCTIONS

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function translate(value,dec){
	//function 'translate' rounds floating-point numbers to a given number of decimal places OR to integers	
	var first = value*Math.pow(10,dec);
	var second = Math.round(first);
	// if number being rounded to integer, don't divide by 100 to change to percent whole number;
	// otherwise, do divide by 100.
	var changed = 0;
	if(dec>0) {
		changed = second / Math.pow(10,(dec));
	} else {   c
		hanged = second;
	}
	return changed;
}


function change(val){		
	if(val > 0){
		var val1 = val * 100;
		var val2 = translate(val1,1);
		return val2 + "%";
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


function unhide(divID) {
	//function toggles hiding and unhiding the Div with ID = 'report'
	var item = document.getElementById(divID);
	if (item) {
		item.className=(item.className==='hidden')?'unhidden':'hidden';
	}
}
 
function zero_out_grids() {
    // zeroing out old data
	$('#board_grid').html('');
	$('#alight_grid').html('');
	$('#access_grid').html('');
	$('#vehicles_grid').html('');
	$('#income_grid').html('');
	$('#race_grid').html('');
	$('#fare_grid').html('');
}

function reset_stores() {
    // Data "stores" - really just arrays of objects (key/value pairs).
	CTPS.rtSurveyApp.BoardStore = []; 
	CTPS.rtSurveyApp.AccessStore = []; 
	CTPS.rtSurveyApp.VehiclesStore = []; 
	CTPS.rtSurveyApp.IncomeStore = []; 
	CTPS.rtSurveyApp.RaceStore  = []; 
	CTPS.rtSurveyApp.FareStore = []; 
	CTPS.rtSurveyApp.AlightStore = [];
}

function clear_selection() {
	//function resets the 'SELECTED STATION box and the data tab panel. The 
	// 'if' query tests to be sure there is a tab panel rendered before attempting
	// to hide it. If the "div" names are not set to empty strings, the tab
	// panel will hide, but will keep the old data in memory.
	document.getElementById('snName').innerHTML = ' ______ ';	
	
    zero_out_grids();
    reset_stores();
	
	if (CTPS.rtSurveyApp.tabs.rendered){
		CTPS.rtSurveyApp.tabs.hide();
	} else {
		//	alert("?? nothing to clear yet");
	}

	unhide('report');
	
	if (document.getElementById('resetData').className==='unhidden'){
		unhide('resetData');
	}
    
    CSSClass.add();
    
    var oElt;
    oElt = document.getElementById("selected_station");
    oElt.selectedIndex = 0;  
}

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

$(document).ready(function(){ 

    $('#mytabs').click(function(){ 
        var piece_dom = $('#mytabs ul > li.current').text(); 
        var table_choice = piece_dom.substring(13);
        if(table_choice === 'Boarding Stations'){        
            $('#downloadData3').prop('disabled', true);
        } else {      
            $('#downloadData3').prop('disabled', false);
        }       
    });
})
 
 
// Data "stores" - really just arrays of objects (key/value pairs).
CTPS.rtSurveyApp.BoardStore = []; 
CTPS.rtSurveyApp.AccessStore = []; 
CTPS.rtSurveyApp.VehiclesStore = []; 
CTPS.rtSurveyApp.IncomeStore = []; 
CTPS.rtSurveyApp.RaceStore  = []; 
CTPS.rtSurveyApp.FareStore = []; 
CTPS.rtSurveyApp.AlightStore = [];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                                   1.  INIT FUNCTION SETS UP COMBO BOX

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

CTPS.rtSurveyApp.init = function() {
        
   //Populate "select station" combo box.
	var i;        
	var oSelect = document.getElementById("selected_station"); // The <select> element in the HTML page.
	var oOption;  // An <option> to be added to the  <select>.
	for (i = 0; i < appUtils.aTransitStations.length; i++) {           
        oOption = document.createElement("OPTION");
        oOption.value = appUtils.aTransitStations[i];
        oOption.text = appUtils.aTransitStations[i];
        oSelect.options.add(oOption);
    }
	
	// Bind event listeners.
	$('#selected_station').change(CTPS.rtSurveyApp.chosenStation);
	$('#submit02').click(CTPS.rtSurveyApp.goFishForData);
	$('#clear_button').click(clear_selection);    
//    $('#downloadData3').prop('disabled', true);
    
    
}; // CTPS.rtSurveyApp.init()

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                                   2a.  METHOD 1: SELECT STATION BY IMAGE-MAP CLICK

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	

function other_station(my_stn){
	// function identifies desired station from map click and gets BOARD_STATION name
	// from SDE point layer (CTPS_MBTA_TSTATIONS_GL_SQZ). This name will then be read 
	// into a query of a data table (CTPS_MBTA_2009RT_ALL) by column, to get almost
	// all desired data in one call.  
	// If new station clicked while old station data still showing, the
	// first section zeroes out the data in the previous station data tabs

//---------------------------------------------------------------------------------
// zeroing out old data
	zero_out_grids();
    reset_stores();
	
	if (CTPS.rtSurveyApp.tabs.rendered){
		CTPS.rtSurveyApp.tabs.hide();
	}  

    var oElt;
    oElt = document.getElementById("selected_station");
    oElt.selectedIndex = 0; 
	
    CSSClass.add();
    
// moved up here from previous position (at line 263) to be sure it runs before the line selections at transfer stations	
	if (document.getElementById('resetData').className==='unhidden'){
		unhide('resetData');
	}
	
// ------------------------------------------------------------------------------
// identify new station and get "BOARD_" name:

//Switch for transfer stations--need to identify 1 line at stations where there's access to more than 1 line:
//This might ultimately be better done with a 'form' ...
	var color = '';
	switch(my_stn){
	case ('Park Street'):
		//	color = prompt("You have selected a station where people may \nboard either the Red or Green Lines; \nEnter R for Red or G for Green")
		color = prompt("Please enter R for Red or G for Green");
		if (color==='G'|| color==='g') {
			my_stn = 'Park Street (G)';
		} else if (color==='R'|| color==='r'){
			my_stn = 'Park Street (R)';
		} else {
			alert('Need to enter either G or R for Park Street--\nTry selecting station again');
			return;
		}
		break;
	case ('Government Center'):
		//	color = prompt("You have selected a station where people may \nboard either the Green or Blue Lines; \nEnter G for Green or B for Blue")
		color = prompt("Please enter G for Green or B for Blue");
		if (color==='G'|| color==='g') {
			my_stn = 'Government Center (G)';
		} else if (color==='B'||color==='b'){
			my_stn = 'Government Center (B)';
		} else {
			alert('Need to enter either G or B for Government Center--\nTry selecting station again');
			return;
		}
		break;	
	case ('Haymarket'):
		//	color = prompt("You have selected a station where people may \nboard either the Green or Orange Lines; \nEnter G for Green or O for Orange")
		color = prompt("Please enter G for Green or O for Orange");
		if (color==='G'|| color==='g') {
			my_stn = 'Haymarket (G)';
		} else if (color==='O'||color==='o'){
			my_stn = 'Haymarket (O)';
		} else {
			alert('Need to enter either G or O for Haymarket--\nTry selecting station again');
			return;
		}
		break;	
	case ('North Station'):
		//	color = prompt("You have selected a station where people may \nboard either the Green or Orange Lines; \nEnter G for Green or O for Orange")
		color = prompt("Please enter G for Green or O for Orange");
		if (color==='G'|| color==='g') {
			my_stn = 'North Station (G)';
		} else if (color==='O'||color==='o'){
			my_stn = 'North Station (O)';
		} else {
			alert('Need to enter either G or O for North Station--\nTry selecting station again');
			return;
		}
		break;	
	case ('North Station'):
		//	color = prompt("You have selected a station where people may \nboard either the Green or Orange Lines; \nEnter G for Green or O for Orange")
		color = prompt("Please enter G for Green or O for Orange");
		if (color==='G'|| color==='g') {
			my_stn = 'North Station (G)';
		} else if (color==='O'||color==='o'){
			my_stn = 'North Station (O)';
		} else {
			alert('Need to enter either G or O for North Station--\nTry selecting station again');
			return;
		}
		break;	
	case ('Downtown Crossing'):
		//	color = prompt("You have selected a station where people may \nboard either the Red or Orange Lines; \nEnter R for Red or O for Orange")
		color = prompt("Please enter R for Red or O for Orange");
		if (color==='R'|| color==='r') {
			my_stn = 'Downtown Crossing (R)';
		} else if (color==='O'||color==='o'){
			my_stn = 'Downtown Crossing (O)';
		} else {
			alert('Need to enter either R or O for Downtown Crossing--\nTry selecting station again');
			return;
		}
		break;	
	case ('State'):
		//	color = prompt("You have selected a station where people may \nboard either the Blue or Orange Lines; \nEnter B for Blue or O for Orange")
		color = prompt("Please enter B for Blue or O for Orange");
		if (color==='B'|| color==='b') {
			my_stn = 'State (B)';
		} else if (color==='O'||color==='o'){
			my_stn = 'State (O)';
		} else {
			alert('Need to enter either B or O for State Street--\nTry selecting station again');
			return;
		}
		break;	
	case ('Ashmont'):
		//	color = prompt("You have selected a station where people may \nboard either the Red or Mattapan Lines; \nEnter R for Red or M for Mattapan")
		color = prompt("Please enter R for Red or M for Mattapan");
		if (color==='R'|| color==='r') {
			my_stn = 'Ashmont (R)';
		} else if (color==='M'||color==='m'){
			my_stn = 'Ashmont (M)';
		} else {
			alert('Need to enter either R or M for Ashmont--\nTry selecting station again');
			return;
		}
		break;	
	default:
		//	alert("keep going");
		break;
	} // switch
	
	document.getElementById('snName').innerHTML = my_stn;
    CTPS.rtSurveyApp.goFishForData();
} // other_station()
    
//////////////////////////////////////////////////////////////////////////////////////////////////////
//
//                      2b.  METHOD 2:  GET STATION FROM COMBO BOX INSTEAD OF MAP CLICK
//
//////////////////////////////////////////////////////////////////////////////////////////////////////

CTPS.rtSurveyApp.chosenStation = function(){

    // zeroing out old data
	
    zero_out_grids();
    reset_stores();
	
	if (CTPS.rtSurveyApp.tabs.rendered){
		CTPS.rtSurveyApp.tabs.hide();
	}

   CSSClass.add(); 
	
// moved up here from previous position (at line 263) to be sure it runs before the line selections at transfer stations	
	if (document.getElementById('resetData').className==='unhidden'){
		unhide('resetData');
	}

    var myselect = document.getElementById("selected_station");
    for (var i=0; i<myselect.options.length; i++){
		if (myselect.options[i].selected==true){
			var szSearchForMe = myselect.options[i].value;
		break;
		}
	}
       
    document.getElementById('snName').innerHTML = szSearchForMe;
    if (document.getElementById('report').className==='unhidden'){
		unhide('report');
	}

}; // CTPS.rtSurveyApp.chosenStation()
  
CTPS.rtSurveyApp.goFishForData = function(){ 

    zero_out_grids();
    reset_stores();
				
	document.getElementById('snName').className ='line';

	// Set a class value for each possible station selection, so that the station name will be drawn in the line's color.	
	if (document.getElementById('snName').className==='line'){
		var currentStn = $('#snName').html();
		switch(currentStn) {
		case 'Alewife':
		case 'Davis':
		case 'Porter':
		case 'Harvard':
		case 'Central':
		case 'Kendall/MIT':
		case 'Charles/MGH':
		case 'Park Street (R)':
		case 'Downtown Crossing (R)':
		case 'South Station':
		case 'Broadway': 
		case 'Andrew':
		case 'JFK/UMass':
		case 'North Quincy':
		case 'Wollaston':
		case 'Quincy Center':
		case 'Quincy Adams':
		case 'Braintree':
		case 'Savin Hill':
		case 'Shawmut':
	    case 'Fields Corner':
		case 'Ashmont (R)':
			document.getElementById('snName').className = 'red';
			break;
		case 'Ashmont (M)':
		case 'Cedar Grove':
		case 'Butler':
		case 'Milton':
		case 'Central Avenue':
		case 'Valley Road':
		case 'Capen Street':
		case 'Mattapan':
			document.getElementById('snName').className = 'maroon';
			break;
		case 'Lechmere':
		case 'Science Park':
		case 'North Station (G)':
		case 'Haymarket (G)':
		case 'Government Center (G)':
		case 'Park Street (G)':
		case 'Boylston':
		case 'Arlington':
		case 'Copley':
		case 'Hynes Convention Ctr/ICA':
		case 'Kenmore':
		case 'Prudential':
		case 'Symphony':
		case 'B: Blandford to Babcock':
		case 'B: Packards Cnr to Warren':
		case 'B: Washington to Boston College':
		case 'C: St. Marys to Summit/Winchester':
		case 'C: Brandon to Cleveland Cir':
		case 'D: Fenway to Longwood':
		case 'D: Brookline Village to Brookline Hills':
		case 'D: Beaconsfield to Chestnut Hill':
		case 'D: Newton Ctr to Eliot':
		case 'D: Waban to Riverside':
		case 'E: Northeastern to Museum of Fine Arts':
		case 'E: Longwood Medical Area to Brigham Cir':
		case 'E: Fenwood to Heath':
			document.getElementById('snName').className = 'green';
			break;
		case 'Oak Grove':
		case 'Malden Center':
		case 'Wellington':
		case 'Sullivan Square':
		case 'Community College':
		case 'North Station (O)':
		case 'Haymarket (O)':
		case 'State (O)':
		case 'Downtown Crossing (O)':
		case 'Chinatown':
		case 'NE Medical Center':
		case 'Back Bay':
		case 'Massachusetts Ave':
		case 'Ruggles':
		case 'Roxbury Crossing':
		case 'Jackson Square':
		case 'Stony Brook':
		case 'Green Street':
		case 'Forest Hills':
			document.getElementById('snName').className = 'orange';
			break;
		case 'Wonderland':
		case 'Revere Beach':
		case 'Beachmont':
		case 'Suffolk Downs':
		case 'Orient Heights':
		case 'Wood Island':
		case 'Airport':
		case 'Maverick':
		case 'Aquarium':
		case 'State (B)':
		case 'Government Center (B)':
		case 'Bowdoin':
			document.getElementById('snName').className = 'blue';
			break;
		default:
			break;
		} // switch
	} // if
    
    if (document.getElementById('report').className==='hidden'){
		unhide('report');
	}
	
	var cqlFilter = "(display_station=='" + currentStn + "')";	
	
	OpenLayers.Request.issue({
			'method': 'GET',
			'url': CTPS.rtSurveyApp.szWFSserverRoot,                    //                '/geoserver/wfs',
			'params': {
				service: 'WFS',
				version: '1.0.0',	
				typename: 'postgis:ctps_mbta_tstations_gl_sqz',
				request: 'getfeature',
				cql_filter: cqlFilter
			},
			'headers': {'content-type' : 'application/xml'},
			'success': function(oRequest) {
				var g = new OpenLayers.Format.GML();
				var aFeatures = g.read(oRequest.responseText);
				
				if (aFeatures.length === 0) {
					alert('no station with that name found');
					return;
                } else {
        //            alert('number of features found = ' + aFeatures.length);
				}
							
				var szResponse = '';
				var i;
				for (i = 0; i < aFeatures.length; i++) {				
					oFeature = aFeatures[i];
					szResponse += 'station: ' + oFeature.attributes['station'];
					szResponse += '\ndisplay_station:  ' + oFeature.attributes['display_station'];
					szResponse += '\nline: ' + oFeature.attributes['line'];
					
					place = oFeature.attributes['station'];            
					CTPS.rtSurveyApp.getData(place,currentStn);					//   Call function that gets data from data table
				}
			},								//  END 'success'
			'failure': function(oRequest) {
				alert("failure");
			}								//  END 'failure'
		});									//  END OpenLayers.Request.Issue
}; // CTPS.rtSurveyApp.goFishForData()

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                          3.   CONSTRUCT AND RUN QUERY, THEN PARSE RESPONSE INTO DATA STORES

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

CTPS.rtSurveyApp.getData = function(place, currentStn) {
	// function invoked directly from OTHER_STATION function--takes selected
	// station passed in the variable 'place', and constructs a single query 
	// for all data items desired, to be run on a single table containing all data, 
	// and then runs the single query. It then parses out the query response, 
	// segment by segment, into a single data store which is re-initialized 
	// after each pass for the different data items. It calls the data grid 
	// function after each pass to read that pass's data store into a 
	// display panel which will be contained in one tab ("grid-exampleX"). 
	// NOTE: this is different from the original version of this, which read the
	// selected station into a 'highlight layer', then required a button-click
	// on the HTML page to actually get the data by querying the "all" table.
    
	if (CTPS.rtSurveyApp.tabs.rendered){		
		CTPS.rtSurveyApp.tabs.hide();		
	} 
		
	CTPS.rtSurveyApp.myData.length = 0;
		
	var board_stn = '';
	
	// set up and run master query to get all data for selected station from 
	// the single table containing all Rapid Transit survey data

	// BK: 09/01/2017: Down-case "place" to get table column name.
	placeLower = place.toLowerCase();
	
	board_stn = 'board_' + placeLower;
	var typename = 'postgis:ctps_mbta_2009rt_all_redo2';
	var propertyname = 'stationorder,attribute_value,' + board_stn + ',display_station';	

			var szUrl2 = CTPS.rtSurveyApp.szWFSserverRoot + '?'               //       '/geoserver/wms?';
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
					
					var szResponse2 = '';
					
	//Parse response data into data store in chunks based on survey question, to be read
	//into separate panels in Tab panel:	
				//  Panel 1:  Exiting Stations for people boarding at selected statioN
						var sum1 = 0;
						var num_boarders = [];
						var boarders_pct = [];
						var line_order = [];
						var j;
	
						//First get sum of boarders to use in calculating percentages
						for (j = 0; j < 158; j++) {			
							if (aFeatures[j].attributes['stationorder'] > 0 && aFeatures[j].attributes['stationorder'] <= 134) {
								line_order[j] = aFeatures[j].attributes['stationorder'];
								num_boarders[j] = parseFloat(aFeatures[j].attributes[board_stn]);
								sum1 += num_boarders[j];
							}
						}

						//Now, retrieve all values, assign to variables, and write into data store
						var i;
						for (i = 0; i < 158; i++) {	
                            var formatted_pct = 0;
                            var board_stn_number = 0;
							oFeature = aFeatures[i];					
							if(oFeature.attributes['stationorder'] > 0 && oFeature.attributes['stationorder'] <= 134) {						
                                                                 
                                // calculate percentages for all boarding number values
                                        if (sum1 !== 0){
                                            if(num_boarders[i] === 0){
                                                boarders_pct[i] = 0;
                                            } else {
                                                boarders_pct[i] = num_boarders[i] / sum1;
                                            }
                                        } else {
                                            alert('sum1 = 0');
                                        }
                                
                                //  start filling in currentStnrary buffer                                 
                                        aTemp1 = [oFeature.attributes['display_station']];                  //  ITEM 0: Station Name

                                        board_stn_number = parseInt(oFeature.attributes[board_stn],10);
                                        aTemp1.push(board_stn_number);                                      //  ITEM 1: Number Alighting
                           
                                        
                                        if(boarders_pct[i] == 0){                                
                                            formatted_pct = boarders_pct[i];
                                        } else {
                                            formatted_pct = change(boarders_pct[i]);                         //  format non-zero numbers with % sign                                 
                                        }
                                        aTemp1.push(formatted_pct);                                         //  ITEM 2: Percent of Total Alighting                                       
                              	
                                        if(board_stn_number > 0){ CTPS.rtSurveyApp.myData.push(aTemp1)};	
                           
							}									// End scrolling through "exiting station" records
								
						  // Sort the results of the WFS request by alightings (ITEM 1) in REVERSE ORDER;                                                 
							CTPS.rtSurveyApp.myData.sort(function(a,b){				
								var stna = parseInt(a[1]), stnb = parseInt(b[1]);
								if (stna > stnb)
									return -1
								if (stna < stnb)
									return 1
								return 0                  		//default value if no sorting
							});                         					
						}										// End scrolling through ALL records
                
                        //  Create new database store (BoardStore)  as JSON-type structure:                                
                        var my_record = [];
                        var dblength = CTPS.rtSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'display_station':  CTPS.rtSurveyApp.myData[j][0],
                                                    'total_borders':   CTPS.rtSurveyApp.myData[j][1],
                                                    'percent':          CTPS.rtSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.rtSurveyApp.myData[j][3]
                                }; 
                                CTPS.rtSurveyApp.BoardStore.push(my_record[j]);                                                                
                         }
    
						CTPS.rtSurveyApp.SetupDataGrid(1,currentStn);		// Setup the ExtJS data grid and render it.
                        
				//  Panel 2:  Access modes for people boarding at selected station
						CTPS.rtSurveyApp.myData.length = 0;
						
						var sum2 = 0;
						var num_mode = [];
						var mode_pct = [];					
						for (j = 0; j < 158; j++) {
							if (aFeatures[j].attributes['stationorder'] > 213 && aFeatures[j].attributes['stationorder'] <= 312){
								num_mode[j] = parseFloat(aFeatures[j].attributes[board_stn]);
								sum2 += num_mode[j];
							}
						}
					
						for (i = 0; i < 158; i++) {							
								oFeature = aFeatures[i];
								if(oFeature.attributes['stationorder'] > 213 && oFeature.attributes['stationorder'] <= 312) {
									
								if (i > 0) {                                  // Skip first record, which is just station_order number
									
									if (sum2 !== 0){	
										mode_pct[i] = num_mode[i] / sum2;
									} else {
										alert('sum2 = 0');
									}
																	
									aTemp2 = [oFeature.attributes['attribute_value']];	
                                    
                                    board_stn_number = parseInt(oFeature.attributes[board_stn],10);
                                    aTemp2.push(board_stn_number);                                    								
                                    
                                    if(mode_pct[i] == 0){                                
                                        formatted_pct = mode_pct[i];
                                    } else {
                                        formatted_pct = change(mode_pct[i]);    //  format non-zero numbers with % sign                                 
                                    }
                                    aTemp2.push(formatted_pct);                               
                                  		
									CTPS.rtSurveyApp.myData.push(aTemp2);
								}
							}
						}	                                    //  End of scrolling through all records
                        
                        //  Create new database store (AccessStore)  as JSON-type structure:   
                        var my_record = [];
                        var dblength = CTPS.rtSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'attribute_value':  CTPS.rtSurveyApp.myData[j][0],
                                                    'total_borders':   CTPS.rtSurveyApp.myData[j][1],
                                                    'percent':          CTPS.rtSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.rtSurveyApp.myData[j][3]
                                }; 
                                CTPS.rtSurveyApp.AccessStore.push(my_record[j]);                                                                
                         }	                      					
						
						CTPS.rtSurveyApp.SetupDataGrid(2,currentStn);					// Setup the ExtJS data grid and render it.
					
				//  Panel 3:  Household vehicles for people boarding at selected station
						CTPS.rtSurveyApp.myData.length = 0;
                        
                        var sum3 = 0;
						var num_veh = [];
						var veh_pct = [];					
						for (j = 0; j < 158; j++) {
							if (aFeatures[j].attributes['stationorder'] > 313 && aFeatures[j].attributes['stationorder'] <= 317){
								num_veh[j] = parseFloat(aFeatures[j].attributes[board_stn]);
								sum3 += num_veh[j];
							}
						}
                        
						
						for (i = 0; i < 158; i++) {								
							oFeature = aFeatures[i];
							if(oFeature.attributes['stationorder'] > 313 && oFeature.attributes['stationorder'] <= 317) {	

                                    if (sum3 !== 0){	
										veh_pct[i] = num_veh[i] / sum3;
									} else {
										alert('sum3 = 0');								
                                    }
									
									if (oFeature.attributes['attribute_value'] === 'Zero Vehicle Households') { oFeature.attributes['attribute_value'] = '0 Vehicles';}
									if (oFeature.attributes['attribute_value'] === '1 Vehicle Households') { oFeature.attributes['attribute_value'] = '1 Vehicle';}
									if (oFeature.attributes['attribute_value'] === '2 Vehicle Households') { oFeature.attributes['attribute_value'] = '2 Vehicles';}
									if (oFeature.attributes['attribute_value'] === '3 Vehicle Households') { oFeature.attributes['attribute_value'] = '3+ Vehicles';}                                     
									aTemp3 = [oFeature.attributes['attribute_value']];	

                                    board_stn_number = parseInt(oFeature.attributes[board_stn],10);
                                    aTemp3.push(board_stn_number);  

                                    if(veh_pct[i] == 0){                                
                                        formatted_pct = veh_pct[i];
                                    } else {
                                        formatted_pct = change(veh_pct[i]);    //  format non-zero numbers with % sign                                 
                                    }
                                    aTemp3.push(formatted_pct);    
                                    								
									CTPS.rtSurveyApp.myData.push(aTemp3);			
							}												//  End of scrolling through "vehicles/hh" records
						}													//  End of scrolling through ALL records
                        
                        //  Create new database store (AccessStore)  as JSON-type structure:   
                        var my_record = [];
                        var dblength = CTPS.rtSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'attribute_value':  CTPS.rtSurveyApp.myData[j][0],
                                                    'total_borders':   CTPS.rtSurveyApp.myData[j][1],
                                                    'percent':          CTPS.rtSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.rtSurveyApp.myData[j][3]
                                }; 
                                CTPS.rtSurveyApp.VehiclesStore.push(my_record[j]);                                                                
                         }	          
                        		
						CTPS.rtSurveyApp.SetupDataGrid(3,currentStn);					//  Setup the ExtJS data grid and render it.
					
				//  Panel 4:  Household income for people boarding at selected station
						CTPS.rtSurveyApp.myData.length = 0;
						szResponse2 = '';
                        
                        var sum4 = 0;
						var num_inc = [];
						var inc_pct = [];					
						for (j = 0; j < 158; j++) {
							if (aFeatures[j].attributes['stationorder'] > 317 && aFeatures[j].attributes['stationorder'] <= 326){
								num_inc[j] = parseFloat(aFeatures[j].attributes[board_stn]);
								sum4 += num_inc[j];
							}
						}
                        
						for (i = 0; i < 158; i++) {						
								oFeature = aFeatures[i];								
								if(oFeature.attributes['stationorder'] > 317 && oFeature.attributes['stationorder'] <= 326) {

                                    if (sum4 !== 0){	
										inc_pct[i] = num_inc[i] / sum4;
									} else {
										alert('sum4 = 0');								
                                    }
									
									// two category labels modified to fit on graph	
									if (oFeature.attributes['attribute_value'] === 'Under $20K') { oFeature.attributes['attribute_value'] = 'Under $20k';}
									if (oFeature.attributes['attribute_value'] === 'Over $100K') { oFeature.attributes['attribute_value'] = 'Over $100K';}
									
									szResponse2 += '\nnumber_of_hh: ' + oFeature.attributes[board_stn] + '\n\n';
									//don't include "not checked" in final graph
									if (oFeature.attributes['attribute_value'] !== 'Not checked') {   
										aTemp4 = [oFeature.attributes['attribute_value']];

                                        board_stn_number = parseInt(oFeature.attributes[board_stn],10);
                                        aTemp4.push(board_stn_number);  

                                        if(inc_pct[i] == 0){                                
                                            formatted_pct = inc_pct[i];
                                        } else {
                                            formatted_pct = change(inc_pct[i]);    //  format non-zero numbers with % sign                                 
                                        }
                                        aTemp4.push(formatted_pct);                
											
										CTPS.rtSurveyApp.myData.push(aTemp4);
									}
								}										//  End of scrolling through "income" records
						}												//  End of scrolling through ALL records
                        
                        
                        //  Create new database store (IncomeStore)  as JSON-type structure:   
                        var my_record = [];
                        var dblength = CTPS.rtSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'attribute_value':  CTPS.rtSurveyApp.myData[j][0],
                                                    'total_borders':   CTPS.rtSurveyApp.myData[j][1],
                                                    'percent':          CTPS.rtSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.rtSurveyApp.myData[j][3]
                                }; 
                                CTPS.rtSurveyApp.IncomeStore.push(my_record[j]);                                                                
                         }	     
                                          		
						CTPS.rtSurveyApp.SetupDataGrid(4,currentStn);				// Setup the ExtJS data grid and render it.
                        					
				//  Panel 5:  Reported Race of People Boarding at Selected Station
					CTPS.rtSurveyApp.myData.length = 0;
					szResponse2 = '';
					var sum5 = 0;
					
					var num_race = [];
                    var race_pct = [];
                    var j;	
                    for (j = 0; j < 158; j++) {	
                        if (aFeatures[j].attributes['stationorder'] > 326 && aFeatures[j].attributes['stationorder'] < 333) {
                            num_race[j] = parseFloat(aFeatures[j].attributes[board_stn]);
                            sum5 += num_race[j];
                        }
					}			
									
					for (i = 0; i < 158; i++) {						
								oFeature = aFeatures[i];								
								if(oFeature.attributes['stationorder'] > 326 && oFeature.attributes['stationorder'] < 333) {
                                
                                    if (sum5 !== 0){	
										race_pct[i] = num_race[i] / sum5;
									} else {
										alert('sum5 = 0');								
                                    }                                    
									
									//don't include "not checked" in final graph
									if (oFeature.attributes['attribute_value'] !== 'Not checked') {  
                                    
										aTemp5 = [aFeatures[i].attributes['attribute_value']];

                                        board_stn_number = parseInt(oFeature.attributes[board_stn],10);
                                        aTemp5.push(board_stn_number);  
										

                                        if(race_pct[i] == 0){                                
                                            formatted_pct = race_pct[i];
                                        } else {
                                            formatted_pct = change(race_pct[i]);    //  format non-zero numbers with % sign                                 
                                        }
                                        aTemp5.push(formatted_pct);    
                                        
										CTPS.rtSurveyApp.myData.push(aTemp5);
									}
								}										//  End of scrolling through "race" records
							}											//  End of scrolling through ALL records
                            
                            
                             //  Create new database store (RaceStore)  as JSON-type structure:   
                            var my_record = [];
                            var dblength = CTPS.rtSurveyApp.myData.length;                 
                            for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'attribute_value':  CTPS.rtSurveyApp.myData[j][0],
                                                    'total_borders':   CTPS.rtSurveyApp.myData[j][1],
                                                    'percent':          CTPS.rtSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.rtSurveyApp.myData[j][3]
                                }; 
                                CTPS.rtSurveyApp.RaceStore.push(my_record[j]);                                                                
                             }	     
                            		
						CTPS.rtSurveyApp.SetupDataGrid(5,currentStn);				// Setup the ExtJS data grid and render it.				
			
			//  Panel 6:  Fare Types and Pass Usage
					CTPS.rtSurveyApp.myData.length = 0;
					szResponse2 = '';
					var sum6 = 0;
					
					var num_fare = [];
					var fare_pct = [];
					var line_order = [];
					var j;

				//          First get overall sum of responses for use in calculating percentages--DON'T DOUBLE-COUNT
				//			"monthly pass" total and "reduced fare" total with subgroup breakdowns
					for (j = 0; j < 158; j++) {		
						if (aFeatures[j].attributes['stationorder'] > 336 && aFeatures[j].attributes['stationorder'] < 361) {
			
							num_fare[j] = parseFloat(aFeatures[j].attributes[board_stn]);		
							sum6 += num_fare[j];
							
			//			Leave out group totals for "monthly pass" and "reduced fare", since subtotals are included in count--
			//			avoid double-counting								
							if(parseFloat(aFeatures[j].attributes['stationorder']) === 339.0) {			//  "monthly pass" total
								sum6 = sum6 - num_fare[j];
							}
							if(parseFloat(aFeatures[j].attributes['stationorder']) === 350.0) {			//  "reduced fare" total
								sum6 = sum6 - num_fare[j];
							}
													
						}					//  END OF LOOP THROUGH 'FARE' RECORDS													
					}						//  END OF LOOP THROUGH ALL RECORDS
					

			//			Now: go through and collect the "fare" values and write into data store						
						for (i = 0; i < 158; i++) {							
							oFeature = aFeatures[i];
							if(oFeature.attributes['stationorder'] > 336 && oFeature.attributes['stationorder'] < 361) {										
									line_order[i] = oFeature.attributes['stationorder'];										
			
			//			Calculate percentage for each line, but set the "monthly pass" and "reduced fare" totals to 0
			//			(values will be shown in the subgroups under each of these totals)
									if (sum6 !== 0){	
										fare_pct[i] = num_fare[i] / sum6;
										if(parseFloat(line_order[i]) === 339.0 || parseFloat(line_order[i]) === 350.0) { 										
											fare_pct[i] = 0; 
											num_fare[i] = 0; 		
										}										
									} else {
										alert('sum6 = 0');
                                    }
																				
									if (oFeature.attributes['attribute_value'] !== 'Not checked') {  
                                    
										aTemp6 = [aFeatures[i].attributes['attribute_value']];                                        
                    
             //         Convert floating-point number of boarders (used for percent calc) to integer before pushing into array
                                        board_stn_number = parseInt(num_fare[i]);
                                        aTemp6.push(board_stn_number);  										

                                        if(fare_pct[i] == 0){                                
                                            formatted_pct = fare_pct[i];
                                        } else {
                                            formatted_pct = change(fare_pct[i]);    //  format non-zero numbers with % sign                                 
                                        }
                                        aTemp6.push(formatted_pct);                                                                              
                                     
                                        aTemp6.push(line_order[i]);
										CTPS.rtSurveyApp.myData.push(aTemp6);
									}
							}											//	End of scrolling through "fare" records	
						}												//	End of scrolling through ALL records
						

		// 				Sort the results of the WFS request by line_order (4th item in data store);                                                 
						CTPS.rtSurveyApp.myData.sort(function(a,b){				
							var stna = parseInt(a[3]), stnb = parseInt(b[3]);
							if (stna < stnb)
								return -1
							if (stna > stnb)
								return 1
							return 0                  					//default value if no sorting
						});
                        
                         //  Create new database store (RaceStore)  as JSON-type structure:   
                            var my_record = [];
                            var dblength = CTPS.rtSurveyApp.myData.length;                 
                            for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'attribute_value':  CTPS.rtSurveyApp.myData[j][0],
                                                    'total_borders':   CTPS.rtSurveyApp.myData[j][1],
                                                    'percent':          CTPS.rtSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.rtSurveyApp.myData[j][3]
                                }; 
                                CTPS.rtSurveyApp.FareStore.push(my_record[j]);                                                              
                             }	     
                   
						CTPS.rtSurveyApp.SetupDataGrid(6,currentStn);				// Setup the ExtJS data grid and render it.				
																
		//				Invoke separate subroutine which reads data ROWS instead of COLUMNS to get boarding stations for
		//				people exiting at selected station
						CTPS.rtSurveyApp.BackwardsTable(board_stn);
					
				},														//  END success
				'failure': function(oRequest2) {
					alert("failure");
				}
			});															//  END OpenLayers.Request.Issue
					
            CSSClass.remove();
            
			if (document.getElementById('resetData').className==='hidden'){
					unhide('resetData');
			}
			
}; // CTPS.rtSurveyApp.getData() 	
		

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

//					4. RUN 'BACKWARDS' TABLE:  ISSUES A QUERY OF ROWS, RATHER THAN COLUMNS,
//					   TO GET THE DISTRIBUTION OF BOARDING STATIONS FOR PEOPLE EXITING AT 
//					   SELECTED STATION

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

CTPS.rtSurveyApp.BackwardsTable = function(board_stn){

	var currentStn = document.getElementById('snName').innerHTML;

	CTPS.rtSurveyApp.myData.length = 0;

	// Yeech: The "board_stn" parameter has the form "board_<station_name>".
	// The substr() call in the next line is Mary's way of extracting <station_name> from it.
	// BK 09/19/2017
	var board_stn_rev = board_stn.substr(6);
	var szSearchForMe = board_stn_rev;
	
	// In PostgreSQL-land, column names such as "board_station" are in lower case.
	// These were in upper case in Oralce land.
	// Because station-name attribute values are kept in upper case, we have to up-case "szSearchForMe".
	// Clear as mud, no?
	// BK 09/19/2017
	szSearchForMe = szSearchForMe.toUpperCase();

	CTPS.rtSurveyApp.myData.length = 0;

	if (szSearchForMe === '') { 
		alert("NO STATION SELECTED--TRY AGAIN");
		return;
	}

	var cqlFilter = "(attribute_value='" + szSearchForMe + "')";

	//NOTE: simplified query without 'params', other items--just URL
	var szQry = CTPS.rtSurveyApp.szWFSserverRoot + '?'                              //       '/geoserver/wfs?';
	szQry += "request=getfeature&version=1.0.0&service=wfs&";
	szQry += "typename=postgis:ctps_mbta_2009rt_all_redo2&" ;
	szQry += "CQL_filter=" + cqlFilter;

	OpenLayers.Request.issue({
		//	'method': 'POST',
			'url': szQry,		
			'success': function(oRequest) {
					var aTemp7 = [];
					var h = new OpenLayers.Format.GML();
					var aFeatures = h.read(oRequest.responseText);					
					var szResponse2 = '';			
				
					if (aFeatures.length === 0) {
						alert('CTPS.rtSurveyApp.BackwardsTable: no station with that name found');
						return;
					}
								
					//array contains display names to be shown in column of final table--no easy way to get these from data without re-querying			
					var aNames = [];
					aNames = ['Alewife','Davis','Porter','Harvard','Central','Kendall/MIT','Charles/MGH','Park Street (R)','Downtown Crossing (R)','South Station',
					'Broadway','Andrew','JFK/UMass','Savin Hill','Fields Corner','Shawmut','Ashmont (R)','North Quincy','Wollaston','Quincy Center',
					'Quincy Adams','Braintree','Lechmere','Science Park','North Station (G)','Haymarket (G)','Government Center (G)','Park Street (G)','Boylston','Arlington',
					'Copley','Hynes Convention Ctr/ICA','Kenmore','Prudential','Symphony','Oak Grove','Malden','Wellington','Sullivan Square','Community College',
					'North Station (O)','Haymarket (O)','State (O)','Downtown Crossing (O)','Chinatown','NE Medical Center','Back Bay','Massachusetts Ave','Ruggles','Roxbury Crossing',
					'Jackson Square','Stony Brook','Green Street','Forest Hills','Wonderland','Revere Beach','Beachmont','Suffolk Downs','Orient Heights','Wood Island',
					'Airport','Maverick','Aquarium','State (B)','Government Center (B)','Bowdoin','Cedar Grove','Butler','Milton','Central Avenue',
					'Valley Road','Capen Street','Mattapan','Ashmont (M)',
					'B: Blandford to Babcock','B: Packards Cnr to Warren','B: Washington to Boston College',
					'C: St. Mary"s to Summit/Winchester','C: Brandon to Cleveland Cir',
					'D: Fenway to Longwood','D: Brookline Village to Brookline Hills','D: Beaconsfield to Chestnut Hill',
					'D: Newton Ctr to Eliot','D: Waban to Riverside',
					'E: Northeastern to Museum of Fine Arts','E: Longwood Medical Area to Brigham Cir','E: Fenwood to Heath'
					];

					//array contains 'BOARD_(station)' names to use in identifying items in data array--no way to do this without enumerating into array
					aCaps = [];
					aCaps = ['BOARD_ALEWIFE','BOARD_DAVIS','BOARD_PORTER','BOARD_HARVARD','BOARD_CENTRAL','BOARD_KENDALL_MIT','BOARD_CHARLES_MGH','BOARD_PARK_STREET_R','BOARD_DOWNTOWN_CROSSING_R','BOARD_SOUTH_STATION',
					'BOARD_BROADWAY','BOARD_ANDREW','BOARD_JFK_UMASS','BOARD_SAVIN_HILL','BOARD_FIELDS_CORNER','BOARD_SHAWMUT','BOARD_ASHMONT_R','BOARD_NORTH_QUINCY','BOARD_WOLLASTON','BOARD_QUINCY_CENTER',
					'BOARD_QUINCY_ADAMS','BOARD_BRAINTREE','BOARD_LECHMERE','BOARD_SCIENCE_PARK','BOARD_NORTH_STATION_G','BOARD_HAYMARKET_G','BOARD_GOVERNMENT_CENTER_G','BOARD_PARK_STREET_G','BOARD_BOYLSTON','BOARD_ARLINGTON',
					'BOARD_COPLEY','BOARD_HYNES_CONVENTION_CENTER','BOARD_KENMORE','BOARD_PRUDENTIAL','BOARD_SYMPHONY','BOARD_OAK_GROVE','BOARD_MALDEN_CENTER','BOARD_WELLINGTON','BOARD_SULLIVAN_SQUARE','BOARD_COMMUNITY_COLLEGE',
					'BOARD_NORTH_STATION_O','BOARD_HAYMARKET_O','BOARD_STATE_O','BOARD_DOWNTOWN_CROSSING_O','BOARD_CHINATOWN','BOARD_NE_MEDICAL_CENTER','BOARD_BACK_BAY','BOARD_MASSACHUSETTS_AVE','BOARD_RUGGLES','BOARD_ROXBURY_CROSSING',
					'BOARD_JACKSON_SQUARE','BOARD_STONY_BROOK','BOARD_GREEN_STREET','BOARD_FOREST_HILLS','BOARD_WONDERLAND','BOARD_REVERE_BEACH','BOARD_BEACHMONT','BOARD_SUFFOLK_DOWNS','BOARD_ORIENT_HEIGHTS','BOARD_WOOD_ISLAND',
					'BOARD_AIRPORT','BOARD_MAVERICK','BOARD_AQUARIUM','BOARD_STATE_B','BOARD_GOVERNMENT_CENTER_B','BOARD_BOWDOIN','BOARD_CEDAR_GROVE','BOARD_BUTLER','BOARD_MILTON','BOARD_CENTRAL_AVE',
					'BOARD_VALLEY_RD','BOARD_CAPEN_ST','BOARD_MATTAPAN','BOARD_ASHMONT_M',
					'BOARD_GREENB_01','BOARD_GREENB_02','BOARD_GREENB_03',
					'BOARD_GREENC_01','BOARD_GREENC_02',
					'BOARD_GREEND_01','BOARD_GREEND_02','BOARD_GREEND_03',
					'BOARD_GREEND_04','BOARD_GREEND_05',
					'BOARD_GREENE_01','BOARD_GREENE_02','BOARD_GREENE_03'
					];	

					// Ah, but in PostgreSQL world, column names are in lower case...
					// I'm leaving the definition of "aCaps", above, in place to provide context
					// just in case the next person to debug this code might need it.
					// BK 09/19/2017
					var aLower = aCaps.map(function(x) { return x.toLowerCase(); });
				
					//this loop is necessary to compute a sum of all boarders, which is used in the next 
					//step to compute percentage of all boardings represented by each boarding station.
					var sum7 = 0;
					var i;
					var j;
                    var board_stn_number;
					var num_boarders = [];
					var boarders_pct = [];
					for (j = 0; j < 87; j++) {
						num_boarders[j] = parseFloat(aFeatures[0].attributes[aLower[j]]);
						sum7 += num_boarders[j];		
					}
						
					//this loop solves the problem of having one long 'item' in data store, instead of a separate item for each station--
					//have to "push" the values one at a time, apparently....
					for (i=0; i< aLower.length;i++){
                    
                        board_stn_number = parseInt(aFeatures[0].attributes[aLower[i]],10);                       
                                         
						boarders_pct[i] = num_boarders[i] / sum7;
                        if(boarders_pct[i] == 0){                                
                            formatted_pct = boarders_pct[i];
                        } else {
                            formatted_pct = change(boarders_pct[i]);    //  format non-zero numbers with % sign                                 
                        }     
                        
						aTemp7 = [aNames[i], board_stn_number, formatted_pct];
                        
						if(board_stn_number > 0){                        
                            CTPS.rtSurveyApp.myData.push(aTemp7);
                        }
					}
                    
                    
                     // Sort the results of the WFS request by alightings (ITEM 1) in REVERSE ORDER;                                                 
                        CTPS.rtSurveyApp.myData.sort(function(a,b){				
                            var stna = parseInt(a[1]), stnb = parseInt(b[1]);
                            if (stna > stnb)
                                return -1
                            if (stna < stnb)
                                return 1
                            return 0                  		//default value if no sorting
                        });        
                
                       //  Create new database store (AlightStore)  as JSON-type structure:                                
                        var my_record = [];
                        var dblength = CTPS.rtSurveyApp.myData.length;                 
                        for (j = 0; j < dblength; j++) {                   
                                 my_record[j] =  {  'display_station':  CTPS.rtSurveyApp.myData[j][0],
                                                    'total_borders':   CTPS.rtSurveyApp.myData[j][1],
                                                    'percent':          CTPS.rtSurveyApp.myData[j][2]
                                    //                'line_order':       CTPS.rtSurveyApp.myData[j][3]
                                }; 
                                CTPS.rtSurveyApp.AlightStore.push(my_record[j]);                                                                
                         }
                    
					CTPS.rtSurveyApp.SetupDataGrid(7,currentStn);						// Setup the data grid and render it.

		
			},       //				END Success
			'failure': function(oRequest) {
				alert("failure");
			}		//				END 'failure'
		});			//				END OpenLayers.Request.Issue
};	// END function CTPS.rtSurveyApp.BackwardsTable()

CTPS.rtSurveyApp.initializeDataStores = function() {	
    alert('nothing in initialize Data Stores')
}; // CTPS.rtSurveyApp.initializeDataStores()

////////////////////////////////////////////////////////////////////////////////////////////////////////////

//						5.	INPUT DATA FROM DATA STORE FOR EACH TABLE IN SUCCESSION 
//							(selected using SWITCH(a)), THEN READ INTO INDIVIDUAL PANEL DIVS

////////////////////////////////////////////////////////////////////////////////////////////////////////////

CTPS.rtSurveyApp.SetupDataGrid = function(a,currentStn) {
 
        switch(a){
		case 1:										//EXITING stations for given BOARDING station
			var colDesc = [ { header : 'EXITING STATION', 		dataIndex : 'display_station', style: 'width: 150px;' }, 
							{ header : 'TOTAL',                 dataIndex : 'total_borders', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}}  }, 
							{ header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x=='0'){return ' '} else {return x}}  } 
					   //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
					];
	
			var mygrid1 = $('#board_grid').accessibleGrid(colDesc, 
									{ 
												tableId 	:	'board_table',
												col1th		: 	true,
												summary		: 	'Table columns are exiting stations for boarders at selected station, numbers of boarders, and percent of total. Rows are individual exiting stations',
												caption		:	'Exiting stations for Boarders at ' + currentStn,
												style       :   'width: 420px;',
												ariaLive	:	'assertive'												
									},
									CTPS.rtSurveyApp.BoardStore);					
			break;
                    
		case 2:										//ACCESS MODES for people BOARDING at selected station
			var colDesc = [ { header : 'ACCESS MODE', 		    dataIndex : 'attribute_value', style: 'width: 150px;' }, 
							{ header : 'TOTAL',                 dataIndex : 'total_borders', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}} }, 
							{ header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x=='0'){return ' '} else {return x}} } 
					   //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
					];
	
			var mygrid2 = $('#access_grid').accessibleGrid(colDesc, { 
												tableId 	:	'access_table',
												col1th		: 	true,
												summary		: 	'Table columns are station access modes used by boarders at selected station, numbers of boarders, and percent of total. Rows are access modes such as walk, drive, carpool',
												caption		:	'Modes of Station Access for Boarders at ' + currentStn,
												style       :   'width: 380px;',
												ariaLive	:	'assertive'												
									},
									CTPS.rtSurveyApp.AccessStore);								
				break;
                    
           case 3:											// VEHICLES PER HOUSEHOLD table for people BOARDING at selected station	
			var colDesc = [ { header : 'VEHICLES PER HH', 		    dataIndex : 'attribute_value',style: 'width: 150px;' }, 
							{ header : 'TOTAL',                 dataIndex : 'total_borders', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}} }, 
							{ header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:80px;" , renderer:function(x){if(x=='0'){return ' '} else {return x}} } 
					   //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
					];
	
			var mygrid3 = $('#vehicles_grid').accessibleGrid(colDesc, { 
												tableId 	:	'vehicles_table',
												col1th		: 	true,
												summary		: 	'Table columns are vehicles per household for boarders at selected station, numbers of boarders, and percent of total. Rows are zero, one, two, or three plus vehicles',
												caption		:	'Vehicles per Household for Boarders at ' + currentStn,
												style		:   'width: 380px;',
												ariaLive	:	'assertive'												
									},
									CTPS.rtSurveyApp.VehiclesStore);						
            break;
                    
		case 4:										//  HOUSEHOLD INCOME for people BOARDING at selected station	
			var colDesc = [ { header : 'HOUSEHOLD INCOME', 		    dataIndex : 'attribute_value',style: 'width: 150px;' }, 
							{ header : 'TOTAL',                 dataIndex : 'total_borders', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}}  }, 
							{ header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x=='0'){return ' '} else {return x}} } 
					   //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
					];
	
			var mygrid4 = $('#income_grid').accessibleGrid(colDesc, { 
															tableId 	:	'income_table',
															col1th		: 	true,
															summary		: 	'Table columns are household income categories for boarders at selected station, numbers of boarders, and percent of total. Rows are 8 income categories',
															caption		:	'Household Income for Boarders at ' + currentStn,
															style       :   'width: 380px;',
															ariaLive	:	'assertive'                                                           
									},
									CTPS.rtSurveyApp.IncomeStore);								
            break;
            
		case 5:                                     //      RACE for people BOARDING at selected station
			 var colDesc = [ { header : 'REPORTED RACE', 		    dataIndex : 'attribute_value',style: 'width: 150px;' }, 
							{ header : 'TOTAL',                 dataIndex : 'total_borders', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}} }, 
							{ header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x=='0'){return ' '} else {return x}} } 
					   //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
					];
	
			mygrid5 = $('#race_grid').accessibleGrid( colDesc, { 
															tableId 	:	'race_table',
															col1th		: 	true,
															summary		: 	'Table columns are self-reported race for boarders at selected station, numbers of boarders, and percent of total. Rows are racial categories',
															caption		:	'Reported Race for Boarders at ' + currentStn,
															style       :   'width: 380px;',
															ariaLive	:	'assertive'                                                          
									},
									CTPS.rtSurveyApp.RaceStore);								
            break;
            
		case 6:
			function subgroups(val){
				if(val === 'Link (Subway + Bus)'||val === 'Zone'||val === 'Boat'||val === 'Inner Express Bus'||val === 'Outer Express Bus'||
					val === 'Student'||val === 'Senior'||val === 'Disability'||val === 'No Pass Selected'||val === 'No Reduced Fare Selected'){		
					return '<span style="font-style:italic; margin-left: 3em;">' + val + '</span>';
				} else {
					return val;
				} 
			}
            
			var colDesc = [ { header: 'FARE TYPE',           dataIndex: 'attribute_value', style: 'width: 200px;', renderer: subgroups },
						{ header : 'TOTAL',                 dataIndex : 'total_borders', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}} }, 
						{ header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x=='0'){return ' '} else {return x}} }
				   //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
				];
        
			mygrid6 = $('#fare_grid').accessibleGrid( colDesc, { 
															tableId 	:	'fare_table',
															col1th		: 	true,
															summary		: 	'Table columns are fare type for boarders at selected station, numbers of boarders, and percent of total. Rows are different fare types such as Monthly Pass or Charlie Card',
															caption		:	'Type of Fare Paid by Boarders at ' + currentStn,
															style       :   'width: 380px;',
															ariaLive	:	'assertive'                                                         
									},
									CTPS.rtSurveyApp.FareStore);						
            break;

		case 7:
			var colDesc = [ { header : 'BOARDING STATION', 	dataIndex : 'display_station',style: 'width: 150px;'}, 
							{ header : 'TOTAL',                 dataIndex : 'total_borders', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x==0){return ' '} else {return addCommas(x)}} }, 
							{ header : 'PERCENT', 	            dataIndex : 'percent', colstyle: "text-align:right", style: "text-align:right;width:80px;", renderer:function(x){if(x=='0'){return ' '} else {return x}} } 
					   //     { header : 'STATION ORDER',         dataIndex : 'line_order' }					
					];
	
			mygrid7 = $('#alight_grid').accessibleGrid( colDesc, { 
												tableId 	:	'alight_table',
												col1th		: 	true,
												summary		: 	'Table columns are boarding stations for exiters at selected station, numbers of exiters and percent of total. Rows are individual boarding stations',
												caption		:	'Boarding stations for Exiters at ' + currentStn + '*',
												style       :   'width: 420px;',
												ariaLive	:	'assertive'												
									},
									CTPS.rtSurveyApp.AlightStore);					
            break;
            
		default:
			alert("No data read into grid");
            break;					
                    
        } //	END of SWITCH
        
        
    
        

};	// CTPS.rtSurveyApp.SetupDataGrid()



        





$(document).ready(function(){ 
 
$('#downloadData1,#downloadData3').click(function(){

//  note: 'selected_table' is choice of individual data grid, or ALL data in all grids except 'boarding_stations';
//  'table_choice' is the name of the current individual data grid.
  
    var selected_table = this.id;
     
    var display_station = document.getElementById('snName').innerHTML;
    
    var table_choice = '';
    var cqlFilter = '', propertyName = '';
    var szQry = '';
    var typename = 'postgis:ctps_mbta_2009rt_all_redo2';
    
    var piece_dom = $('#mytabs ul > li.current').text(); 
   
    table_choice = piece_dom.substring(13);
      
    switch(table_choice) {                                                                         //  gets values for displayed table only for selected origin
        case 'Exiting Stations':                                                       
            cqlFilter = "(summaryrttable > 0)AND(summaryrttable<=299)";				
            break;
        case 'Boarding Stations':
			// Ugh.. reference to global "place" replaced with global "placeLower".
			// Gag me to the max, big daddy-o.
			// BK 09/19/2017
            cqlFilter = "(attribute_value='" + placeLower + "')";          
            break;            
       case 'Access Mode':
            cqlFilter = "(summaryrttable >=301)AND(summaryrttable<=312)";
            break;      
       case 'Household Vehicles':
            cqlFilter = "(summaryrttable >= 314)AND(summaryrttable<=317)";
            break;
       case 'Household Income':
            cqlFilter = "(summaryrttable >= 318)AND(summaryrttable<=326)";
            break;
        case 'Race':
            cqlFilter = "(summaryrttable >= 327)AND(summaryrttable<=335)";
            break;
       case 'Fare Type':
            cqlFilter = "(summaryrttable >= 337)AND(summaryrttable<=360)";
            break;            
       default:
            alert('no grid selected');
    }
    
    //  note:  variable below was created to exclude values not included in printed page from Access (or in app as it stands) from choice to download ALL data below (downloadData3);
    var all_values = "((summaryrttable > 0)AND(summaryrttable<=299))"
    all_values += "OR((summaryrttable >=301)AND(summaryrttable<=312))"
    all_values += "OR((summaryrttable >= 314)AND(summaryrttable<=317))"
    all_values += "OR((summaryrttable >= 318)AND(summaryrttable<=326))"
    all_values += "OR((summaryrttable >= 327)AND(summaryrttable<=335))"
    all_values += "OR((summaryrttable >= 337)AND(summaryrttable<=360))"
	    
  if(table_choice==='Boarding Stations'){
   //     alert("Note that 'all data' button doesn't work for boarding stations tab");
		// Change here: replaced "aCaps" in next stmt with "aLower".
		// BK 09/19/2017
        propertyName = 'attribute_value,' + aLower + ',display_station';        
    } else {
			// Ugh.. two eferences to global "place" in switch statment below replaced with global "placeLower".
			// Gag me to the max, big daddy-o.
			// BK 09/19/2017
    switch(selected_table){
        case 'downloadData1':  
             propertyName = 'summaryrttable,attribute_value,' + 'board_' + placeLower;                       //  gets values for displayed table for selected origin station only
             break;
         case 'downloadData2':            
            alert('shouldnt be here');
            break;
        case 'downloadData3':            
             cqlFilter = all_values;                                                                     //  gets ALL data for selected origin station, not just displayed table
             var propertyName = 'summaryrttable,attribute_value,' + 'board_' + placeLower;                    //  gets values for displayed table for selected origin station only
             break;
        default:
            alert('OK, now Im confused..');
      }
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
			// var szTemp = "http://www.ctps.org:8080/geoserver/wfs?";                                                       //      NOTE:  CHANGED TO MAKE DOWNLOAD WORK FROM \\lindalino:8080    
			var szTemp = CTPS.rtSurveyApp.szWFSserverRoot + '?';
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

