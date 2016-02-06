module ngSliderComponents {

    class ngRanger {

    }

    let ngRangerDirective = [function () {
        return {
            restrict: 'AE',
            replace: true,
            scope: {},
            link: function () {
                
            },
            template: '<h1>It works!</h1>'
        }
    }];

    angular.module('ngSlider')
        .directive('ngRanger', ngRangerDirective);

}