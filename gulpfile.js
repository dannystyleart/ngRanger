var gulp = require('gulp');
var ts = require('gulp-typescript');

gulp.task('watch', function () {
    gulp.watch('src/ts/*.ts', ['ts']);
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