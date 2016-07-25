(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('organizationTile', OrganizationTile);

  OrganizationTile.$inject = [];

  function OrganizationTile() {
    return {
      bindToController: true,
      controller: OrganizationTileController,
      controllerAs: 'organizationTileCtrl',
      scope: {
        organization: '='
      },
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/organization-tile/organization-tile.html'
    };
  }

  OrganizationTileController.$inject = [
    'app.model.modelManager',
    '$state',
    'app.utils.utilsService',
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @name OrganizationTileController
   * @constructor
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $state - the angular $state service
   * @param {object} utils - our utils service
   * @param {object} confirmDialog - our confirmation dialog service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationTileController(modelManager, $state, utils, confirmDialog) {
    var that = this;
    this.$state = $state;
    this.actions = [];

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');

    // Present memory usage
    var usedMemHuman = utils.mbToHumanSize(this.organization.memUsed);
    var memQuotaHuman = utils.mbToHumanSize(this.organization.memQuota);
    this.memory = usedMemHuman + ' / ' + memQuotaHuman;

    // Present instances utilisation
    var instancesUsed = this.organization.instances;
    var appInstanceQuota = this.organization.instancesQuota;
    if (appInstanceQuota === -1) {
      appInstanceQuota = '∞';
    }
    this.instances = instancesUsed + ' / ' + appInstanceQuota;

    // Present the user's roles
    this.roles = that.organizationModel.organizationRolesToString(this.organization.roles);

    this.summary = function () {
      that.$state.go('endpoint.clusters.cluster.organization.detail.spaces', {organization: that.organization.guid});
    };

    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    var isAdmin = stackatoInfo.info.endpoints.hcf[that.organization.cnsiGuid].user.admin;
    var canDelete = false;
    if (isAdmin) {
      var spacesInOrg = that.organizationModel.organizations[that.organization.cnsiGuid][that.organization.guid].spaces;
      canDelete = _.keys(spacesInOrg).length === 0;
    }

    setActions();

    function setActions() {
      that.actions.push({
        name: gettext('Edit Organization'),
        disabled: true,
        execute: function () {
        }
      });
      that.actions.push({
        name: gettext('Delete Organization'),
        disabled: !canDelete,
        execute: function () {
          confirmDialog({
            title: gettext('Delete Organization'),
            description: gettext('Are you sure you want to delete organization') +
            " '" + that.organization.name + "' ?",
            buttonText: {
              yes: gettext('Delete'),
              no: gettext('Cancel')
            }
          }).result.then(function () {
            return that.organizationModel.deleteOrganization(that.organization.cnsiGuid, that.organization.guid);
          });

        }
      });
      that.actions.push({
        name: gettext('Assign User(s)'),
        disabled: true,
        execute: function () {
        }
      });
    }

  }

})();