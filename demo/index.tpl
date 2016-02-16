<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ngRanger</title>
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/paper/bootstrap.min.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">
    <!--SRC:CSS-->
</head>
<body ng-app="app">

<div class="container">
    <div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2 col-lg-6 col-lg-offset-3">

        <div class="panel panel-default">
            <div class="jumbotron" style="margin-bottom: 0">
                <h3 class="text-center">ngRanger <span class="fa fa-fw fa-map-marker"></span></h3>
            </div>
            <div class="panel-body" ng-controller="SliderExampleController">

                <p class="text-center text-muted">Detailed demo page coming soon</p>

                <h6 class="text-muted text-uppercase">Single slider Example</h6>
                <ng-ranger min="0" max="100" model="sliderModel" translate-fn="translateFn" scroll></ng-ranger>

                <h6 class="text-muted text-uppercase">Range slider Examples</h6>

                <ng-ranger min="rangeMin" on-change="onChange" max="200" model="rangeLow" model-high="rangeHigh" translate-fn="translateFn"></ng-ranger>

                <ng-ranger min="rangeMin" on-change="onChange" range-volume="25:100" max="200" model="fixedRangeLow" model-high="fixedRangeHigh"
                           translate-fn="translateFn"></ng-ranger>

            </div>


            <table class="table">
                <thead>
                <tr>
                    <th>Option</th>
                    <th>Possible Value</th>
                    <th>Description</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>min</td>
                    <td>number</td>
                    <td>Specifies the floor / lowest possible value</td>
                </tr>

                <tr>
                    <td>max</td>
                    <td>number</td>
                    <td>Specifies the ceil / highest possible value</td>
                </tr>

                <tr>
                    <td>model</td>
                    <td>number</td>
                    <td>Model of the slider</td>
                </tr>

                <tr>
                    <td>modelHigh</td>
                    <td>number</td>
                    <td>Higher Model of the slider</td>
                </tr>

                <tr>
                    <td>scroll</td>
                    <td>attribute</td>
                    <td>If attribute presented lower model will be scrollable</td>
                </tr>

                <tr>
                    <td>translateFn</td>
                    <td>function</td>
                    <td>A function to format values' label text</td>
                </tr>

                <tr>
                    <td>rangeMinVolume</td>
                    <td>number</td>
                    <td>Minimum values (distance) between low and high model value</td>
                </tr>

                <tr>
                    <td>rangeMaxVolume</td>
                    <td>number</td>
                    <td>Maximum values (distance) between low and high model value</td>
                </tr>

                <tr>
                    <td>rangeVolume</td>
                    <td>string</td>
                    <td>Combined distance in a format _'N:N'_ e.g: _10:40 means the minimum distance is 10 and maximum is 40 between low and high values_</td>
                </tr>
                <tr>
                    <td>precision</td>
                    <td>number</td>
                    <td>Length of .toFixed() when calculating round values. Useful when step is lower than 0</td>
                </tr>
                <tr>
                    <td>step</td>
                    <td>number</td>
                    <td>Distance between 2 valid values on the range. e.g step = 2, the valid values on a 0-10 range: <em>0, 2, 4, 6, 8, 10</em></td>
                </tr>
                </tbody>
            </table>


        </div>
    </div>
</div>

<script src="bower_components/angular/angular.min.js"></script>
<!--SRC:JS-->
<script src="js/app.js"></script>
</body>
                                                                                                                                                                                                                                                                                                                                                          