/*
Copyright 2024 apHarmony

This file is part of jsHarmony.

jsHarmony is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

jsHarmony is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this package.  If not, see <http://www.gnu.org/licenses/>.
*/

var _ = require('lodash');
var jsHarmonyModule = require('jsharmony/jsHarmonyModule');
var jsHarmonyWorkflowProcessor = require('./jsHarmonyWorkflowProcessor.js');
var jsHarmonyWorkflowConfig = require('./jsHarmonyWorkflowConfig.js');
var jsHarmonyWorkflowTransform = require('./jsHarmonyWorkflowTransform.js');

function jsHarmonyWorkflow(name, options){
  options = _.extend({
    schema: 'wkflow',
  }, options);

  var _this = this;
  jsHarmonyModule.call(this, name);
  _this.Config = new jsHarmonyWorkflowConfig();

  if(name) _this.name = name;
  _this.typename = 'jsHarmonyWorkflow';

  _this.schema = options.schema;
  _this.existingSchema = options.existingSchema;
  _this.transform = new jsHarmonyWorkflowTransform(_this);
}

jsHarmonyWorkflow.prototype = new jsHarmonyModule();

jsHarmonyWorkflow.prototype.onModuleAdded = function(jsh){
  var _this = this;
  _this.processor = new jsHarmonyWorkflowProcessor(_this);

  jsh.Config.onServerReady.push(function (cb, servers){
    _this.processor.run();
    return cb();
  });
};

module.exports = exports = jsHarmonyWorkflow;