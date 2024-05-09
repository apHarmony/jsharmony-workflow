# ==================
# jsharmony-workflow
# ==================

Workflow management for jsharmony-factory projects

## Installation

npm install jsharmony-workflow --save

## Initial Configuration

Add to your config file
```
var jsHarmonyWorkflow = require('jsharmony-workflow');

....

  jsh.AddModule(new jsHarmonyWorkflow());

  var configWorkflow = config.modules['jsHarmonyWorkflow'];
  if (configWorkflow) {
    configWorkflow.disabled = false;  //Disable the workflow system
    configWorkflow.checkDelay = 5000;  //Time between checks for state changes
    configWorkflow.maxNewWorkflowsPerCycle = 100;  //Max New Workflows per Cycle
  }
```

If you are adding to an existing site, initialize the DB Scripts for the jsHarmony Workflow module and restart the service.
