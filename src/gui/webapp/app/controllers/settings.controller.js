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