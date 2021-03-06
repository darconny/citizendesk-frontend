'use strict';

describe('Controller: ReportWebLinkCtrl', function () {

  // load the controller's module
  beforeEach(module('citizendeskFrontendApp'));

  var ReportCtrl,
      scope,
      $httpBackend,
      Report = {
        getSelectedCoverage: function(){},
        checkPublished: function(){},
        getVerificationHandler: function(){ return function(){}; },
        addSteps: function(){},
        getStepsHandler: function(){ return function(){}; }
      },
      Coverages = { promise: { then: function(){} } },
      $window = {
        history: {
          back: function(){}
        }
      },
      PageBroker = {
        load: function(){}
      },
      dependencies = {
        $routeParams: {id: 'abcdef'},
        Report: Report,
        Coverages: Coverages,
        $window: $window,
        PageBroker: PageBroker
      },
      def = {
        reports: {}
      },
      $q,
      api;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, _$httpBackend_, _$q_, _api_) {
    $q = _$q_;
    api = _api_;
    spyOn(api.reports, 'getById').andCallThrough();
    spyOn(api.steps, 'query').andCallThrough();
    spyOn(Report, 'getVerificationHandler').andCallThrough();
    spyOn(PageBroker, 'load');

    scope = $rootScope.$new();
    dependencies.$scope = scope;
    ReportCtrl = $controller('ReportWebLinkCtrl', dependencies);
    $httpBackend = _$httpBackend_;
    api.reports.def.getById
      .resolve(angular.copy(mocks.reports['5418128a9c616745002376bb']));
    api.steps.def.query.resolve(mocks.steps.list);
    scope.$digest();
  }));

  it('has the correct link to the endpoint', function() {
    expect(scope.report._links.self.href)
      .toBe('/reports/5418128a9c616745002376bb');
  });
  it('attaches a report to the scope', function () {
    expect(scope.report).toBeDefined();
  });
  it('checks when verified', function() {
    scope.verified = true;
    scope.$digest();
    expect(Report.getVerificationHandler).toHaveBeenCalled();
  });
  describe('starting with existent steps', function() {
    beforeEach(inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();
      dependencies.$scope = scope;
      api.reports.reset.getById();
      api.steps.reset.query();
      ReportCtrl = $controller('ReportSmsCtrl', dependencies);
      api.reports.def.getById
        .resolve(angular.copy(mocks.reports['538df48f9c616729ad000035']));
      api.steps.def.query.resolve(mocks.steps.list);
      scope.$digest();
    }));
    it('checks when verified', function() {
      scope.verified = true;
      scope.$digest();
      expect(Report.getVerificationHandler).toHaveBeenCalled();
    });
  });
  it('deletes a summary', function(){
    def.reports.remove = $q.defer();
    spyOn(scope.api.reports, 'remove')
      .andReturn(def.reports.remove.promise);
    spyOn($window.history, 'back');
    scope.deleteSummary();
    expect(scope.api.reports.remove).toHaveBeenCalled();
    expect(scope.deleteSummaryDisabled).toBe(true);
    def.reports.remove.resolve({});
    scope.$digest();
    expect($window.history.back).toHaveBeenCalled();
  });
  it('leads to the media select page', function() {
    scope.toMediaSelection();
    var args = PageBroker.load.mostRecentCall.args;
    expect(args[0])
      .toBe('/select-media-to-publish/web_link/5418128a9c616745002376bb');
    expect(args[1]._id).toBe(scope.report._id);
  });
});
