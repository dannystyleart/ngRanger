(function () {
    'use strict';

    var demoApp = angular.module('app', ['ngSlider']);

    var debuggerService = ['$window', function () {
        return {
            log: function () {
                if (arguments.length > 0) {
                    console.log('%c Debugger log:  ', 'background: #2196F3; color: #FFF;display:inline-block;padding:2px;text-transform: uppercase; font-weight: bold;');
                    console.log.apply(console, arguments);
                }
            }
        }
    }];

    demoApp.service('Debugger', debuggerService);

    var SliderExampleController = ['$scope', 'Debugger', function ($scope, Debugger) {

        $scope.rangeMin = 0;
        $scope.rangeMax = 100;
        $scope.sliderModel = 0;
        $scope.translateFn = function (value) {

            return '$' + (value.toFixed(2));

        };

        $scope.$on('ngSlider:stop', function (event, value) {
            Debugger.log('ngSlider event: stop', 'ngSlider event argument: ', value)
        });

    }];

    demoApp.controller('SliderExampleController', SliderExampleController);


    var RangerExampleController = ['$scope', function ($scope) {

        $scope.rangeMin = 0;
        $scope.rangeMax = 100;

        $scope.sliderModel = 25;

    }];

    demoApp.controller('RangerExampleController', RangerExampleController);

})();