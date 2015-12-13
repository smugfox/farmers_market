'use strict'
// Setting up document.ready function
$(function() {
  // Declare our variables and create empty arrays
  var marketId = []; //returned from the API
  var allLatlng = []; //returned from the API
  var allMarkers = []; //returned from the API
  var marketName = []; //returned from the API
  var infowindow = null;
  var pos;
  var userCords;
  var tempMarkerHolder = [];

  // Get information from the users browser using geolocation
  // Start geolocation
  if (navigator.geolocation) {
    function error(err) {
      console.warn('Error(' + err.code + '): ' + err.message);
    }
    // On success we'll assign the coords to the userCords variables
    function success(pos) {
      userCords = pos.coords;
    }
    // Get the user's current position
    navigator.geolocation.getCurrentPosition(success, error);
    // console.log(pos.latitude + " " + pos.longitude);
  } else {
    alert('Geolocation is not supported in your browser');
  }
  // End geolocation

  // Map options once you load up the app
  var mapOptions = {
    zoom: 5,
    center: new google.maps.LatLng(37.09024, -100.712891),
    panControl: false,
    panControlOptions: {
      position: google.maps.ControlPosition.BOTTOM_LEFT
    },
    zoomControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.LARGE,
      position: google.maps.ControlPosition.RIGHT_CENTER
    },
    scaleControl: false
  };

  // Adding infowindow option
  // Telling googlemaps that we want to add an info window
  var infowindow = new google.maps.InfoWindow({
    content: 'holding...'
  });

  // Fire up Google maps and place inside the map-canvas div
  var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

  // Grab from data
  // Bind function to submit event form
  $('#chooseZip').submit(function() {
    // Define and set variables
    var userZip = $('#textZip').val();

    // Declare a varibale
    var accessURL;

    // Check to see if the user entered a zip or not.  Use URL based on input
    if(userZip) {
      accessURL =
      'http://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=' + userZip;
    } else {
      accessURL = 'http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=' + userCords.latitude + '&lng=' + userCords.longitude;
    }

    // Use the zip code and return all market ids in area.
    $.ajax({
      type: 'GET',
      contentType: 'application/json; charset=utf-8',
      url: accessURL,
      dataType: 'jsonp',
      success: function(data) {
        $.each(data.results, function(i, val) {
          // Loop through each returned item and push onto marketId
          marketId.push(val.id);
          // Loop through each returned item and push marketname onto var marketName
          marketName.push(val.marketname);
        });
        //console.log(marketName);
        //console.log(marketId);

        var counter = 0;

        // Now, use the id to get query the API again.  This time we can use the ID to return more useful info
        $.each(marketId, function(k, v) {
          $.ajax({
            type: 'GET',
            contentType: 'application/json; charset=utf-8',

            // Submit a get request to the restful service mktDetail.
            url: 'http://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=' + v,
            dataType: 'jsonp',
            success: function(data) {
              // On success we'll grab all the results and break them apart
              for(var key in data) {
                var results = data[key];

                // The results contain a google maps link, but we just want the lat and long to plot the points
                // console.log(results);

                // The API returns a link to Google maps containing lat and long.  This pulls it apart.
                var googleLink = results['GoogleLink'];
                var latLong = decodeURIComponent(googleLink.substring(googleLink.indexOf('=')+1, googleLink.lastIndexOf('(')));

                // Both the lat and long are returned as one string. We need to seperate them.
                var split = latLong.split(',');
                var latitude = split[0];
                var longitude = split[1];


                // Set the markers.
                var myLatlng = new google.maps.LatLng(latitude,longitude);
                // console.log(myLatlng);
                var allMarkers = new google.maps.Marker({
                  position: myLatlng,
                  // Renders the features on the map
                  map: map,
                  // Title of the market when mouseover
                  title: marketName[counter],
                  // Styling of info window when clicked
                  html:
                        '<div class="markerPop">' +
                        // Substring removes distance from title
                        '<h1>' + marketName[counter].substring(4) + '</h1>' +
                        '<h3>' + results['Address'] + '</h3>' +
                        '<p>' + results['Products'].split(';') + '</p>' +
                        '<p>' + results['Schedule'] + '</p>' +
                        '</div>'
                });

                // Put all lat long in array.  Need this to create a viewport
                allLatlng.push(myLatlng);
                tempMarkerHolder.push(allMarkers);
                counter++;
              };

              // Using parameters set above, we're adding a click listener to the markers
              google.maps.event.addListener(allMarkers, 'click', function() {
                infowindow.setContent(this.html);
                infowindow.open(map, this);
              });

              // console.log(allLatlng);

              // From the allLatlng array, we'll show the markers in a new viewport bound
              var bounds = new google.maps.LatLngBounds();
              // Go through each...
              for(var i = 0, LtLgLen = allLatlng.length; i < LtLgLen; i++) {
                // And increase the bounds to take this point
                bounds.extend(allLatlng[i]);
              }
              // Fit these bounds to the map
              map.fitBounds(bounds);
            }
          });
        });
      }
    });
    return false; // Important: prevent the form from submitting
  });
});
