(function () {
    'use strict';

    var demoApp = angular.module('app', ['ngSlider']);


    var SliderExampleController = ['$scope', function ($scope) {

        $scope.rangeMin = 0;
        $scope.rangeMax = 100;
        $scope.sliderModel = 25;
$scope.translateFn = function (value) {

    if (value === $scope.rangeMin) {
        return '$' + $scope.rangeMin;
    } else if (value < 3) {
        return 'Too cheap ($' + value + ')';
    } else if (value >= 3 && value <= 5) {
        return 'Could be good ($ ' + value + ')';
    } else if (value === $scope.rangeMax) {
        return '$' + $scope.rangeMax;
    }
    return 'Too expensive ($' + value + ')';

};

        $scope.$on('ngSlider:stop', function (event, value) {
            console.log('ngSlider event: stop', 'ngSlider event argument: ', value);
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