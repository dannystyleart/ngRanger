<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ngSlider</title>
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
                <h3 class="text-center">ngSlider <span class="fa fa-fw fa-map-marker"></span></h3>
            </div>
            <div class="panel-body" ng-controller="SliderExampleController">
                <h6 class="text-muted text-uppercase">Range slider Example</h6>
                <ng-slider min="rangeMin" on-change="onChange" max="rangeMax" model="rangeLow" model-high="rangeHigh" translate-fn="translateFn"></ng-slider>
            </div>
        </div>
    </div>
</div>

<script src="bower_components/angular/angular.min.js"></script>
<!--SRC:JS-->
<script src="js/app.js"></script>
</body>
                                                                                                                                                                                                                                                                                                                                                          