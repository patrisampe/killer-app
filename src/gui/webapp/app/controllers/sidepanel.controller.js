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