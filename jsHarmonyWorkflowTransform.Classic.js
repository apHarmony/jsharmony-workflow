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

var transform = { };

transform.tables = {
  'code_wkflow_def_sts': 'ucod_wkflow_def_sts',
  'code_wkflow_def_state_sts': 'ucod_wkflow_def_state_sts',
  'code_wkflow_def_state_type': 'ucod_wkflow_def_state_type',
  'code_wkflow_def_state_tran_sts': 'ucod_wkflow_def_state_tran_sts',
  'code_wkflow_def_state_tran_cond_type': 'ucod_wkflow_def_state_tran_cond_type',
  'code_wkflow_def_state_action_sts': 'ucod_wkflow_def_state_action_sts',
  'code_wkflow_def_state_action_type': 'ucod_wkflow_def_state_action_type',
  'code_wkflow_sts': 'ucod_wkflow_sts',
  'code_wkflow_tran_sts': 'ucod_wkflow_tran_sts',
  'code_wkflow_var_name': 'ucod_wkflow_var_name',
  'code_task_sts': 'ucod_task_sts',
  'code_task_def_sts': 'ucod_task_def_sts',
  'code_task_def_dur_type': 'ucod_task_def_dur_type',
  'code_sys': 'ucod_h',
  'sys_func': 'sf',
  'sys_user_func': 'spef',
  'single': 'dual',
};

transform.fields = {
  'menu_name': 'sm_name',
  'menu_desc': 'sm_desc',
  'menu_cmd': 'sm_cmd',
  'menu_subcmd': 'sm_subcmd',
  'menu_seq': 'sm_seq',
  'menu_id': 'sm_id',
  'menu_parent_name': 'sm_parent_name',

  'code_txt': 'codetxt',
  'code_val': 'codeval',
  'code_val1': 'codeval1',
  'code_val2': 'codeval2',
  'code_parent': 'codeparent',
  'code_seq': 'codseq',
  'code_icon': 'codeicon',
  'code_id': 'codeid',
  'code_parent_id': 'codeparentid',
  'code_type': 'codetype',
  'code_code': 'codecode',
  'code_end_dt': 'codetdt',
  
  'my_sys_user_id': 'mype',
  'sys_user_id': 'pe_id',
  'sys_func_name': 'sf_name',
};

transform.sql = {
  'my_db_user_fmt': 'mycuser_fmt',
  'my_now': 'mynow',
  'my_sys_user_id': 'mype',
};

var baseTransform = new (require('./jsHarmonyWorkflowTransform.js'))();
for(var transformType in transform){
  var keys = _.keys(transform[transformType]);
  _.each(keys, function(key){
    if(!(key in baseTransform[transformType])) delete transform[transformType][key];
  });
}

exports = module.exports = transform;