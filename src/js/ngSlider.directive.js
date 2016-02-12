var ngSliderComponents;
(function (ngSliderComponents) {
    'use strict';
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
            this.isVisible = true;
            this.sLeft = 0;
            this.sWidth = this.width();
        }
        SlideElement.prototype.width = function () {
            return this.element[0].getBoundingClientRect().width;
        };
        SlideElement.prototype.hide = function () {
            this.isVisible = false;
            this.element.css({ 'opacity': 0, 'visibility': 'hidden' });
        };
        SlideElement.prototype.show = function () {
            this.isVisible = true;
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
                '<span class="ng-slider-fullbar"></span>' +
                '<span class="ng-slider-selection"></span>' +
                '<span class="ng-slider-label-low"></span>' +
                '<span class="ng-slider-handle-low"></span>' +
                '<span class="ng-slider-label-high"></span>' +
                '<span class="ng-slider-handle-high"></span>' +
                '<span class="ng-slider-label-cmb"></span>' +
                '</div>';
            /**
             * Range feature flag
             * @type {boolean}
             */
            this.isRange = false;
            /**
             * Minimum Volume of selection range
             * @type {number}
             */
            this.rangeMinVolume = -1;
            /**
             * Maximum Volume of selection range
             * @type {number}
             */
            this.rangeMaxVolume = -1;
            /**
             * Minimum and Maximum Volume of selection range
             * @type {Array<number>}
             */
            this.rangeVolume = [-1, -1];
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
             * @param {object} $scope
             * @param {jQLiteElement} $element
             * @param {object} $attrs
             */
            this.link = function ($scope, $element, $attrs) {
                _this.$$scope = $scope;
                _this.$$element = $element;
                _this.$$attrs = $attrs;
                _this.init();
                _this.translateFn = angular.isFunction($scope.translateFn) ? $scope.translateFn() : _this.translateFn;
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
        SliderDirective.Factory = function () {
            var directive = function ($document, $timeout, $window) {
                return new SliderDirective($document, $timeout, $window);
            };
            directive.$inject = ['$document', '$timeout'];
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
            this.rangeMinVolume = angular.isDefined(this.$$attrs.rangeMinVolume) && parseInt(this.$$attrs.rangeMinVolume) > 0 ? parseInt(this.$$attrs.rangeMinVolume) : -1;
            this.rangeMaxVolume = angular.isDefined(this.$$attrs.rangeMaxVolume) && parseInt(this.$$attrs.rangeMaxVolume) > 0 ? parseInt(this.$$attrs.rangeMaxVolume) : -1;
            if (angular.isDefined(this.$$attrs.rangeVolume) && angular.isString(this.$$attrs.rangeVolume) && this.$$attrs.rangeVolume.split(':').length === 2) {
                var testRangeVolumes = this.$$attrs.rangeVolume.split(':');
                this.rangeVolume[0] = (parseInt(testRangeVolumes[0]) > 0) ? parseInt(testRangeVolumes[0]) : -1;
                this.rangeMinVolume = this.rangeVolume[0];
                this.rangeVolume[1] = (parseInt(testRangeVolumes[1]) > 0) ? parseInt(testRangeVolumes[1]) : -1;
                this.rangeMaxVolume = this.rangeVolume[1];
            }
            else {
                if (this.rangeMinVolume > 0) {
                    this.rangeVolume[0] = this.rangeMinVolume;
                }
                if (this.rangeMaxVolume > 0) {
                    this.rangeVolume[1] = this.rangeMaxVolume;
                }
            }
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
                        // fullbar
                        var fullBar = new SlideElement(element, _this.minVal);
                        _this.handles.push(fullBar);
                        _this.fullBarWidth = fullBar.width();
                        break;
                    case 3:
                        // selection
                        var selection = new SlideElement(element, _this.minVal);
                        _this.handles.push(selection);
                        break;
                    case 4:
                        // label low
                        var handlerLabel = new SlideElement(element, _this.$$scope.model);
                        _this.handles.push(handlerLabel);
                        break;
                    case 5:
                        // handle-low
                        var handler = new SlideElement(element, _this.minVal);
                        _this.handleWidth = handler.width();
                        _this.handles.push(handler);
                        break;
                    case 6:
                        // label high
                        var handlerLabel = new SlideElement(element, _this.$$scope.modelHigh);
                        _this.handles.push(handlerLabel);
                        if (!_this.isRange) {
                            handlerLabel.hide();
                        }
                        break;
                    case 7:
                        // handle-high
                        var handler = new SlideElement(element, _this.minVal);
                        _this.handleWidth = handler.width();
                        if (!_this.isRange) {
                            handler.hide();
                        }
                        _this.handles.push(handler);
                        break;
                    case 8:
                        // cmbLab
                        var handlerLabel = new SlideElement(element, null);
                        _this.handles.push(handlerLabel);
                        handlerLabel.hide();
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
            if (angular.isDefined(this.$$attrs.scroll)) {
                angular.element(this.$$element).bind('DOMMouseScroll mousewheel', angular.bind(this, this.onWheel));
            }
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
            if (angular.isDefined(this.$$attrs.scroll)) {
                angular.element(this.$$element).unbind('DOMMouseScroll mousewheel');
            }
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
            var eventX = this.eventX(event), sliderLeftOffset = this.sLeft, eventRelativeOffset = eventX - sliderLeftOffset - (this.handleWidth / 2), rangeMinVolume = this.rangeVolume[0] > -1 ? this.rangeVolume[0] : false, rangeMaxVolume = this.rangeVolume[1] > -1 ? this.rangeVolume[1] : false, newValue;
            newValue = this.roundValue(this.offsetToValue(eventRelativeOffset));
            if (eventRelativeOffset <= 0 || newValue <= 0) {
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
            else if (eventRelativeOffset > this.sMaxLeft || newValue > this.maxVal) {
                handler.sVal = this.maxVal;
                this.$$scope[control] = this.maxVal;
                this.$$scope.$apply();
                this.renderHandles();
                this.renderLabels();
                this.renderSelectionBar();
                return;
            }
            /**
             * @TODO: INCREASE / DECREASE MODELS BY RANGE VALUE VOLUMES
             * - TAKE CARE OF VALUES OUT OF BOUND
             * - PREVENT RENDERING WHEN INVALID RANGE WOULD RENDERED - PREVENTING FLASHES
             */
            if (this.isRange) {
                if (rangeMinVolume !== false && (Math.abs(this.$$scope['modelHigh']) - Math.abs(this.$$scope['model']) < rangeMinVolume)) {
                }
            }
            /* EVADE OVERLAPING
             if (control === 'model' && this.$$scope[control] > this.$$scope.modelHigh) {
             control = 'modelHigh';
             } else if (control === 'modelHigh' && this.$$scope[control] < this.$$scope.model) {
             control = 'model';
             }
             */
            handler.sVal = newValue;
            this.$$scope[control] = newValue;
            this.$$scope.$apply();
            this.renderHandles();
            this.renderLabels();
            this.renderSelectionBar();
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
            var minLab = this.getSliderElement('MINLABEL'), maxLab = this.getSliderElement('MAXlABEL'), loLab = this.getSliderElement('LOWLABEL'), hiLab = this.getSliderElement('HIGHLABEL'), cmbLab = this.getSliderElement('CMBLABEL'), minOffset, maxOffset, loOffset, hiOffset, cmbOffset;
            minLab.setContent(this.translateFn(this.minVal));
            maxLab.setContent(this.translateFn(this.maxVal));
            loLab.setContent(this.translateFn(this.$$scope.model));
            hiLab.setContent(this.translateFn(this.$$scope.modelHigh || this.maxVal));
            cmbLab.setContent([this.translateFn(this.$$scope.model), this.translateFn(this.$$scope.modelHigh || this.maxVal)].join(' - '));
            minOffset = this.valueToOffset(this.minVal);
            maxOffset = this.fullBarWidth - maxLab.width();
            loOffset = this.valueToOffset(this.$$scope.model) + this.handleWidth / 2 - loLab.width() / 2;
            hiOffset = this.isRange ? this.valueToOffset(this.$$scope.modelHigh || this.maxVal) + this.handleWidth / 2 - hiLab.width() / 2 : 0;
            cmbOffset = this.isRange ? this.valueToOffset((this.$$scope.model + (this.$$scope.modelHigh || this.maxVal)) / 2) - (cmbLab.width() / 2) : 0;
            if (minOffset + minLab.width() > loOffset) {
                minLab.hide();
                loOffset = minOffset;
            }
            else {
                minLab.show();
            }
            if (loOffset + loLab.width() > maxOffset) {
                maxLab.hide();
                loOffset = this.fullBarWidth - loLab.width();
            }
            else {
                maxLab.show();
            }
            if (hiOffset + hiLab.width() > maxOffset) {
                maxLab.hide();
                hiOffset = this.fullBarWidth - hiLab.width();
            }
            else {
                maxLab.show();
            }
            if (loOffset + loLab.width() > hiOffset) {
                cmbLab.show();
                loLab.hide();
                hiLab.hide();
            }
            else {
                cmbLab.hide();
                loLab.show();
                hiLab.show();
            }
            if (cmbLab.isVisible) {
                if (cmbOffset < minOffset) {
                    cmbOffset = minOffset;
                    minLab.hide();
                    loLab.hide();
                }
                if (cmbOffset > this.fullBarWidth - cmbLab.width()) {
                    cmbOffset = this.fullBarWidth - cmbLab.width();
                    maxLab.hide();
                    hiLab.hide();
                }
            }
            this.setLeft(minLab, minOffset);
            this.setLeft(maxLab, maxOffset);
            this.setLeft(loLab, loOffset);
            this.setLeft(hiLab, hiOffset);
            this.setLeft(cmbLab, cmbOffset);
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
                case 'LOWLABEL':
                    lookupClass = 'ng-slider-label-low';
                    break;
                case 'MINLABEL':
                    lookupClass = 'ng-slider-min-label';
                    break;
                case 'HIGHLABEL':
                    lookupClass = 'ng-slider-label-high';
                    break;
                case 'MAXLABEL':
                    lookupClass = 'ng-slider-max-label';
                    break;
                case 'CMBLABEL':
                    lookupClass = 'ng-slider-label-cmb';
                    break;
            }
            this.handles.forEach(function (handle) {
                if (handle.element.hasClass(lookupClass)) {
                    element = handle;
                }
            });
            return element;
        };
        return SliderDirective;
    })();
    ngSliderComponents.SliderDirective = SliderDirective;
    angular.module('ngSlider')
        .directive('ngSlider', SliderDirective.Factory());
})(ngSliderComponents || (ngSliderComponents = {}));
