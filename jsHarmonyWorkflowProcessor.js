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
var async =require('async');
var Helper = require('jsharmony/Helper');

module.exports = exports = function jsHarmonyWorkflowProcessor(module){
  var _this = this;
  var jsh = module.jsh;

  _this.isRunning = false;
  _this.runNextLoopImmediately = false;
  _this.taskTimer = null;

  _this.run = function(){
    if(_this.isRunning){
      _this.runNextLoopImmediately = true;
      return;
    }
    _this.isRunning = true;

    if(_this.taskTimer) clearTimeout(_this.taskTimer);
    _this.taskTimer =  null;

    function scheduleNextLoop(timeout){
      _this.taskTimer = setTimeout(function(){ _this.run(); }, (_this.runNextLoopImmediately ? 1 : timeout));
      _this.runNextLoopImmediately = false;
      _this.isRunning = false;
    }

    if (module.Config.disabled){
      return scheduleNextLoop(module.Config.checkDelay);
    }

    _this.processWorkflows(function(err, rerun){
      if(rerun) _this.runNextLoopImmediately = true;
      return scheduleNextLoop(module.Config.checkDelay);
    });
  };

  _this.processWorkflows = function(callback /*  function(err, rerun){} */){
    callback = callback || function(err){ };

    var appsrv = jsh.AppSrv;
    var dbtypes = appsrv.DB.types;
    var db = jsh.getDB('default');

    var hasInvalidWorkflows = false;
    var hasTerminalWorkflows = false;
    var wkflows = {
      /*
      wkflow_id: {
        wkflow_id,
        wkflow_def_id,
        wkflow_def_code,
        wd.wkflow_def_name,
        wd.wkflow_def_sts,
        wsd.wkflow_def_state_code,
        wsd.wkflow_def_state_name,
        wsd.wkflow_def_state_type,
        wsd.wkflow_def_state_sts,
        tran: {
          wkflow_def_state_id_dst: [
            {
              id,
              wkflow_def_state_tran_cond_type,
              wkflow_def_state_tran_cond_param,
            }
          ]
        },
        next_state_id,
        next_state_actions,
      }
      */
    };
    var wkflow_trans = [
      // id
      // sql
    ];
    var wkflow_next = {
      //wkflow_id: wkflow
    };
    var wkflow_trans_start = [
      // wkflow_id
      // sql
    ];
    var code_wkflow_var_name = {
      // code_val: { code_val, code_txt }
    };

    async.waterfall([

      //Get all active workflows
      function(process_cb){
        let sql = [
          //rs_wkflow
          'select',
          '    w.wkflow_id,',
          '    w.wkflow_def_id,',
          '    w.wkflow_def_state_id,',
          '    w.wkflow_tran_sts,',
          '    wd.wkflow_def_code,',
          '    wd.wkflow_def_name,',
          '    wd.wkflow_def_sts,',
          '    wsd.wkflow_def_state_code,',
          '    wsd.wkflow_def_state_name,',
          '    wsd.wkflow_def_state_type,',
          '    wsd.wkflow_def_state_sts',
          '  from {schema}.wkflow w',
          '    left outer join {schema}.wkflow_def wd on wd.wkflow_def_id = w.wkflow_def_id',
          '    left outer join {schema}.wkflow_def_state wsd on wsd.wkflow_def_state_id = w.wkflow_def_state_id',
          "  where w.wkflow_sts='ACTIVE';",

          //rs_code_wkflow_var_name
          'select ',
          '  '+jsh.map.code_val+', '+jsh.map.code_txt+'',
          '  from {schema}.' + module.transform.mapping['code_wkflow_var_name'],
          '  where (' + jsh.map.code_end_date + ' is null or ' + jsh.map.code_end_date + '>%%%'+jsh.map.timestamp+'%%%);',

          //rs_wkflow_var
          'select',
          '    w.wkflow_id,',
          '    wv.wkflow_var_name,',
          '    wv.wkflow_var_val',
          '  from {schema}.wkflow w',
          '    inner join {schema}.wkflow_var wv on wv.wkflow_id = w.wkflow_id',
          "  where w.wkflow_sts='ACTIVE';",

          //rs_wkflow_tran
          'select',
          '    w.wkflow_id,',
          '    wstd.wkflow_def_state_id_src,',
          '    wstd.wkflow_def_state_id_dst,',
          '    wstd.wkflow_def_state_tran_cond_type,',
          '    wstd.wkflow_def_state_tran_cond_param',
          '  from {schema}.wkflow w',
          "    inner join {schema}.wkflow_def_state_tran wstd on wstd.wkflow_def_state_id_src = w.wkflow_def_state_id and wstd.wkflow_def_state_tran_sts='ACTIVE'",
          "  where w.wkflow_sts='ACTIVE' and w.wkflow_tran_sts='COMPLETE' and w.wkflow_def_state_id is not null;",

          //rs_wkflow_tran_start
          'select',
          '    wd.wkflow_def_id,',
          '    wd.wkflow_def_code,',
          '    wd.wkflow_def_name,',
          '    wstd.wkflow_def_state_id_src,',
          '    wstd.wkflow_def_state_id_dst,',
          '    wstd.wkflow_def_state_tran_cond_type,',
          '    wstd.wkflow_def_state_tran_cond_param',
          '  from {schema}.wkflow_def wd',
          "    inner join {schema}.wkflow_def_state wsd on wsd.wkflow_def_id = wd.wkflow_def_id and wsd.wkflow_def_state_sts='ACTIVE'",
          "    inner join {schema}.wkflow_def_state_tran wstd on wstd.wkflow_def_state_id_src is null and wstd.wkflow_def_state_id_dst = wsd.wkflow_def_state_id and wstd.wkflow_def_state_tran_sts='ACTIVE'",
          "  where wd.wkflow_def_sts='ACTIVE';",
        ].join(' ');
        appsrv.ExecMultiRecordset('wkflow', module.replaceSchema(sql), [], {}, function (err, rslt) {
          if(err){ err.sql = sql; return process_cb(err); }
          if(!rslt || !rslt[0] || (rslt[0].length != 5)) return process_cb(new Error('Unexpected database error has occurred'));
          var rs_wkflow = rslt[0][0] || [];
          var rs_code_wkflow_var_name = rslt[0][1] || [];
          var rs_wkflow_var = rslt[0][2] || [];
          var rs_wkflow_tran = rslt[0][3] || [];
          var rs_wkflow_tran_start = rslt[0][4] || [];
          _.each(rs_wkflow, function(row){
            row.wkflow_tran_sts = (row.wkflow_tran_sts||'').toString().toUpperCase();
            row.wkflow_def_sts = (row.wkflow_def_sts||'').toString().toUpperCase();
            row.wkflow_def_state_sts = (row.wkflow_def_state_sts||'').toString().toUpperCase();
            row.wkflow_def_state_type = (row.wkflow_def_state_type||'').toString().toUpperCase();
            if(row.wkflow_def_sts!='ACTIVE'){ hasInvalidWorkflows = true; return; }
            if(row.wkflow_def_state_sts!='ACTIVE'){ hasInvalidWorkflows = true; return; }
            if((row.wkflow_def_state_type=='TERIMNAL') && (row.wkflow_tran_sts=='COMPLETE')){ hasTerminalWorkflows = true; return; }
            if(!wkflows[row.wkflow_id]){
              wkflows[row.wkflow_id] = _.extend(row, {
                tran: {},
                tran_start: {},
                next_state_id: null,
                next_state_actions: [],
                var: {},
              });
            }
          });
          //Sort workflow variable definitions by length (longest first)
          rs_code_wkflow_var_name.sort(function(a,b){
            var aval = (a[jsh.map.code_val] || '').length;
            var bval = (b[jsh.map.code_val] || '').length;
            if(aval < bval) return 1;
            if(aval > bval) return -1;
            return 0;
          });
          //Process workflow variable definitions
          _.each(rs_code_wkflow_var_name, function(row){
            row.wkflow_var_name = row[jsh.map.code_val];
            code_wkflow_var_name[(row.wkflow_var_name||'').toString().toUpperCase()] = row;
          });
          //Process workflow variables
          for(var i=0;i<rs_wkflow_var.length;i++){
            let row = rs_wkflow_var[i];
            let wkflow = wkflows[row.wkflow_id];
            if(!wkflow) return process_cb(new Error('Workflow '+row.wkflow_id+' missing from recordset'));
            var wkflow_var_name_ucase = (row.wkflow_var_name||'').toString().toUpperCase();
            wkflow.var[wkflow_var_name_ucase] = row.wkflow_var_val;
          }
          function processTran(row){
            var wkflow_tran = _.extend({}, row);
            wkflow_tran.wkflow_def_state_tran_cond_type = (wkflow_tran.wkflow_def_state_tran_cond_type || '').toString().toUpperCase();
            var tran_sql = '';
            if(wkflow_tran.wkflow_def_state_tran_cond_type == 'SQL'){
              tran_sql = wkflow_tran.wkflow_def_state_tran_cond_param;
            }
            else if(wkflow_tran.wkflow_def_state_tran_cond_type == 'TASKCMPL'){
              tran_sql = [
                'select task_id',
                '  from {schema}.task',
                '    inner join {schema}.task_def on task.task_def_id = task_def.task_def_id',
                "  where wkflow_id=@wkflow_id and task_def_code=@task_def_code and task_sts='COMPLETE';"
              ].join(' ');
              tran_sql = Helper.ReplaceAll(tran_sql, '@task_def_code', "'" + db.sql.escape(wkflow_tran.wkflow_def_state_tran_cond_param||'') + "'");
            }
            if(row.wkflow_id) tran_sql = Helper.ReplaceAll(tran_sql, '@wkflow_id', db.sql.escape(parseInt(row.wkflow_id)));
            wkflow_tran.sql = tran_sql;
            wkflow_tran.id = wkflow_trans.length;
            return wkflow_tran;
          }
          //Process state transitions
          for(let i=0;i<rs_wkflow_tran.length;i++){
            let row = rs_wkflow_tran[i];
            let wkflow = wkflows[row.wkflow_id];
            if(!wkflow) return process_cb(new Error('Workflow '+row.wkflow_id+' missing from recordset'));
            if(row.wkflow_def_state_id_dst){
              if(!wkflow.tran[row.wkflow_def_state_id_dst]){
                wkflow.tran[row.wkflow_def_state_id_dst] = [];
              }
              let wkflow_tran = processTran(rs_wkflow_tran[i]);
              for(var key in code_wkflow_var_name){
                wkflow_tran.sql = Helper.ReplaceAll(wkflow_tran.sql, '@wkflow_var_' + code_wkflow_var_name[key].wkflow_var_name, "'" + db.sql.escape(wkflow.var[key]||'') + "'");
              }
              wkflow.tran[row.wkflow_def_state_id_dst].push(wkflow_tran);
              wkflow_trans.push(wkflow_tran);
            }
          }
          //Process start transitions
          for(let i=0;i<rs_wkflow_tran_start.length;i++){
            let row = rs_wkflow_tran_start[i];
            if(row.wkflow_def_state_id_dst){
              let wkflow_tran = processTran(rs_wkflow_tran_start[i]);
              wkflow_trans_start.push(wkflow_tran);
            }
          }
          return process_cb();
        });
      },

      //Cancel invalid workflows
      function(process_cb){
        if(!hasInvalidWorkflows) return process_cb();
        jsh.Log.info('Workflow canceled');
        let sql = [
          "update {schema}.wkflow set wkflow_sts='CANCELED'",
          "  where wkflow_sts='ACTIVE' and wkflow_id in (",
          '    select w.wkflow_id',
          '      from {schema}.wkflow w',
          '        left outer join {schema}.wkflow_def wd on wd.wkflow_def_id = w.wkflow_def_id',
          '        left outer join {schema}.wkflow_def_state wsd on wsd.wkflow_def_state_id = w.wkflow_def_state_id',
          "    where wkflow_sts='ACTIVE' and (",
          "      (wkflow_def_sts is null or wkflow_def_sts <> 'ACTIVE') or",
          "      (wkflow_def_state_sts is null or wkflow_def_state_sts <> 'ACTIVE')",
          '    )',
          '  )',
        ].join(' ');
        appsrv.ExecCommand('wkflow', module.replaceSchema(sql), [], {}, function (err) {
          if(err){ err.sql = sql; return process_cb(err); }
          return process_cb();
        });
      },

      //Complete terminal workflows
      function(process_cb){
        if(!hasTerminalWorkflows) return process_cb();
        jsh.Log.info('Workflow complete');
        let sql = [
          "update {schema}.wkflow set wkflow_sts='COMPLETE'",
          "  where wkflow_sts='ACTIVE' and wkflow_tran_sts='COMPLETE' and wkflow_id in (",
          '    select w.wkflow_id',
          '      from {schema}.wkflow w',
          '        left outer join {schema}.wkflow_def wd on wd.wkflow_def_id = w.wkflow_def_id',
          '        left outer join {schema}.wkflow_def_state wsd on wsd.wkflow_def_state_id = w.wkflow_def_state_id',
          "    where wkflow_sts='ACTIVE' and wkflow_state_def_type = 'TERMINAL'",
          '  )',
        ].join(' ');
        appsrv.ExecCommand('wkflow', module.replaceSchema(sql), [], {}, function (err) {
          if(err){ err.sql = sql; return process_cb(err); }
          return process_cb();
        });
      },

      //Evaluate Pending Conditions
      function(process_cb){
        if(_.isEmpty(wkflows)) return process_cb();

        //Add Starting States
        _.each(wkflows, function(wkflow){
          if(wkflow.wkflow_tran_sts == 'PENDING'){
            wkflow.next_state_id = wkflow.wkflow_def_state_id;
            wkflow_next[wkflow.wkflow_id] = wkflow;
          }
        });

        //Evaluate Conditions
        let sql = '';
        _.each(wkflow_trans, function(wkflow_tran){
          var sql_stmt = wkflow_tran.sql.trim();
          if(!sql_stmt) sql_stmt = 'select 1 where 0=1';
          if(!Helper.endsWith(sql_stmt, ';')) sql_stmt += ';';
          sql += sql_stmt;
        });
        appsrv.ExecMultiRecordset('wkflow', module.replaceSchema(sql), [], {}, function (err, rslt) {
          if(err){ err.sql = sql; return process_cb(err); }
          _.each(wkflows, function(wkflow){
            for(var wkflow_def_state_id_dst in wkflow.tran){
              _.each(wkflow.tran[wkflow_def_state_id_dst], function(wkflow_tran){
                wkflow_tran.rslt = !!rslt[0][wkflow_tran.id].length;
              });
            }
          });
          _.each(wkflows, function(wkflow){
            for(var wkflow_def_state_id_dst in wkflow.tran){
              if(!wkflow.tran[wkflow_def_state_id_dst].length) continue;
              var all_tran = true;
              _.each(wkflow.tran[wkflow_def_state_id_dst], function(wkflow_tran){
                if(!wkflow_tran.rslt) all_tran = false;
              });
              if(all_tran){
                wkflow.next_state_id = wkflow_def_state_id_dst;
                wkflow_next[wkflow.wkflow_id] = wkflow;
                break;
              }
            }
          });
          return process_cb();
        });
      },
      
      //Get actions for any state transitions
      function(process_cb){
        if(_.isEmpty(wkflow_next)) return process_cb();
        let sql = [
          'select',
          '    wdsa.wkflow_def_state_id,',
          '    wdsa.wkflow_def_state_action_type,',
          '    wdsa.wkflow_def_state_action_param',
          '  from {schema}.wkflow_def_state_action wdsa',
          '  where wdsa.wkflow_def_state_id in ('+_.map(wkflow_next, function(wkflow){ return db.sql.escape(parseInt(wkflow.next_state_id)); }).join(',')+") and wdsa.wkflow_def_state_action_sts='ACTIVE'",
        ].join(' ');
        appsrv.ExecRecordset('wkflow', module.replaceSchema(sql), [], {}, function (err, rslt) {
          if(err){ err.sql = sql; return process_cb(err); }
          var wkflow_actions = {
            //wkflow_def_state_id : { wkflow_def_state_action_type, wkflow_def_state_action_param }
          };
          _.each(rslt && rslt[0], function(row){
            if(!(row.wkflow_def_state_id in wkflow_actions)) wkflow_actions[row.wkflow_def_state_id] = [];
            row.wkflow_def_state_action_type = (row.wkflow_def_state_action_type || '').toString().toUpperCase();
            wkflow_actions[row.wkflow_def_state_id].push(row);
          });
          _.each(wkflow_next, function(wkflow){
            _.each(wkflow_actions[wkflow.next_state_id], function(wkflow_action){
              var next_action = _.extend({}, wkflow_action);
              var action_sql = '';
              if(wkflow_action.wkflow_def_state_action_type == 'SQL'){
                action_sql = wkflow_action.wkflow_def_state_action_param;
              }
              else if(wkflow_action.wkflow_def_state_action_type == 'NEWTASK'){
                action_sql = [
                  'insert into {schema}.task(task_def_id, task_sts, wkflow_id, task_due)',
                  "  select task_def_id, 'ACTIVE', @wkflow_id,",
                  '    case',
                  '      when (task_def_dur_type is null) or (task_def_dur is null) then null',
                  "      when task_def_dur_type='CALDAYS' then $addDays(jsharmony."+module.transform.mapping['my_now']+'(),task_def_dur)',
                  "      when task_def_dur_type='BUSDAYS' then $addBusinessDays(jsharmony."+module.transform.mapping['my_now']+'(),task_def_dur)',
                  '      else null',
                  '    end',
                  '    from {schema}.task_def td',
                  "    where td.task_def_sts='ACTIVE' and td.task_def_code = @task_def_code;",
                ].join(' ');
                action_sql = Helper.ReplaceAll(action_sql, '@task_def_code', "'" + db.sql.escape(wkflow_action.wkflow_def_state_action_param||'') + "'");
              }
              action_sql = Helper.ReplaceAll(action_sql, '@wkflow_id', db.sql.escape(parseInt(wkflow.wkflow_id)));
              for(var key in code_wkflow_var_name){
                action_sql = Helper.ReplaceAll(action_sql, '@wkflow_var_' + code_wkflow_var_name[key].wkflow_var_name, "'" + db.sql.escape(wkflow.var[key]||'') + "'");
              }
              next_action.sql = action_sql;
              wkflow.next_state_actions.push(next_action);
            });
          });
          return process_cb();
        });
      },

      //Execute state transitions
      function(process_cb){
        if(_.isEmpty(wkflow_next)) return process_cb();

        async.eachSeries(wkflow_next, function(wkflow, wkflow_cb){
          jsh.Log.info('Workflow '+(wkflow.wkflow_id||'').toString()+' transitioning to state '+(wkflow.next_state_id||'').toString());
          let sql = "update {schema}.wkflow set wkflow_def_state_id=@wkflow_def_state_id, wkflow_tran_sts='COMPLETE' where wkflow_id=@wkflow_id;";
          let sql_ptypes = [dbtypes.BigInt, dbtypes.BigInt];
          let sql_params = { wkflow_id: wkflow.wkflow_id, wkflow_def_state_id: wkflow.next_state_id };
          _.each(wkflow.next_state_actions, function(next_action){
            var sql_stmt = next_action.sql.trim();
            if(!sql_stmt) return;
            if(!Helper.endsWith(sql_stmt, ';')) sql_stmt += ';';
            sql += sql_stmt;
          });
          appsrv.ExecCommandTrans('wkflow', module.replaceSchema(sql), sql_ptypes, sql_params, function (err) {
            if(err){ err.sql = sql; jsh.Log.error(err); }
            return wkflow_cb();
          });
        }, process_cb);
      },

      //Create new workflows, where appropriate
      function(process_cb){
        if(_.isEmpty(wkflows)) return process_cb();

        var newWorkflows = 0;
        async.eachSeries(wkflow_trans_start, function(wkflow_tran, wkflow_tran_cb){
          let sql = (wkflow_tran.sql||'').trim();
          if(!sql) return wkflow_tran_cb();
          if(newWorkflows > module.Config.maxNewWorkflowsPerCycle) return wkflow_tran_cb();
          appsrv.ExecRecordset('wkflow', module.replaceSchema(sql), [], {}, function (err, rslt) {
            if(err){ err.sql = sql; jsh.Log.error(err); return wkflow_tran_cb(); }
            if(rslt && rslt[0] && rslt[0].length) jsh.Log.info('Creating new "'+wkflow_tran.wkflow_def_code + '" workflows ('+rslt[0].length+' found)');
            async.eachSeries(rslt && rslt[0], function(row, row_cb){
              if(!row) return row_cb();
              if(newWorkflows >= module.Config.maxNewWorkflowsPerCycle) return row_cb();
              newWorkflows++;
              var dbtasks = {};
              var dbtaskid = 0;
              dbtasks['wkflow'] = function (dbtrans, db_callback, transtbl) {
                let sql = [
                  '$getInsertKey(wkflow, wkflow_id, ',
                  "  insert into {schema}.wkflow(wkflow_def_id, wkflow_def_state_id, wkflow_sts, wkflow_tran_sts) values (@wkflow_def_id, @wkflow_def_state_id_dst, 'ACTIVE', 'PENDING')",
                  ');',
                ].join(' ');
                let sql_ptypes = [
                  dbtypes.BigInt,
                  dbtypes.BigInt,
                ];
                let sql_params = {
                  wkflow_def_id: wkflow_tran.wkflow_def_id,
                  wkflow_def_state_id_dst: wkflow_tran.wkflow_def_state_id_dst,
                };
              
                db.Scalar('wkflow', module.replaceSchema(sql), sql_ptypes, sql_params, dbtrans, function (err, rslt) {
                  if (err) { err.sql = sql; }
                  db_callback(err, rslt);
                });
              };
              var wkflow_var = {};
              for(var key in code_wkflow_var_name){
                var wkflow_var_name = code_wkflow_var_name[key].wkflow_var_name;
                if(!wkflow_var_name) continue;
                var wkflow_var_sqlparam = 'wkflow_var_'+wkflow_var_name;
                var wkflow_var_val = row[wkflow_var_sqlparam];
                if(!wkflow_var_val) continue;
                wkflow_var[wkflow_var_name] = wkflow_var_val;
                //Workflow Variables
                dbtasks['wkflow_var_'+(++dbtaskid).toString()] = function (dbtrans, db_callback, transtbl) {
                  let sql = [
                    'insert into {schema}.wkflow_var(wkflow_id, wkflow_var_name, wkflow_var_val) values(@wkflow_id, @wkflow_var_name, @wkflow_var_val)'
                  ].join(' ');
                  let sql_ptypes = [
                    dbtypes.BigInt,
                    dbtypes.VarChar(32),
                    dbtypes.VarChar(255),
                  ];
                  let sql_params = {
                    wkflow_id: transtbl.wkflow,
                    wkflow_var_name: wkflow_var_name,
                    wkflow_var_val: wkflow_var_val,
                  };
                  db.Command('wkflow', module.replaceSchema(sql), sql_ptypes, sql_params, dbtrans, function (err, rslt) {
                    if (err) { err.sql = sql; }
                    db_callback(err, rslt);
                  });
                };
              }
              jsh.Log.info('Creating Workflow "'+wkflow_tran.wkflow_def_code + '"' + (!_.isEmpty(wkflow_var) ? ' with '+JSON.stringify(wkflow_var).toString() : ''));
              db.ExecTransTasks(dbtasks, function (err, rslt) {
                if (err != null) { jsh.Log.error(err); return row_cb(); }
                return row_cb();
              });
            }, wkflow_tran_cb);
          });
        }, process_cb);
      },
    ], function(err){
      if(err) jsh.Log.error(err);
      var rerun = !_.isEmpty(wkflow_next);
      return callback(err, rerun);
    });
  };
};
