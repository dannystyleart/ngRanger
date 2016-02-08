var ngSliderComponents;
(function (ngSliderComponents) {
    var SliderEvent = (function () {
        function SliderEvent() {
        }
        SliderEvent.onChange = "ngSlider:change";
        SliderEvent.forceRender = "ngSlider:forceRender";
        SliderEvent.renderDone = "ngSlider:rendered";
        return SliderEvent;
    })();
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
        SlideElement.prototype.hide = function () {
            this.element.css({ 'opacity': 0, 'visibility': 'hidden' });
        };
        SlideElement.prototype.show = function () {
            this.element.css({ 'opacity': 1, 'visibility': 'visible' });
        };
        SlideElement.prototype.setContent = function (content) {
            this.element.html(content);
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
            this.scope = { model: '=', modelHigh: '=', min: '=', max: '=', translateFn: '&', step: '=', precision: '=', onChange: '&' };
            this.template = '<div class="ng-slider">' +
                '<span class="ng-slider-min-label"></span>' +
                '<span class="ng-slider-max-label"></span>' +
                '<span class="ng-slider-label"></span>' +
                '<span class="ng-slider-fullbar"></span>' +
                '<span class="ng-slider-selection"></span>' +
                '<span class="ng-slider-handle-low"></span>' +
                '<span class="ng-slider-handle-high"></span>' +
                '</div>';
            /**
             * Range feature flag
             * @type {boolean}
             */
            this.isRange = false;
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
             * Slider width
             * @type {number}
             */
            this.sWidth = 0;
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
            this.sLeft = 0;
            /**
             * Slider viewport maximum left offset
             * @type {number}
             */
            this.sMaxLeft = 0;
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
                _this.init();
                _this.translateFn = angular.isFunction(scope.translateFn) ? scope.translateFn() : _this.translateFn;
                _this.render();
                angular.element(_this.$window).bind('resize', angular.bind(_this, _this.render));
                var modelWatcher = _this.$$scope.$watch('model', function (current, prev) {
                    if (angular.isDefined(current) && (current !== prev)) {
                        _this.renderHandles();
                        _this.renderLabels();
                        _this.renderSelectionBar();
                    }
                }, true);
                _this.$$scope.$on('$destroy', function () {
                    modelWatcher;
                });
                _this.$$scope.$on(SliderEvent.forceRender, function () {
                    _this.render();
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
         * Initialize element directive attributes and scope values
         */
        SliderDirective.prototype.init = function () {
            // Validate proper usage
            if (angular.isUndefined(this.$$attrs.min) && this.$$attrs.min === '') {
                throw new Error('ngSlider directive must have a \'min\' attribute given');
            }
            else if (!angular.isNumber(this.$$scope.min)) {
                throw new Error('ngSlider directive \'min\' attribute must be a valid number');
            }
            if (angular.isUndefined(this.$$attrs.max) && this.$$attrs.max === '') {
                throw new Error('ngSlider directive must have a \'max\' attribute given');
            }
            else if (!angular.isNumber(this.$$scope.max)) {
                throw new Error('ngSlider directive \'max\' attribute must be a valid number');
            }
            if (angular.isUndefined(this.$$attrs.model) && this.$$attrs.model === '') {
                throw new Error('ngSlider directive must have a \'model\' attribute given');
            }
            else if (!angular.isNumber(this.$$scope.model)) {
                this.$$scope.model = this.$$scope.min;
            }
            // Initialize base attributes
            this.minVal = this.$$scope.min;
            this.maxVal = this.$$scope.max;
            this.valueRange = this.maxVal - this.minVal;
            this.isRange = angular.isDefined(this.$$attrs.modelHigh);
            this.step = angular.isDefined(this.$$scope.step) ? this.$$scope.step : 1;
            this.precision = angular.isDefined(this.$$scope.precision) ? this.$$scope.precision : 0;
            this.onChange = angular.isDefined(this.$$attrs.onChange) && angular.isFunction(this.$$scope.onChange()) ? this.$$scope.onChange() : angular.noop;
            // Initialize model
            this.$$scope.model = angular.isNumber(this.$$scope.model) ? this.$$scope.model : this.minVal;
            this.$$scope.modelHigh = this.isRange && !angular.isNumber(this.$$scope.modelHigh) ? this.maxVal : this.$$scope.modelHigh;
        };
        SliderDirective.prototype.render = function () {
            var _this = this;
            this.$timeout(function () {
                _this.initElements();
                _this.calcViewDimensions();
                _this.bindEventsToElements();
                _this.$$scope.$emit(SliderEvent.renderDone);
            });
        };
        /**
         * Calculating view dimensions. This will be called on each window resize and when 'slideRender' event fired
         */
        SliderDirective.prototype.calcViewDimensions = function () {
            // compute element width
            this.sWidth = this.$$element[0].getBoundingClientRect().width;
            this.sLeft = this.$$element[0].getBoundingClientRect().left;
            this.sMaxLeft = this.sWidth - this.handleWidth;
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
                        break;
                    case 1:
                        // max-label
                        var maxLabel = new SlideElement(element, _this.maxVal);
                        _this.handles.push(maxLabel);
                        break;
                    case 2:
                        // handle label
                        var handlerLabel = new SlideElement(element, _this.$$scope.model);
                        _this.handles.push(handlerLabel);
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
                        _this.handles.push(selection);
                        break;
                    case 5:
                        // handle-low
                        var handler = new SlideElement(element, _this.minVal);
                        _this.handleWidth = handler.width();
                        _this.handles.push(handler);
                        break;
                    case 6:
                        // handle-high
                        var handler = new SlideElement(element, _this.minVal);
                        _this.handleWidth = handler.width();
                        if (!_this.isRange) {
                            handler.hide();
                        }
                        _this.handles.push(handler);
                        break;
                }
            }, this);
            this.$timeout(function () {
                _this.renderHandles();
                _this.renderSelectionBar();
                _this.renderLabels();
            });
        };
        /**
         * Bind events to elements for dragging and clicking
         */
        SliderDirective.prototype.bindEventsToElements = function () {
            this.unbindEvents();
            angular.element(this.$$element).bind('DOMMouseScroll mousewheel', angular.bind(this, this.onWheel));
            var lowHandler = this.getSliderElement('LOWHANDLE');
            lowHandler.element.bind('mousedown touchstart', angular.bind(this, this.onStart, lowHandler, 'model'));
            if (this.isRange) {
                var highHandle = this.getSliderElement('HIGHHANDLE');
                highHandle.element.bind('mousedown touchstart', angular.bind(this, this.onStart, highHandle, 'modelHigh'));
            }
        };
        /**
         * Unbind events to elements for dragging and clicking
         */
        SliderDirective.prototype.unbindEvents = function () {
            angular.element(this.$$element).unbind('DOMMouseScroll mousewheel');
            this.getSliderElement('LOWHANDLE').element.unbind('mousedown touchstart');
            if (this.isRange) {
                this.getSliderElement('HIGHHANDLE').element.unbind('mousedown touchstart');
            }
        };
        /**
         * Compute event's X offset
         * @param {JQueryInputEventObject} event
         * @returns {number}
         */
        SliderDirective.prototype.eventX = function (event) {
            var eventX = 0;
            if (angular.isDefined(event.clientX)) {
                eventX = event.clientX;
            }
            else if (angular.isDefined(event.touches) && event.touches.length > 0) {
                eventX = event.touches[0].clientX;
            }
            else if (angular.isDefined(event.originalEvent)) {
                eventX = event.originalEvent.touches[0].clientX;
            }
            return eventX;
        };
        /**
         * Compute mousewheel event's delta value
         * @param {JQueryInputEventObject} event
         * @returns {number}
         */
        SliderDirective.prototype.wheelDelta = function (event) {
            var delta = 0;
            if (angular.isDefined(event.wheelDelta)) {
                delta = event.wheelDelta;
            }
            else if (angular.isDefined(event.originalEvent.wheelDelta)) {
                delta = event.originalEvent.wheelDelta;
            }
            else if (angular.isDefined(event.originalEvent.detail)) {
                delta = event.originalEvent.detail;
            }
            return delta;
        };
        /**
         * Proper event stopping
         * @param {JQueryEventObject} event
         */
        SliderDirective.prototype.stopEvent = function (event) {
            if (event.stopPropagation)
                event.stopPropagation();
            if (event.preventDefault)
                event.preventDefault();
            event.cancelBubble = true;
            event.returnValue = false;
        };
        /**
         * Event handler for event fired on mousewheel event on the slider element
         * @param {jQLiteEvent} event
         */
        SliderDirective.prototype.onWheel = function (event) {
            this.stopEvent(event);
            if (this.wheelDelta(event) > 0) {
                if (this.$$scope.model + this.step <= this.maxVal) {
                    this.$$scope.model += this.step;
                }
            }
            else {
                if (this.$$scope.model - this.step >= this.minVal) {
                    this.$$scope.model -= this.step;
                }
            }
            this.$$scope.$apply();
            this.renderHandles();
            this.renderLabels();
            this.renderSelectionBar();
        };
        /**
         * Event handler for event fired on mousedown and touchstart events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        SliderDirective.prototype.onStart = function (handler, control, event) {
            this.stopEvent(event);
            handler.element.addClass('active');
            this.$document.on('mousemove touchmove', angular.bind(this, this.onMove, handler, control));
            this.$document.on('mouseup touchend', angular.bind(this, this.onStop, handler, control));
        };
        /**
         * Event handler for event fired on mousemove and touchmove events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        SliderDirective.prototype.onMove = function (handler, control, event) {
            var eventX = this.eventX(event), sliderLO = this.sLeft, newOffset = eventX - sliderLO - (this.handleWidth / 2), newValue;
            newValue = this.roundValue(this.offsetToValue(newOffset));
            if (newOffset <= 0 || newValue <= 0) {
                if (handler.sLeft !== 0) {
                    handler.sVal = 0;
                    this.$$scope[control] = 0;
                    this.$$scope.$apply();
                    this.renderHandles();
                    this.renderLabels();
                    this.renderSelectionBar();
                }
                return;
            }
            else if (newOffset > this.sMaxLeft || newValue > this.maxVal) {
                handler.sVal = this.maxVal;
                this.$$scope[control] = this.maxVal;
                this.$$scope.$apply();
                this.renderHandles();
                this.renderLabels();
                this.renderSelectionBar();
                return;
            }
            if (control === 'model' && this.$$scope[control] > this.$$scope.modelHigh) {
                control = 'modelHigh';
            }
            else if (control === 'modelHigh' && this.$$scope[control] < this.$$scope.model) {
                control = 'model';
            }
            handler.sVal = newValue;
            this.$$scope[control] = newValue;
            this.$$scope.$apply();
            this.renderHandles();
            this.renderLabels();
            this.renderSelectionBar();
        };
        /**
         * Render slide handles
         */
        SliderDirective.prototype.renderHandles = function () {
            var handler = this.getSliderElement('LOWHANDLE'), newOffset = this.valueToOffset(this.$$scope.model);
            this.setLeft(handler, newOffset);
            if (this.isRange) {
                var highHandler = this.getSliderElement('HIGHHANDLE'), newOffset = this.valueToOffset(this.$$scope.modelHigh);
                this.setLeft(highHandler, newOffset);
            }
        };
        /**
         * Render labels
         */
        SliderDirective.prototype.renderLabels = function () {
            var handleLabel = this.getSliderElement('HANDLELABEL'), minLabel = this.getSliderElement('MINLABEL'), maxLabel = this.getSliderElement('MAXLABEL'), handleLabelOffset;
            handleLabel.setContent(this.translateFn(this.$$scope.model));
            handleLabelOffset = this.valueToOffset(this.$$scope.model) - (handleLabel.width() / 2) + (this.handleWidth / 2);
            if (handleLabelOffset < 0) {
                this.setLeft(handleLabel, 0);
            }
            else if (handleLabelOffset + handleLabel.width() >= this.fullBarWidth) {
                this.setLeft(handleLabel, this.fullBarWidth - handleLabel.width());
            }
            else {
                this.setLeft(handleLabel, handleLabelOffset);
            }
            minLabel.setContent(this.translateFn(this.minVal));
            this.setLeft(minLabel, 0);
            maxLabel.setContent(this.translateFn(this.maxVal));
            this.setLeft(maxLabel, this.fullBarWidth - maxLabel.width());
            if (handleLabelOffset <= minLabel.width()) {
                minLabel.hide();
            }
            else {
                minLabel.show();
            }
            if (handleLabelOffset + handleLabel.width() < (this.fullBarWidth - maxLabel.width())) {
                maxLabel.show();
            }
            else {
                maxLabel.hide();
            }
        };
        /**
         * Render selection bar
         */
        SliderDirective.prototype.renderSelectionBar = function () {
            var selection = this.getSliderElement('SELECTION'), newOffset = this.valueToOffset(this.$$scope.model), newCss;
            if (!this.isRange) {
                newCss = { 'width': newOffset + 'px' };
            }
            else {
                newCss = { 'left': newOffset + 'px', 'width': this.valueToOffset((this.$$scope.modelHigh - this.$$scope.model)) + 'px' };
            }
            selection.element.css(newCss);
        };
        /**
         * Event handler for event fired on mouseup and touchstop events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        SliderDirective.prototype.onStop = function (handler, control, event) {
            handler.element.removeClass('active');
            this.$document.unbind('mousemove touchmove');
            this.$document.unbind('mouseup touchend');
            this.$$scope.$emit(SliderEvent.onChange, control, this.$$scope[control]);
            this.onChange.call(this, control, this.$$scope[control]);
            this.renderHandles();
            this.renderLabels();
            this.renderSelectionBar();
        };
        /**
         * Set left offset of slider element
         * @param {SliderElement} sliderElement
         * @param {number} offset
         */
        SliderDirective.prototype.setLeft = function (sliderElement, offset) {
            sliderElement.sLeft = offset;
            sliderElement.element.css({ 'left': offset + 'px' });
        };
        /**
         * Convert value to offset
         * @param {number} value
         * @returns {number}
         */
        SliderDirective.prototype.valueToOffset = function (value) {
            return (value - this.minVal) * this.sMaxLeft / this.valueRange;
        };
        /**
         * Convert handler offset to valid value
         * @param {number} offset
         * @returns {number}
         */
        SliderDirective.prototype.offsetToValue = function (offset) {
            return (offset / this.sMaxLeft) * this.valueRange + this.minVal;
        };
        /**
         * Convert floated value to round value aligned to steps
         * @param {number} value
         * @returns {number}
         */
        SliderDirective.prototype.roundValue = function (value) {
            var step = this.step, remainder = (value - this.minVal) % step, steppedValue = remainder > (step / 2) ? value + step - remainder : value - remainder;
            return +(steppedValue).toFixed(this.precision);
        };
        /**
         * Retrieve SliderElement
         * @param {string} handlerName
         * @returns {SliderElement|undefined}
         */
        SliderDirective.prototype.getSliderElement = function (handlerName) {
            var lookupClass, element;
            switch (handlerName.toUpperCase()) {
                case 'FULLBAR':
                    lookupClass = 'ng-slider-fullbar';
                    break;
                case 'SELECTION':
                    lookupClass = 'ng-slider-selection';
                    break;
                case 'LOWHANDLE':
                    lookupClass = 'ng-slider-handle-low';
                    break;
                case 'HIGHHANDLE':
                    lookupClass = 'ng-slider-handle-high';
                    break;
                case 'HANDLELABEL':
                    lookupClass = 'ng-slider-label';
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
