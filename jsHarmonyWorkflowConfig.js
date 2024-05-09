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

var jsHarmonyConfig = require('jsharmony/jsHarmonyConfig');
var path = require('path');

function jsHarmonyWorkflowConfig(){
  //Module path
  this.moduledir = path.dirname(module.filename);

  //Disable the workflow processor
  this.disabled = false;
  
  //Time between checks for state changes
  this.checkDelay = 5000;

  //Max New Workflows per Cycle
  this.maxNewWorkflowsPerCycle = 100;
}

jsHarmonyWorkflowConfig.prototype = new jsHarmonyConfig.Base();

jsHarmonyWorkflowConfig.prototype.Init = function(cb, jsh){
  if(cb) return cb();
};

exports = module.exports = jsHarmonyWorkflowConfig;