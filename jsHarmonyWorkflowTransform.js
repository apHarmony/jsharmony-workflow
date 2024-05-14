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

var jsHarmonyModuleTransform = require('jsharmony/jsHarmonyModuleTransform');

function jsHarmonyWorkflowTransform(module){
  this.tables = {
    'code_wkflow_def_sts': 'code_wkflow_def_sts',
    'code_wkflow_def_state_sts': 'code_wkflow_def_state_sts',
    'code_wkflow_def_state_type': 'code_wkflow_def_state_type',
    'code_wkflow_def_state_tran_sts': 'code_wkflow_def_state_tran_sts',
    'code_wkflow_def_state_tran_cond_type': 'code_wkflow_def_state_tran_cond_type',
    'code_wkflow_def_state_action_sts': 'code_wkflow_def_state_action_sts',
    'code_wkflow_def_state_action_type': 'code_wkflow_def_state_action_type',
    'code_wkflow_sts': 'code_wkflow_sts',
    'code_wkflow_tran_sts': 'code_wkflow_tran_sts',
    'code_wkflow_var_name': 'code_wkflow_var_name',
    'code_task_sts': 'code_task_sts',
    'code_task_def_sts': 'code_task_def_sts',
    'code_task_def_dur_type': 'code_task_def_dur_type',
    'code_sys': 'code',
    'sys_func': 'sys_func',
    'sys_user_func': 'sys_user_func',
    'single': 'single',
  };

  this.fields = {
    'menu_name': 'menu_name',
    'menu_desc': 'menu_desc',
    'menu_cmd': 'menu_cmd',
    'menu_subcmd': 'menu_subcmd',
    'menu_seq': 'menu_seq',
    'menu_id': 'menu_id',
    'menu_parent_name': 'menu_parent_name',
    
    'code_txt': 'code_txt',
    'code_val': 'code_val',
    'code_val1': 'code_val1',
    'code_val2': 'code_val2',
    'code_parent': 'code_parent',
    'code_seq': 'code_seq',
    'code_icon': 'code_icon',
    'code_id': 'code_id',
    'code_parent_id': 'code_parent_id',
    'code_type': 'code_type',
    'code_code': 'code_code',
    'code_end_dt': 'code_end_dt',
    
    'my_sys_user_id': 'my_sys_user_id',
    'sys_user_id': 'sys_user_id',
    'sys_func_name': 'sys_func_name',
  };

  this.sql = {
    'my_db_user_fmt': 'my_db_user_fmt',
    'my_now': 'my_now',
    'my_sys_user_id': 'my_sys_user_id',
  };

  jsHarmonyModuleTransform.call(this, module);
}

jsHarmonyWorkflowTransform.prototype = new jsHarmonyModuleTransform();

exports = module.exports = jsHarmonyWorkflowTransform;