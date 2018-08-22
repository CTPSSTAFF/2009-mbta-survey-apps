# 2009-mbta-survey-apps
2009 MBTA on-board passenger survey results apps

These apps were written by Mary McShane circa 2010. 

This repo contains the code for 4 apps, each of which is has its own HTML "index" file:
* rtSurveyApp.html - rapid transit survey results app
* crSurvyApp.html - commuter rail survey results app
* busSurveyApp.html - key bus routes survey results app
* boatSurveyApp.html - commuter ferry/boad survey results app

These apps make use of the following external resources:
* version 1.7 of the jQuery library
* version 0.09 of the jQuery accessible grid plugin (in external repo)
* version 1.9.4 of Dirk Ginader's accessible tabs library
* version 2.13.1 of the OpenLayers library
* the OpenLayers ScaleBar add-in

These apps were modified by Ben Krepp in 2018 to use a PostGIS/PostgreSQL data source rather than an ArcSDE/Oracle data source, but are otherwise unchanged.
