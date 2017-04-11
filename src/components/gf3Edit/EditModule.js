goog.provide('gf3_edit');

goog.require('gf3_edit_directive');
goog.require('gf3_edit_popup_service');
goog.require('gf3_edit_save_service');
goog.require('gf3_edit_utils_service');
goog.require('gf3_editfeatureattrs_directive');

/**
 * This module is responsible for the edition of vectorial layers.
 *
 * It contains:
 * <ul>
 *   <li>gf3_edit_directive: the main part of the module. It handles user
 *     interaction with the map during the edition of a layer.</li>
 *   <li>gf3_edit_popup_service: functions to open/hide the popups and tooltip
 *      related to the edition.</li>
 *   <li>gf3_edit_save_service: functions to save the modifications.</li>
 *   <li>gf3_edit_utils_service: functions for various usages.</li>
 *   <li>gf3_editfeatureattrs_directive: used in a popup to edit the attributes
 *     of a feature.</li>
 * </ul>
 */
(function() {
  angular.module('gf3_edit', [
    'gf3_edit_directive',
    'gf3_edit_popup_service',
    'gf3_edit_save_service',
    'gf3_edit_utils_service',
    'gf3_editfeatureattrs_directive'
  ]);
})();
