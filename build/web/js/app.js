var configFn, app;

// module configuration function
configFn = function($mdThemingProvider, RestangularProvider, $routeProvider, $locationProvider, $cookiesProvider) {

	$locationProvider.hashPrefix('!');

	// theme config
	$mdThemingProvider.theme("default")
		.primaryPalette("blue")
		.accentPalette("light-blue");

	$routeProvider
		.when('/', {
			templateUrl: 'templates/home.tpl.html',
			controller: 'HomeCtrl'
		})
		.when('/settings', {
			templateUrl: 'templates/settings.tpl.html',
			controller: 'SettingsCtrl'
		})
		.otherwise({
				redirectTo: '/'
			});


};
configFn.$inject = ["$mdThemingProvider", "RestangularProvider", "$routeProvider", "$locationProvider", "$cookiesProvider"];

// define module
app = angular.module("killerApp", ["ngMaterial", "restangular", "ngRoute", "ngCookies"]);
// configuration of color themes
app.config(configFn);

/*
How to use:

ErrorHandlerService.log(err[, displayErrConfig]);

err is an Object that contains information about the error. It is mandatory to pass the Object into .log() function.

The structure is as follows (with example):

err = {
	"errCode": "REGSTATS_NOT_LOADED", // code of error (must be unique in scope of the project)
	"errTitle": "Registration data is not loaded", // short description of what happened
	"errMsg": "Couldn't load Registration information from controller. Server does not respond.", // moderately detailed description of the error
	"errResolution": "Check if controller is down, otherwise check your connection.", // optional: resolution of the problem
	// Optional: an object that may be processed in different ways, thanks to errCode.
	// Contains details of the problem (may be anything that helps identify and fix the reason without debugging the code)
	"errObj": {
		"testProp": "testValue"
	}
};

displayErrConfig can be boolean (true/false) or an Object. Optional.

If missing or false, user doesn't see the error.
If true, it shows pop-up by default (see this.defaultMethod)
If Object, it must have "type" property, which must be one of the following:
- dialog: depict as a dialog window
- toast: depict as a small pop-up notification in a corner
- default: same as if displayErrConfig === true, that is it choose default method
- hide: same as if displayErrConfig === false, that is it hides the error from user
As the Object it may have a boolean property allowToLogInConsole, which determines if the message needs putting to console (true = put, false = do not)
 */

