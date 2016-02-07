var gulp = require('gulp'),
    fs = require('fs'),
    ts = require('gulp-typescript'),
    connect = require('gulp-connect'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglifyjs'),
    rename = require('gulp-rename'),
    cssmin = require('gulp-cssmin'),
    rimraf = require('gulp-rimraf'),
    ngAnnotate = require('gulp-ng-annotate'),
    replace = require('gulp-replace'),
    injectString = require('gulp-inject-string');

/********************************
 * Project config
 *******************************/
var LICENCE, ABOUT, AUTOPREFIX_CONFIG;

LICENCE = fs.readFileSync('LICENSE.md', 'utf-8');

ABOUT = '/**\r\n\r\n' +
    '@name       ngSlider AngularJS directives\r\n' +
    '@author     Daniel Sebestyen <dannystyleart@gmail.com>\r\n' +
    '@url        https://gitlab.com/dannystyleart/ng-slider\r\n' +
    '@license    MIT\r\n\r\n' +
    LICENCE +
    '\r\n*/\r\n';

AUTOPREFIX_CONFIG = {
    browsers: ['last 2 versions'],
    cascade: true
};
/********************************
 * Utilities
 *******************************/
function toIncludeTags(sources, type) {
    var tags = '';
    switch (type.toUpperCase()) {
        case 'CSS':
            sources.forEach(function (src) {
                tags += '<link rel="stylesheet" href="' + src + '">\r\n';
            });
            break;
        case 'JS':
            sources.forEach(function (src) {
                tags += '<script src="' + src + '"></script>\r\n';
            });
            break;
    }
    return tags;
}

gulp.task('util:cleanup', function () {
    gulp.src(['src/js/**/*.js', 'src/css/**/*.css', 'dist/**/*.{js,css}'], {read: false})
        .pipe(rimraf());
});
gulp.task('util:watch', function () {
    gulp.watch('src/ts/*.ts', ['compile:ts', 'server:livereload']);
    gulp.watch(['src/**/*.{js,css}', 'demo/**/*.{js,css,html}'], ['server:livereload']);
    gulp.watch('src/**/*.scss', ['compile:styles']);

});
gulp.task('util:replace:disthtml', function () {
    var js = ['dist/js/ngSlider.min.js'],
        css = ['dist/css/ngSlider.min.css'];

    gulp.src(['demo/index.tpl'])
        .pipe(replace('<!--SRC:JS-->', toIncludeTags(js, 'JS')))
        .pipe(replace('<!--SRC:CSS-->', toIncludeTags(css, 'css')))
        .pipe(rename({basename:'dist', extname: '.html'}))
        .pipe(gulp.dest('demo'));
});
gulp.task('util:replace:sourcehtml', function () {
    var js = ['src/js/ngSlider.module.js', 'src/js/ngSlider.directive.js', 'src/js/ngRanger.directive.js'],
        css = ['src/css/ngSlider.css'];

    gulp.src(['demo/index.tpl'])
        .pipe(replace('<!--SRC:JS-->', toIncludeTags(js, 'JS')))
        .pipe(replace('<!--SRC:CSS-->', toIncludeTags(css, 'css')))
        .pipe(rename({basename:'source', extname: '.html'}))
        .pipe(gulp.dest('demo'));
});
/********************************
 * Source Compiling
 *******************************/
gulp.task('compile:ts', function () {
    return gulp.src('src/ts/*.ts')
        .pipe(ts({
            target: 'es5',
            noImplicitAny: false,
            emitDecoratorMetadata: true,
            outDir: 'js'
        }))
        .pipe(gulp.dest('src/js'));
});
gulp.task('compile:styles', function () {
    return gulp.src('./src/style/*.scss')
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(autoprefixer(AUTOPREFIX_CONFIG))
        .pipe(gulp.dest('./src/css'));
});
/********************************
 * Builders
 *******************************/
gulp.task('build:sources', ['util:cleanup', 'compile:styles', 'compile:ts']);
gulp.task('build:release', ['build:sources'], function () {
    gulp.src('src/**/*.css')
        .pipe(injectString.prepend(ABOUT))
        .pipe(gulp.dest('dist'));

    gulp.src('src/**/*.css')
        .pipe(cssmin())
        .pipe(injectString.prepend(ABOUT))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist'));

    gulp.src('src/**/*.js')
        .pipe(injectString.prepend(ABOUT))
        .pipe(gulp.dest('dist'));

    gulp.src(['src/js/ngSlider.module.js', 'src/js/ngSlider.directive.js', 'src/js/ngRanger.directive.js'])
        .pipe(ngAnnotate())
        .pipe(uglify({
            mangle: false
        }))
        .pipe(injectString.prepend(ABOUT))
        .pipe(rename({
            basename: 'ngSlider',
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/js'));
});
gulp.task('build', ['build:release']);
/********************************
 * Server
 *******************************/
gulp.task('server:livereload', function () {
    gulp.src(['src/**/*.{js,css}', 'demo/**/*.{js,html}', 'dist/**/*.{js,css}'])
        .pipe(connect.reload());
});
gulp.task('serve:source', ['util:replace:sourcehtml', 'build:sources', 'util:watch'], function () {
    connect.server({
        root: 'demo',
        port: 9000,
        livereload: true,
        middleware: function (connect) {
            return [
                connect().use('/bower_components', connect.static('bower_components')),
                connect().use('/src', connect.static('src'))
            ];
        },
        fallback: 'demo/source.html'
    });
});
gulp.task('serve:dist', ['util:replace:disthtml', 'build:release'], function () {
    connect.server({
        root: 'demo',
        port: 9000,
        livereload: true,
        middleware: function (connect) {
            return [
                connect().use('/bower_components', connect.static('bower_components')),
                connect().use('/dist', connect.static('dist'))
            ];
        },
        fallback: 'demo/dist.html'
    });
});
/********************************
 * Aliases
 *******************************/
gulp.task('serve', ['serve:dist']);
gulp.task('develop', ['serve:source']);

gulp.task('default', function () {
    console.log('Builders: \r\n', '* build:release\r\n', '* build:sources');
    console.log('Servers: \r\n', '* serve:dist\r\n', '* serve:source');
    console.log('Aliases: \r\n', '* serve\t==> serve:dist\r\n', '* build\t==> build:dist\r\n', '* develop\t==> serve:source');
});