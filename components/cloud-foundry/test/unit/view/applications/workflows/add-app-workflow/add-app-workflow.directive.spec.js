(function () {
  'use strict';

  /* eslint-disable angular/no-private-call */
  describe('add-app-workflow directive', function () {
    var $httpBackend, $scope, $translate, that, $q, authModel, serviceInstanceModel, appModel, routeModel, spaceModel,
      privateDomainModel, sharedDomainModel, cfOrganizationModel, appEventService;

    function getResolved() {
      return $q.resolve();
    }

    function getRejected() {
      return $q.reject();
    }

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      $translate = $injector.get('$translate');
      var modelManager = $injector.get('modelManager');
      authModel = modelManager.retrieve('cloud-foundry.model.auth');
      serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      appModel = modelManager.retrieve('cloud-foundry.model.application');
      routeModel = modelManager.retrieve('cloud-foundry.model.route');
      spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      privateDomainModel = modelManager.retrieve('cloud-foundry.model.private-domain');
      sharedDomainModel = modelManager.retrieve('cloud-foundry.model.shared-domain');
      $q = $injector.get('$q');
      cfOrganizationModel = $injector.get('cfOrganizationModel');
      appEventService = $injector.get('appEventService');

      $httpBackend.whenGET('/pp/v1/cnsis/registered').respond(200, {});
      $httpBackend.expectGET('/pp/v1/cnsis/registered');

      $scope.testDismiss = function () {};
      $scope.testClose = function () {};

      var markup = '<add-app-workflow close-dialog="testClose" dismiss-dialog="testDismiss"></add-app-workflow>';
      var element = angular.element(markup);
      $compile(element)($scope);
      $scope.$apply();
      that = element.controller('addAppWorkflow');
      $httpBackend.flush();
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be compilable', function () {
      expect(that).toBeDefined();
    });

    describe('- after init', function () {
      beforeEach(function () {
      });

      it('should watch userInput.serviceInstance', function () {
        that.options.domains = [{
          value: 'my-domain'
        }];
        that.getDomains = getResolved;
        spyOn(that, 'getOrganizations');
        spyOn(that, 'getDomains').and.callThrough();
        that.userInput.serviceInstance = {};
        $scope.$apply();
        expect(that.getOrganizations).toHaveBeenCalled();
        expect(that.getDomains).toHaveBeenCalled();
        expect(that.userInput.domain).toBe(that.options.domains[0].value);
      });

      it('should watch userInput.organization', function () {
        spyOn(that, 'getSpacesForOrganization');
        that.userInput.organization = {
          metadata: {
            guid: 'organization-guid'
          }
        };
        $scope.$apply();
        expect(that.userInput.space).toBe(null);
        expect(that.getSpacesForOrganization).toHaveBeenCalledWith('organization-guid');
      });

      it('should watch userInput.space', function () {
        spyOn(that, 'getAppsForSpace');
        that.userInput.space = {
          metadata: {
            guid: 'space-guid'
          }
        };
        $scope.$apply();
        expect(that.getAppsForSpace).toHaveBeenCalledWith('space-guid');
      });

      describe('- after reset', function () {
        beforeEach(function () {
          that.reset();
        });

        it('should be set properly', function () {
          expect(that.userInput).toEqual({
            name: null,
            serviceInstance: null,
            clusterUsername: null,
            clusterPassword: null,
            organization: null,
            space: null,
            host: null,
            domain: null,
            application: null,
            cfApiEndpoint: null,
            cfUserName: null
          });
          expect(that.data.workflow).toBeDefined();
          expect($translate.instant(that.data.workflow.title)).toBe('Add Application');
          expect(that.data.workflow.steps.length).toBe(1);
          expect(that.options.serviceCategories).toEqual([{ label: gettext('All Services'), value: 'all' }]);
          expect(that.options.services).toEqual([]);
          expect(that.options.organizations).toEqual([]);
          expect(that.options.spaces).toEqual([]);
          expect(that.options.domains).toEqual([]);
          expect(that.options.errors).toEqual({});
          expect(that.options.apps).toEqual([]);
        });

        it('addApplicationActions - stop', function () {
          spyOn(that, 'stopWorkflow');
          that.addApplicationActions.stop();
          expect(that.stopWorkflow).toHaveBeenCalled();
        });

        it('addApplicationActions - finish', function () {
          spyOn(that, 'finishWorkflow');
          that.addApplicationActions.finish();
          expect(that.finishWorkflow).toHaveBeenCalled();
        });

        describe('step 1 - Application Name', function () {
          var step, mockData;

          beforeEach(function () {
            step = that.data.workflow.steps[0];
            mockData = [
              { id: 1, name: 'cluster1', url:' cluster1_url', cnsi_type: 'cf', valid: true },
              { id: 2, name: 'cluster2', url:' cluster2_url', cnsi_type: 'misc', valid: true }
            ];
          });

          it('should have right title and button labels', function () {
            expect(step.title).toBe(gettext('Name'));
            expect($translate.instant(step.nextBtnText)).toBe(gettext('Add'));
            expect($translate.instant(step.cancelBtnText)).toBe(gettext('Cancel'));
            expect(step.showBusyOnNext).toBe(true);
          });

          it('onEnter', function () {
            authModel.doesUserHaveRole = function () { return true; };
            serviceInstanceModel.list = function () {
              return $q.resolve(mockData);
            };
            spyOn(that, 'getOrganizations');
            that.getDomains = getResolved;
            spyOn(that, 'getDomains').and.callThrough();
            spyOn(serviceInstanceModel, 'list').and.callThrough();
            that.userInput.serviceInstance = {};
            step.onEnter();
            $scope.$apply();

            expect(that.getOrganizations).toHaveBeenCalled();
            expect(that.getDomains).toHaveBeenCalled();
            expect(serviceInstanceModel.list).toHaveBeenCalled();
            expect(that.options.serviceInstances.length).toBe(1);
            expect(that.options.serviceInstances[0].label).toBe('cluster1');
          });

          it('onEnter - when that.options.userInput.serviceInstance is null', function () {
            stopWatch();
            simulateUserInput();
            that.options.userInput.serviceInstance = null;
            appModel.filterParams = { cnsiGuid: 'no all' };

            authModel.doesUserHaveRole = function () { return true; };
            serviceInstanceModel.list = function () {
              return $q.resolve(mockData);
            };
            spyOn(serviceInstanceModel, 'list').and.callThrough();
            step.onEnter();
            $scope.$apply();

            expect(serviceInstanceModel.list).toHaveBeenCalled();
            expect(that.options.serviceInstances.length).toBe(1);
            expect(that.options.serviceInstances[0].label).toBe('cluster1');
          });

          it('onNext - invalid route', function () {
            that.validateNewRoute = getRejected;
            var p = step.onNext();
            $scope.$apply();
            expect(p.$$state.status).toBe(2);
          });

          it('onNext - creating application failed', function () {
            stopWatch();
            simulateUserInput();
            spyOn(that, 'validateNewRoute').and.returnValue($q.resolve());
            spyOn(that, 'createApp').and.returnValue($q.reject()); // <== here
            var p = step.onNext();
            $scope.$apply();
            expect(p.$$state.status).toBe(2);
            expect(p.$$state.value).toBe(gettext('There was a problem creating your application. Please try again or contact your administrator if the problem persists.'));
          });

          it('onNext - valid route', function () {
            var services = mock.cloudFoundryAPI.Spaces.ListAllServiceInstancesForSpace(123).response[200].body.resources;
            stopWatch();
            simulateUserInput();
            spyOn(that, 'validateNewRoute').and.returnValue($q.resolve());
            spyOn(that, 'createApp').and.returnValue($q.resolve());
            spyOn(spaceModel, 'listAllServicesForSpace').and.returnValue($q.resolve(services));
            expect(that.options.services.length).toBe(0);
            var p = step.onNext();
            $scope.$apply();
            expect(p.$$state.status).toBe(1);
            expect(that.validateNewRoute).toHaveBeenCalled();
            expect(that.createApp).toHaveBeenCalled();
          });
        });

        it('createApp', function () {
          simulateWatch();

          var newAppSpec = {
            name: that.userInput.name,
            space_guid: that.userInput.space.metadata.guid
          };
          appModel.createApp = function () {
            return $q.resolve(mock.cloudFoundryAPI.Apps.CreateApp(newAppSpec).response[201].body);
          };
          spyOn(appModel, 'createApp').and.callThrough();

          that.createApp();
          $scope.$apply();

          expect(appModel.createApp).toHaveBeenCalled();
          expect(appModel.getAppSummary).toHaveBeenCalled();
          expect(routeModel.createRoute).toHaveBeenCalled();
          expect(routeModel.associateAppWithRoute).toHaveBeenCalled();
          expect(that.getOrganizations).toHaveBeenCalled();
          expect(that.getDomains).toHaveBeenCalled();
        });

        it('#validateNewRoute - route already exists', function () {
          simulateWatch();
          routeModel.checkRouteExists = function () {
            return $q.resolve({
            });
          };
          spyOn(routeModel, 'checkRouteExists').and.callThrough();

          var p = that.validateNewRoute();
          $scope.$apply();

          expect(routeModel.checkRouteExists).toHaveBeenCalled();
          expect(p.$$state.status).toBe(2);
          expect(p.$$state.value).toBe(gettext('This route already exists. Choose a new one.'));
        });

        it('#validateNewRoute - valid route', function () {
          simulateWatch();
          routeModel.checkRouteExists = function () {
            return $q.reject({
              status: 404
            });
          };
          spyOn(routeModel, 'checkRouteExists').and.callThrough();

          var p = that.validateNewRoute();
          $scope.$apply();

          expect(routeModel.checkRouteExists).toHaveBeenCalled();
          expect(p.$$state.status).toBe(1);
          expect(p.$$state.value).toBeUndefined();
        });

        it('#validateNewRoute - failed on checking', function () {
          simulateWatch();
          routeModel.checkRouteExists = function () {
            return $q.reject({
            });
          };
          spyOn(routeModel, 'checkRouteExists').and.callThrough();

          var p = that.validateNewRoute();
          $scope.$apply();

          expect(routeModel.checkRouteExists).toHaveBeenCalled();
          expect(p.$$state.status).toBe(2);
          expect(p.$$state.value).toBe(gettext('There was a problem validating your route. Please try again or contact your administrator if the problem persists.'));
        });

        describe('#getOrganizations', function () {
          var organizations;

          beforeEach(function () {
            organizations = mock.cloudFoundryAPI.Organizations.ListAllOrganizations(123).response['200'].body.resources;
            cfOrganizationModel.listAllOrganizations = function () {
              return $q.resolve(organizations);
            };
            that.getDomains = getResolved;
            spyOn(cfOrganizationModel, 'listAllOrganizations').and.callThrough();
            spyOn(that, 'getDomains').and.callThrough();
            stopWatch();
            simulateUserInput();
          });

          it('#getOrganizations - is admin', function () {
            authModel.isAdmin = function () { return true; };
            expect(that.options.organizations.length).toBe(0);
            var p = that.getOrganizations();
            $scope.$apply();
            expect(p.$$state.status).toBe(1);
            expect(that.options.organizations.length).toBe(1);
            expect(that.options.organizations[0].label).toBe(organizations[0].entity.name);
          });

          it('#getOrganizations - is not admin', function () {
            authModel.isAdmin = function () { return false; };
            authModel.principal = { cnsiGuid_123: { userSummary: { spaces: { all: [] } } } };
            expect(that.options.organizations.length).toBe(0);
            var p = that.getOrganizations();
            $scope.$apply();
            expect(p.$$state.status).toBe(1);
            expect(that.options.organizations.length).toBe(0);
          });

          it('#getOrganizations - no organizations', function () {
            cfOrganizationModel.listAllOrganizations = function () {
              return $q.resolve([]); // empty array, no organizations
            };
            appModel.filterParams.orgGuid = 'not all';
            authModel.isAdmin = function () { return true; };
            expect(that.options.organizations.length).toBe(0);
            var p = that.getOrganizations();
            $scope.$apply();
            expect(p.$$state.status).toBe(1);
            expect(that.options.organizations.length).toBe(0);
            expect(that.options.userInput.organization).toBeUndefined();
          });
        });

        describe('#getSpacesForOrganization', function () {
          var spaces;

          beforeEach(function () {
            spaces = mock.cloudFoundryAPI.Organizations.ListAllSpacesForOrganization(123).response['200'].body.resources;
            cfOrganizationModel.listAllSpacesForOrganization = function () {
              return $q.resolve(spaces);
            };
            that.getDomains = getResolved;
            spyOn(cfOrganizationModel, 'listAllSpacesForOrganization').and.callThrough();
            spyOn(that, 'getDomains').and.callThrough();
            stopWatch();
            simulateUserInput();
            that.userInput.space = null;
          });

          it('#getSpacesForOrganization - is admin', function () {
            authModel.isAdmin = function () { return true; };
            expect(that.options.spaces.length).toBe(0);
            var p = that.getSpacesForOrganization();
            $scope.$apply();
            expect(p.$$state.status).toBe(1);
            expect(that.options.spaces.length).toBe(1);
            expect(that.options.spaces[0].label).toBe(spaces[0].entity.name);
          });

          it('#getSpacesForOrganization - is not admin', function () {
            authModel.isAdmin = function () { return false; };
            authModel.principal = { cnsiGuid_123: { userSummary: { spaces: { all: [] } } } };
            expect(that.options.spaces.length).toBe(0);
            var p = that.getSpacesForOrganization();
            $scope.$apply();
            expect(p.$$state.status).toBe(1);
            expect(that.options.spaces.length).toBe(0);
          });

          it('#getSpacesForOrganization - no space', function () {
            cfOrganizationModel.listAllSpacesForOrganization = function () {
              return $q.resolve([]); // empty array, no spaces
            };
            appModel.filterParams.spaceGuid = 'not all';
            authModel.isAdmin = function () { return true; };
            expect(that.options.spaces.length).toBe(0);
            var p = that.getSpacesForOrganization();
            $scope.$apply();
            expect(p.$$state.status).toBe(1);
            expect(that.options.spaces.length).toBe(0);
            expect(that.options.userInput.space).toBeUndefined();
          });
        });

        it('#getAppsForSpace', function () {
          stopWatch();
          simulateUserInput();
          spaceModel.listAllAppsForSpace = function () {
            return $q.resolve(mock.cloudFoundryAPI.Spaces.ListAllAppsForSpace(123).response['200'].body.guid.resources);
          };
          spyOn(spaceModel, 'listAllAppsForSpace').and.callThrough();
          expect(that.options.apps.length).toBe(0);
          that.getAppsForSpace();
          $scope.$apply();
          expect(spaceModel.listAllAppsForSpace).toHaveBeenCalled();
          expect(that.options.apps.length).toBe(1);
          expect(that.options.apps[0].label).toBe('name-2500');
        });

        it('#getDomains', function () {
          spyOn(that, 'getPrivateDomains');
          spyOn(that, 'getSharedDomains');
          that.getDomains();
          expect(that.options.domains.length).toBe(0);
          expect(that.getPrivateDomains).toHaveBeenCalled();
          expect(that.getSharedDomains).toHaveBeenCalled();
        });

        it('#getPrivateDomains', function () {
          stopWatch();
          simulateUserInput();
          privateDomainModel.listAllPrivateDomains = function () {
            return $q.resolve(mock.cloudFoundryAPI.PrivateDomains.ListAllPrivateDomains().response['200'].body.resources);
          };
          spyOn(privateDomainModel, 'listAllPrivateDomains').and.callThrough();
          expect(that.options.domains.length).toBe(0);
          that.getPrivateDomains();
          $scope.$apply();
          expect(that.options.domains.length).toBe(2);
        });

        it('#getSharedDomains', function () {
          stopWatch();
          simulateUserInput();
          sharedDomainModel.listAllSharedDomains = function () {
            return $q.resolve(mock.cloudFoundryAPI.SharedDomains.ListAllSharedDomains().response['200'].body.resources);
          };
          spyOn(sharedDomainModel, 'listAllSharedDomains').and.callThrough();
          expect(that.options.domains.length).toBe(0);
          that.getSharedDomains();
          $scope.$apply();
          expect(that.options.domains.length).toBe(2);
        });

        it('#notify - has application created', function () {
          stopWatch();
          simulateUserInput();
          that.userInput.application = { summary: { guid: 'appGuid' } };
          var stateValue;
          appEventService.$on(appEventService.events.REDIRECT, function (event, state) {
            stateValue = state;
          });
          that.notify();
          expect(stateValue).toBe('cf.applications.application.summary');
        });

        it('#notify - has no created', function () {
          stopWatch();
          simulateUserInput();
          var stateValue;
          appEventService.$on(appEventService.events.REDIRECT, function (event, state) {
            stateValue = state;
          });
          that.notify();
          expect(stateValue).toBeUndefined();
        });

        it('#startWorkflow', function () {
          spyOn(that, 'reset');
          that.startWorkflow();
          expect(that.addingApplication).toBe(true);
          expect(that.reset).toHaveBeenCalled();
          that.addingApplication = false;
        });

        it('#stopWorkflow', function () {
          spyOn(that, 'notify');
          that.stopWorkflow();
          expect(that.notify).toHaveBeenCalled();
          expect(that.addingApplication).toBe(false);
        });

        it('#finishWorkflow', function () {
          spyOn(that, 'notify');
          that.finishWorkflow();
          expect(that.notify).toHaveBeenCalled();
          expect(that.addingApplication).toBe(false);
        });

      });
    });

    function stopWatch() {
      that.stopWatchServiceInstance();
      that.stopWatchOrganization();
      that.stopWatchSpace();
    }

    function simulateUserInput() {
      that.userInput.serviceInstance = { guid: 'cnsiGuid_123', api_endpoint: { Scheme: 'https' } };
      that.userInput.name = 'myapp';
      that.userInput.space = { metadata: { guid: 'space_guid' } };
      that.userInput.host = 'myapp';
      that.userInput.domain = { metadata: { guid: 'my.domain.com' } };
    }

    function simulateWatch() {
      appModel.getAppSummary = function () {
        return $q.resolve(mock.cloudFoundryAPI.Apps.GetAppSummary('84a911b3-16f7-4f47-afa4-581c86018600').response[200].body);
      };
      routeModel.createRoute = function () {
        return $q.resolve({
          metadata: { guid: 'af96374d-3f82-4956-8af2-f2a7b572458e' }
        });
      };
      routeModel.associateAppWithRoute = function () {
        return $q.resolve({
        });
      };
      that.getOrganizations = function () {
        return $q.resolve({
        });
      };
      that.getDomains = function () {
        return $q.resolve({
        });
      };

      spyOn(appModel, 'getAppSummary').and.callThrough();
      spyOn(routeModel, 'createRoute').and.callThrough();
      spyOn(routeModel, 'associateAppWithRoute').and.callThrough();
      spyOn(that, 'getOrganizations').and.callThrough();
      spyOn(that, 'getDomains').and.callThrough();

      simulateUserInput();
    }
  });

  /* eslint-enable angular/no-private-call */
})();