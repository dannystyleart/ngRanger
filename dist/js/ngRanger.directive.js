/**

 @name       ngSlider AngularJS directives
 @author     Daniel Sebestyen <dannystyleart@gmail.com>
 @url        https://gitlab.com/dannystyleart/ng-slider
 @license    MIT

 The MIT License (MIT)
 =====================

 Copyright © 2016 Daniel Sebestyen

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the “Software”), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
 */
var ngSliderComponents;
(function (ngSliderComponents) {
    var ngRanger = (function () {
        function ngRanger() {
        }

        return ngRanger;
    })();
    var ngRangerDirective = [function () {
        return {
            restrict: 'AE',
            replace: true,
            scope: {},
            link: function () {
            },
            template: '<h1>It works!</h1>'
        };
    }];
    angular.module('ngSlider')
        .directive('ngRanger', ngRangerDirective);
})(ngSliderComponents || (ngSliderComponents = {}));
