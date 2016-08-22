var connect = require('connect');
var serveStatic = require('serve-static');

var port = 8080;

connect().use(serveStatic(__dirname + "/web")).listen(port, function(){
	console.log('Server running on ' + port +  '...');
});