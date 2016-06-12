	var searchQuery;
        var keywordList = ['accounting', 'airport','amusement park','aquarium','art gallery','atm','bakery','bank','bar','beauty salon','bicycle store','book store','bowling alley','bus station','cafe','campground','car dealer','car rental','car repair','car wash','casino','cemetery','church','city hall','clothing store','convenience store','courthouse','dentist','department store','doctor','electrician','electronics store','embassy','fire station','florist','funeral home','furniture store','gas station','gym','hair care','hardware store','hindu temple','home goods store','hospital','insurance agency','jewelry store','laundry','lawyer','library','liquor store','local government office','locksmith','lodging','meal delivery','meal takeaway','mosque','movie rental','movie theater','moving company','museum','night club','painter','park','parking','pet store','pharmacy','physiotherapist','plumber','police','post office','real estate agency','restaurant','roofing contractor','rv park','school','shoe store','shopping mall','spa','stadium','storage','store','subway station','synagogue','taxi stand','train station','transit station','travel agency','university','veterinary care','zoo'];
        for (var i = 0; i < keywordList.length; i++) {
            keywordList[i] = keywordList[i].replace(" ", "_");
        }
        
	    function MessageHandler(context, event) {
	        raw_message = event.message;
	        msg = event.message.toLowerCase();
	        
	        if (event.messageobj.type=='location') {
                var lat = event.messageobj.latitude;
                var long = event.messageobj.longitude;
                var url = event.message;
                var name = event.senderobj["display"];
                
                if (context.simpledb.roomleveldata.coordinates !== undefined) {
	                context.simpledb.roomleveldata.coordinates[name] = {
	                    "lat": lat,
	                    "long": long
	                };
	                context.sendResponse("Success! Thanks.");
	            }
	            
	            else {
	                context.simpledb.roomleveldata.coordinates = {
	                    name : {
	                        "lat": lat,
    	                    "long": long
	                    }
	                };
	                context.sendResponse("Success! Thanks.");
	            }
	            
            }
            else if(msg == "/help") {
                var result = "Hi, I'm a bot that allows you to collaborate with other people in order to find a common meeting place.\n\nTo use my services, simply enter your location by tapping the paper clip, then tapping 'location'. I will index your location in my database.\n\nUse /find <query> to locate various services around you (/index for a list of queries), /delete <user> to delete a user from my location database and /list to list users in my location database.";
                context.sendResponse(result);
            }
            
            else if (msg == "/list") {
                key = context.simpledb.botleveldata.config.MapsAPIKey;
                info = context.simpledb.roomleveldata.coordinates;
                toPrint = "";
                count = 1;
                for (name in info) {
                    toPrint += count.toString() + ". " + name + "\n";
                    count += 1;
                }
                context.sendResponse(toPrint);
            }
            
            else if (msg.startsWith("/delete ")) {
                if(msg.length > 7) {
                    name = raw_message.substring(raw_message.indexOf(" ")+1, raw_message.length);
                } else {
                    context.sendResponse('/delete takes an argument, which is the user that you wish to delete.');
                }
                delete context.simpledb.roomleveldata.coordinates[name];
                context.sendResponse("Deleted " + name);
            }
            
            else if (msg.startsWith("/find ") || msg.startsWith("/sfind ")) {
                var subject;
                var replacer = {'taxi': 'taxi stand', 'bicycle': 'bicycle store', 'art': 'art gallery', 'shoes': 'shoe store', 'money': 'atm', 'fish': 'aquarium', 'theme park': 'amusement park', 'books': 'book store', 'college': 'university', 'beauty parlor': 'beauty salon', 'education': 'school', 'insurance': 'insurance agency', 'vet': 'veterinary care', 'jewelry': 'jewelry store', 'travel': 'travel agency', 'club': 'night club', 'dealership': 'car dealer', 'retail store': 'clothing store', 'medicine': 'pharmacy', 'gambling': 'casino', 'transit': 'transit station', 'coffee': 'cafe', 'pets': 'pet store', 'food': 'restaurant', 'bus': 'bus station', 'hotel': 'lodging', 'gas': 'gas station', 'cops': 'police', 'plane': 'airport', 'moving': 'moving company', 'hair salon': 'hair care', 'dead people': 'cemetery', 'furniture': 'furniture store', 'arena': 'stadium', 'temple': 'hindu temple', 'jesus': 'church', 'takeout': 'meal takeaway', 'movies': 'movie theater', 'mall': 'shopping mall', 'train': 'train station', 'subway': 'subway station', 'bowling': 'bowling alley'};
                if(msg.length > 5) {
                    subject = msg.substring(msg.indexOf("d") + 2, msg.length);
                    if (replacer[subject] !== undefined) {
                        subject = replacer[subject];
                    }
                    subject = subject.replace(" ", "_");
                    searchQuery = subject;
                    if (keywordList.indexOf(subject) < 0) {
                        context.sendResponse("Sorry, but '" + subject + "' is not an indexed term. Use /index to find valid terms.");
                    }
    
                } else {
                    context.sendResponse("I'm sorry, but I don't know what you want to find. Are you lost?");
                    return;
                }
                key = context.simpledb.botleveldata.config.MapsAPIKey;
                result = findSearchArea();
                avgLat = result[0];
                avgLong = result[1];
                radius = !(msg.substring(0, 6) == "/sfind") ? (parseInt(result[2])*1609).toString() : "50000";
                //context.sendResponse(avgLat + ", " + avgLong + ", " + radius);
                context.simplehttp.makeGet("https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + avgLat +"%2C" + avgLong + "&radius=" + radius + "&type=" + subject + "&key="+key);
            } else if(msg.substring(0, 6) == '/index') {
                var response = "Valid search keywords are: ";
                for(var i = 0; i < keywordList.length; i++) {
                    response+= keywordList[i] + (i != keywordList.length - 1 ? ", " : "");
                }
                response+= ". Note that some words are automatically converted to valid key words.";
                context.sendResponse(response);
            }
	    }
	    
	    function findSearchArea() {
	        var MINIMUM_DISTANCE = 3; // Minimum radius of search in miles
        	var people = Object.keys(context.simpledb.roomleveldata.coordinates);
        	var latSum = 0;
        	var longSum = 0;
        	for(var i = 0; i < people.length; i++) {
        		var person = context.simpledb.roomleveldata.coordinates[people[i]];
        		latSum+= parseFloat(person["lat"]);
        		longSum+= parseFloat(person["long"]);
        	}
        	var avgLat = latSum/people.length;
        	var avgLong = longSum/people.length;
        	var distanceSum = 0;
        	for(var i = 0; i < people.length; i++) {
        		var person = context.simpledb.roomleveldata.coordinates[people[i]];
        		var latitude = parseFloat(person["lat"]);
        		var longitude = parseFloat(person["long"]);
        		var radiansLat = latitude*Math.PI/180;
        		var radiansLong = longitude*Math.PI/180;
        		var radiansAvgLat = avgLat*Math.PI/180;
        		var radiansAvgLong = avgLong*Math.PI/180;
        		var radius = 3959; // Radius of earth in miles
        		var h = hav(radiansLat - radiansAvgLat) + Math.cos(radiansLat)*Math.cos(radiansAvgLat)*hav(radiansLong - radiansAvgLong); // Haversine formula
        		if(h > 1) {
        			h = 1;
        		}
        		var distance = 2*radius*Math.asin(Math.sqrt(h));
        		distanceSum+= distance;
        	}
        	var avgDistance = distanceSum/people.length;
        	if(distance < MINIMUM_DISTANCE) {
        		distance = MINIMUM_DISTANCE;
            }
        	var result = [avgLat, avgLong, distance];
        	return result;
}

        function hav(angle) {
	        return (1 - Math.cos(angle))/2
        }

	    /** Functions declared below are required **/
	    function EventHandler(context, event) {
	        if(! context.simpledb.botleveldata.numinstance)
	            context.simpledb.botleveldata.numinstance = 0;
	        numinstances = parseInt(context.simpledb.botleveldata.numinstance) + 1;
	        context.simpledb.botleveldata.numinstance = numinstances;
	        context.sendResponse("Thanks for adding me. Use /help to begin.\nNote: I must be an admin to receive locations.\n");
	    }
	
	    function HttpResponseHandler(context, event) {
            result = JSON.parse(event.getresp);
            toPrint = "";
            arr = result.results;
            numResults = 0;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].types.indexOf(searchQuery) < 0) {
                    continue;
                }
                numResults++;
                toPrint += arr[i].name + "\nhttp://maps.google.com/?q=" + arr[i].geometry.location.lat + "," + arr[i].geometry.location.lng + "\n" + arr[i].vicinity + "\n\n";
            }
            if(numResults == 0) {
                toPrint+="Sorry, but we didn't find any results for your search term. Did you make a typo? Use superfind (/sfind) to search a larger radius.";
            }
            context.sendResponse(toPrint);
	    }
	    function DbGetHandler(context, event) {
	        context.sendResponse("testdbput keyword was last get by:" + event.dbval);
	    }
	
	    function DbPutHandler(context, event) {
	        context.sendResponse("testdbput keyword was last put by:" + event.dbval);
	    }
