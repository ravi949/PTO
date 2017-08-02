/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/redirect', 'N/ui/serverWidget', 'N/search', 'N/task'],
/**
 * @param {record} record
 * @param {redirect} redirect
 * @param {serverWidget} serverWidget
 * @param {search} search
 * @param {task} task
 */
function(record, redirect, runtime, serverWidget, task) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
    	try{ 
    		if(scriptContext.type == 'view'){
    			var recordId = scriptContext.newRecord.id;
    			
    			var statusOfRec = scriptContext.newRecord.getValue({ fieldId: 'orderstatus'	});
    			log.debug('statusOfRec:	', statusOfRec);
    			if(statusOfRec == 'B' ||  statusOfRec == 'D' || statusOfRec == 'F'){
        			/******* loading the client script *******/
    				scriptContext.form.clientScriptModulePath ='./CPM_SalesOrder_ChangeOrder_cs_script.js';
        			/******* Adding button to Sales Order record  *******/
        			scriptContext.form.addButton({
        				id : 'custpage_changeorderbtn',
        				label : 'Change Orders',
        				functionName:'changeSalesOrder('+recordId+')'        	    
        			});
    			}
    			
    		}
    	}catch(e){
    		log.error('Exception:	', e);
    	}

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

    }

    return {
        beforeLoad: beforeLoad,
//        beforeSubmit: beforeSubmit,
//        afterSubmit: afterSubmit
    };
    
});
