(function () {
  'use strict';

  var wrapper = require('../wrapper.po');
  var helpers = require('../helpers.po');

  module.exports = {
    isSingleButton: isSingleButton,
    getSingleButton: getSingleButton,
    getSingleButtonText: getSingleButtonText,
    getItems: getItems,
    getItemText: getItemText,
    clickItem: clickItem,
    click: click
  };

  wrapper(module);

  function isSingleButton(actionMenu) {
    return actionMenu.element(by.css('.action-button')).isDisplayed();
  }

  function getSingleButton(actionMenu) {
    return actionMenu.element(by.css('.action-button a'));
  }

  function getSingleButtonText(actionMenu) {
    return actionMenu.element(by.css('.action-button a span')).getText();
  }

  function getItems(actionMenu) {
    return actionMenu.all(by.repeater('action in actionsMenuCtrl.actions'));
  }

  function getItemText(actionMenu, row) {
    // getText doesn't seem to work??
    return _getRow(actionMenu, row).getAttribute('innerText')
      .then(function (text) {
        return text.trim();
      });
  }

  function click(actionMenu) {
    return helpers.waitForElementAndClick(actionMenu.element(by.css('.actions-menu-icon')));
  }

  function clickItem(actionMenu, row) {
    return helpers.waitForElementAndClick(_getRow(actionMenu, row));
  }

  function _getRow(actionMenu, row) {
    return actionMenu.element(by.repeater('action in actionsMenuCtrl.actions').row(row));
  }
})();

