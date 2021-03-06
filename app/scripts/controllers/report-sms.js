'use strict';
/* jshint camelcase: false */

angular.module('citizendeskFrontendApp')
  .controller('ReportSmsCtrl', function ($scope, $routeParams, Raven, api, $location, Report, Coverages, $window, screenSize, superdeskDate) {
    var id = $routeParams.id;

    function updateReport() {
      return api.reports
        .getById(id)
        .then(function(report) {
          $scope.report = report;
          Report.addSteps($scope.report);
          $scope.selectedCoverage = Report
            .getSelectedCoverage(report, $scope.coverages);
          if (report.on_behalf_id) {
            api.users.getById(report.on_behalf_id)
              .then(function(user) {
                $scope.onBehalf = user;
              });
          }
        });
    }
    
    updateReport().then(function() {

      $scope.$watch('report.coverages', function() {
        $scope.isPublished = Report.checkPublished($scope.report);
      }, true);

      $scope.$watch('report.session', function(newValue) {
        $scope.encodedSession = encodeURIComponent(newValue);
      });

      $scope.$watch('report.status', Report.getVerificationHandler($scope));
      $scope.$watch('report.steps', Report.getStepsHandler($scope));

      $scope.$watch('report.status', function(n, o) {
        if(n === o) {
          return;
        }
        $scope.report.status_updated = superdeskDate.render(new Date());
        $scope.save();
      });

      $scope.$watch('report.texts', function() {
        $scope.hasTranscript = $scope.report.texts[0].transcript;
      }, true);
    });

    $scope.api = api; // expose for mocking in tests
    
    $scope.largeScreen = screenSize.is('md,lg');
    $scope.save = function() {
      $scope.status = 'info';
      $scope.alert = 'saving';
      $scope.disabled = true;

      api.reports.save($scope.report)
        .then(function () {
          $scope.status = 'success';
          $scope.alert = 'saved';
          $scope.disabled = false;
        })
        .catch(function () {
          $scope.status = 'danger';
          $scope.alert = 'error';
        });
    };

    $scope.changeStep = function(checking) {
      if (!checking) {
        alert('A validation step should never be unchecked, if you are unchecking now this means that the validation process was poor. Please be sure to avoid this in the future');
      }
      $scope.save();
    };

    $scope.startTranscript = function() {
      var initial;
      if ($scope.hasTranscript) {
        initial = $scope.report.texts[0].transcript;
      } else {
        initial = angular
          .copy($scope.report.texts[0].original);
      }
      $scope.transcriptCandidate = initial;
      $scope.editingTranscript = true;
    };

    $scope.cancelTranscriptEditing = function() {
      $scope.editingTranscript = false;
    };

    $scope.saveTranscript = function() {
      $scope.disableTranscript = true;
      var texts = angular.copy($scope.report.texts);
      texts[0].transcript = $scope.transcriptCandidate;
      api.reports
        .update($scope.report, {texts: texts})
        .then(function(report) {
          $scope.disableTranscript = false;
          $scope.editingTranscript = false;
          $scope.report = report;
        });
    };

    $scope.discardTranscript = function() {
      $scope.disableTranscript = true;
      var texts = angular.copy($scope.report.texts);
      texts[0].transcript = undefined;
      api.reports
        .update($scope.report, {texts: texts})
        .then(function(report) {
          $scope.disableTranscript = false;
          $scope.report = report;
        });
    };

    Coverages.promise.then(function(coverages) {
      $scope.coverages = coverages;
    });

    $scope.publish = function() {
      $scope.disablePublish = true;
      Report
        .publish($scope.report, $scope.selectedCoverage)
        .then(function() {
          updateReport();
          $scope.disablePublish = false;
      });
    };

    $scope.unpublish = function() {
      $scope.disablePublish = true;
      Report
        .unpublish($scope.report, $scope.selectedCoverage)
        .then(function() {
          updateReport();
          $scope.disablePublish = false;
        });
    };
    $scope.deleteSummary = function(){
      // no need to set it to false again. we will either have an
      // error or go back in the browser history
      $scope.deleteSummaryDisabled = true;
      api.reports
        .remove($scope.report)
        .then(function(){
          $window.history.back();
        });
    };
  });
