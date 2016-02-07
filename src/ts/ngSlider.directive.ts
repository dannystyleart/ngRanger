module ngSliderComponents {

    export interface ISliderScope extends ng.IScope {
        model: number;
        min: number;
        max: number;
        step: number;
        precision: number;
        showLabels?:boolean;
        translateFn():ng.IInterpolationFunction;
    }

    class SlideElement {
        sVal:number;
        sWidth:number;
        sLeft:number;

        constructor(public element:ng.IAugmentedJQuery, sVal:number) {
            this.sLeft = 0;
            this.sWidth = this.width();
            return this;
        }

        width():number {
            return this.element[0].getBoundingClientRect().width;
        }

        hide():void {
            this.element.css({'opacity': 0});
        }

        show():void {
            this.element.css({'opacity': 1});
        }

        setContent(content) {
            this.element.html(content);
        }
    }

    class SliderDirective {

        static $inject = ['$document', '$timeout'];

        restrict = 'E';
        replace = true;
        scope = {model: '=', min: '=', max: '=', translateFn: '&', step: '=', precision: '='};
        template = '<div class="ng-slider">' +
            '<span class="ng-slider-min-label"></span>' +
            '<span class="ng-slider-max-label"></span>' +
            '<span class="ng-slider-handle"></span>' +
            '<span class="ng-slider-label"></span>' +
            '<span class="ng-slider-fullbar"></span>' +
            '<span class="ng-slider-selection"></span>' +
            '</div>';

        constructor(private $document, private $timeout, private $window) {
        }

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
        private $$scope:ISliderScope;
        /**
         * Linked property
         * $$element
         */
        private $$element:ng.IAugmentedJQuery;
        /**
         * Linked property
         * $$attrs
         */
        private $$attrs:ng.IAttributes;
        /**
         * Container for slide holder items
         * @type {Array}
         */
        private handles:Array<ngSliderComponents.IHandler & any> = [];
        /**
         * Slide width
         * @type {number}
         */
        private width:number = 0;
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
        private left:number = 0;
        /**
         * Slider viewport maximum left offset
         * @type {number}
         */
        private maxLeft:number = 0;
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
         * Directive Link function
         * @param {object} scope
         * @param {jQLiteElement} element
         * @param {object} attrs
         */
        link = (scope:ISliderScope, element:ng.IAugmentedJQuery, attrs:ng.IAttributes) => {
            this.$$scope = scope;
            this.$$element = element;
            this.$$attrs = attrs;

            this.translateFn = angular.isFunction(scope.translateFn) ? scope.translateFn() : this.translateFn;

            this.init();

            this.initElements();
            this.calcViewDimensions();

            this.bindEventsToElements();

            angular.element(this.$window).bind('resize', () => {
                this.$timeout(() => {
                    this.initElements();
                    this.calcViewDimensions();
                });
            });

            var modelWatcher = this.$$scope.$watch('model', (current, prev) => {
                if (angular.isDefined(current) && (current !== prev)) {
                    this.updateHandler();
                    this.updateLabels();
                    this.updateSelection();
                }
            }, true);

            this.$$scope.$on('$destroy', () => {
                modelWatcher;
            });

        };

        /**
         * Factory function for directive
         * @returns {function(any, any): ngSliderComponents.SliderDirective}
         */
        static factory() {
            var directive = ($document, $timeout, $window) => new SliderDirective($document, $timeout, $window);
            return directive;
        }

        /**
         * Initialize element, bind events, compute metrics
         */
        init():void {
            this.minVal = this.$$scope.min;
            this.maxVal = this.$$scope.max;
            this.valueRange = this.maxVal - this.minVal;
            this.step = angular.isDefined(this.$$scope.step) ? this.$$scope.step : 1;
            this.precision = angular.isDefined(this.$$scope.precision) ? this.$$scope.precision : 0;
        }

        /**
         * Calculating view dimensions. This will be called on each window resize and when 'slideRender' event fired
         */
        calcViewDimensions():void {
            // compute element width
            this.width = this.$$element[0].getBoundingClientRect().width;
            this.left = this.$$element[0].getBoundingClientRect().left;
            this.maxLeft = this.width - this.handleWidth;
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
                        // handle
                        var handler = new SlideElement(element, this.minVal);
                        this.handleWidth = handler.width();
                        this.handles.push(handler);
                        break;
                    case 3:
                        // handle label
                        var handlerLabel = new SlideElement(element, this.$$scope.model);
                        this.handles.push(handlerLabel);
                        break;
                    case 4:
                        // fullbar
                        var fullBar = new SlideElement(element, this.minVal);
                        this.handles.push(fullBar);
                        this.fullBarWidth = fullBar.width();
                        break;
                    case 5:
                        // selection
                        var selection = new SlideElement(element, this.minVal);
                        this.handles.push(selection);
                        break;
                }
            }, this);


            this.$timeout(() => {
                this.updateHandler();
                this.updateSelection();
                this.updateLabels();
            });

        }

        /**
         * Bind events to elements for dragging and clicking
         */
        bindEventsToElements():void {

            angular.element(this.$$element).bind('DOMMouseScroll mousewheel', angular.bind(this, this.onWheel));

            var _handles = this.handles.filter((sliderItem) => {
                if (sliderItem.element.hasClass('ng-slider-handle')) {
                    return sliderItem;
                }
            });

            angular.forEach(_handles, (handler) => {
                handler.element.bind('mousedown touchstart', angular.bind(this, this.onStart, handler));
            });

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
            this.updateHandler();
            this.updateLabels();
            this.updateSelection();
        }

        /**
         * Event handler for event fired on mousedown and touchstart events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        onStart(handler:SlideElement, event:JQueryEventObject) {
            this.stopEvent(event);

            handler.element.addClass('active');
            this.$document.on('mousemove touchmove', angular.bind(this, this.onMove, handler));
            this.$document.on('mouseup touchend', angular.bind(this, this.onStop, handler));
        }

        /**
         * Event handler for event fired on mousemove and touchmove events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        onMove(handler:SlideElement, event:JQueryInputEventObject & any) {

            var eventX = this.eventX(event),
                sliderLO = this.left,
                newOffset = eventX - sliderLO - (this.handleWidth / 2),
                newValue;

            newValue = this.roundValue(this.offsetToValue(newOffset));

            if (newOffset <= 0 || newValue <= 0) {
                if (handler.sLeft !== 0) {
                    handler.sVal = 0;
                    this.$$scope.model = 0;
                    this.$$scope.$apply();
                    this.updateHandler();
                    this.updateLabels();
                    this.updateSelection();
                }

                return;
            } else if (newOffset > this.maxLeft || newValue > this.maxVal) {

                handler.sVal = this.maxVal;
                this.$$scope.model = this.maxVal;
                this.$$scope.$apply();
                this.updateHandler();
                this.updateLabels();
                this.updateSelection();
                return;
            }


            handler.sVal = newValue;
            this.$$scope.model = newValue;
            this.$$scope.$apply();

            this.updateHandler();
            this.updateLabels();
            this.updateSelection();

        }

        updateHandler() {
            var handler = this.getHandler('HANDLE'),
                newOffset = this.valueToOffset(this.$$scope.model);
            this.setLeft(handler, newOffset);
        }

        updateLabels() {

            var handleLabel = this.getHandler('HANDLELABEL'),
                minLabel = this.getHandler('MINLABEL'),
                maxLabel = this.getHandler('MAXLABEL'),
                handleLabelOffset = 0;

            handleLabel.setContent(this.translateFn(this.$$scope.model));
            handleLabelOffset = this.valueToOffset(this.$$scope.model) - (handleLabel.width() / 2) + (this.handleWidth / 2);
            if (handleLabelOffset < 0) {
                this.setLeft(handleLabel, 0);
            } else if (handleLabelOffset + handleLabel.width() >= this.fullBarWidth) {
                this.setLeft(handleLabel, this.fullBarWidth - handleLabel.width());
            } else {
                this.setLeft(handleLabel, handleLabelOffset);
            }

            minLabel.setContent(this.translateFn(this.minVal));
            this.setLeft(minLabel, 0);
            maxLabel.setContent(this.translateFn(this.maxVal));
            this.setLeft(maxLabel, this.fullBarWidth - maxLabel.width());


            if (handleLabelOffset <= minLabel.width()) {
                minLabel.hide();
            } else {
                minLabel.show();
            }

            if (handleLabelOffset + handleLabel.width() < (this.fullBarWidth - maxLabel.width())) {
                maxLabel.show();
            } else {
                maxLabel.hide();
            }
        }

        updateSelection() {
            var selection = this.getHandler('SELECTION'),
                newOffset = this.valueToOffset(this.$$scope.model);
            selection.element.css({'width': newOffset + 'px'});
        }

        /**
         * Event handler for event fired on mouseup and touchstop events
         * @param {SlideElement} handler
         * @param {jQLiteEvent} event
         */
        onStop(handler:SlideElement) {
            handler.element.removeClass('active');
            this.$document.unbind('mousemove touchmove');
            this.$document.unbind('mouseup touchend');
            this.$$scope.$emit('ngSlider:stop', this.$$scope.model);
            this.updateHandler();
            this.updateLabels();
            this.updateSelection();
        }

        /**
         *
         * @param element
         * @param {number} offset
         */
        setLeft(handle, offset):void {
            handle.sLeft = offset;
            handle.element.css({'left': offset + 'px'});
        }

        /**
         * Converts value to offset
         * @param {number} value
         * @returns {number}
         */
        valueToOffset(value:number):number {
            return (value - this.minVal) * this.maxLeft / this.valueRange;
        }

        /**
         * Converts handler offset to valid value
         * @param {number} offset
         * @returns {number}
         */
        offsetToValue(offset:number):number {
            return (offset / this.maxLeft) * this.valueRange + this.minVal;
        }

        /**
         * Convers floated value to round value aligned to steps
         * @param {number} value
         * @returns {number}
         */
        roundValue(value:any):number {

            var step = this.step,
                remainder = (value - this.minVal) % step,
                steppedValue = remainder > (step / 2) ? value + step - remainder : value - remainder;

            return +(steppedValue).toFixed(this.precision);

        }

        getHandler(handlerName:string):SlideElement {

            var lookupClass,
                element;

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

        }

    }

    angular.module('ngSlider')
        .directive('ngSlider', SliderDirective.factory());
}