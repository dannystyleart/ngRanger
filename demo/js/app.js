(function () {
    'use strict';

    var demoApp = angular.module('app',['ngSlider']);


    var SliderExampleController = ['$scope', function ($scope) {

        $scope.rangeMin = 0;
        $scope.rangeMax = 100;

        $scope.sliderModel = 25;

    }];

    demoApp.controller('SliderExampleController', SliderExampleController);



    var RangerExampleController = ['$scope', function ($scope) {

        $scope.rangeMin = 0;
        $scope.rangeMax = 100;

        $scope.sliderModel = 25;

    }];

    demoApp.controller('RangerExampleController', RangerExampleController);

})();