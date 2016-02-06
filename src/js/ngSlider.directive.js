var ngSliderComponents;
(function (ngSliderComponents) {
    var SlideElement = (function () {
        function SlideElement(element, sVal) {
            this.element = element;
            this.sLeft = 0;
            this.sWidth = this.width();
            return this;
        }
        SlideElement.prototype.width = function () {
            return this.element[0].getBoundingClientRect().width;
        };
        return SlideElement;
    })();
    var SliderDirective = (function () {
        function SliderDirective($document, $timeout) {
            var _this = this;
            this.$document = $document;
            this.$timeout = $timeout;
            this.restrict = 'E';
            this.replace = true;
            this.scope = { model: '=', min: '=', max: '=', translateFn: '&' };
            this.template = '<div class="ng-slider">' +
                '<span class="ng-slider-min-label"></span>' +
                '<span class="ng-slider-max-label"></span>' +
                '<span class="ng-slider-handle"></span>' +
                '<span class="ng-slider-fullbar"></span>' +
                '<span class="ng-slider-selection"></span>' +
                '</div>';
            this.handles = [];
            this.width = 0;
            this.fullBarWidth = 0;
            this.minVal = 0;
            this.maxVal = 0;
            this.left = 0;
            this.maxLeft = 0;
            this.handleWidth = 0;
            this.link = function (scope, element, attrs) {
                _this.$$scope = scope;
                _this.$$element = element;
                _this.$$attrs = attrs;
                _this.translateFn = angular.isFunction(scope.translateFn) ? scope.translateFn : _this.translateFn;
                _this.init();
                _this.initElements();
                _this.calcViewDimensions();
                _this.bindEventsToElements();
            };
        }
        SliderDirective.prototype.translateFn = function (value) {
            return value;
        };
        ;
        SliderDirective.factory = function () {
            var directive = function ($document, $timeout) { return new SliderDirective($document, $timeout); };
            return directive;
        };
        /**
         * Initialize element, bind events, compute metrics
         */
        SliderDirective.prototype.init = function () {
            this.minVal = this.$$scope.min;
            this.maxVal = this.$$scope.max;
        };
        SliderDirective.prototype.calcViewDimensions = function () {
            // compute element width
            this.width = this.$$element[0].getBoundingClientRect().width;
            this.left = this.$$element[0].getBoundingClientRect().left;
            this.maxLeft = this.width - this.handleWidth;
        };
        /**
         * Initialize elements, storing and binding events
         */
        SliderDirective.prototype.initElements = function () {
            var _this = this;
            // compute handles width
            angular.forEach(this.$$element.find('span'), function (element, elemIndex) {
                element = angular.element(element);
                switch (elemIndex) {
                    case 0:
                        // min-label
                        _this.handles.push(new SlideElement(element, _this.minVal));
                        break;
                    case 1:
                        // max-label
                        _this.handles.push(new SlideElement(element, _this.maxVal));
                        break;
                    case 2:
                        // handle
                        var handler = new SlideElement(element, _this.minVal);
                        _this.handleWidth = handler.width();
                        _this.handles.push(handler);
                        break;
                    case 3:
                        // fullbar
                        var fullBar = new SlideElement(element, _this.minVal);
                        _this.handles.push(fullBar);
                        _this.fullBarWidth = fullBar.width();
                        break;
                    case 4:
                        // selection
                        _this.handles.push(new SlideElement(element, _this.minVal));
                        break;
                }
            }, this);
        };
        SliderDirective.prototype.bindEventsToElements = function () {
            var _this = this;
            var _handles = this.handles.filter(function (sliderItem) {
                if (sliderItem.element.hasClass('ng-slider-handle')) {
                    return sliderItem;
                }
            });
            angular.forEach(_handles, function (handler) {
                handler.element.bind('mousedown', angular.bind(_this, _this.onStart, handler));
            });
        };
        SliderDirective.prototype.onStart = function (handler, event) {
            event.stopPropagation();
            event.preventDefault();
            handler.element.addClass('active');
            this.$document.on('mousemove', angular.bind(this, this.onMove, handler));
            this.$document.on('mouseup', angular.bind(this, this.onStop, handler));
        };
        SliderDirective.prototype.onMove = function (handler, event) {
            var eventX = event.clientX || (typeof (event.originalEvent) != 'undefined' ? event.originalEvent.touches[0].clientX : event.touches[0].clientX), sliderLO = this.left, newOffset = eventX - sliderLO - (this.handleWidth / 2), newValue;
            if (newOffset <= 0) {
                if (handler.sLeft !== 0) {
                    this.setLeft(handler, 0);
                }
                return;
            }
            else if (newOffset > this.maxLeft) {
                this.setLeft(handler, this.maxLeft);
                return;
            }
            this.setLeft(handler, newOffset);
        };
        SliderDirective.prototype.onStop = function (handler) {
            handler.element.removeClass('active');
            this.$document.unbind('mousemove');
            this.$document.unbind('mouseup');
        };
        /**
         *
         * @param element
         * @param {number} offset
         */
        SliderDirective.prototype.setLeft = function (handle, offset) {
            handle.sLeft = offset;
            handle.element.css({ 'left': offset + 'px' });
        };
        /**
         * Converts value to offset
         * @param {number} value
         * @returns {number}
         */
        SliderDirective.prototype.valueToOffset = function (value) {
            return 1;
        };
        /**
         * Converts handler offset to valid value
         * @param {number} offset
         * @returns {number}
         */
        SliderDirective.prototype.offsetToValue = function (offset) {
            return 1;
        };
        SliderDirective.$inject = ['$document', '$timeout'];
        return SliderDirective;
    })();
    angular.module('ngSlider')
        .directive('ngSlider', SliderDirective.factory());
})(ngSliderComponents || (ngSliderComponents = {}));
