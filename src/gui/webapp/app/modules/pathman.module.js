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