(function(app){

	var ErrorHandlerService = function($log, $mdDialog, $mdToast) {

		// If true, track errors in the console
		this.debug = true;
		this.defaultMethod = 'toast';


		this.readErrorMessagesFile = function(){

		};

		this.getErrorByCode = function(code){

		};

		/**
		 * A tiny pop-up at the top right corner. Can expand to a dialog window
		 * @param err {Object} Error object with the following properties: errCode, errTitle, errMsg, errResolution, errObj
		 */
		this.displayMDToast = function(err){
			$mdToast.show({
				hideDelay   : 10000,
				position    : 'bottom right',
				controller  : 'ErrorHandlerCtrl',
				templateUrl : 'templates/error-views/toast.tpl.html',
				locals: {
					'errData': err
				}
			});
		};

		/**
		 * Open a dialog window for the error
		 * @param err {Object} Error object with the following properties: errCode, errTitle, errMsg, errResolution, errObj
		 */
		this.displayMDDialog = function(err){
			var parentEl = angular.element(document.body);
			$mdDialog.show({
				parent: parentEl,
				controller  : 'ErrorHandlerCtrl',
				templateUrl : 'templates/error-views/dialog.tpl.html',
				clickOutsideToClose: true,
				locals: {
					'errData': err
				}
			});
		};

		/**
		 * Display error to user by default
		 * @param err {Object} Error object with the following properties: errCode, errTitle, errMsg, errResolution, errObj
		 */
		this.displayPopupByDefault = function(err){
			switch(this.defaultMethod){
				case 'toast':
					this.displayMDToast(err);
					break;
				case 'dialog':
					this.displayMDDialog(err);
					break;
			}
		};

		/**
		 * Track error
		 * @param err {Object} Error object with the following properties: errCode, errTitle, errMsg, errResolution, errObj
		 * @param displayErrConfig {Boolean} Do we need to show the error to a user?
		 */
		this.log = function(err, displayErrConfig){

			displayErrConfig = displayErrConfig || false;

			var consoleMessagesAllowed = true;

			// if user needs to see it
			if(displayErrConfig){
				// default settings
				if(displayErrConfig === true){
					this.displayPopupByDefault(err);
				}
				// explicitly defined configuration
				else{
					if(displayErrConfig.hasOwnProperty('type')){
						switch(displayErrConfig.type){
							// display as a dialog
							case 'dialog':
								this.displayMDDialog(err);
								break;
							// display as a toast
							case 'toast':
								this.displayMDToast(err);
								break;
							// pop-up by default
							case 'default':
								this.displayPopupByDefault(err);
								break;
							// show nothing
							case 'hide':
								break;
						}
					}
					else{
						// action by default
						this.displayPopupByDefault(err);
					}

					// allowToLogInConsole implementation
					if(displayErrConfig.hasOwnProperty('allowToLogInConsole')){
						consoleMessagesAllowed = (typeof displayErrConfig.allowToLogInConsole == 'boolean') ?
							displayErrConfig.allowToLogInConsole : false;
					}
				}
			}

			// "debug" mode allows messages appear in console
			if(this.debug && consoleMessagesAllowed)
				$log.error("Error occurred.", err);

		};
	};

	ErrorHandlerService.$inject = ['$log', '$mdDialog', '$mdToast'];
	app.service("ErrorHandlerService", ErrorHandlerService);

})(app);
(function(app){

	/*
	SharedDataService
	The service provides controllers and services access communicate with each other avoiding $scope routine
	 */

	var SharedDataService = function(){

		var self = this;
		this.multiSet = multiSet;

		// shared data
		this.data = {
			configCookieName: "kaProxyConfig",
			// side panel details
			sidePanel: false,
			sidePanelName: null,

			// number of flows
			flowsNumber: null,
			// status of traffic generator (running/stopped)
			tgStatus: {
				"vpp": null,
				"ovs": null
			},
			tgStats: {
				"vpp": null,
				"ovs": null
			},
			// current ctrl
			currentCtrl: null,

			// Base URLs of TRex HTTP servers (REST servers)
			proxyConfig: null

		};

		/* Implementation */

		/**
		 * Copy properties of "sourceObj" into shared data object
		 * @param sourceObj {Object} Donor object
		 * @param deepCopy {Boolean} Perform deep copy or not
		 */
		function multiSet(sourceObj, deepCopy){

			deepCopy = deepCopy || false;

			for (var property in sourceObj) {
				if (sourceObj.hasOwnProperty(property)) {
					if(deepCopy)
						self.data[property] = angular.copy(sourceObj[property]);
					else
						self.data[property] = sourceObj[property];
				}
			}
		}

	};

	SharedDataService.$inject = [];
	app.service("SharedDataService", SharedDataService);

})(app);
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
					&& typeof sourceObj.ovs === "object" && sourceObj.ovs !== null && typeof sourceObj.dvs === "object" && sourceObj.dvs !== null){

						if(sourceObj.vpp.hasOwnProperty("mac_dest") && sourceObj.vpp.hasOwnProperty("url")
						&& sourceObj.ovs.hasOwnProperty("mac_dest") && sourceObj.ovs.hasOwnProperty("url") && sourceObj.dvs.hasOwnProperty("mac_dest") && sourceObj.dvs.hasOwnProperty("url")){
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
(function(app){

	/*
	 NetworkService
	 The service talks REST API with TRex HTTP Proxy (https://github.com/zverevalexei/trex-http-proxy)
	 */

	var TrexService = function(Restangular, HelpersService){

		this.start = start;
		this.stop = stop;
		this.getApiVersion = getApiVersion;
		this.getStatus = getStatus;

		function start(baseUrl, config, successCbk, errorCbk){

			var restObj = Restangular.setBaseUrl(baseUrl).all("start");

			restObj.customPOST({"input": config}).then(
				function(data) {
					if(HelpersService.hasOwnPropertiesPath(data, ["output", "result"])){
						successCbk(data.output);
					}
					else{
						var errData = {
							"errCode": "START_TRAFFIC_INVALID",
							"errTitle": "Couldn't start traffic",
							"errMsg": "Response to command 'start traffic' is invalid.",
							"errResolution": "Make sure that protocols match.",
							"errObj": data
						};
						errorCbk(errData);
					}
				},
				function(err){

					var errData = {
						"errCode": "START_TRAFFIC",
						"errTitle": "Couldn't start traffic",
						"errMsg": "You tried to start traffic, but for some reason it is being complicated at this point.",
						"errResolution": "Check your connection, otherwise make sure if HTTP proxy is up.",
						"errObj": err
					};

					errorCbk(errData);

				}
			);


		}


		function stop(baseUrl, successCbk, errorCbk){

			var restObj = Restangular.setBaseUrl(baseUrl).all("stop");

			restObj.post({}).then(
				function(data) {
					if(HelpersService.hasOwnPropertiesPath(data, ["output", "result"])){
						successCbk(data.output);
					}
					else{
						var errData = {
							"errCode": "STOP_TRAFFIC_INVALID",
							"errTitle": "Couldn't stop traffic",
							"errMsg": "Response to command 'Stop traffic' is invalid.",
							"errResolution": "Make sure that protocols match.",
							"errObj": data
						};
						errorCbk(errData);
					}
				},
				function(err){

					var errData = {
						"errCode": "STOP_TRAFFIC",
						"errTitle": "Couldn't stop traffic",
						"errMsg": "You tried to stop traffic, but for some reason it is being complicated at this point.",
						"errResolution": "Check your connection, otherwise make sure if HTTP proxy is up.",
						"errObj": err
					};

					errorCbk(errData);

				}
			);

		}


		/**
		 * Get API version
		 * @param baseUrl {String} Base URL of TRex HTTP proxy
		 * @param successCbk
		 * @param errorCbk
		 */
		function getApiVersion(baseUrl, successCbk, errorCbk){

			var restObj = Restangular.setBaseUrl(baseUrl).one("api_version");

			restObj.get().then(
				function(data) {
					if(HelpersService.hasOwnPropertiesPath(data, ["output", "result"])){
						successCbk(data.output.result);
					}
					else{
						var errData = {
							"errCode": "GET_API_VERSION_INVALID",
							"errTitle": "Couldn't read API version",
							"errMsg": "API version is invalid.",
							"errResolution": "Make sure that protocols match.",
							"errObj": data
						};
						errorCbk(errData);
					}
				},
				function(err){

					var errData = {
						"errCode": "GET_API_VERSION",
						"errTitle": "Couldn't get API version",
						"errMsg": "You tried to read API version from server, but for some reason it is being complicated at this point.",
						"errResolution": "Check your connection, otherwise make sure if HTTP proxy is up.",
						"errObj": err
					};

					errorCbk(errData);

				}
			);

		}


		/**
		 * Get status
		 * @param baseUrl {String} Base URL of TRex HTTP proxy
		 * @param successCbk
		 * @param errorCbk
		 */
		function getStatus(baseUrl, successCbk, errorCbk){

			var restObj = Restangular.setBaseUrl(baseUrl).one("get_status");

			restObj.get().then(
				function(data) {
					if(HelpersService.hasOwnPropertiesPath(data, ["output", "status"])){
						successCbk(data.output);
					}
					else{
						var errData = {
							"errCode": "GET_STATUS_INVALID",
							"errTitle": "Couldn't read status data",
							"errMsg": "Status data is invalid.",
							"errResolution": "Make sure that protocols match.",
							"errObj": data
						};
						errorCbk(errData);
					}
				},
				function(err){

					var errData = {
						"errCode": "GET_STATUS",
						"errTitle": "Couldn't get status data",
						"errMsg": "You tried to read status data from server, but for some reason it is being complicated at this point.",
						"errResolution": "Check your connection, otherwise make sure if HTTP proxy is up.",
						"errObj": err
					};

					errorCbk(errData);

				}
			);

		}

	};

	TrexService.$inject = ["Restangular", "HelpersService"];
	app.service("TrexService", TrexService);

})(app);

(function(app){

	var ErrorHandlerCtrl = function($scope, errData, $mdToast, $mdDialog, ErrorHandlerService) {


		$scope.errData = errData;


		$scope.closeDialog = function(){
			$mdDialog.hide();
		};

		$scope.showMoreInfoInDialog = function(){
			$scope.closeToast();
			ErrorHandlerService.log($scope.errData, {
				type: "dialog",
				allowTologInConsole: false
			});
		};

		$scope.closeToast = function(){
			$mdToast
				.hide()
				.then(function() {

				});
		};

	};


	ErrorHandlerCtrl.$inject=['$scope', 'errData', '$mdToast', '$mdDialog', 'ErrorHandlerService'];
	app.controller("ErrorHandlerCtrl", ErrorHandlerCtrl);
})(app);
(function(app){

	var SidePanelCtrl = function($scope, $mdSidenav, SharedDataService) {

		$scope.closeSidePanel = closeSidePanel;

		// "scopify" shared data
		$scope.shared = SharedDataService.data;

		function closeSidePanel(fadeTopoLayers){

			// erase temporary data
			SharedDataService.data.sidePanel = false;
			SharedDataService.data.sidePanelName = null;

		}
	};

	SidePanelCtrl.$inject = ["$scope", "$mdSidenav", "SharedDataService"];
	app.controller("SidePanelCtrl", SidePanelCtrl);

})(app);
(function(app){

	var ToolbarCtrl = function($scope, $rootScope, $mdSidenav, $mdDialog, SharedDataService, ErrorHandlerService, TrexService, $route, $location) {

		// "scopify" shared data
		$scope.shared = SharedDataService.data;
		$scope.$route = $route;

		$scope.setUrlHash = setUrlHash;

		$scope.$on("$routeChangeSuccess", function(event, current, previous){
			if(current.hasOwnProperty("$$route")){
				$scope.shared.currentCtrl = current.$$route.controller;
			}
		});

		/* Implementation */
		function setUrlHash(hash){
			$location.path(hash);
		}

	};

	ToolbarCtrl.$inject = ["$scope", "$rootScope", "$mdSidenav", "$mdDialog", "SharedDataService", "ErrorHandlerService", "TrexService", "$route", "$location"];
	app.controller("ToolbarCtrl", ToolbarCtrl);

})(app);
(function(app){

	var SettingsCtrl = function($scope, $mdSidenav, $mdDialog, SharedDataService, ErrorHandlerService, TrexService, $cookies, HelpersService) {

		$scope.init = init;

		// "scopify" shared data
		$scope.shared = SharedDataService.data;



		$scope.init();

		/* Implementation */

		function init(){

			readCookieConfig();

			$scope.$on("PROXY_CONFIG_UPDATED", readCookieConfig);

			// deep watch the form data
			$scope.$watch("settingsData", settingsDataWatcher, true);

		}

		function settingsDataWatcher(settingsForm){

			var proxyConfig = HelpersService.validateProxyConfigStructure(settingsForm);

			// if data is good
			if(proxyConfig !== false){
				SharedDataService.data.proxyConfig = proxyConfig;
			}

		}

		function readCookieConfig(){

			$scope.settingsData = angular.copy(SharedDataService.data.proxyConfig);

		}

	};

	SettingsCtrl.$inject = ["$scope", "$mdSidenav", "$mdDialog", "SharedDataService", "ErrorHandlerService", "TrexService", "$cookies", "HelpersService"];
	app.controller("SettingsCtrl", SettingsCtrl);

})(app);
(function(app){

	var HomeCtrl = function($scope, $mdSidenav, $mdDialog, SharedDataService, ErrorHandlerService, TrexService, $interval, HelpersService) {

		// method prototypes

		$scope.init = init;
		$scope.updateStatus = updateStatus;
		$scope.updatePps = updatePps;
		$scope.pauseTraffic = pauseTraffic;


		$scope.macsPerSec = 0;
		$scope.lastSetMacsPerSec = 0;

		$scope.packetSize = 64; // 64 bytes by default
		$scope.lastSetPacketSize = $scope.packetSize;

		$scope.ppsMult = 1;
		$scope.lastSetPpsMult = $scope.ppsMult;

		// "scopify" shared data
		$scope.shared = SharedDataService.data;

		// initialize the app
		$scope.init();

		/* Implementation */

		/**
		 * Initialize application
		 */
		function init(){
			SharedDataService.data.flowsNumber = 0;
			$scope.updateStatus();

			$interval(function(){
					$scope.updateStatus(false);
					$scope.updatePps();
			}, 1500);

		}

		/**
		 *
		 * @param explicitUpdate {Boolean} Identifies if the status to
		 */
		function updateStatus(explicitUpdate){

			explicitUpdate = (typeof explicitUpdate === "boolean") ? explicitUpdate : true;

			var lastStatus = SharedDataService.data.tgStatus;

			if(explicitUpdate){
				SharedDataService.data.tgStatus.vpp = SharedDataService.data.tgStatus.ovs = SharedDataService.data.tgStatus.dvs  = 'updating';
			}

			if(HelpersService.hasOwnPropertiesPath(SharedDataService.data.proxyConfig, ["vpp", "url"])
			&& HelpersService.hasOwnPropertiesPath(SharedDataService.data.proxyConfig, ["ovs", "url"])
			&& HelpersService.hasOwnPropertiesPath(SharedDataService.data.proxyConfig, ["dvs", "url"])){

				// get status VPP
				TrexService.getStatus(
					SharedDataService.data.proxyConfig.vpp.url,
					returnSuccessCbkForGetStatus("vpp"),
					returnErrorCbkForGetStatus("vpp")
				);

				// get status OVS
				TrexService.getStatus(
					SharedDataService.data.proxyConfig.ovs.url,
					returnSuccessCbkForGetStatus("ovs"),
					returnErrorCbkForGetStatus("ovs")
				);

				<!-- patricia: add dvs -->
				TrexService.getStatus(
					SharedDataService.data.proxyConfig.dvs.url,
					returnSuccessCbkForGetStatus("dvs"),
					returnErrorCbkForGetStatus("dvs")
				);

			}

			// *** service functions ***
			/**
			 * Returns a success callback function for REST call
			 * @param mode {String} vpp/ovs
			 * @returns {Function}
			 */
			function returnSuccessCbkForGetStatus(mode){
				return function(data){
					if(data.result.status == 'running'){
						SharedDataService.data.tgStatus[mode] = 'running';
						SharedDataService.data.tgStats[mode] = data.result.stats;

						var globalStats = SharedDataService.data.tgStats[mode].global;
						var tx_bps = globalStats["tx_bps"];


						// bits
						if(tx_bps < 1000){
							globalStats["tx_bps_value"] = tx_bps;
							globalStats["tx_bps_units"] = "bitrr/s";

							log.console('try 2');
						}
						// kbits
						else if(tx_bps >= 1000 && tx_bps < 1000000){
							globalStats["tx_bps_value"] = tx_bps/1000;
							globalStats["tx_bps_units"] = "kbitrr/s";
							log.console('try 3');
						}
						else if(tx_bps >= 1000000 && tx_bps < 1000000000){
							globalStats["tx_bps_value"] = tx_bps/1000000;
							globalStats["tx_bps_units"] = "mbitoo/s";
						}
						else if(tx_bps >  999999999){
							globalStats["tx_bps_value"] = tx_bps/1000000000;
							globalStats["tx_bps_units"] = "gbituu/s";
							log.console('try 5');
						}
						log.console('try 1');

					}
					else if(data.result.status == 'stopped'){
						SharedDataService.data.tgStatus[mode] = 'stopped';
					}
					else{
						SharedDataService.data.tgStatus[mode] = null;
					}
				};
			}

			/**
			 * Returns an error callback function for REST call
			 * @param mode {String} vpp/ovs
			 * @returns {Function}
			 */
			function returnErrorCbkForGetStatus(mode){
				return function(err){
					if(lastStatus[mode] !== "not_connected"){
						ErrorHandlerService.log(err, true);
					}
					SharedDataService.data.tgStatus[mode] = 'not_connected';
				};
			}

		}

		function updatePps(forceStart){

			if(angular.isDefined($scope.lastSetMacsPerSec) && angular.isDefined($scope.macsPerSec)){
				if(($scope.lastSetMacsPerSec != $scope.macsPerSec ||
					$scope.lastSetPacketSize != $scope.packetSize ||
					$scope.lastSetPpsMult != $scope.ppsMult ||
					forceStart) && $scope.macsPerSec > 0){

					$scope.lastSetMacsPerSec = $scope.macsPerSec;
					$scope.lastSetPacketSize = $scope.packetSize;
					$scope.lastSetPpsMult = $scope.ppsMult;

					// VPP Trex
					TrexService.stop(
						SharedDataService.data.proxyConfig.vpp.url,
						returnSuccessCbkForStop("vpp"),
						returnErrorCbkForStop("vpp")
					);

					// OVS Trex
					TrexService.stop(
						SharedDataService.data.proxyConfig.ovs.url,
						returnSuccessCbkForStop("ovs"),
						returnErrorCbkForStop("ovs")
					);
					<!-- patricia: add dvs -->
					TrexService.stop(
						SharedDataService.data.proxyConfig.dvs.url,
						returnSuccessCbkForStop("dvs"),
						returnErrorCbkForStop("dvs")
					);

				}

				// handling the situation when # of PPS/MAC addresses == 0
				else if(($scope.lastSetMacsPerSec != $scope.macsPerSec || forceStart) && $scope.macsPerSec == 0){

					$scope.lastSetMacsPerSec = 0;
					$scope.lastSetPacketSize = $scope.packetSize;
					$scope.lastSetPpsMult = $scope.ppsMult;

					$scope.pauseTraffic();


				}
			}

			// *** service functions ***
			/**
			 * Returns a success callback function for REST call
			 * @param mode {String} vpp/ovs
			 * @returns {Function}
			 */
			function returnSuccessCbkForStop(mode){
				return function(data){
					TrexService.start(
						SharedDataService.data.proxyConfig[mode].url,
						{
							"pps": String($scope.macsPerSec),
							"src_n": String($scope.macsPerSec),
							"mac_dest": SharedDataService.data.proxyConfig[mode].mac_dest,
							"pkts_n": "1",
							"packet_size": String($scope.packetSize),
							"mult": String($scope.ppsMult)
						},
						function(data){},
						function(err){
							ErrorHandlerService.log(err, true);
						}
					);
				};
			}

			/**
			 * Returns a success callback function for REST call
			 * @param mode {String} vpp/ovs
			 * @returns {Function}
			 */
			function returnErrorCbkForStop(mode){
				return function(err){
					ErrorHandlerService.log(err, true);
				};
			}

		}

		function pauseTraffic(){

			// VPP Trex
			TrexService.stop(
				SharedDataService.data.proxyConfig.vpp.url,
				function(data){},
				function(err){
					ErrorHandlerService.log(err, true);
				}
			);

			// OVS Trex
			TrexService.stop(
				SharedDataService.data.proxyConfig.ovs.url,
				function(data){},
				function(err){
					ErrorHandlerService.log(err, true);
				}
			);
			<!-- patricia: add dvs -->
			TrexService.stop(
				SharedDataService.data.proxyConfig.dvs.url,
				function(data){},
				function(err){
					ErrorHandlerService.log(err, true);
				}
			);


		}


	};

	HomeCtrl.$inject = ["$scope", "$mdSidenav", "$mdDialog", "SharedDataService", "ErrorHandlerService", "TrexService", "$interval", "HelpersService"];
	app.controller("HomeCtrl", HomeCtrl);

})(app);
(function(app){

	var MainCtrl = function($scope, $rootScope, $mdSidenav, $mdDialog, SharedDataService, $window, $cookies, HelpersService) {

		// "scopify" shared data
		$scope.shared = SharedDataService.data;
		$scope.redirectUrl = redirectUrl;
		$scope.init = init;

		$scope.show3=false;


		$scope.init();



		/* Implementation */

		function init(){

			var proxyConfigCookie = $cookies.getObject(SharedDataService.data.configCookieName);

			if(proxyConfigCookie !== false){
				SharedDataService.data.proxyConfig = proxyConfigCookie;
			}

			$scope.$watch("shared.proxyConfig", configWatcher, true);

		}

		function redirectUrl(url, newTab){

			newTab = newTab || false;

			$window.open(url, newTab ? "_blank" : "");

			// fixme: make dynamic
			SharedDataService.data.restBaseUrls.vpp = "http://localhost:5000";
			SharedDataService.data.restBaseUrls.ovs = "http://localhost:6000";

			<!-- patricia: add dvs -->
			SharedDataService.data.restBaseUrls.dvs = "http://localhost:7000";

		}

		function configWatcher(proxyConfig){

			var validatedProxyConfig = HelpersService.validateProxyConfigStructure(proxyConfig);

			// if data is good
			if(validatedProxyConfig !== false){

				// set cookie
				var cookieExpDate = new Date();
				cookieExpDate.setMonth(cookieExpDate.getMonth() + 1);

				$cookies.putObject(SharedDataService.data.configCookieName, SharedDataService.data.proxyConfig, {
					"path": "/",
					"expires": cookieExpDate
				});

				$rootScope.$broadcast("PROXY_CONFIG_UPDATED");

			}

		}

	};

	MainCtrl.$inject = ["$scope", "$rootScope", "$mdSidenav", "$mdDialog", "SharedDataService", "$window", "$cookies", "HelpersService"];
	app.controller("MainCtrl", MainCtrl);

})(app);