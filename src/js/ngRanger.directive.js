var ngSlider;
(function (ngSlider) {
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
                link: ngRanger,
                template: '<h1>It works!</h1>'
            };
        }];
    angular.module('ngSlider')
        .directive('ngRanger', ngRangerDirective);
})(ngSlider || (ngSlider = {}));
