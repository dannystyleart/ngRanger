var ngSliderComponents;
(function (ngSliderComponents) {
    var ngRanger = (function () {
        function ngRanger() {
        }
        return ngRanger;
    })();
    var ngRangerDirective = [function () {
            return {
                restrict: 'AE',
                replace: true,
                scope: {},
                link: function () {
                },
                template: '<h1>It works!</h1>'
            };
        }];
    angular.module('ngSlider')
        .directive('ngRanger', ngRangerDirective);
})(ngSliderComponents || (ngSliderComponents = {}));
