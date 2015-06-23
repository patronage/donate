var gulp        = require('gulp');
var $           = require('gulp-load-plugins')();
var rimraf      = require('rimraf');
var runSequence = require('run-sequence');
var source      = require('vinyl-source-stream');
var sourcemaps  = require('gulp-sourcemaps');
var browserify  = require('browserify');
var reactify    = require('reactify');
var browserSync = require('browser-sync');
var reload      = browserSync.reload;

var handleErrors = function() {
    var args = Array.prototype.slice.call(arguments);
    $.notify.onError({
        title: 'Compile Error',
        message: '<%= error.message %>'
    }).apply(this, args);

    this.emit('end');
}

gulp.task('styles', function() {
    return gulp.src( 'styles/screen.scss' )
        .pipe(sourcemaps.init())
        .pipe($.sass({
            style: 'compressed',
            onError: function(err){
                $.notify().write(err);
            }
        }))
        .pipe($.sourcemaps.write())
        .pipe($.autoprefixer('last 2 versions'))
        .pipe(gulp.dest( 'dist/stylesheets' ))
});

gulp.task('browserify', function() {
    var self = this;
    var b = browserify({
        entries: './templates/app.jsx'
    })
    b.transform(reactify); // use the reactify transform
    return b.bundle()
        .on('error', handleErrors)
        .pipe(source('templates/app.jsx'))
        .pipe($.rename('app.js'))
        .pipe(gulp.dest('./dist'));
});

// clean output directory
gulp.task('clean', function (cb) {
    rimraf('dist', cb);
});

gulp.task('assetMover', function() {
    gulp.src('assets/**')
        .pipe(gulp.dest('dist/assets'))
});

gulp.task('viewMover', function() {
    gulp.src('index.html', {base: './'})
        .pipe(gulp.dest('dist/'))
});

gulp.task('webserver', function() {
    browserSync({
        // tunnel: true,
        logLevel: 'info',
        files: 'dist/stylesheets/screen.css',
        injectChanges: true,
        server: {
            baseDir: ['dist'],
        }
    });
});

gulp.task('watch', function() {
    gulp.watch([
        'dist/app.js',
        'dist/assets/**/*',
        'dist/index.html'
    ], reload);
    gulp.watch('assets/**/*', ['assetMover']);
    gulp.watch('index.html', ['viewMover']);
    gulp.watch('{components,data,library,templates}/**/*.{js,jsx,json}', ['browserify']);
    gulp.watch('styles/**/*.scss', ['styles']);
});

gulp.task('default', function( cb ) {
    runSequence( 'clean', 'viewMover', 'assetMover', 'styles', 'browserify', ['watch', 'webserver'], cb );
});
