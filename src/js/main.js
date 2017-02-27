var testObj = {

	config: {

	},

	init: function(config) {
		$.extend(testObj.config, config);

		console.log("init");

	},
	
}

$(document).ready(function() {
	testObj.init();
});