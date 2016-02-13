/// <reference path="../../bower_components/dt-angular/angular.d.ts"/>
/// <reference path="../../bower_components/dt-jquery/jquery.d.ts"/>

declare module ngSliderComponents {

    interface IHandler {
        element: ng.IAugmentedJQuery;
        sVal: number;
        sWidth: number;
        sLeft: number;
        width():number;
    }

}