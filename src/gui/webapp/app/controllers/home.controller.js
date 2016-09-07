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