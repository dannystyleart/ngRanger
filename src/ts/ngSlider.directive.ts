module ngSliderComponents {
    'use strict';
    /**
     * @TODO:
     * Solve singleton problem -> ngSlider class instantiates only once so the link function will be applied only on the last directive
     *
     * Combo label ( when high handle & min handle's label is too near )
     * RangeMinVolume (optional)
     * RangeMaxVolume (optional)
     * RangeVolume (excludes min and max volume)
     */

    export interface INgSliderScope extends ng.IScope {
        model: number;
        modelHigh: number;
        min: number;
        max: number;
        step: number;
        precision: number;
        showLabels?:boolean;
        translateFn():ng.IInterpolationFunction;
        onChange():void;
        rangeMinVolume?:number;
        rangeMaxVolume?:number;
        rangeVolume?:Array<number>;
    }

    interface INgSliderAttributes extends ng.IAttributes {
        model: any;
        modelHigh?: any;
        min: any;
        max: any;
        step?: any;
        precision?: any;
        showLabels?:any;
        translateFn?:any;
        onChange?:any;
        scroll?:any;
        rangeMinVolume?:any;
        rangeMaxVolume?:any;
        rangeVolume?:any;
    }

    class SliderEvent {
        static onChange:string = "ngSlider:change";
        static forceRender:string = "ngSlider:forceRender";
        static renderDone:string = "ngSlider:rendered"
    }

    class SlideElement implements ng.IDirective {
        sVal:number;
        sWidth:number;
        sLeft:number;
        isVisible:boolean = true;

        constructor(public element:ng.IAugmentedJQuery, sVal:number) {
            this.sLeft = 0;
            this.sWidth = this.width();
        }

        width():number {
            return this.element[0].getBoundingClientRect().width;
        }

        hide():void {
            this.isVisible = false;
            this.element.css({'opacity': 0, 'visibility': 'hidden'});
        }

        show():void {
            this.isVisible = true;
            this.element.css({'opacity': 1, 'visibility': 'visible'});
        }

        setContent(content) {
            this.element.html(content);
        }
    }

    export class SliderDirective {

        public restrict = 'E';
        public replace = true;
        public scope = {model: '=', modelHigh: '=', min: '=', max: '=', translateFn: '&', step: '=', precision: '=', onChange: '&'};
        public template = '<div class="ng-slider">' +
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
        private isRange:boolean = false;
        /**
         * Minimum Volume of selection range
         * @type {number}
         */
        private rangeMinVolume:number = -1;
        /**
         * Maximum Volume of selection range
         * @type {number}
         */
        private rangeMaxVolume:number = -1;
        /**
         * Minimum and Maximum Volume of selection range
         * @type {Array<number>}
         */
        private rangeVolume:Array<number> = [-1, -1];
        /**
         * Precision pointer for fixed numbers
         * @type {number}
         */
        private precision = 0;
        /**
         * Stepper value
         * @type {number}
         */
        private step = 1;
        /**
         * Linked property
         * $$scope
         */
        private $$scope:INgSliderScope;
        /**
         * Linked property
         * $$element
         */
        private $$element:ng.IAugmentedJQuery;
        /**
         * Linked property
         * $$attrs
         */
        private $$attrs:INgSliderAttributes;
        /**
         * Container for slide holder items
         * @type {Array}
         */
        private handles:Array<ngSliderComponents.IHandler & any> = [];
        /**
         * Slider width
         * @type {number}
         */
        private sWidth:number = 0;
        /**
         * Slide fullBar Width
         * @type {number}
         */
        private fullBarWidth:number = 0;
        /**
         * Floor value of slider
         * @type {number}
         */
        private minVal:number = 0;
        /**
         * Ceiling value of slider
         * @type {number}
         */
        private maxVal:number = 0;
        /**
         * Range number of values - computed
         * @type {number}
         */
        private valueRange:number = 0;
        /**
         * Slider viewport left offset
         * @type {number}
         */
        private sLeft:number = 0;
        /**
         * Slider viewport maximum left offset
         * @type {number}
         */
        private sMaxLeft:number = 0;
        /**
         * Handles' width
         * @type {number}
         */
        private handleWidth:number = 0;

        /**
         * Translate function to translate given value to a label text
         * @param {number} value Value of given offset
         * @returns {string}
         */
        private translateFn(value:number):string {
            return '' + value;
        }

        /**
         * On change callback
         * @param {string} model model key
         * @param {number} value current model value
         */
        private onChange:any;

        /**
         * Directive Link function
         * @param {object} $scope
         * @param {jQLiteElement} $element
         * @param {object} $attrs
         */
        public link:Function = ($scope:INgSliderScope, $element:ng.IAugmentedJQuery, $attrs:INgSliderAttributes):void => {

            this.$$scope = $scope;
            this.$$element = $element;
            this.$$attrs = $attrs;

            this.init();

            this.translateFn = angular.isFunction($scope.translateFn) ? $scope.translateFn() : this.translateFn;

            this.render();

            angular.element(this.$window).bind('resize', angular.bind(this, this.render));

            var modelWatcher = this.$$scope.$watch('model', (current, prev) => {
                if (angular.isDefined(current) && (current !== prev)) {
                    this.renderHandles();
                    this.renderLabels();
                    this.renderSelectionBar();
                }
            }, true);

            this.$$scope.$on('$destroy', () => {
                modelWatcher;
            });

            this.$$scope.$on(SliderEvent.forceRender, () => {
                this.render();
            });

        };

        /**
         * Factory function for directive
         * @returns {function(any, any): ngSliderComponents.SliderDirective}
         */
        static Factory() {
            var directive = ($document, $timeout, $window) => {
                return new SliderDirective($document, $timeout, $window);
            };
            directive.$inject = ['$document', '$timeout'];
            return directive;
        }

        /**
         * Initialize element directive attributes and scope values
         */
        init():void {

            // Validate proper usage
            if (angular.isUndefined(this.$$attrs.min) && this.$$attrs.min === '') {
                throw new Error('ngSlider directive must have a \'min\' attribute given');
            } else if (!angular.isNumber(this.$$scope.min)) {
                throw new Error('ngSlider directive \'min\' attribute must be a valid number');
            }
            if (angular.isUndefined(this.$$attrs.max) && this.$$attrs.max === '') {
                throw new Error('ngSlider directive must have a \'max\' attribute given');
            } else if (!angular.isNumber(this.$$scope.max)) {
                throw new Error('ngSlider directive \'max\' attribute must be a valid number');
            }
            if (angular.isUndefined(this.$$attrs.model) && this.$$attrs.model === '') {
                throw new Error('ngSlider directive must have a \'model\' attribute given');
            } else if (!angular.isNumber(this.$$scope.model)) {
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
            } else {

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

        }

        private render():void {
            this.$timeout(() => {
                this.initElements();
                this.calcViewDimensions();
                this.bindEventsToElements();
                this.$$scope.$emit(SliderEvent.renderDone);
            });
        }

        /**
         * Calculating view dimensions. This will be called on each window resize and when 'slideRender' event fired
         */
        calcViewDimensions():void {
            // compute element width
            this.sWidth = this.$$element[0].getBoundingClientRect().width;
            this.sLeft = this.$$element[0].getBoundingClientRect().left;
            this.sMaxLeft = this.sWidth - this.handleWidth;
        }

        /**
         * Initialize elements, storing and binding events
         */
        initElements():void {

            if (this.handles.length) {
                this.handles = [];
            }

            // compute handles width
            angular.forEach(this.$$element.find('span'), (element, elemIndex)=> {
                element = angular.element(element);

                switch (elemIndex) {
                    case 0:
                        // min-label
                        var minLabel = new SlideElement(element, this.minVal);
                        this.handles.push(minLabel);
                        break;
                    case 1:
                        // max-label
                        var maxLabel = new SlideElement(element, this.maxVal);
                        this.handles.push(maxLabel);
                        break;
                    case 2:
                        // fullbar
                        var fullBar = new SlideElement(element, this.minVal);
                        this.handles.push(fullBar);
                        this.fullBarWidth = fullBar.width();
                        break;
                    case 3:
                        // selection
                        var selection = new SlideElement(element, this.minVal);
                        this.handles.push(selection);
                        break;
                    case 4:
                        // label low
                        var handlerLabel = new SlideElement(element, this.$$scope.model);
                        this.handles.push(handlerLabel);
                        break;
                    case 5:
                        // handle-low
                        var handler = new SlideElement(element, this.minVal);
                        this.handleWidth = handler.width();
                        this.handles.push(handler);
                        break;
                    case 6:
                        // label high
                        var handlerLabel = new SlideElement(element, this.$$scope.modelHigh);
                        this.handles.push(handlerLabel);
                        if (!this.isRange) {
                            handlerLabel.hide();
                        }
                        break;
                    case 7:
                        // handle-high
                        var handler = new SlideElement(element, this.minVal);
                        this.handleWidth = handler.width();
                        if (!this.isRange) {
                            handler.hide();
                        }
                        this.handles.push(handler);
                        break;
                    case 8:
                        // cmbLab
                        var handlerLabel = new SlideElement(element, null);
                        this.handles.push(handlerLabel);
                        handlerLabel.hide();
                        break;
                }
            }, this);


            this.$timeout(() => {
                this.renderHandles();
                this.renderSelectionBar();
                this.renderLabels();
            });

        }

        /**
         * Bind events to elements for dragging and clicking
         */
        bindEventsToElements():void {

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

        }

        /**
         * Unbind events to elements for dragging and clicking
         */
        unbindEvents():void {
            if (angular.isDefined(this.$$attrs.scroll)) {
                angular.element(this.$$element).unbind('DOMMouseScroll mousewheel');
            }
            this.getSliderElement('LOWHANDLE').element.unbind('mousedown touchstart');
            if (this.isRange) {
                this.getSliderElement('HIGHHANDLE').element.unbind('mousedown touchstart');
            }
        }

        /**
         * Compute event's X offset
         * @param {JQueryInputEventObject} event
         * @returns {number}
         */
        private eventX(event:JQueryInputEventObject & any):number {
            var eventX = 0;
            if (angular.isDefined(event.clientX)) {
                eventX = event.clientX;
            } else if (angular.isDefined(event.touches) && event.touches.length > 0) {
                eventX = event.touches[0].clientX;
            } else if (angular.isDefined(event.originalEvent)) {
                eventX = event.originalEvent.touches[0].clientX;
            }

            return eventX;
        }

        /**
         * Compute mousewheel event's delta value
         * @param {JQueryInputEventObject} event
         * @returns {number}
         */
        private wheelDelta(event:JQueryInputEventObject & any):number {
            var delta = 0;

            if (angular.isDefined(event.wheelDelta)) {
                delta = event.wheelDelta
            } else if (angular.isDefined(event.originalEvent.wheelDelta)) {
                delta = event.originalEvent.wheelDelta
            } else if (angular.isDefined(event.originalEvent.detail)) {
                delta = event.originalEvent.detail
            }

            return delta;
        }

        /**
         * Proper event stopping
         * @param {JQueryEventObject} event
         */
        private stopEvent(event:JQueryEventObject):void {
            if (event.stopPropagation) event.stopPropagation();
            if (event.preventDefault) event.preventDefault();
            event.cancelBubble = true;
            event.returnValue = false;
        }

        /**
         * Event handler for event fired on mousewheel event on the slider element
         * @param {jQLiteEvent} event
         */
        onWheel(event:JQueryEventObject):void {
            this.stopEvent(event);

            if (this.wheelDelta(event) > 0) {
                if (this.$$scope.model + this.step <= this.maxVal) {
                    this.$$scope.model += this.step;
                }
            } else {
                if (this.$$scope.model - this.step >= this.minVal) {
                    this.$$scope.model -= this.step;
                }
            }

            this.$$scope.$apply();
            this.renderHandles();
            this.renderLabels();
            this.renderSelectionBar();
        }

        /**
         * Event handler for event fired on mousedown and touchstart events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        onStart(handler:SlideElement, control:string, event:JQueryEventObject) {
            this.stopEvent(event);
            handler.element.addClass('active');
            this.$document.on('mousemove touchmove', angular.bind(this, this.onMove, handler, control));
            this.$document.on('mouseup touchend', angular.bind(this, this.onStop, handler, control));
        }

        /**
         * Event handler for event fired on mousemove and touchmove events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        onMove(handler:SlideElement, control:string, event:JQueryInputEventObject & any) {

            var eventX = this.eventX(event),
                sliderLeftOffset = this.sLeft,
                eventRelativeOffset = eventX - sliderLeftOffset - (this.handleWidth / 2),
                rangeMinVolume = this.rangeVolume[0] > -1 ? this.rangeVolume[0] : false,
                rangeMaxVolume = this.rangeVolume[1] > -1 ? this.rangeVolume[1] : false,
                newValue;

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
            } else if (eventRelativeOffset > this.sMaxLeft || newValue > this.maxVal) {

                handler.sVal = this.maxVal;
                this.$$scope[control] = this.maxVal;
                this.$$scope.$apply();
                this.renderHandles();
                this.renderLabels();
                this.renderSelectionBar();
                return;
            }

            if (this.isRange) {
                if (rangeMinVolume !== false && (Math.abs(this.$$scope['modelHigh']) - Math.abs(this.$$scope['model']) < rangeMinVolume)) {
                    /**
                     * @TODO: INCREASE / DECREASE MODELS BY RANGE VALUE VOLUMES
                     * - TAKE CARE OF VALUES OUT OF BOUND
                     * - PREVENT RENDERING WHEN INVALID RANGE WOULD RENDERED - PREVENTING FLASHES
                     */
                }
            }

            /* @TODO EVADE OVERLAPING IN A BETTER WAY */
            if (control === 'model' && this.$$scope[control] > this.$$scope.modelHigh) {
                control = 'modelHigh';
            } else if (control === 'modelHigh' && this.$$scope[control] < this.$$scope.model) {
                control = 'model';
            }

            handler.sVal = newValue;
            this.$$scope[control] = newValue;
            this.$$scope.$apply();

            this.renderHandles();
            this.renderLabels();
            this.renderSelectionBar();

        }

        /**
         * Event handler for event fired on mouseup and touchstop events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        onStop(handler:SlideElement, control:string, event) {
            handler.element.removeClass('active');
            this.$document.unbind('mousemove touchmove');
            this.$document.unbind('mouseup touchend');
            this.$$scope.$emit(SliderEvent.onChange, control, this.$$scope[control]);
            this.onChange.call(this, control, this.$$scope[control]);
            this.renderHandles();
            this.renderLabels();
            this.renderSelectionBar();
        }

        /**
         * Render slide handles
         */
        renderHandles() {
            var handler = this.getSliderElement('LOWHANDLE'),
                newOffset = this.valueToOffset(this.$$scope.model);
            this.setLeft(handler, newOffset);
            if (this.isRange) {

                var highHandler = this.getSliderElement('HIGHHANDLE'),
                    newOffset = this.valueToOffset(this.$$scope.modelHigh);
                this.setLeft(highHandler, newOffset);

            }
        }

        /**
         * Render labels
         */
        renderLabels() {

            var minLab = this.getSliderElement('MINLABEL'),
                maxLab = this.getSliderElement('MAXlABEL'),
                loLab = this.getSliderElement('LOWLABEL'),
                hiLab = this.getSliderElement('HIGHLABEL'),
                cmbLab = this.getSliderElement('CMBLABEL'),
                minOffset, maxOffset, loOffset, hiOffset, cmbOffset;

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
            } else {
                minLab.show();
            }

            if (loOffset + loLab.width() > maxOffset) {
                maxLab.hide();
                loOffset = this.fullBarWidth - loLab.width();
            } else {
                maxLab.show();
            }

            if (hiOffset + hiLab.width() > maxOffset) {
                maxLab.hide();
                hiOffset = this.fullBarWidth - hiLab.width();
            } else {
                maxLab.show();
            }

            if (loOffset + loLab.width() > hiOffset) {
                cmbLab.show();
                loLab.hide();
                hiLab.hide();
            } else {
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
            this.setLeft(cmbLab, cmbOffset)

        }

        /**
         * Render selection bar
         */
        renderSelectionBar() {
            var selection = this.getSliderElement('SELECTION'),
                newOffset = this.valueToOffset(this.$$scope.model),
                newCss;
            if (!this.isRange) {
                newCss = {'width': newOffset + 'px'};
            } else {
                newCss = {'left': newOffset + 'px', 'width': this.valueToOffset((this.$$scope.modelHigh - this.$$scope.model)) + 'px'};
            }

            selection.element.css(newCss);
        }

        /**
         * Set left offset of slider element
         * @param {SliderElement} sliderElement
         * @param {number} offset
         */
        setLeft(sliderElement, offset):void {
            sliderElement.sLeft = offset;
            sliderElement.element.css({'left': offset + 'px'});
        }

        /**
         * Convert value to offset
         * @param {number} value
         * @returns {number}
         */
        valueToOffset(value:number):number {
            return (value - this.minVal) * this.sMaxLeft / this.valueRange;
        }

        /**
         * Convert handler offset to valid value
         * @param {number} offset
         * @returns {number}
         */
        offsetToValue(offset:number):number {
            return (offset / this.sMaxLeft) * this.valueRange + this.minVal;
        }

        /**
         * Convert floated value to round value aligned to steps
         * @param {number} value
         * @returns {number}
         */
        roundValue(value:any):number {

            var step = this.step,
                remainder = (value - this.minVal) % step,
                steppedValue = remainder > (step / 2) ? value + step - remainder : value - remainder;

            return +(steppedValue).toFixed(this.precision);

        }

        /**
         * Retrieve SliderElement
         * @param {string} handlerName
         * @returns {SliderElement|undefined}
         */
        getSliderElement(handlerName:string):SlideElement {

            var lookupClass,
                element;

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

        }

        constructor(private $document:ng.IDocumentService, private $timeout:ng.ITimeoutService, private $window:ng.IWindowService) {
        }
    }

    angular.module('ngSlider')
        .directive('ngSlider', SliderDirective.Factory());
}