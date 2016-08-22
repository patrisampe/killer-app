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