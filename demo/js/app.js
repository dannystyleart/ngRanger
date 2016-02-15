(function () {
    'use strict';

    var demoApp = angular.module('app', ['ngRanger']);

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
        $scope.sliderModel = 50;
        $scope.rangeLow = 75;
        $scope.rangeHigh = 125;
        $scope.fixedRangeLow = 50;
        $scope.fixedRangeHigh = 150;
        $scope.debugPane = 'HTML';
        $scope.translateFn = function (value) {
            return '$' + (value.toFixed(2));
        };

        $scope.onChange = function (model, value) {
            Debugger.log('onChange callback(' + model + ', ' + value + ')')
        };

        $scope.setModel = function (value) {
            $scope.sliderModel = value;
        };

        $scope.$on('ngRanger:change', function (event, key, value) {
            Debugger.log('ngRanger event: change', 'ngRanger model type: ', key, 'ngRanger model value: ', value)
        });

        $scope.$on('ngRanger:rendered', function () {
            Debugger.log('ngRanger event: rendered');
        });
        $scope.toggleDebugPane = function (pane) {
            $scope.debugPane = pane;
        };

    }];

    demoApp.controller('SliderExampleController', SliderExampleController);

})();