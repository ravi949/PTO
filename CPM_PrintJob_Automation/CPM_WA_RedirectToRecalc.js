/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/redirect', 'N/runtime'],

function(redirect, runtime) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} sc
     * @param {Record} sc.newRecord - New record
     * @param {Record} sc.oldRecord - Old record
     * @Since 2016.1
     */
    function onAction(sc) {
    	redirect.toSuitelet({
			scriptId : runtime.getCurrentScript().getParameter({name:'custscript_cpm_warecalcs'}),
			deploymentId : runtime.getCurrentScript().getParameter({name:'custscript_cpm_warecalcd'}),
			parameters : {
				'pjid' : sc.newRecord.id
			}
		});
    }

    return {
        onAction : onAction
    };
    
});
