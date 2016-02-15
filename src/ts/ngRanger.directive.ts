module ngRangerComponents {

    /**
     * Ranger Events
     */
    class ngRangerEvent {
        /**
         * Change event ( Emitted )
         * Fired when model change. Event will get the modelKey {[model,modelHigh]}, and the value {number} arguments
         * @type {string}
         */
        static onChange:string = "ngRanger:change";
        /**
         * Forced rendering ( Watched )
         * Useful when the directive instantiated when parent element has display: none;
         * @type {string}
         */
        static forceRender:string = "ngRanger:forceRender";
        /**
         * Rendered notifier ( Emitted )
         * Event fired when component is rendered, ready to work
         * @type {string}
         */
        static renderDone:string = "ngRanger:rendered"
    }

    /**
     * Ranger Element wrapper
     * Used for easier handling of elements
     */
    class ngRangerElement implements ng.IDirective {
        /**
         * Element model-related value placeholder
         * @type {number}
         */
        sVal:number = 0;
        /**
         * Element width
         * @type {number}
         */
        sWidth:number = 0;
        /**
         * Element relative left position
         * @type {number}
         */
        sLeft:number = 0;
        /**
         * Visibility flag
         * @type {boolean}
         */
        isVisible:boolean = true;

        constructor(public element:ng.IAugmentedJQuery, sVal:number) {
            this.sWidth = this.width();
        }

        /**
         * Get actual width of element
         * @returns {number}
         */
        width():number {
            return this.element[0].getBoundingClientRect().width;
        }

        /**
         * Manipulate visibility: Hide
         */
        hide():void {
            this.isVisible = false;
            this.element.css({'opacity': 0, 'visibility': 'hidden'});
        }

        /**
         * Manipulate visibility: Show
         */
        show():void {
            this.isVisible = true;
            this.element.css({'opacity': 1, 'visibility': 'visible'});
        }

        /**
         * Set html content of element
         * @param {string} content
         */
        setContent(content) {
            this.element.html(content);
        }
    }

    interface RangerScope extends ng.IScope {
        max: number;
        min: number;
        model: number;
        modelHigh?:number;
        onChange?:Function;
        precision?:number;
        rangeMinVolume?:number;
        rangeMaxVolume?:number;
        rangeVolume?:string;
        step?:number;
        translateFn()
    }

    class ngRanger {
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
        private precision = 2;
        /**
         * Stepper value
         * @type {number}
         */
        private step = 1;
        /**
         * Container for slide holder items
         * @type {Array}
         */
        private handles:Array<ngRangerComponents.IHandler & any> = [];
        /**
         * Rangee component width
         * @type {number}
         */
        private sWidth:number = 0;
        /**
         * Range fullBar Width
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
         * Range component viewport left offset
         * @type {number}
         */
        private sLeft:number = 0;
        /**
         * Range component viewport maximum left offset
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

        constructor(private $document, private $window, private $timeout, private $scope:RangerScope, private $element, private $attrs) {
            // Initialize config
            this.init();

            // Apply resize listener
            angular.element(this.$window).bind('resize', angular.bind(this, this.render));

            // Render component
            this.render();

            // Register model watcher - useful when model is touched from outside of directive
            var modelWatcher = this.$scope.$watch('model', (current, prev) => {
                if (angular.isDefined(current) && (current !== prev)) {
                    this.renderHandles();
                    this.renderLabels();
                    this.renderSelectionBar();
                }
            }, true);

            var modelHighWatcher = this.$scope.$watch('modelHigh', (current, prev) => {
                if (angular.isDefined(current) && (current !== prev)) {
                    this.renderHandles();
                    this.renderLabels();
                    this.renderSelectionBar();
                }
            }, true);

            // Unregister all watcher
            this.$scope.$on('$destroy', () => {
                modelWatcher();
                modelHighWatcher();
            });

            // Register listener for force render event
            this.$scope.$on(ngRangerEvent.forceRender, () => {
                this.render();
            });
        }

        /**
         * Initialize element directive attributes and scope values
         */
        private init():void {

            // Validate proper usage
            if (angular.isUndefined(this.$attrs.min) && this.$attrs.min === '') {
                throw new Error('ngRanger directive must have a \'min\' attribute given');
            } else if (!angular.isNumber(this.$scope.min)) {
                throw new Error('ngRanger directive \'min\' attribute must be a valid number');
            }
            if (angular.isUndefined(this.$attrs.max) && this.$attrs.max === '') {
                throw new Error('ngRanger directive must have a \'max\' attribute given');
            } else if (!angular.isNumber(this.$scope.max)) {
                throw new Error('ngRanger directive \'max\' attribute must be a valid number');
            }
            if (angular.isUndefined(this.$attrs.model) && this.$attrs.model === '') {
                throw new Error('ngRanger directive must have a \'model\' attribute given');
            } else if (!angular.isNumber(this.$scope.model)) {
                this.$scope.model = this.$scope.min;
            }

            // Initialize base attributes
            this.minVal = this.$scope.min;
            this.maxVal = this.$scope.max;
            this.valueRange = this.maxVal - this.minVal;
            this.isRange = angular.isDefined(this.$attrs.modelHigh);
            this.step = angular.isDefined(this.$scope.step) ? this.$scope.step : 1;
            this.precision = angular.isDefined(this.$scope.precision) && angular.isNumber(this.$scope.precision) ? this.$scope.precision : this.precision;
            // for ultimate precision
            this.precision = this.step < 1 && this.step.toString().length < this.precision ? this.step.toString().length : this.precision;
            this.onChange = angular.isDefined(this.$attrs.onChange) && angular.isFunction(this.$scope.onChange()) ? this.$scope.onChange() : angular.noop;
            this.rangeMinVolume = angular.isNumber(this.$scope.rangeMinVolume) && this.$scope.rangeMinVolume > 0 ? this.$scope.rangeMinVolume : -1;
            this.rangeMaxVolume = angular.isNumber(this.$scope.rangeMaxVolume) && this.$scope.rangeMaxVolume > 0 ? this.$scope.rangeMaxVolume : -1;
            this.translateFn = angular.isFunction(this.$scope.translateFn()) ? this.$scope.translateFn() : this.translateFn;

            if (angular.isDefined(this.$attrs.rangeVolume) && angular.isString(this.$attrs.rangeVolume)) {
                var testRangeVolumes = this.$attrs.rangeVolume.split(':');
                if (testRangeVolumes.length === 2) {
                    this.rangeVolume[0] = (parseInt(testRangeVolumes[0]) > 0) ? parseInt(testRangeVolumes[0]) : -1;
                    this.rangeMinVolume = this.rangeVolume[0];
                    this.rangeVolume[1] = (parseInt(testRangeVolumes[1]) > 0) ? parseInt(testRangeVolumes[1]) : -1;
                    this.rangeMaxVolume = this.rangeVolume[1];
                } else if (testRangeVolumes.length === 1) {
                    this.rangeVolume[0] = (parseInt(testRangeVolumes[0]) > 0) ? parseInt(testRangeVolumes[0]) : -1;
                    this.rangeMinVolume = this.rangeVolume[0];
                }
            } else {

                if (this.rangeMinVolume > 0) {
                    this.rangeVolume[0] = this.rangeMinVolume;
                }
                if (this.rangeMaxVolume > 0) {
                    this.rangeVolume[1] = this.rangeMaxVolume;
                }
            }

            // Initialize model
            this.$scope.model = angular.isNumber(this.$scope.model) ? this.$scope.model : this.minVal;
            this.$scope.modelHigh = !this.isRange || !angular.isNumber(this.$scope.modelHigh) ? this.maxVal : this.$scope.modelHigh;

            if (this.isRange && this.rangeMinVolume > -1 && (this.$scope.modelHigh - this.$scope.model) < this.rangeMinVolume) {
                this.$scope.modelHigh = this.$scope.model + this.rangeMinVolume;
            } else if (this.isRange && this.rangeMaxVolume > -1 && (this.$scope.modelHigh - this.$scope.model) > this.rangeMaxVolume) {
                this.$scope.modelHigh = this.$scope.model + this.rangeMaxVolume;
            } else if (this.isRange && this.rangeMinVolume > -1 && this.rangeMaxVolume === -1) {
                this.$scope.modelHigh = this.$scope.model + this.rangeMinVolume;
            }
        }

        /**
         * Render component. This will be called on each window resize and when 'forceRender' event fired
         */
        private render():void {
            this.$timeout(() => {
                this.initElements();
                this.calcViewDimensions();
                this.bindEventsToElements();
                this.$scope.$emit(ngRangerEvent.renderDone);
            });
        }

        /**
         * Calculating view dimensions.
         */
        calcViewDimensions():void {
            // compute element width
            this.sWidth = this.$element[0].getBoundingClientRect().width;
            this.sLeft = this.$element[0].getBoundingClientRect().left;
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
            angular.forEach(this.$element.find('span'), (element, elemIndex)=> {
                element = angular.element(element);
                switch (elemIndex) {
                    case 0:
                        // min-label
                        var minLabel = new ngRangerElement(element, this.minVal);
                        this.handles.push(minLabel);
                        break;
                    case 1:
                        // max-label
                        var maxLabel = new ngRangerElement(element, this.maxVal);
                        this.handles.push(maxLabel);
                        break;
                    case 2:
                        // fullbar
                        var fullBar = new ngRangerElement(element, this.minVal);
                        this.handles.push(fullBar);
                        this.fullBarWidth = fullBar.width();
                        break;
                    case 3:
                        // selection
                        var selection = new ngRangerElement(element, this.minVal);
                        this.handles.push(selection);
                        break;
                    case 4:
                        // label low
                        var handlerLabel = new ngRangerElement(element, this.$scope.model);
                        this.handles.push(handlerLabel);
                        break;
                    case 5:
                        // handle-low
                        var handler = new ngRangerElement(element, this.minVal);
                        this.handleWidth = handler.width();
                        this.handles.push(handler);
                        break;
                    case 6:
                        // label high
                        var handlerLabel = new ngRangerElement(element, this.$scope.modelHigh);
                        this.handles.push(handlerLabel);
                        if (!this.isRange) {
                            handlerLabel.hide();
                        }
                        break;
                    case 7:
                        // handle-high
                        var handler = new ngRangerElement(element, this.minVal);
                        this.handleWidth = handler.width();
                        if (!this.isRange) {
                            handler.hide();
                        }
                        this.handles.push(handler);
                        break;
                    case 8:
                        // cmbLab
                        var handlerLabel = new ngRangerElement(element, null);
                        if (!this.isRange) {
                            handlerLabel.hide();
                        }
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
            if (angular.isDefined(this.$attrs.scroll)) {
                angular.element(this.$element).bind('DOMMouseScroll mousewheel', angular.bind(this, this.onWheel));
            }

            var lowHandler = this.getngRangerElement('LOWHANDLE');
            lowHandler.element.bind('mousedown touchstart', angular.bind(this, this.onStart, lowHandler, 'model'));

            if (this.isRange) {
                var highHandle = this.getngRangerElement('HIGHHANDLE');
                highHandle.element.bind('mousedown touchstart', angular.bind(this, this.onStart, highHandle, 'modelHigh'));
            }

        }

        /**
         * Unbind events from elements for dragging and clicking
         */
        unbindEvents():void {
            if (angular.isDefined(this.$attrs.scroll)) {
                angular.element(this.$element).unbind('DOMMouseScroll mousewheel');
            }
            this.getngRangerElement('LOWHANDLE').element.unbind('mousedown touchstart');
            if (this.isRange) {
                this.getngRangerElement('HIGHHANDLE').element.unbind('mousedown touchstart');
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

        wheelTimeout = false;
        /**
         * Event handler for event fired on mousewheel event on the slider element
         * @param {jQLiteEvent} event
         */
        onWheel(event:JQueryEventObject):void {

            this.stopEvent(event);

            if (this.wheelDelta(event) > 0) {
                if (this.$scope.model + this.step <= this.maxVal) {
                    this.$scope.model += this.step;
                }
            } else {
                if (this.$scope.model - this.step >= this.minVal) {
                    this.$scope.model -= this.step;
                }
            }

            if (this.wheelTimeout) {
                this.$timeout.cancel(this.wheelTimeout);
                this.wheelTimeout = false;
            }

            this.wheelTimeout = this.$timeout(() => {
                this.$scope.$emit(ngRangerEvent.onChange, 'model', this.$scope.model);
                this.onChange.call(this, 'model', this.$scope.model);
            }, 100);

            this.$scope.$apply();
            this.renderHandles();
            this.renderLabels();
            this.renderSelectionBar();
        }

        /**
         * Event handler for event fired on mousedown and touchstart events
         * @param {ngRangerElement} handler
         * @param {jQLiteEvent} event
         */
        onStart(handler:ngRangerElement, control:string, event:JQueryEventObject) {
            this.stopEvent(event);
            handler.element.addClass('active');
            this.$document.on('mousemove touchmove', angular.bind(this, this.onMove, handler, control));
            this.$document.on('mouseup touchend', angular.bind(this, this.onStop, handler, control));
        }

        /**
         * Event handler for event fired on mousemove and touchmove events
         * @param {ngRangerElement} handler
         * @param {jQLiteEvent} event
         */
        onMove(handler:ngRangerElement, control:string, event:JQueryInputEventObject & any) {

            var eventX = this.eventX(event),
                sliderLeftOffset = this.sLeft,
                eventRelativeOffset = eventX - sliderLeftOffset - (this.handleWidth / 2),
                rangeMinVolume = this.rangeVolume[0] > -1 ? this.rangeVolume[0] : -1,
                rangeMaxVolume = this.rangeVolume[1] > -1 ? this.rangeVolume[1] : -1,
                newValue;

            newValue = this.roundValue(this.offsetToValue(eventRelativeOffset));

            if (this.isRange) {

                if (rangeMinVolume > -1) {
                    if (control === 'model') {
                        if (eventRelativeOffset <= this.valueToOffset(this.minVal)) {
                            handler.sVal = this.minVal;
                        } else if (eventRelativeOffset >= this.valueToOffset(this.maxVal - rangeMinVolume)) {
                            handler.sVal = this.maxVal - rangeMinVolume;
                        } else {
                            if (newValue + rangeMinVolume >= this.$scope.modelHigh) {
                                this.$scope.modelHigh = newValue + rangeMinVolume;
                            }
                            handler.sVal = newValue;
                        }
                    } else {
                        if (eventRelativeOffset >= this.valueToOffset(this.maxVal)) {
                            handler.sVal = this.maxVal;
                        } else if (eventRelativeOffset <= this.valueToOffset(this.minVal + rangeMinVolume)) {
                            handler.sVal = this.minVal + rangeMinVolume;
                        } else {
                            if (newValue - rangeMinVolume <= this.$scope.model) {
                                this.$scope.model = newValue - rangeMinVolume;
                            }
                            handler.sVal = newValue;
                        }
                    }
                }

                if (rangeMinVolume === -1) {
                    if (eventRelativeOffset <= this.valueToOffset(this.minVal)) {
                        handler.sVal = this.minVal;
                    } else if (eventRelativeOffset >= this.valueToOffset(this.maxVal)) {
                        handler.sVal = this.maxVal;
                    } else {

                        if (control === 'model') {
                            if (eventRelativeOffset >= this.valueToOffset(this.$scope.modelHigh)) {
                                this.$scope.modelHigh = newValue;
                            } else if (eventRelativeOffset >= this.valueToOffset(this.maxVal)) {
                                this.$scope.modelHigh = this.maxVal;
                                newValue = this.maxVal;
                            }
                            handler.sVal = newValue;

                        } else {
                            if (eventRelativeOffset <= this.valueToOffset(this.$scope.model)) {
                                this.$scope.model = newValue;
                            } else if (eventRelativeOffset <= this.valueToOffset(this.minVal)) {
                                this.$scope.model = this.minVal;
                                newValue = this.minVal;
                            }
                            handler.sVal = newValue;
                        }

                    }
                }

                if (rangeMaxVolume > -1) {

                    if (control === 'model') {
                        if (this.$scope.modelHigh - this.$scope.model >= rangeMaxVolume) {
                            this.$scope.modelHigh = this.$scope.model + rangeMaxVolume;
                        }
                    } else {
                        if (this.$scope.modelHigh - this.$scope.model >= rangeMaxVolume) {
                            this.$scope.model = this.$scope.modelHigh - rangeMaxVolume;
                        }
                    }

                }

                this.$scope[control] = handler.sVal;

            } else {
                handler.sVal = (eventRelativeOffset <= this.valueToOffset(this.minVal)) ? this.minVal : (eventRelativeOffset >= this.valueToOffset(this.maxVal) ? this.maxVal : newValue);
                this.$scope[control] = handler.sVal;
            }

            this.renderHandles();
            this.renderLabels();
            this.renderSelectionBar();

        }

        /**
         * Event handler for event fired on mouseup and touchstop events
         * @param {ngRangerElement} handler
         * @param {jQLiteEvent} event
         */
        onStop(handler:ngRangerElement, control:string, event) {
            handler.element.removeClass('active');
            this.$document.unbind('mousemove touchmove');
            this.$document.unbind('mouseup touchend');
            this.$scope.$emit(ngRangerEvent.onChange, control, this.$scope[control]);
            this.onChange.call(this, control, this.$scope[control]);
            this.renderHandles();
            this.renderLabels();
            this.renderSelectionBar();
        }

        /**
         * Render dragging handlers
         */
        renderHandles():void {
            var handler = this.getngRangerElement('LOWHANDLE'),
                newOffset = this.valueToOffset(this.$scope.model);
            this.setLeft(handler, newOffset);
            if (this.isRange) {

                var highHandler = this.getngRangerElement('HIGHHANDLE'),
                    newOffset = this.valueToOffset(this.$scope.modelHigh);
                this.setLeft(highHandler, newOffset);

            }
        }

        /**
         * Render labels to min/max values; low/high model handlers and a
         * combo label which contains low/high values when labesl are too near
         */
        renderLabels():void {

            var minLab = this.getngRangerElement('MINLABEL'),
                maxLab = this.getngRangerElement('MAXlABEL'),
                loLab = this.getngRangerElement('LOWLABEL'),
                hiLab = this.getngRangerElement('HIGHLABEL'),
                cmbLab = this.getngRangerElement('CMBLABEL'),
                minOffset, maxOffset, loOffset, hiOffset, cmbOffset;

            minLab.setContent(this.translateFn(this.minVal));
            maxLab.setContent(this.translateFn(this.maxVal));
            loLab.setContent(this.translateFn(this.$scope.model));
            hiLab.setContent(this.translateFn(this.$scope.modelHigh || this.maxVal));
            cmbLab.setContent([this.translateFn(this.$scope.model), this.translateFn(this.$scope.modelHigh || this.maxVal)].join(' - '));

            minOffset = this.valueToOffset(this.minVal);
            maxOffset = this.fullBarWidth - maxLab.width();
            loOffset = this.valueToOffset(this.$scope.model) + this.handleWidth / 2 - loLab.width() / 2;
            hiOffset = this.isRange ? this.valueToOffset(this.$scope.modelHigh || this.maxVal) + this.handleWidth / 2 - hiLab.width() / 2 : 0;
            cmbOffset = this.isRange ? this.valueToOffset((this.$scope.model + (this.$scope.modelHigh || this.maxVal)) / 2) - (cmbLab.width() / 2) : 0;

            if (minOffset + minLab.width() > loOffset) {
                minLab.hide();
                loOffset = minOffset;
            } else {
                minLab.show();
            }

            if (loOffset + loLab.width() >= maxOffset) {
                maxLab.hide();
                loOffset = this.fullBarWidth - loLab.width();
            } else {
                maxLab.show();
            }

            if (this.isRange) {

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
         * Render the selection bar
         */
        renderSelectionBar():void {
            var selection = this.getngRangerElement('SELECTION'),
                newOffset = this.valueToOffset(this.$scope.model),
                newCss;
            if (!this.isRange) {
                newCss = {'width': newOffset + 'px'};
            } else {
                newCss = {'left': newOffset + 'px', 'width': this.valueToOffset((this.$scope.modelHigh - this.$scope.model)) + 'px'};
            }

            selection.element.css(newCss);
        }

        /**
         * Set left offset of slider element
         * @param {ngRangerElement} sliderElement
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
         * Retrieve ngRangerElement
         * @param {string} handlerName
         * @returns {ngRangerElement|undefined}
         */
        getngRangerElement(handlerName:string):ngRangerElement {

            var lookupClass,
                element;

            switch (handlerName.toUpperCase()) {
                case 'FULLBAR':
                    lookupClass = 'ng-ranger-fullbar';
                    break;
                case 'SELECTION':
                    lookupClass = 'ng-ranger-selection';
                    break;
                case 'LOWHANDLE':
                    lookupClass = 'ng-ranger-handle-low';
                    break;
                case 'HIGHHANDLE':
                    lookupClass = 'ng-ranger-handle-high';
                    break;
                case 'LOWLABEL':
                    lookupClass = 'ng-ranger-label-low';
                    break;
                case 'MINLABEL':
                    lookupClass = 'ng-ranger-min-label';
                    break;
                case 'HIGHLABEL':
                    lookupClass = 'ng-ranger-label-high';
                    break;
                case 'MAXLABEL':
                    lookupClass = 'ng-ranger-max-label';
                    break;
                case 'CMBLABEL':
                    lookupClass = 'ng-ranger-label-cmb';
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

    /**
     * Angular Directive Config
     */
    let ngRangerDirective = ['$document', '$window', '$timeout', function ($document, $window, $timeout) {
        return {
            restrict: 'E',
            replace: true,
            scope: {model: '=', modelHigh: '=?', min: '=', max: '=', translateFn: '&', step: '=?', precision: '=?', onChange: '&', rangeMinVolume: '=?', rangeMaxVolume: '=?'},
            template: '<div class="ng-ranger">' +
            '<span class="ng-ranger-min-label"></span>' +
            '<span class="ng-ranger-max-label"></span>' +
            '<span class="ng-ranger-fullbar"></span>' +
            '<span class="ng-ranger-selection"></span>' +
            '<span class="ng-ranger-label-low"></span>' +
            '<span class="ng-ranger-handle-low"></span>' +
            '<span class="ng-ranger-label-high"></span>' +
            '<span class="ng-ranger-handle-high"></span>' +
            '<span class="ng-ranger-label-cmb"></span>' +
            '</div>',
            link: function ($scope, $element, $attrs) {
                new ngRanger($document, $window, $timeout, $scope, $element, $attrs)
            }
        };
    }];

    angular.module('ngRanger')
        .directive('ngRanger', ngRangerDirective);


}