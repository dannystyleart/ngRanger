var gulp = require('gulp'),
    ts = require('gulp-typescript'),
    connect = require('gulp-connect'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer');

var serverConfig = {
    root: 'demo',
    port: 9000,
    livereload:true,
    middleware: function(connect) {

        var proxies = [
            connect().use('/bower_components', connect.static('bower_components')),
            connect().use('/src', connect.static('src'))
        ];

        return proxies;
    }

};

var autoprefixerConfig = {
    browsers: ['last 2 versions'],
    cascade: true
};

gulp.task('watch', function () {
    gulp.watch('src/ts/*.ts', ['ts', 'livereload']);
    gulp.watch(['src/**/*.{js,css}', 'demo/**/*.{js,css,html}'], ['livereload']);
    gulp.watch('src/**/*.scss', ['styles']);

});

gulp.task('styles', function () {
    return gulp.src('./src/style/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer(autoprefixerConfig))
        .pipe(gulp.dest('./src/css'));
});

gulp.task('livereload', function () {
   gulp.src('src/**/*.{js,css}')
       .pipe(connect.reload());
});
gulp.task('ts', function () {
    return gulp.src('src/ts/*.ts')
        .pipe(ts({
            target: 'es5',
            noImplicitAny: false,
            emitDecoratorMetadata: true,
            outDir: 'js'
        }))
        .pipe(gulp.dest('src/js'));
});

gulp.task('serve', function () {
    connect.server(serverConfig);
});

gulp.task('dev', function () {
   gulp.run(['serve', 'watch']);
});