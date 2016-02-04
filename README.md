# ngSlider

This project is inspired by rzajac/angularjs-slider but written in typescript and separating the two different slider type _(range-slider and single slider)_ into directives.

## Installion

To install this package you can use bower:

    user@machine$:path/to/project~ bower install ng-slider

Initialize the module 'ngSlider' into your application

example __app.js__

    angular.module('app',['ngSlider'])

Now you are ready!

#### ngSlider
By design this slider is a single value slider which ables the user to select a value from a range

__Usage:__

Options:

| Option          | Possible Value   | Description                                                     |
| --------------: |:----------------:| --------------------------------------------------------------- |
| __min__         | number           | Specifies the floor / lowest possible value                     |
| __max__         | number           | Specifies the ceil / highest possible value                     |
| __model__       | number/undefined | Model of the slider                                             |
| __translateFn__ | function         | A function to format values' label text                         |
| __showSteps__   | 'all'/array      | Tells the slider which value's label to show out of min and max |

_html_

    <ng-slider min="0" max="5" translate-fn="translateFn" model="mySliderModel"></ng-slider>

_js_

    app.controller('MySingleCtrl', function($scope){
        $scope.mySliderModel = 2;
        $scope.translateFn = function(valueKey){
            return ['Result', valueKey].join(' - ');
        }
    });

#### ngRanger

By design this slider is an interval slider which ables the user to select a lowest and a highest value from a range

__Usage:__

Options:

| Option          | Possible Value   | Description                                                     |
| --------------: |:----------------:| --------------------------------------------------------------- |
| __min__         | number           | Specifies the floor / lowest possible value                     |
| __max__         | number           | Specifies the ceil / highest possible value                     |
| __model__       | number/undefined | Model(lowest) of the slider                                     |
| __modelHigh__   | number/undefined | Model(highest) of the slider                                    |
| __translateFn__ | function         | A function to format values' label text                         |
| __showSteps__   | 'all'/array      | Tells the slider which value's label to show out of min and max |

_html_

    <ng-ranger min="0" max="5" translate-fn="translateFn" model="mySliderModel" model-hight="mySliderModelHigh"></ng-ranger>

_js_

    app.controller('MyCtrl', function($scope){
        $scope.mySliderModel = 2;
        $scope.mySliderModelHigh = 4;
        $scope.translateFn = function(valueKey){
            return ['Result', valueKey].join(' - ');
        }
    });

## Custom styling

## Custom Build
Since the source of the sliders written in typescript you must have installed typescript (1.7) already.
The build flow is written in gulp so gulp also should be installed.

To start build run:

    user@machine$:path/to/ng-slider~ gulp build

This process will compile typescript file into source javascript file located in __src/js__ , also compiles scss files into css files and outputs to __src/css__ and runs the minification which outputs to __dist/js__ and __dist/css__
