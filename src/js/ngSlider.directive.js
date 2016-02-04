/// <reference path="ngSlider.d.ts"/>
var ngSlider;
(function (ngSlider) {
    var SlideHandle = (function () {
        function SlideHandle(element, value) {
            this.element = element;
            this.sVal = value;
            this.sLeft = 0;
            this.sWidth = this.element.width();
            return this;
        }
        return SlideHandle;
    })();
    var ngSliderLink = (function () {
        function ngSliderLink(scope, element, attrs) {
            this.scope = scope;
            this.element = element;
            this.attrs = attrs;
            this.handles = [];
            this.width = 0;
            this.minVal = 0;
            this.maxVal = 0;
            this.translateFn = angular.noop;
            // Initialize
            this.translateFn = angular.isFunction(scope.translateFn) ? scope.translateFn : angular.noop;
            this.init();
            // Initialize elements
            // Render
        }
        ngSliderLink.prototype.init = function () {
            // Initialization - run once when component loads up and just have been compiled
            // set min and max values
            this.minVal = this.scope.min;
            this.maxVal = this.scope.max;
            // Initialize Elements
            this.initElements();
            // invoke event bindings
            this.bindEventsToElements();
        };
        ngSliderLink.prototype.initElements = function () {
            var _this = this;
            // compute element width
            this.width = this.element.width();
            // compute handles width
            angular.forEach(this.element.find('span'), function (element, elemIndex) {
                switch (elemIndex) {
                    case 0:
                        _this.handles.push(new SlideHandle(element, _this.minVal));
                        break;
                    case 1:
                        _this.handles.push(new SlideHandle(element, _this.maxVal));
                        break;
                    case 2:
                        _this.handles.push(new SlideHandle(element, _this.minVal));
                        break;
                    case 3:
                        _this.handles.push(new SlideHandle(element, _this.minVal));
                        break;
                    case 4:
                        _this.handles.push(new SlideHandle(element, _this.minVal));
                        break;
                }
            }, this);
        };
        ngSliderLink.prototype.bindEventsToElements = function () {
        };
        ngSliderLink.prototype.valueToOffset = function () {
            return 1;
        };
        ngSliderLink.prototype.offsetToValue = function () {
            return 1;
        };
        ngSliderLink.prototype.render = function () {
        };
        return ngSliderLink;
    })();
    var ngSliderDirective = [function () {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    model: '=',
                    min: '=',
                    max: '=',
                    translateFn: '&'
                },
                link: ngSliderLink,
                template: '<div class="ng-slider">' +
                    '<span class="ng-slider-min-label"></span>' +
                    '<span class="ng-slider-max-label"></span>' +
                    '<span class="ng-slider-handle"></span>' +
                    '<span class="ng-slider-fullbar"></span>' +
                    '<span class="ng-slider-selection"></span>' +
                    '</div>'
            };
        }];
    angular.module('ngSlider')
        .directive('ngSlider', ngSliderDirective);
})(ngSlider || (ngSlider = {}));
