# ngRanger

This project is inspired by rzajac/angularjs-slider but written in typescript.

## Installion

To install this package you can use bower:

    user@machine$:path/to/project~ bower install ng-ranger

Initialize the module 'ngRanger' into your application

example __app.js__

    angular.module('app',['ngRanger'])

Now you are ready!

#### ngRanger

__Usage:__

Options:

| Option                | Possible Value   | Description                                                     |
| --------------:       |:----------------:| --------------------------------------------------------------- |
| __min__               | number           | Specifies the floor / lowest possible value                     |
| __max__               | number           | Specifies the ceil / highest possible value                     |
| __model__             | number/undefined | Model of the slider                                             |
| __modelHigh__         | number/undefined | Higher Model of the slider                                      |
| __scroll__            | attribute        | If attribute presented lower model will be scrollable           |
| __translateFn__       | function         | A function to format values' label text                         |
| __rangeMinVolume__    | number           | Minimum values (distance) between low and high  model value     |
| __rangeMaxVolume__    | number           | Maximum values (distance) between low and high  model value     |
| __rangeVolume__       | string           | Combined distance in a format _'N:N'_ e.g: _10:40 means the minimum distance is 10 and maximum is 40 between low and high values_  |
| __precision__         | number           | length of .toFixed() when calculating round values. Useful when step is lower than 0 |
| __step__              | number           | distance between 2 valid values on the range. e.g step = 2, the valid values on a 0-10 range: _0, 2, 4, 6, 8, 10_ | 

_html_

    <ng-ranger min="0" max="5" translate-fn="translateFn" model="mySliderModel"></ng-ranger>

_js_

    app.controller('MySingleCtrl', function($scope){
        $scope.mySliderModel = 2;
        $scope.translateFn = function(valueKey){
            return ['Result', valueKey].join(' - ');
        }
    });

## Custom styling
Styling is written in SCSS so it can be overwrited or even just copied into project.
Styles can be build using command:

    user@machine$:path/to/ng-ranger~ gulp compile:styles

## Custom Build
Since the source of the sliders written in typescript you must have installed typescript (1.7) already.
The build flow is written in gulp so gulp also should be installed.

To start build run:

    user@machine$:path/to/ng-ranger~ gulp build

This process will compile typescript file into source javascript file located in __src/js__ , also compiles scss files into css files and outputs to __src/css__ and runs the minification which outputs to __dist/js__ and __dist/css__
