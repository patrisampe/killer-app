'use strict';

var gulp = require('gulp'),
	watch = require('gulp-watch'),
	prefixer = require('gulp-autoprefixer'),
	uglify = require('gulp-uglify'),
	less = require('gulp-less'),
	rigger = require('gulp-rigger'),
	cssmin = require('gulp-minify-css'),
	rename = require('gulp-rename'),
	del = require('del'),
	browserSync = require("browser-sync"),
	htmlmin = require("gulp-htmlmin"),
	reload = browserSync.reload;

var config = {
	debug: false
};

var path = {

	build: {
		index: '../build/web/',
		js: '../build/web/js/',
		css: '../build/web/css/',
		img: '../build/web/media/img/',
		templates: '../build/web/templates/',
		vendor: '../build/web/vendor/',
		webServer: '../build/'
	},
	src: {
		index: 'gui/webapp/index.html',
		js: 'gui/webapp/main.js',
		style: 'gui/assets/less/main.less',
		img: 'gui/assets/media/img/**/*.*',
		templates: 'gui/webapp/app/templates/**/*.*',
		vendor: 'gui/vendor/**/*.*',
		webServer: 'web-server/**/*.*'
	},
	watch: {
		index: 'gui/webapp/index.html',
		js: 'gui/webapp/**/*.js',
		style: 'gui/assets/less/**/*.less',
		img: 'gui/assets/media/img/**/*.*',
		templates: 'gui/webapp/app/templates/',
		vendor: 'gui/vendor/**/*.*',
		webServer: 'web-server/**/*.*'
	},

	fileNames: {
		jsMinified: 'app.js',
		cssMinified: 'style.css'
	},

	clean: '../build'
};

gulp.task('clean', function () {
	del([path.clean]);
});

gulp.task('js:build', function () {
	gulp.src(path.src.js)
		.pipe(rigger())
		//.pipe(uglify())
		.pipe(rename(path.fileNames.jsMinified))
		.pipe(gulp.dest(path.build.js));
});

gulp.task('style:build', function () {
	gulp.src(path.src.style)
		.pipe(less({
			includePaths: ['gui/style/'],
			outputStyle: 'compressed',
			sourceMap: true,
			errLogToConsole: true
		}))
		.pipe(prefixer())
		.pipe(cssmin())
		.pipe(rename(path.fileNames.cssMinified))
		.pipe(gulp.dest(path.build.css));
});

gulp.task('image:build', function () {
	gulp.src(path.src.img)
		.pipe(gulp.dest(path.build.img));
});

gulp.task('html:build', function(){

	// build index
	gulp.src(path.src.index)
		.pipe(rigger())
		.pipe(gulp.dest(path.build.index));

	// build templates
	gulp.src(path.src.templates)
		.pipe(rigger())
		.pipe(gulp.dest(path.build.templates));
});

gulp.task('vendor:build', function(){
	gulp.src(path.src.vendor)
		.pipe(gulp.dest(path.build.vendor))
});

gulp.task('webServer:build', function(){
	gulp.src(path.src.webServer)
		.pipe(gulp.dest(path.build.webServer))
});

gulp.task('build', [
	'html:build', // compile index.html
	'js:build', // assemble and minify js
	'style:build', // assemble and minify less/css
	'image:build', // just copy images
	'vendor:build', // copy vendor files
	'webServer:build'
]);


gulp.task('watch', function(){
	watch([path.watch.index, path.watch.templates], function(event, cb) {
		gulp.start('html:build');
	});
	watch([path.watch.style], function(event, cb) {
		gulp.start('style:build');
	});
	watch([path.watch.js], function(event, cb) {
		gulp.start('js:build');
	});
	watch([path.watch.img], function(event, cb) {
		gulp.start('image:build');
	});
	watch([path.watch.vendor], function(event, cb) {
		gulp.start('vendor:build');
	});
});


gulp.task('default', ['clean'], function(){
	gulp.start('../build');
	gulp.start('watch');
});