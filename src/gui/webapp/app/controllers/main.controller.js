(function(app){

	var MainCtrl = function($scope, $rootScope, $mdSidenav, $mdDialog, SharedDataService, $window, $cookies, HelpersService) {

		// "scopify" shared data
		$scope.shared = SharedDataService.data;
		$scope.redirectUrl = redirectUrl;
		$scope.init = init;

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