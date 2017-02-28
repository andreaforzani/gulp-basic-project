'use strict';
var browserSync = require('browser-sync');
var csso = require('gulp-csso');
var del = require('del');
var glob = require("glob");
var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var prefix = require('gulp-autoprefixer');
var reload = browserSync.reload;
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var modernizr = require('gulp-modernizr');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var gulpicon = require("gulpicon/tasks/gulpicon");
var svgmin = require('gulp-svgmin');
var merge = require('merge-stream');

var config = {
	dev: gutil.env.dev,
	sourcemaps: (gutil.env.sourcemaps || gutil.env.dev) ? true : false,
	src: {
		styles : 'src/scss/',
		scripts: 'src/js/',
		images: 'src/images/',
		icons: 'src/icons/',
		fonts: 'src/fonts/'
	},
	dest: {
		styles : 'css/',
		scripts: 'js/',
		images: 'images/',
		icons: 'icons/',
		fonts: 'fonts/'
	}
}

// clean
gulp.task('clean', function () {
	return del([
		config.dest.styles,
		config.dest.scripts,
		config.dest.images,
		config.dest.icons,
		config.dest.fonts
	]);
});

gulp.task('scripts', function () {
	// set up the browserify instance on a task basis
	var b = browserify({
		entries: config.src.scripts + "main.js",
		debug: true
	});

	return b.bundle()
		.pipe(source('main.js'))
		.pipe(buffer())
		.pipe(gulpif(config.sourcemaps, sourcemaps.init({loadMaps: true})))
		.pipe(gulpif(!config.dev, uglify()))
		.on('error', gutil.log)
		.pipe(gulpif(config.sourcemaps, sourcemaps.write('./')))
		.pipe(gulp.dest(config.dest.scripts));
});

gulp.task('styles', function () {  
	return gulp.src(config.src.styles + "*.scss")
		.pipe(gulpif(config.sourcemap, sourcemaps.init()))
		.pipe(sass().on('error', sass.logError))
		.pipe(prefix({browsers: ['last 1 version']}))
		.pipe(gulpif(config.sourcemaps, sourcemaps.write()))
		.pipe(gulpif(!config.dev, csso()))
		.pipe(gulp.dest(config.dest.styles))
		.pipe(gulpif(config.dev, reload({stream:true})));
});

gulp.task('browser-sync', ['watch'], function() {  
	browserSync.init(["css/*.css", "js/*.js", "*.html"], {
		server: {
			baseDir: "./"
		}
	});
});

gulp.task('modernizr', function() {
	return gulp.src([config.src.scripts + "*.js"])
		.pipe(modernizr({
			"options": [
				'setClasses',
				'html5printshiv',
				'test/css/flexbox',
				'test/dom/classlist',
				'test/svg/inline',
				'test/css/animations',
				'test/css/transitions'
			],
			"uglify": true,
			excludeTests: ['hidden']
		}))
		.pipe(gulp.dest(config.dest.scripts))
});

gulp.task('images', function () {
	return gulp.src(config.src.images + '**/*')
		.pipe(imagemin())
		.pipe(gulp.dest(config.dest.images));
});

gulp.task('watch', function () {
	gulp.watch(config.src.styles + "**/*.scss", ['styles']);

	gulp.task('scripts:watch', ['scripts'], reload);
	gulp.watch(config.src.scripts + "**/*.js", ['scripts']);
	
	gulp.task('images:watch', ['images'], reload);
	gulp.watch(config.src.images + '**/*', ['images:watch']);
});

gulp.task('fonts', function() {
	gulp.src(config.src.fonts + "*")
		.pipe(gulp.dest(config.dest.fonts));
});

gulp.task('optimizeSVG', function () {
	var stream = gulp.src(config.src.icons + 'svg/*.svg')
		.pipe(svgmin({
			js2svg: {
				pretty: true
			},
			plugins: [{
				removeAttrs: {
					attrs: '(width|height)'
				}
			}]
		}))
		.pipe(gulp.dest(config.dest.icons + 'svg'));
	return stream;
});

var	iconFiles = glob.sync(config.dest.icons + 'svg/*.svg');
gulp.task('gulpicon', ['optimizeSVG'], gulpicon(iconFiles, {
	enhanceSVG: true,
	defaultWidth: "100px",
	defalutHeight: "100px",
	dest: config.dest.icons
}));

// default build task
gulp.task('default', function () {

	// define build tasks
	var tasks = [
		'clean',
		'scripts', 
		'styles', 
		'images',
		'fonts',
		'modernizr'
	];

	// run build
	runSequence(tasks, function () {
		// gulp.start('gulpicon');
		if (config.dev) {
			gulp.start('browser-sync');
		}
	});

});

function errorHandler(error) {
	if (typeof error.fileName != "undefined") {
		console.log(error.fileName);
	}
	console.log(error.message);
	gutil.beep();
	this.emit("end");
	return true;
}