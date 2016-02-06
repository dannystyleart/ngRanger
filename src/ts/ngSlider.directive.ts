module ngSliderComponents {

    export interface ISliderScope extends ng.IScope {
        model: number,
        min: number,
        max: number,
        showLabels?:boolean
        translateFn(value:number):any
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
    }

    class SliderDirective {

        static $inject = ['$document', '$timeout'];

        restrict = 'E';
        replace = true;
        scope = {model: '=', min: '=', max: '=', translateFn: '&'};
        template = '<div class="ng-slider">' +
            '<span class="ng-slider-min-label"></span>' +
            '<span class="ng-slider-max-label"></span>' +
            '<span class="ng-slider-handle"></span>' +
            '<span class="ng-slider-fullbar"></span>' +
            '<span class="ng-slider-selection"></span>' +
            '</div>';

        constructor(private $document, private $timeout) {
        }


        private $$scope:ISliderScope;
        private $$element:ng.IAugmentedJQuery;
        private $$attrs:ng.IAttributes;

        handles:Array<ngSliderComponents.IHandler & any> = [];
        width:number = 0;
        fullBarWidth:number = 0;
        minVal:number = 0;
        maxVal:number = 0;
        left:number = 0;
        maxLeft:number = 0;
        handleWidth:number = 0;

        translateFn(value:number):any {
            return value;
        };

        link = (scope:ISliderScope, element:ng.IAugmentedJQuery, attrs:ng.IAttributes) => {
            this.$$scope = scope;
            this.$$element = element;
            this.$$attrs = attrs;
            this.translateFn = angular.isFunction(scope.translateFn) ? scope.translateFn : this.translateFn;

            this.init();

            this.initElements();
            this.calcViewDimensions();

            this.bindEventsToElements();


        };

        static factory() {
            var directive = ($document, $timeout) => new SliderDirective($document, $timeout);
            return directive;
        }

        /**
         * Initialize element, bind events, compute metrics
         */
        init():void {
            this.minVal = this.$$scope.min;
            this.maxVal = this.$$scope.max;
        }

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


            // compute handles width
            angular.forEach(this.$$element.find('span'), (element, elemIndex)=> {
                element = angular.element(element);
                switch (elemIndex) {
                    case 0:
                        // min-label
                        this.handles.push(new SlideElement(element, this.minVal));
                        break;
                    case 1:
                        // max-label
                        this.handles.push(new SlideElement(element, this.maxVal));
                        break;
                    case 2:
                        // handle
                        var handler = new SlideElement(element, this.minVal);
                        this.handleWidth = handler.width();
                        this.handles.push(handler);
                        break;
                    case 3:
                        // fullbar
                        var fullBar = new SlideElement(element, this.minVal);
                        this.handles.push(fullBar);
                        this.fullBarWidth = fullBar.width();
                        break;
                    case 4:
                        // selection
                        this.handles.push(new SlideElement(element, this.minVal));
                        break;
                }
            }, this);

        }

        bindEventsToElements():void {
            var _handles = this.handles.filter((sliderItem) => {
                if (sliderItem.element.hasClass('ng-slider-handle')) {
                    return sliderItem;
                }
            });

            angular.forEach(_handles, (handler) => {
                handler.element.bind('mousedown', angular.bind(this, this.onStart, handler));
            });

        }

        onStart(handler, event) {
            event.stopPropagation();
            event.preventDefault();

            handler.element.addClass('active');
            this.$document.on('mousemove', angular.bind(this, this.onMove, handler));
            this.$document.on('mouseup', angular.bind(this, this.onStop, handler));
        }

        onMove(handler, event) {
            var eventX = event.clientX || (typeof(event.originalEvent) != 'undefined' ? event.originalEvent.touches[0].clientX : event.touches[0].clientX),
                sliderLO = this.left,
                newOffset = eventX - sliderLO - (this.handleWidth / 2),
                newValue;


            if (newOffset <= 0) {

                if (handler.sLeft !== 0) {
                    this.setLeft(handler, 0);
                }

                return;
            } else if (newOffset > this.maxLeft) {
                this.setLeft(handler, this.maxLeft);
                return;
            }

            this.setLeft(handler, newOffset);

        }

        onStop(handler) {
            handler.element.removeClass('active');
            this.$document.unbind('mousemove');
            this.$document.unbind('mouseup');
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
            return 1;
        }

        /**
         * Converts handler offset to valid value
         * @param {number} offset
         * @returns {number}
         */
        offsetToValue(offset:number):number {
            return 1;
        }

    }

    angular.module('ngSlider')
        .directive('ngSlider', SliderDirective.factory());
}