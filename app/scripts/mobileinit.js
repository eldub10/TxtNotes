// jquery mobile configuration
$( document ).bind( "mobileinit", function() {
	// disable functions that use 'history'
	// because it's not available in chrome packaged apps
  $.mobile.hashListeningEnabled = false;
  $.mobile.changePage.defaults.changeHash = false;
});
