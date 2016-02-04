/// <reference path="ngSlider.d.ts"/>

module ngSlider {

    export interface ISliderScope extends ng.IScope {
        model: number,
        min: number,
        max: number,
        showLabels?:boolean,
        translateFn(value:any):string
    }

    class SlideHandle {
        sVal:number;
        sWidth:number;
        sLeft:number;

        constructor(public element:ng.IAugmentedJQuery, value:number) {
            this.sVal = value;
            this.sLeft = 0;
            this.sWidth = this.element.width();
            return this;
        }
    }

    class ngSliderLink {

        handles:Array<ngSlider.IHandler> = [];
        width:number = 0;
        minVal:number = 0;
        maxVal:number = 0;
        translateFn = angular.noop;

        constructor(private scope:ISliderScope, private element:ng.IAugmentedJQuery, private attrs:ng.IAttributes) {
            // Initialize
            this.translateFn = angular.isFunction(scope.translateFn) ? scope.translateFn : angular.noop;
            this.init();
            // Initialize elements

            // Render
        }

        init():void {
            // Initialization - run once when component loads up and just have been compiled
            // set min and max values
            this.minVal = this.scope.min;
            this.maxVal = this.scope.max;

            // Initialize Elements
            this.initElements();
            // invoke event bindings
            this.bindEventsToElements();
        }

        initElements():void {
            // compute element width
            this.width = this.element.width();

            // compute handles width
            angular.forEach(this.element.find('span'), (element, elemIndex)=> {
                switch (elemIndex) {
                    case 0:
                        this.handles.push(new SlideHandle(element, this.minVal));
                        break;
                    case 1:
                        this.handles.push(new SlideHandle(element, this.maxVal));
                        break;
                    case 2:
                        this.handles.push(new SlideHandle(element, this.minVal));
                        break;
                    case 3:
                        this.handles.push(new SlideHandle(element, this.minVal));
                        break;
                    case 4:
                        this.handles.push(new SlideHandle(element, this.minVal));
                        break;
                }
            }, this);
        }

        bindEventsToElements():void {

        }

        valueToOffset():number {
            return 1;
        }

        offsetToValue():number {
            return 1;
        }

        render():void {

        }

    }

    let ngSliderDirective = [function () {
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
        }
    }];

    angular.module('ngSlider')
        .directive('ngSlider', ngSliderDirective);
}