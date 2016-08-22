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