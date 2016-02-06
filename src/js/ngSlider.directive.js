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
        function SliderDirective($document, $timeout, $window) {
            var _this = this;
            this.$document = $document;
            this.$timeout = $timeout;
            this.$window = $window;
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
            /**
             * Precision pointer for fixed numbers
             * @type {number}
             */
            this.precision = 0;
            /**
             * Stepper value
             * @type {number}
             */
            this.step = 1;
            /**
             * Container for slide holder items
             * @type {Array}
             */
            this.handles = [];
            /**
             * Slide width
             * @type {number}
             */
            this.width = 0;
            /**
             * Slide fullBar Width
             * @type {number}
             */
            this.fullBarWidth = 0;
            /**
             * Floor value of slider
             * @type {number}
             */
            this.minVal = 0;
            /**
             * Ceiling value of slider
             * @type {number}
             */
            this.maxVal = 0;
            /**
             * Range number of values - computed
             * @type {number}
             */
            this.valueRange = 0;
            /**
             * Slider viewport left offset
             * @type {number}
             */
            this.left = 0;
            /**
             * Slider viewport maximum left offset
             * @type {number}
             */
            this.maxLeft = 0;
            /**
             * Handles' width
             * @type {number}
             */
            this.handleWidth = 0;
            /**
             * Directive Link function
             * @param {object} scope
             * @param {jQLiteElement} element
             * @param {object} attrs
             */
            this.link = function (scope, element, attrs) {
                _this.$$scope = scope;
                _this.$$element = element;
                _this.$$attrs = attrs;
                _this.translateFn = angular.isFunction(scope.translateFn) ? scope.translateFn() : _this.translateFn;
                _this.init();
                _this.initElements();
                _this.calcViewDimensions();
                _this.bindEventsToElements();
                angular.element(_this.$window).bind('resize', function () {
                    _this.$timeout(function () {
                        _this.initElements();
                        _this.calcViewDimensions();
                    });
                });
            };
        }
        /**
         * Translate function to translate given value to a label text
         * @param {number} value Value of given offset
         * @returns {string}
         */
        SliderDirective.prototype.translateFn = function (value) {
            return '' + value;
        };
        /**
         * Factory function for directive
         * @returns {function(any, any): ngSliderComponents.SliderDirective}
         */
        SliderDirective.factory = function () {
            var directive = function ($document, $timeout, $window) { return new SliderDirective($document, $timeout, $window); };
            return directive;
        };
        /**
         * Initialize element, bind events, compute metrics
         */
        SliderDirective.prototype.init = function () {
            this.minVal = this.$$scope.min;
            this.maxVal = this.$$scope.max;
            this.valueRange = this.maxVal - this.minVal;
        };
        /**
         * Calculating view dimensions. This will be called on each window resize and when 'slideRender' event fired
         */
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
            if (this.handles.length) {
                this.handles = [];
            }
            // compute handles width
            angular.forEach(this.$$element.find('span'), function (element, elemIndex) {
                element = angular.element(element);
                switch (elemIndex) {
                    case 0:
                        // min-label
                        var minLabel = new SlideElement(element, _this.minVal);
                        _this.handles.push(minLabel);
                        _this.$timeout(function () {
                            _this.setLeft(minLabel, 0);
                            minLabel.element.text(_this.translateFn(_this.minVal));
                        });
                        break;
                    case 1:
                        // max-label
                        var maxLabel = new SlideElement(element, _this.maxVal);
                        _this.handles.push(maxLabel);
                        _this.$timeout(function () {
                            maxLabel.element.text(_this.translateFn(_this.maxVal));
                            _this.setLeft(maxLabel, _this.fullBarWidth - maxLabel.width());
                        });
                        break;
                    case 2:
                        // handle
                        var handler = new SlideElement(element, _this.minVal);
                        _this.handleWidth = handler.width();
                        _this.handles.push(handler);
                        _this.$timeout(function () {
                            _this.setLeft(handler, _this.valueToOffset(_this.$$scope.model));
                        });
                        break;
                    case 3:
                        // fullbar
                        var fullBar = new SlideElement(element, _this.minVal);
                        _this.handles.push(fullBar);
                        _this.fullBarWidth = fullBar.width();
                        break;
                    case 4:
                        // selection
                        var selection = new SlideElement(element, _this.minVal);
                        _this.$timeout(function () {
                            selection.element.css({ 'width': _this.valueToOffset(_this.$$scope.model) + 'px' });
                        });
                        _this.handles.push(selection);
                        break;
                }
            }, this);
        };
        /**
         * Bind events to elements for dragging and clicking
         */
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
        /**
         * Event handler for event fired on mousedown and touchstart events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        SliderDirective.prototype.onStart = function (handler, event) {
            event.stopPropagation();
            event.preventDefault();
            handler.element.addClass('active');
            this.$document.on('mousemove', angular.bind(this, this.onMove, handler));
            this.$document.on('mouseup', angular.bind(this, this.onStop, handler));
        };
        /**
         * Event handler for event fired on mousemove and touchmove events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        SliderDirective.prototype.onMove = function (handler, event) {
            var eventX = event.clientX || (typeof (event.originalEvent) != 'undefined' ? event.originalEvent.touches[0].clientX : event.touches[0].clientX), sliderLO = this.left, newOffset = eventX - sliderLO - (this.handleWidth / 2), newValue;
            newValue = this.roundValue(this.offsetToValue(newOffset));
            if (newOffset <= 0 || newValue <= 0) {
                if (handler.sLeft !== 0) {
                    this.setLeft(handler, 0);
                    handler.sVal = 0;
                    this.$$scope.model = 0;
                    this.$$scope.$apply();
                    var selection = this.getHandler('SELECTION');
                    selection.element.css({ 'width': '0px' });
                }
                return;
            }
            else if (newOffset > this.maxLeft || newValue > this.maxVal) {
                this.setLeft(handler, this.maxLeft);
                handler.sVal = this.maxVal;
                this.$$scope.model = this.maxVal;
                this.$$scope.$apply();
                var selection = this.getHandler('SELECTION');
                selection.element.css({ 'width': this.fullBarWidth + 'px' });
                return;
            }
            this.setLeft(handler, newOffset);
            handler.sVal = newValue;
            this.$$scope.model = newValue;
            this.$$scope.$apply();
            var selection = this.getHandler('SELECTION');
            selection.element.css({ 'width': newOffset + 'px' });
        };
        /**
         * Event handler for event fired on mouseup and touchstop events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        SliderDirective.prototype.onStop = function (handler) {
            handler.element.removeClass('active');
            this.$document.unbind('mousemove');
            this.$document.unbind('mouseup');
            this.$$scope.$emit('ngSlider:stop', this.$$scope.model);
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
            return (value - this.minVal) * this.maxLeft / this.valueRange;
        };
        /**
         * Converts handler offset to valid value
         * @param {number} offset
         * @returns {number}
         */
        SliderDirective.prototype.offsetToValue = function (offset) {
            return (offset / this.maxLeft) * this.valueRange + this.minVal;
        };
        /**
         * Convers floated value to round value aligned to steps
         * @param {number} value
         * @returns {number}
         */
        SliderDirective.prototype.roundValue = function (value) {
            return parseInt(value.toFixed(this.precision));
        };
        SliderDirective.prototype.getHandler = function (handlerName) {
            var lookupClass, element;
            switch (handlerName.toUpperCase()) {
                case 'FULLBAR':
                    lookupClass = 'ng-slider-fullbar';
                    break;
                case 'SELECTION':
                    lookupClass = 'ng-slider-selection';
                    break;
                case 'HANDLE':
                    lookupClass = 'ng-slider-handle';
                    break;
                case 'MINLABEL':
                    lookupClass = 'ng-slider-min-label';
                    break;
                case 'MAXLABEL':
                    lookupClass = 'ng-slider-max-label';
                    break;
            }
            this.handles.forEach(function (handle) {
                if (handle.element.hasClass(lookupClass)) {
                    element = handle;
                }
            });
            return element;
        };
        SliderDirective.$inject = ['$document', '$timeout'];
        return SliderDirective;
    })();
    angular.module('ngSlider')
        .directive('ngSlider', SliderDirective.factory());
})(ngSliderComponents || (ngSliderComponents = {}));
