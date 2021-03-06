'use strict';
/* jshint camelcase: false */

angular.module('citizendeskFrontendApp')
  .service('Report', function Report(api, session, $q, config, $http, lodash, gettextCatalog, $window, linkTweetEntities, Raven, reportStatuses, superdeskDate) {
    var _ = lodash;
    this.publish = function(report, coverage) {
      var modifiedReport = angular.copy(report),
          deferred = $q.defer();
      api.reports
        .save(modifiedReport, {on_behalf_id: session.identity._id})
        .then(function() {
          $http
            .post(config.server.url + 'proxy/publish', {
              report: report._id,
              coverage: coverage.uuid
            })
            .then(function() {
              deferred.resolve();
            });
        });
      return deferred.promise;
    };
    this.unpublish = function(report, coverage) {
      return $http.post(config.server.url + 'proxy/unpublish', {
        report: report._id,
        coverage: coverage.uuid
      });
    };
    this.checkPublished = function(report) {
      if (report.coverages && report.coverages.published) {
        return report.coverages.published.length > 0;
      } else {
        return false;
      }
    };
    this.getSelectedCoverage = function(report, coverages) {
      if (coverages && report.coverages && report.coverages.published) {
        return _.find(coverages, {uuid: report.coverages.published[0]});
      }
    };
    // abstraction of an handler needed both on the tweet report
    // controller and on the mobile report controller. get the
    // controller scope, and get also its window because it is tested
    // and mocked at the controller level
    this.getVerificationHandler = function($scope) {
      return function(newValue, oldValue){
        if(newValue === oldValue) {
          return;
        }
        // possibly complain about doing the necessary steps
        if ($scope.report.steps) {
          var badVerification = gettextCatalog.getString('This report is being marked as verified without going through the planned verification steps');
          var allDone = $scope.report.steps.every(function(step) {
            return step.done;
          });
          if (newValue === 'verified' && allDone === false) {
            $window.alert(badVerification);
          }
        }
        // possibly complain about not playing with verification
        if (oldValue === 'verified') {
          var doNotJump = gettextCatalog.getString('This report was marked as verified, and now it is marked as unverified again! This is a very bad practice, and should be avoided');
          $window.alert(doNotJump);
        }
      };
    };
    this.getStepsHandler = function($scope) {
      return function() {
        if ($scope.report && $scope.report.steps) {
          $scope.verificationDisabled = $scope.report.steps
            .some(function(step) {
              return step.mandatory && (!step.done);
            });
        } else {
          return false;
        }
      };
    };
    this.linkTweetTexts = function(report) {
      if (report.feed_type === 'tweet') {
        try {
          report.linkedText = linkTweetEntities(report);
        } catch (exception) {
          Raven.raven.captureException(exception);
        }
      }
    };
    this.linkTweetTextsInList = function(list) {
      list.forEach(this.linkTweetTexts);
    };
    this.getDismiss = function(disabled, callback) {
      return function(report) {
        disabled[report._id] = true;
        return api.reports
          .update(report, {
            assignments: [],
            status: reportStatuses('dismissed'),
            status_updated: superdeskDate.render(new Date())
          })
          .then(function(response) {
            disabled[report._id] = false;
            callback(response);
          });
      };
    };
    // see
    // https://github.com/sourcefabric-innovation/citizendesk-frontend/issues/29
    // for a bit more details about the initial properties
    this.create = function(parameters) {
      return {
        texts: [],
        summary: false,
        session: parameters.session,
        channels: [{
          type: 'frontend'
        }],
        produced: superdeskDate.render(new Date()),
        user_id: session._id,
        authors: [{
          authority: 'citizen_desk',
          identifiers: session._id
        }],
        assignments: [],
        feed_type: 'plain',
        automatic: false,
        local: true,
        proto: false
      };
    };
    this.addSteps = function(report) {
      if (!('steps' in report)) {
        api.steps.query()
          .then(function(response) {
            var data = response._items;
            if (data.length === 0) {
              Raven.raven.captureMessage('no validation steps for report detail');
            } else {
              report.steps = data.map(function(step) {
                step.done = false;
                return step;
              });
            }
          });
      }
    };
  });
