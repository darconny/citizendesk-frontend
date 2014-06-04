'use strict';
/* jshint camelcase:false */

angular.module('citizendeskFrontendApp')
  .controller('ConfigureTwitterIngestionStreamsCtrl', ['$scope', 'prefix', '$http', 'Raven', 'resource', function ($scope, prefix, $http, Raven, resource) {
    var res = {
      filters: resource(prefix + '/twt_filters/:id'),
      streams: resource(prefix + '/twt_streams/:id')
    };
    $scope.disabled = {};
    $scope.error = {};
    $scope.restartDisabled = {};
    $scope.restartError = {};

    $scope.twtFilters = res.filters.query();
    $scope.twtStreams = res.streams.query();
    $scope.saveStream = function(original) {
      $scope.disabled[original._id] = true;
      original.$save()
        .finally(function() {
          $scope.disabled[original._id] = false;
        });
    };
    $scope.restartDisabled = {};
    $scope.restartError = {};
    $scope.restart = function(stream) {
      var id = stream._id;
      var path = prefix + '/proxy';
      $scope.restartDisabled[id] = true;
      $http
        .get(path + '/stop-stream/'+id)
        .success(function() {
          $http
            .get(path + '/start-stream/'+id)
            .success(function() {
              $scope.restartDisabled[id] = false;
              $scope.restartError[id] = false;
            })
            .error(function() {
              Raven.raven.captureMessage('error starting stream');
              $scope.restartDisabled[id] = false;
              $scope.restartError[id] = true;
            });
        })
        .error(function() {
          Raven.raven.captureMessage('error stopping stream');
          $scope.restartDisabled[id] = false;
          $scope.restartError[id] = true;
        });
    };
  }]);
