(function(app){

	/*
	HelpersService
	This service contains functions that help a dev with routine work
	 */

	var HelpersService = function(){

		var self = this;

		this.hasOwnPropertiesPath = hasOwnPropertiesPath;
		this.debounce = debounce;
		this.arraySum = arraySum;
		this.validateProxyConfigStructure = validateProxyConfigStructure;
		this.isRealObject = isRealObject;

		/**
		 * If an object "a" has a path [b, c, d], it verifies if the object a.b.c.d exists
		 * @param sourceObj {Object}
		 * @param path {Array}
		 */
		function hasOwnPropertiesPath(sourceObj, path){

			var currentObject = sourceObj;

			for(var i = 0; i < path.length; i++){
				if(self.isRealObject(currentObject)){
					if(currentObject.hasOwnProperty(path[i])){
						currentObject = currentObject[path[i]];
					}
					else return false;
				}
				else return false;
			}
			return true;

		}

		/**
		 * Tests if the variable has type Object and not null
		 * @param testObj {*}
		 * @returns {Boolean}
		 */
		function isRealObject(testObj){
			return (typeof testObj == "object" && testObj !== null);
		}


		/**
		 * Debouncing function (allows increase performance)
		 * @param func {Function} Callback function
		 * @param wait {Number} Integer: number of milliseconds to wait
		 * @param immediate {Boolean} If needed to call immediately
		 * @returns {Function}
		 */
		function debounce(func, wait, immediate) {
			var timeout;
			return function() {
				var context = this, args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
		}

		function arraySum(arr){
			var total = 0;
			arr.forEach(function(el){
				total += el;
			});
			return total;
		}


		function validateProxyConfigStructure(sourceObj){
			var resultObj;

			if(typeof sourceObj === "object" && sourceObj !== null){

				if(sourceObj.hasOwnProperty("vpp") && sourceObj.hasOwnProperty("ovs")){

					if(typeof sourceObj.vpp === "object" && sourceObj.vpp !== null
					&& typeof sourceObj.ovs === "object" && sourceObj.ovs !== null
						&& typeof sourceObj.dvs === "object" && sourceObj.dvs !== null){

						if(sourceObj.vpp.hasOwnProperty("mac_dest") && sourceObj.vpp.hasOwnProperty("url")
						&& sourceObj.ovs.hasOwnProperty("mac_dest") && sourceObj.ovs.hasOwnProperty("url")
							&& sourceObj.dvs.hasOwnProperty("mac_dest") && sourceObj.dvs.hasOwnProperty("url")){
							// todo: validation

							resultObj = angular.copy(sourceObj);
							return resultObj;

						}

					}
				}
			}

			return false;
			
		}

	};

	HelpersService.$inject = [];
	app.service("HelpersService", HelpersService);

})(app);